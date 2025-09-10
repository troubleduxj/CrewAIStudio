"""网页浏览工具 - 抓取网页内容"""

import requests
from bs4 import BeautifulSoup
from typing import Optional, Dict, Any
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

class BrowserInput(BaseModel):
    """浏览器工具输入模型"""
    url: str = Field(..., description="要抓取的网页URL")
    timeout: int = Field(default=10, description="请求超时时间（秒）")
    headers: Optional[Dict[str, str]] = Field(default=None, description="自定义请求头")

class BrowserTool(BaseTool):
    """网页浏览工具
    
    功能：
    - 抓取指定URL的网页内容
    - 提取纯文本内容
    - 处理常见的网页编码问题
    """
    
    name: str = "browser"
    description: str = "抓取网页内容并提取纯文本。输入URL，返回网页的文本内容。"
    args_schema: type[BaseModel] = BrowserInput
    
    def _run(self, url: str, timeout: int = 10, headers: Optional[Dict[str, str]] = None) -> str:
        """
        执行网页抓取
        
        Args:
            url: 要抓取的网页URL
            timeout: 请求超时时间
            headers: 自定义请求头
            
        Returns:
            str: 网页的纯文本内容
            
        Raises:
            Exception: 当网页抓取失败时
        """
        try:
            # 设置默认请求头
            default_headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            
            if headers:
                default_headers.update(headers)
            
            # 发送HTTP请求
            response = requests.get(
                url, 
                headers=default_headers, 
                timeout=timeout,
                verify=False  # 忽略SSL证书验证
            )
            
            # 检查响应状态
            if not response.ok:
                raise Exception(f"HTTP请求失败: {response.status_code} - {response.reason}")
            
            # 解析HTML内容
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 移除脚本和样式标签
            for script in soup(["script", "style"]):
                script.decompose()
            
            # 提取文本内容
            text_content = soup.get_text()
            
            # 清理文本：移除多余的空白字符
            lines = (line.strip() for line in text_content.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            text = ' '.join(chunk for chunk in chunks if chunk)
            
            logger.info(f"成功抓取网页内容: {url}，内容长度: {len(text)}")
            return text
            
        except requests.exceptions.Timeout:
            error_msg = f"请求超时: {url}"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        except requests.exceptions.ConnectionError:
            error_msg = f"连接错误: {url}"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        except requests.exceptions.RequestException as e:
            error_msg = f"请求异常: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        except Exception as e:
            error_msg = f"网页抓取失败: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    async def _arun(self, url: str, timeout: int = 10, headers: Optional[Dict[str, str]] = None) -> str:
        """
        异步执行网页抓取
        
        Args:
            url: 要抓取的网页URL
            timeout: 请求超时时间
            headers: 自定义请求头
            
        Returns:
            str: 网页的纯文本内容
        """
        # 对于网络请求，直接调用同步方法
        return self._run(url, timeout, headers)