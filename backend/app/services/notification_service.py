"""通知服务层 - 处理系统通知和消息推送"""

from typing import List, Optional, Dict, Any, Callable
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import json
import logging
import asyncio
from enum import Enum
from dataclasses import dataclass
import smtplib
from email.mime.text import MIMEText as MimeText
from email.mime.multipart import MIMEMultipart as MimeMultipart
from email.mime.base import MIMEBase as MimeBase
from email import encoders
import aiohttp
from websockets.server import WebSocketServerProtocol
from jinja2 import Template

from ..core.config import get_settings
from ..models.agent import Agent
from ..models.task import Task
from ..models.workflow import Workflow

logger = logging.getLogger(__name__)
settings = get_settings()

class NotificationType(Enum):
    """通知类型枚举"""
    INFO = "info"
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    EXECUTION_START = "execution_start"
    EXECUTION_COMPLETE = "execution_complete"
    EXECUTION_FAILED = "execution_failed"
    SYSTEM_ALERT = "system_alert"

class NotificationChannel(Enum):
    """通知渠道枚举"""
    EMAIL = "email"
    WEBHOOK = "webhook"
    WEBSOCKET = "websocket"
    SMS = "sms"
    SLACK = "slack"
    DISCORD = "discord"

@dataclass
class NotificationMessage:
    """通知消息"""
    id: str
    type: NotificationType
    title: str
    content: str
    recipient: str
    channel: NotificationChannel
    metadata: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    status: str = "pending"  # pending, sent, failed
    retry_count: int = 0
    max_retries: int = 3
    error_message: Optional[str] = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.utcnow()

@dataclass
class NotificationTemplate:
    """通知模板"""
    name: str
    type: NotificationType
    subject_template: str
    content_template: str
    channel: NotificationChannel
    variables: List[str]
    is_active: bool = True

