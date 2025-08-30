# LLM配置指南

CrewAI Studio现在支持多种LLM提供商，包括OpenAI、DeepSeek、Ollama和Anthropic。本文档将指导您如何配置和使用这些LLM提供商。

## 支持的LLM提供商

### 1. OpenAI
- **提供商**: `openai`
- **支持模型**: `gpt-3.5-turbo`, `gpt-4`, `gpt-4-turbo`等
- **配置要求**: 需要OpenAI API密钥

### 2. DeepSeek
- **提供商**: `deepseek`
- **支持模型**: `deepseek-chat`, `deepseek-coder`等
- **配置要求**: 需要DeepSeek API密钥
- **特点**: 兼容OpenAI API格式

### 3. Ollama (本地模型)
- **提供商**: `ollama`
- **支持模型**: `llama2`, `codellama`, `mistral`等
- **配置要求**: 需要本地运行Ollama服务
- **特点**: 完全本地化，无需API密钥

### 4. Anthropic
- **提供商**: `anthropic`
- **支持模型**: `claude-3-sonnet-20240229`, `claude-3-opus-20240229`等
- **配置要求**: 需要Anthropic API密钥

## 环境变量配置

在`.env`文件中添加以下配置：

```bash
# OpenAI配置
OPENAI_API_KEY=your_openai_api_key_here

# DeepSeek配置
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Ollama配置（本地）
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Anthropic配置
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# 默认LLM提供商
DEFAULT_LLM_PROVIDER=openai
```

## Agent配置示例

### 使用OpenAI
```json
{
  "name": "OpenAI Agent",
  "role": "Assistant",
  "goal": "Help users with tasks",
  "backstory": "I am an AI assistant",
  "llm_provider": "openai",
  "llm_config": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

### 使用DeepSeek
```json
{
  "name": "DeepSeek Agent",
  "role": "Code Assistant",
  "goal": "Help with coding tasks",
  "backstory": "I am a coding assistant",
  "llm_provider": "deepseek",
  "llm_config": {
    "provider": "deepseek",
    "model": "deepseek-chat",
    "temperature": 0.3,
    "max_tokens": 2000
  }
}
```

### 使用Ollama（本地模型）
```json
{
  "name": "Local Ollama Agent",
  "role": "Local Assistant",
  "goal": "Provide local AI assistance",
  "backstory": "I am a local AI assistant",
  "llm_provider": "ollama",
  "llm_config": {
    "provider": "ollama",
    "model": "llama2",
    "temperature": 0.7,
    "max_tokens": 1000
  }
}
```

### 使用Anthropic
```json
{
  "name": "Claude Agent",
  "role": "Research Assistant",
  "goal": "Help with research tasks",
  "backstory": "I am a research assistant",
  "llm_provider": "anthropic",
  "llm_config": {
    "provider": "anthropic",
    "model": "claude-3-sonnet-20240229",
    "temperature": 0.5,
    "max_tokens": 1500
  }
}
```

## Ollama本地部署指南

### 1. 安装Ollama
```bash
# Windows
winget install Ollama.Ollama

# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

### 2. 启动Ollama服务
```bash
ollama serve
```

### 3. 下载模型
```bash
# 下载Llama2模型
ollama pull llama2

# 下载Code Llama模型
ollama pull codellama

# 下载Mistral模型
ollama pull mistral
```

### 4. 验证安装
```bash
# 测试模型
ollama run llama2 "Hello, how are you?"
```

## API密钥获取

### OpenAI
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册账户并登录
3. 前往 API Keys 页面
4. 创建新的API密钥

### DeepSeek
1. 访问 [DeepSeek Platform](https://platform.deepseek.com/)
2. 注册账户并登录
3. 前往 API Keys 页面
4. 创建新的API密钥

### Anthropic
1. 访问 [Anthropic Console](https://console.anthropic.com/)
2. 注册账户并登录
3. 前往 API Keys 页面
4. 创建新的API密钥

## 测试LLM集成

运行测试脚本验证配置：

```bash
cd backend
python test_llm_integration.py
```

测试脚本将验证：
- 配置信息是否正确
- API密钥是否有效
- LLM实例是否能正常创建
- 各提供商的连接状态

## 故障排除

### 常见问题

1. **API密钥错误**
   - 检查`.env`文件中的API密钥是否正确
   - 确保API密钥有足够的权限和余额

2. **Ollama连接失败**
   - 确保Ollama服务正在运行 (`ollama serve`)
   - 检查Ollama服务地址是否为 `http://localhost:11434`
   - 确保所需模型已下载

3. **模型不存在**
   - 检查模型名称是否正确
   - 对于Ollama，确保模型已通过 `ollama pull` 下载

4. **网络连接问题**
   - 检查网络连接
   - 确保防火墙没有阻止API请求
   - 对于中国用户，可能需要配置代理

### 日志查看

查看应用日志以获取详细错误信息：

```bash
# 查看后端日志
tail -f backend/logs/app.log

# 或者直接运行后端查看控制台输出
cd backend
python main.py
```

## 性能优化建议

1. **本地模型 (Ollama)**
   - 优点：完全私有，无API费用，低延迟
   - 缺点：需要本地计算资源，模型能力可能有限
   - 适用场景：隐私敏感、离线环境、成本控制

2. **云端API (OpenAI/DeepSeek/Anthropic)**
   - 优点：强大的模型能力，无需本地资源
   - 缺点：需要网络连接，有API费用
   - 适用场景：高质量输出、复杂任务、快速部署

3. **混合使用**
   - 简单任务使用本地模型
   - 复杂任务使用云端API
   - 根据成本和性能需求灵活选择

## 更新日志

- **v1.0.0**: 初始版本，支持OpenAI
- **v1.1.0**: 添加DeepSeek和Ollama支持
- **v1.2.0**: 添加Anthropic支持，完善配置系统