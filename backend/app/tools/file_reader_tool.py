"""文件读取工具 - 读取本地文件内容"""

import os
import mimetypes
from pathlib import Path
from typing import Optional, List
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

class FileReaderInput(BaseModel):
    """文件读取工具输入模型"""
    path: str = Field(..., description="要读取的文件路径")
    encoding: str = Field(default="utf-8", description="文件编码格式")
    max_size: int = Field(default=10*1024*1024, description="最大文件大小（字节），默认10MB")

class FileReaderTool(BaseTool):
    """文件读取工具
    
    功能：
    - 安全地读取本地文件内容
    - 支持多种文本编码格式
    - 限制文件大小以防止内存溢出
    - 支持常见的文本文件格式
    """
    
    name: str = "file_reader"
    description: str = "读取本地文件内容。输入文件路径，返回文件的文本内容。支持多种编码格式。"
    args_schema: type[BaseModel] = FileReaderInput
    
    # 支持的文本文件扩展名
    _text_extensions = {
        '.txt', '.md', '.py', '.js', '.ts', '.jsx', '.tsx', '.html', '.htm', 
        '.css', '.scss', '.sass', '.less', '.json', '.xml', '.yaml', '.yml',
        '.ini', '.cfg', '.conf', '.log', '.sql', '.sh', '.bat', '.ps1',
        '.java', '.c', '.cpp', '.h', '.hpp', '.cs', '.php', '.rb', '.go',
        '.rs', '.swift', '.kt', '.scala', '.r', '.m', '.pl', '.lua',
        '.dockerfile', '.gitignore', '.gitattributes', '.env'
    }
    
    # 常见编码格式
    _encodings = ['utf-8', 'utf-16', 'utf-32', 'gbk', 'gb2312', 'big5', 'ascii', 'latin-1']
    
    def _is_text_file(self, file_path: str) -> bool:
        """
        判断文件是否为文本文件
        
        Args:
            file_path: 文件路径
            
        Returns:
            bool: 是否为文本文件
        """
        # 检查文件扩展名
        ext = Path(file_path).suffix.lower()
        if ext in self._text_extensions:
            return True
        
        # 检查MIME类型
        mime_type, _ = mimetypes.guess_type(file_path)
        if mime_type and mime_type.startswith('text/'):
            return True
        
        return False
    
    def _detect_encoding(self, file_path: str) -> str:
        """
        检测文件编码格式
        
        Args:
            file_path: 文件路径
            
        Returns:
            str: 检测到的编码格式
        """
        try:
            import chardet
            
            with open(file_path, 'rb') as f:
                raw_data = f.read(8192)  # 读取前8KB用于检测
                result = chardet.detect(raw_data)
                if result['encoding'] and result['confidence'] > 0.7:
                    return result['encoding']
        except ImportError:
            logger.warning("chardet库未安装，使用默认编码检测")
        except Exception as e:
            logger.warning(f"编码检测失败: {str(e)}")
        
        # 尝试常见编码
        for encoding in self._encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    f.read(1024)  # 尝试读取前1KB
                return encoding
            except UnicodeDecodeError:
                continue
            except Exception:
                break
        
        return 'utf-8'  # 默认返回UTF-8
    
    def _run(self, path: str, encoding: str = "utf-8", max_size: int = 10*1024*1024) -> str:
        """
        执行文件读取
        
        Args:
            path: 文件路径
            encoding: 文件编码格式
            max_size: 最大文件大小（字节）
            
        Returns:
            str: 文件内容
            
        Raises:
            Exception: 当文件读取失败时
        """
        try:
            # 规范化路径
            file_path = os.path.abspath(path)
            
            # 检查文件是否存在
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"文件不存在: {file_path}")
            
            # 检查是否为文件
            if not os.path.isfile(file_path):
                raise ValueError(f"路径不是文件: {file_path}")
            
            # 检查文件大小
            file_size = os.path.getsize(file_path)
            if file_size > max_size:
                raise ValueError(f"文件过大: {file_size} 字节，超过限制 {max_size} 字节")
            
            # 检查是否为文本文件
            if not self._is_text_file(file_path):
                logger.warning(f"文件可能不是文本文件: {file_path}")
            
            # 如果编码为auto，则自动检测
            if encoding.lower() == 'auto':
                encoding = self._detect_encoding(file_path)
                logger.info(f"自动检测到编码: {encoding}")
            
            # 读取文件内容
            try:
                with open(file_path, 'r', encoding=encoding, errors='replace') as f:
                    content = f.read()
            except UnicodeDecodeError:
                # 如果指定编码失败，尝试自动检测
                logger.warning(f"使用编码 {encoding} 读取失败，尝试自动检测")
                detected_encoding = self._detect_encoding(file_path)
                with open(file_path, 'r', encoding=detected_encoding, errors='replace') as f:
                    content = f.read()
                logger.info(f"使用检测到的编码 {detected_encoding} 成功读取")
            
            logger.info(f"成功读取文件: {file_path}，大小: {len(content)} 字符")
            return content
            
        except FileNotFoundError as e:
            error_msg = str(e)
            logger.error(error_msg)
            raise Exception(error_msg)
            
        except PermissionError:
            error_msg = f"没有权限读取文件: {path}"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        except ValueError as e:
            error_msg = str(e)
            logger.error(error_msg)
            raise Exception(error_msg)
            
        except Exception as e:
            error_msg = f"文件读取失败: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    async def _arun(self, path: str, encoding: str = "utf-8", max_size: int = 10*1024*1024) -> str:
        """
        异步执行文件读取
        
        Args:
            path: 文件路径
            encoding: 文件编码格式
            max_size: 最大文件大小（字节）
            
        Returns:
            str: 文件内容
        """
        # 文件I/O操作，直接调用同步方法
        return self._run(path, encoding, max_size)