class NotificationService:
    """通知服务类"""
    
    def __init__(self, db: Session):
        """
        初始化通知服务
        
        Args:
            db: 数据库会话
        """
        self.db = db
        self.pending_notifications: List[NotificationMessage] = []
        self.notification_history: List[NotificationMessage] = []
        self.websocket_connections: Dict[str, websockets.WebSocketServerProtocol] = {}
        self.notification_templates: Dict[str, NotificationTemplate] = {}
        self.subscribers: Dict[NotificationType, List[Callable]] = {}
        
        # 初始化默认模板
        self._initialize_default_templates()
        
        # 启动通知处理任务
        asyncio.create_task(self._process_notifications())
    
    def _initialize_default_templates(self) -> None:
        """
        初始化默认通知模板
        """
        templates = [
            NotificationTemplate(
                name="task_execution_start",
                type=NotificationType.EXECUTION_START,
                subject_template="Task Execution Started: {{ task_name }}",
                content_template="Task '{{ task_name }}' (ID: {{ task_id }}) has started execution at {{ start_time }}.",
                channel=NotificationChannel.EMAIL,
                variables=["task_name", "task_id", "start_time"]
            ),
            NotificationTemplate(
                name="task_execution_complete",
                type=NotificationType.EXECUTION_COMPLETE,
                subject_template="Task Execution Completed: {{ task_name }}",
                content_template="Task '{{ task_name }}' (ID: {{ task_id }}) has completed successfully at {{ completion_time }}.\n\nResult: {{ result }}",
                channel=NotificationChannel.EMAIL,
                variables=["task_name", "task_id", "completion_time", "result"]
            ),
            NotificationTemplate(
                name="task_execution_failed",
                type=NotificationType.EXECUTION_FAILED,
                subject_template="Task Execution Failed: {{ task_name }}",
                content_template="Task '{{ task_name }}' (ID: {{ task_id }}) has failed at {{ failure_time }}.\n\nError: {{ error_message }}",
                channel=NotificationChannel.EMAIL,
                variables=["task_name", "task_id", "failure_time", "error_message"]
            ),
            NotificationTemplate(
                name="workflow_execution_start",
                type=NotificationType.EXECUTION_START,
                subject_template="Workflow Execution Started: {{ workflow_name }}",
                content_template="Workflow '{{ workflow_name }}' (ID: {{ workflow_id }}) has started execution at {{ start_time }}.",
                channel=NotificationChannel.EMAIL,
                variables=["workflow_name", "workflow_id", "start_time"]
            ),
            NotificationTemplate(
                name="workflow_execution_complete",
                type=NotificationType.EXECUTION_COMPLETE,
                subject_template="Workflow Execution Completed: {{ workflow_name }}",
                content_template="Workflow '{{ workflow_name }}' (ID: {{ workflow_id }}) has completed successfully at {{ completion_time }}.\n\nResult: {{ result }}",
                channel=NotificationChannel.EMAIL,
                variables=["workflow_name", "workflow_id", "completion_time", "result"]
            ),
            NotificationTemplate(
                name="workflow_execution_failed",
                type=NotificationType.EXECUTION_FAILED,
                subject_template="Workflow Execution Failed: {{ workflow_name }}",
                content_template="Workflow '{{ workflow_name }}' (ID: {{ workflow_id }}) has failed at {{ failure_time }}.\n\nError: {{ error_message }}",
                channel=NotificationChannel.EMAIL,
                variables=["workflow_name", "workflow_id", "failure_time", "error_message"]
            ),
            NotificationTemplate(
                name="system_alert",
                type=NotificationType.SYSTEM_ALERT,
                subject_template="System Alert: {{ alert_title }}",
                content_template="System Alert: {{ alert_title }}\n\nMessage: {{ alert_message }}\n\nTime: {{ alert_time }}",
                channel=NotificationChannel.EMAIL,
                variables=["alert_title", "alert_message", "alert_time"]
            )
        ]
        
        for template in templates:
            self.notification_templates[template.name] = template
    
    async def send_notification(
        self,
        type: NotificationType,
        title: str,
        content: str,
        recipient: str,
        channel: NotificationChannel = NotificationChannel.EMAIL,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        发送通知
        
        Args:
            type: 通知类型
            title: 通知标题
            content: 通知内容
            recipient: 接收者
            channel: 通知渠道
            metadata: 元数据
            
        Returns:
            str: 通知ID
        """
        import uuid
        
        notification = NotificationMessage(
            id=str(uuid.uuid4()),
            type=type,
            title=title,
            content=content,
            recipient=recipient,
            channel=channel,
            metadata=metadata or {}
        )
        
        self.pending_notifications.append(notification)
        logger.info(f"Notification queued: {notification.id} - {title}")
        
        return notification.id
    
    async def send_template_notification(
        self,
        template_name: str,
        recipient: str,
        variables: Dict[str, Any],
        channel: Optional[NotificationChannel] = None
    ) -> str:
        """
        使用模板发送通知
        
        Args:
            template_name: 模板名称
            recipient: 接收者
            variables: 模板变量
            channel: 通知渠道（可选，使用模板默认渠道）
            
        Returns:
            str: 通知ID
        """
        template = self.notification_templates.get(template_name)
        if not template:
            raise ValueError(f"Template '{template_name}' not found")
        
        if not template.is_active:
            logger.warning(f"Template '{template_name}' is not active")
            return ""
        
        # 渲染模板
        subject_template = Template(template.subject_template)
        content_template = Template(template.content_template)
        
        try:
            title = subject_template.render(**variables)
            content = content_template.render(**variables)
        except Exception as e:
            logger.error(f"Template rendering failed for '{template_name}': {str(e)}")
            raise ValueError(f"Template rendering failed: {str(e)}")
        
        # 使用指定渠道或模板默认渠道
        notification_channel = channel or template.channel
        
        return await self.send_notification(
            type=template.type,
            title=title,
            content=content,
            recipient=recipient,
            channel=notification_channel,
            metadata={"template_name": template_name, "variables": variables}
        )
    
    async def notify_task_execution_start(self, task: Task, recipient: str) -> str:
        """
        通知任务执行开始
        
        Args:
            task: 任务实例
            recipient: 接收者
            
        Returns:
            str: 通知ID
        """
        variables = {
            "task_name": task.name,
            "task_id": task.id,
            "start_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        }
        
        return await self.send_template_notification(
            template_name="task_execution_start",
            recipient=recipient,
            variables=variables
        )
    
    async def notify_task_execution_complete(self, task: Task, result: str, recipient: str) -> str:
        """
        通知任务执行完成
        
        Args:
            task: 任务实例
            result: 执行结果
            recipient: 接收者
            
        Returns:
            str: 通知ID
        """
        variables = {
            "task_name": task.name,
            "task_id": task.id,
            "completion_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "result": result
        }
        
        return await self.send_template_notification(
            template_name="task_execution_complete",
            recipient=recipient,
            variables=variables
        )
    
    async def notify_task_execution_failed(self, task: Task, error_message: str, recipient: str) -> str:
        """
        通知任务执行失败
        
        Args:
            task: 任务实例
            error_message: 错误消息
            recipient: 接收者
            
        Returns:
            str: 通知ID
        """
        variables = {
            "task_name": task.name,
            "task_id": task.id,
            "failure_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "error_message": error_message
        }
        
        return await self.send_template_notification(
            template_name="task_execution_failed",
            recipient=recipient,
            variables=variables
        )
    
    async def notify_workflow_execution_start(self, workflow: Workflow, recipient: str) -> str:
        """
        通知工作流执行开始
        
        Args:
            workflow: 工作流实例
            recipient: 接收者
            
        Returns:
            str: 通知ID
        """
        variables = {
            "workflow_name": workflow.name,
            "workflow_id": workflow.id,
            "start_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        }
        
        return await self.send_template_notification(
            template_name="workflow_execution_start",
            recipient=recipient,
            variables=variables
        )
    
    async def notify_workflow_execution_complete(self, workflow: Workflow, result: str, recipient: str) -> str:
        """
        通知工作流执行完成
        
        Args:
            workflow: 工作流实例
            result: 执行结果
            recipient: 接收者
            
        Returns:
            str: 通知ID
        """
        variables = {
            "workflow_name": workflow.name,
            "workflow_id": workflow.id,
            "completion_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "result": result
        }
        
        return await self.send_template_notification(
            template_name="workflow_execution_complete",
            recipient=recipient,
            variables=variables
        )
    
    async def notify_workflow_execution_failed(self, workflow: Workflow, error_message: str, recipient: str) -> str:
        """
        通知工作流执行失败
        
        Args:
            workflow: 工作流实例
            error_message: 错误消息
            recipient: 接收者
            
        Returns:
            str: 通知ID
        """
        variables = {
            "workflow_name": workflow.name,
            "workflow_id": workflow.id,
            "failure_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
            "error_message": error_message
        }
        
        return await self.send_template_notification(
            template_name="workflow_execution_failed",
            recipient=recipient,
            variables=variables
        )
    
    async def send_system_alert(self, title: str, message: str, recipient: str) -> str:
        """
        发送系统警报
        
        Args:
            title: 警报标题
            message: 警报消息
            recipient: 接收者
            
        Returns:
            str: 通知ID
        """
        variables = {
            "alert_title": title,
            "alert_message": message,
            "alert_time": datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
        }
        
        return await self.send_template_notification(
            template_name="system_alert",
            recipient=recipient,
            variables=variables
        )
    
    async def _process_notifications(self) -> None:
        """
        处理待发送的通知
        """
        while True:
            try:
                if self.pending_notifications:
                    notification = self.pending_notifications.pop(0)
                    await self._send_notification(notification)
                else:
                    await asyncio.sleep(1)  # 等待1秒后再检查
            except Exception as e:
                logger.error(f"Error processing notifications: {str(e)}")
                await asyncio.sleep(5)  # 出错时等待5秒
    
    async def _send_notification(self, notification: NotificationMessage) -> None:
        """
        发送单个通知
        
        Args:
            notification: 通知消息
        """
        try:
            if notification.channel == NotificationChannel.EMAIL:
                await self._send_email_notification(notification)
            elif notification.channel == NotificationChannel.WEBHOOK:
                await self._send_webhook_notification(notification)
            elif notification.channel == NotificationChannel.WEBSOCKET:
                await self._send_websocket_notification(notification)
            elif notification.channel == NotificationChannel.SLACK:
                await self._send_slack_notification(notification)
            elif notification.channel == NotificationChannel.DISCORD:
                await self._send_discord_notification(notification)
            else:
                logger.warning(f"Unsupported notification channel: {notification.channel}")
                notification.status = "failed"
                notification.error_message = f"Unsupported channel: {notification.channel}"
            
            if notification.status != "failed":
                notification.status = "sent"
                notification.sent_at = datetime.utcnow()
                logger.info(f"Notification sent successfully: {notification.id}")
            
        except Exception as e:
            notification.status = "failed"
            notification.error_message = str(e)
            notification.retry_count += 1
            
            logger.error(f"Failed to send notification {notification.id}: {str(e)}")
            
            # 重试逻辑
            if notification.retry_count < notification.max_retries:
                logger.info(f"Retrying notification {notification.id} (attempt {notification.retry_count + 1})")
                await asyncio.sleep(60)  # 等待1分钟后重试
                self.pending_notifications.append(notification)
            else:
                logger.error(f"Max retries exceeded for notification {notification.id}")
        
        finally:
            # 添加到历史记录
            self.notification_history.append(notification)
    
    async def _send_email_notification(self, notification: NotificationMessage) -> None:
        """
        发送邮件通知
        
        Args:
            notification: 通知消息
        """
        if not settings.SMTP_HOST or not settings.SMTP_USER:
            raise ValueError("SMTP configuration not found")
        
        msg = MimeMultipart()
        msg['From'] = settings.SMTP_USER
        msg['To'] = notification.recipient
        msg['Subject'] = notification.title
        
        # 添加邮件正文
        msg.attach(MimeText(notification.content, 'plain', 'utf-8'))
        
        # 发送邮件
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            if settings.SMTP_TLS:
                server.starttls()
            if settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
    
    async def _send_webhook_notification(self, notification: NotificationMessage) -> None:
        """
        发送Webhook通知
        
        Args:
            notification: 通知消息
        """
        webhook_url = notification.metadata.get('webhook_url') or settings.DEFAULT_WEBHOOK_URL
        if not webhook_url:
            raise ValueError("Webhook URL not configured")
        
        payload = {
            "id": notification.id,
            "type": notification.type.value,
            "title": notification.title,
            "content": notification.content,
            "recipient": notification.recipient,
            "timestamp": notification.created_at.isoformat(),
            "metadata": notification.metadata
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                webhook_url,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status >= 400:
                    raise ValueError(f"Webhook request failed with status {response.status}")
    
    async def _send_websocket_notification(self, notification: NotificationMessage) -> None:
        """
        发送WebSocket通知
        
        Args:
            notification: 通知消息
        """
        message = {
            "id": notification.id,
            "type": notification.type.value,
            "title": notification.title,
            "content": notification.content,
            "timestamp": notification.created_at.isoformat(),
            "metadata": notification.metadata
        }
        
        # 发送给特定用户或广播
        if notification.recipient in self.websocket_connections:
            websocket = self.websocket_connections[notification.recipient]
            try:
                await websocket.send(json.dumps(message))
            except websockets.exceptions.ConnectionClosed:
                # 连接已关闭，从连接列表中移除
                del self.websocket_connections[notification.recipient]
                raise ValueError("WebSocket connection closed")
        else:
            raise ValueError(f"WebSocket connection not found for user: {notification.recipient}")
    
    async def _send_slack_notification(self, notification: NotificationMessage) -> None:
        """
        发送Slack通知
        
        Args:
            notification: 通知消息
        """
        slack_webhook = notification.metadata.get('slack_webhook') or settings.SLACK_WEBHOOK_URL
        if not slack_webhook:
            raise ValueError("Slack webhook URL not configured")
        
        # 根据通知类型设置颜色
        color_map = {
            NotificationType.SUCCESS: "good",
            NotificationType.WARNING: "warning",
            NotificationType.ERROR: "danger",
            NotificationType.EXECUTION_FAILED: "danger",
            NotificationType.INFO: "#36a64f",
            NotificationType.EXECUTION_START: "#36a64f",
            NotificationType.EXECUTION_COMPLETE: "good",
            NotificationType.SYSTEM_ALERT: "warning"
        }
        
        payload = {
            "text": notification.title,
            "attachments": [
                {
                    "color": color_map.get(notification.type, "#36a64f"),
                    "fields": [
                        {
                            "title": "Message",
                            "value": notification.content,
                            "short": False
                        },
                        {
                            "title": "Type",
                            "value": notification.type.value,
                            "short": True
                        },
                        {
                            "title": "Time",
                            "value": notification.created_at.strftime("%Y-%m-%d %H:%M:%S UTC"),
                            "short": True
                        }
                    ]
                }
            ]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                slack_webhook,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status >= 400:
                    raise ValueError(f"Slack webhook request failed with status {response.status}")
    
    async def _send_discord_notification(self, notification: NotificationMessage) -> None:
        """
        发送Discord通知
        
        Args:
            notification: 通知消息
        """
        discord_webhook = notification.metadata.get('discord_webhook') or settings.DISCORD_WEBHOOK_URL
        if not discord_webhook:
            raise ValueError("Discord webhook URL not configured")
        
        # 根据通知类型设置颜色
        color_map = {
            NotificationType.SUCCESS: 0x00ff00,
            NotificationType.WARNING: 0xffff00,
            NotificationType.ERROR: 0xff0000,
            NotificationType.EXECUTION_FAILED: 0xff0000,
            NotificationType.INFO: 0x0099ff,
            NotificationType.EXECUTION_START: 0x0099ff,
            NotificationType.EXECUTION_COMPLETE: 0x00ff00,
            NotificationType.SYSTEM_ALERT: 0xffff00
        }
        
        embed = {
            "title": notification.title,
            "description": notification.content,
            "color": color_map.get(notification.type, 0x0099ff),
            "timestamp": notification.created_at.isoformat(),
            "fields": [
                {
                    "name": "Type",
                    "value": notification.type.value,
                    "inline": True
                },
                {
                    "name": "Recipient",
                    "value": notification.recipient,
                    "inline": True
                }
            ]
        }
        
        payload = {
            "embeds": [embed]
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                discord_webhook,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                if response.status >= 400:
                    raise ValueError(f"Discord webhook request failed with status {response.status}")
    
    def add_websocket_connection(self, user_id: str, websocket: WebSocketServerProtocol) -> None:
        """
        添加WebSocket连接
        
        Args:
            user_id: 用户ID
            websocket: WebSocket连接
        """
        self.websocket_connections[user_id] = websocket
        logger.info(f"WebSocket connection added for user: {user_id}")
    
    def remove_websocket_connection(self, user_id: str) -> None:
        """
        移除WebSocket连接
        
        Args:
            user_id: 用户ID
        """
        if user_id in self.websocket_connections:
            del self.websocket_connections[user_id]
            logger.info(f"WebSocket connection removed for user: {user_id}")
    
    def subscribe(self, notification_type: NotificationType, callback: Callable[[NotificationMessage], None]) -> None:
        """
        订阅通知类型
        
        Args:
            notification_type: 通知类型
            callback: 回调函数
        """
        if notification_type not in self.subscribers:
            self.subscribers[notification_type] = []
        self.subscribers[notification_type].append(callback)
    
    def unsubscribe(self, notification_type: NotificationType, callback: Callable[[NotificationMessage], None]) -> None:
        """
        取消订阅通知类型
        
        Args:
            notification_type: 通知类型
            callback: 回调函数
        """
        if notification_type in self.subscribers and callback in self.subscribers[notification_type]:
            self.subscribers[notification_type].remove(callback)
    
    def get_notification_history(
        self,
        recipient: Optional[str] = None,
        notification_type: Optional[NotificationType] = None,
        limit: int = 100
    ) -> List[NotificationMessage]:
        """
        获取通知历史
        
        Args:
            recipient: 接收者过滤
            notification_type: 通知类型过滤
            limit: 限制数量
            
        Returns:
            List[NotificationMessage]: 通知历史列表
        """
        filtered_history = self.notification_history
        
        if recipient:
            filtered_history = [n for n in filtered_history if n.recipient == recipient]
        
        if notification_type:
            filtered_history = [n for n in filtered_history if n.type == notification_type]
        
        # 按创建时间倒序排列
        filtered_history.sort(key=lambda x: x.created_at, reverse=True)
        
        return filtered_history[:limit]
    
    def get_notification_statistics(self) -> Dict[str, Any]:
        """
        获取通知统计信息
        
        Returns:
            Dict[str, Any]: 统计信息
        """
        total_notifications = len(self.notification_history)
        sent_notifications = len([n for n in self.notification_history if n.status == "sent"])
        failed_notifications = len([n for n in self.notification_history if n.status == "failed"])
        pending_notifications = len(self.pending_notifications)
        
        # 按类型统计
        type_stats = {}
        for notification in self.notification_history:
            type_name = notification.type.value
            if type_name not in type_stats:
                type_stats[type_name] = {"total": 0, "sent": 0, "failed": 0}
            type_stats[type_name]["total"] += 1
            if notification.status == "sent":
                type_stats[type_name]["sent"] += 1
            elif notification.status == "failed":
                type_stats[type_name]["failed"] += 1
        
        # 按渠道统计
        channel_stats = {}
        for notification in self.notification_history:
            channel_name = notification.channel.value
            if channel_name not in channel_stats:
                channel_stats[channel_name] = {"total": 0, "sent": 0, "failed": 0}
            channel_stats[channel_name]["total"] += 1
            if notification.status == "sent":
                channel_stats[channel_name]["sent"] += 1
            elif notification.status == "failed":
                channel_stats[channel_name]["failed"] += 1
        
        return {
            "total_notifications": total_notifications,
            "sent_notifications": sent_notifications,
            "failed_notifications": failed_notifications,
            "pending_notifications": pending_notifications,
            "success_rate": (sent_notifications / total_notifications * 100) if total_notifications > 0 else 0,
            "active_websocket_connections": len(self.websocket_connections),
            "type_statistics": type_stats,
            "channel_statistics": channel_stats
        }
    
    def add_notification_template(self, template: NotificationTemplate) -> None:
        """
        添加通知模板
        
        Args:
            template: 通知模板
        """
        self.notification_templates[template.name] = template
        logger.info(f"Notification template added: {template.name}")
    
    def get_notification_template(self, name: str) -> Optional[NotificationTemplate]:
        """
        获取通知模板
        
        Args:
            name: 模板名称
            
        Returns:
            Optional[NotificationTemplate]: 通知模板或None
        """
        return self.notification_templates.get(name)
    
    def list_notification_templates(self) -> List[NotificationTemplate]:
        """
        列出所有通知模板
        
        Returns:
            List[NotificationTemplate]: 模板列表
        """
        return list(self.notification_templates.values())
    
    def cleanup_notification_history(self, older_than_days: int = 30) -> int:
        """
        清理通知历史
        
        Args:
            older_than_days: 清理多少天前的记录
            
        Returns:
            int: 清理的记录数
        """
        cutoff_time = datetime.utcnow() - timedelta(days=older_than_days)
        
        original_count = len(self.notification_history)
        self.notification_history = [
            n for n in self.notification_history 
            if n.created_at > cutoff_time
        ]
        
        cleaned_count = original_count - len(self.notification_history)
        logger.info(f"Cleaned up {cleaned_count} notification history records")
        
        return cleaned_count