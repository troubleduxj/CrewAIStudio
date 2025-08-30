# CrewAI Studio Backend

基于FastAPI和CrewAI框架的后端服务。

## 环境要求

- Python >= 3.10 < 3.14
- 推荐使用虚拟环境

## 快速开始

### 1. 环境设置

#### 自动设置（推荐）
```bash
# 运行环境设置脚本
python setup_env.py
```

#### 手动设置
```bash
# 1. 检查Python版本
python check_python_version.py

# 2. 创建虚拟环境
python -m venv .venv

# 3. 激活虚拟环境
# Windows PowerShell
.venv\Scripts\Activate.ps1

# Windows CMD
.venv\Scripts\activate.bat

# Unix/Linux/macOS
source .venv/bin/activate

# 4. 安装依赖
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. 启动服务

#### 使用启动脚本（推荐）
```bash
# 自动检查环境并启动
python start.py
```

#### 直接启动
```bash
# 确保已激活虚拟环境
python main.py

# 或使用uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 访问服务

- API文档: http://localhost:8000/docs
- 健康检查: http://localhost:8000/api/v1/health

## 项目结构

```
backend/
├── .venv/                 # 虚拟环境
├── app/                   # 应用代码
│   ├── api/              # API路由
│   ├── core/             # 核心配置
│   ├── models/           # 数据模型
│   ├── schemas/          # Pydantic模式
│   ├── services/         # 业务逻辑
│   └── utils/            # 工具函数
├── .env                  # 环境变量
├── main.py               # 应用入口
├── requirements.txt      # 依赖列表
├── setup_env.py          # 环境设置脚本
├── start.py              # 启动脚本
└── check_python_version.py # 版本检查脚本
```

## 环境变量配置

复制 `.env` 文件并根据需要修改配置：

```bash
# Python版本要求
PYTHON_VERSION_MIN=3.10
PYTHON_VERSION_MAX=3.14

# 项目基础信息
PROJECT_NAME="CrewAI Studio Backend"
DEBUG=true

# 服务器配置
HOST=0.0.0.0
PORT=8000

# 数据库配置
DATABASE_URL=sqlite:///./crewai_studio.db

# API Keys（请替换为实际值）
# CREWAI_API_KEY=your-crewai-api-key-here
# OPENAI_API_KEY=your-openai-api-key-here
```

## 开发说明

### 虚拟环境管理

- **创建**: `python -m venv .venv`
- **激活**: 
  - Windows: `.venv\Scripts\activate`
  - Unix/Linux: `source .venv/bin/activate`
- **退出**: `deactivate`
- **删除**: 直接删除 `.venv` 文件夹

### 依赖管理

```bash
# 安装新依赖
pip install package_name

# 更新requirements.txt
pip freeze > requirements.txt

# 安装所有依赖
pip install -r requirements.txt
```

### 数据库

项目使用SQLite作为默认数据库，数据库文件位于 `crewai_studio.db`。

### API文档

启动服务后访问 http://localhost:8000/docs 查看自动生成的API文档。

## 故障排除

### Python版本问题
```bash
# 检查Python版本
python check_python_version.py

# 如果版本不符合要求，请安装Python 3.10-3.13
```

### 依赖安装问题
```bash
# 使用国内镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple/

# 升级pip
pip install --upgrade pip
```

### 虚拟环境问题
```bash
# 删除现有虚拟环境
rm -rf .venv  # Unix/Linux
rmdir /s .venv  # Windows

# 重新创建
python -m venv .venv
```

## 许可证

MIT License