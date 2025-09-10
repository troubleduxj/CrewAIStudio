"""计算器工具 - 执行数学计算"""

import ast
import operator
import math
from typing import Union, Dict, Any
from crewai.tools import BaseTool
from pydantic import BaseModel, Field
import logging

logger = logging.getLogger(__name__)

class CalculatorInput(BaseModel):
    """计算器工具输入模型"""
    expression: str = Field(..., description="要计算的数学表达式")

class CalculatorTool(BaseTool):
    """数学计算工具
    
    功能：
    - 安全地执行数学表达式计算
    - 支持基本算术运算（+, -, *, /, **, %）
    - 支持常用数学函数（sin, cos, tan, log, sqrt等）
    - 支持常数（pi, e）
    """
    
    name: str = "calculator"
    description: str = "执行数学计算。输入数学表达式，返回计算结果。支持基本运算和常用数学函数。"
    args_schema: type[BaseModel] = CalculatorInput
    
    # 支持的运算符
    _operators = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Pow: operator.pow,
        ast.Mod: operator.mod,
        ast.USub: operator.neg,
        ast.UAdd: operator.pos,
    }
    
    # 支持的数学函数
    _functions = {
        'abs': abs,
        'round': round,
        'min': min,
        'max': max,
        'sum': sum,
        'sin': math.sin,
        'cos': math.cos,
        'tan': math.tan,
        'asin': math.asin,
        'acos': math.acos,
        'atan': math.atan,
        'sinh': math.sinh,
        'cosh': math.cosh,
        'tanh': math.tanh,
        'log': math.log,
        'log10': math.log10,
        'log2': math.log2,
        'exp': math.exp,
        'sqrt': math.sqrt,
        'ceil': math.ceil,
        'floor': math.floor,
        'factorial': math.factorial,
        'degrees': math.degrees,
        'radians': math.radians,
    }
    
    # 支持的常数
    _constants = {
        'pi': math.pi,
        'e': math.e,
        'tau': math.tau,
        'inf': math.inf,
    }
    
    def _evaluate_node(self, node: ast.AST) -> Union[int, float]:
        """
        安全地评估AST节点
        
        Args:
            node: AST节点
            
        Returns:
            Union[int, float]: 计算结果
            
        Raises:
            ValueError: 当遇到不支持的操作时
        """
        if isinstance(node, ast.Constant):  # Python 3.8+
            return node.value
        elif isinstance(node, ast.Num):  # Python < 3.8
            return node.n
        elif isinstance(node, ast.Name):
            if node.id in self._constants:
                return self._constants[node.id]
            else:
                raise ValueError(f"不支持的变量: {node.id}")
        elif isinstance(node, ast.BinOp):
            left = self._evaluate_node(node.left)
            right = self._evaluate_node(node.right)
            op = self._operators.get(type(node.op))
            if op is None:
                raise ValueError(f"不支持的二元运算符: {type(node.op).__name__}")
            return op(left, right)
        elif isinstance(node, ast.UnaryOp):
            operand = self._evaluate_node(node.operand)
            op = self._operators.get(type(node.op))
            if op is None:
                raise ValueError(f"不支持的一元运算符: {type(node.op).__name__}")
            return op(operand)
        elif isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                func_name = node.func.id
                if func_name in self._functions:
                    args = [self._evaluate_node(arg) for arg in node.args]
                    return self._functions[func_name](*args)
                else:
                    raise ValueError(f"不支持的函数: {func_name}")
            else:
                raise ValueError("不支持的函数调用")
        elif isinstance(node, ast.List):
            return [self._evaluate_node(item) for item in node.elts]
        elif isinstance(node, ast.Tuple):
            return tuple(self._evaluate_node(item) for item in node.elts)
        else:
            raise ValueError(f"不支持的节点类型: {type(node).__name__}")
    
    def _run(self, expression: str) -> Union[int, float]:
        """
        执行数学计算
        
        Args:
            expression: 数学表达式字符串
            
        Returns:
            Union[int, float]: 计算结果
            
        Raises:
            Exception: 当计算失败时
        """
        try:
            # 清理表达式
            expression = expression.strip()
            
            if not expression:
                raise ValueError("表达式不能为空")
            
            # 解析表达式为AST
            try:
                tree = ast.parse(expression, mode='eval')
            except SyntaxError as e:
                raise ValueError(f"表达式语法错误: {str(e)}")
            
            # 安全地计算结果
            result = self._evaluate_node(tree.body)
            
            # 检查结果是否为有效数字
            if isinstance(result, (int, float)):
                if math.isnan(result):
                    raise ValueError("计算结果为NaN")
                elif math.isinf(result):
                    raise ValueError("计算结果为无穷大")
            
            logger.info(f"计算表达式: {expression} = {result}")
            return result
            
        except ValueError as e:
            error_msg = f"计算错误: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        except ZeroDivisionError:
            error_msg = "除零错误"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        except OverflowError:
            error_msg = "数值溢出"
            logger.error(error_msg)
            raise Exception(error_msg)
            
        except Exception as e:
            error_msg = f"计算失败: {str(e)}"
            logger.error(error_msg)
            raise Exception(error_msg)
    
    async def _arun(self, expression: str) -> Union[int, float]:
        """
        异步执行数学计算
        
        Args:
            expression: 数学表达式字符串
            
        Returns:
            Union[int, float]: 计算结果
        """
        # 数学计算是CPU密集型操作，直接调用同步方法
        return self._run(expression)