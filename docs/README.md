# CrewAI Studio 文档中心

欢迎来到 CrewAI Studio 文档中心！这里包含了项目的完整文档，支持中英文双语。

## 📚 文档导航

### 🇨🇳 中文文档 (Chinese Documentation)

#### 快速开始
- **[主文档](zh/README.md)** - 项目概述和快速导航
- **[快速开始指南](zh/quickstart.md)** - 5分钟快速上手

#### 数据库管理
- **[迁移工作流](zh/database/migration-workflow.md)** - 完整的数据库迁移指南
- **[迁移命令参考](zh/database/migration-reference.md)** - 常用命令速查表
- **[迁移错误处理](zh/database/migration-errors.md)** - 常见问题解决方案
- **[迁移工具](zh/database/migration-utilities.md)** - 迁移工具使用指南

#### 部署指南
- **[部署文档](zh/deployment/deployment-guide.md)** - 完整的部署流程和最佳实践

#### 开发指南
- **[项目结构](zh/development/project-structure.md)** - 代码组织和架构说明
- **[项目维护](zh/development/maintenance.md)** - 日常维护和清理指南

#### 故障排除
- **[常见问题](zh/troubleshooting/common-issues.md)** - 问题诊断和解决方案

### 🇺🇸 English Documentation

#### Database Management
- **[Migration Workflow](en/database/migration-workflow.md)** - Complete database migration guide
- **[Migration Utilities](en/database/migration-utilities.md)** - Migration tools reference

#### Deployment
- **[Deployment Guide](en/deployment/deployment-guide.md)** - Production deployment procedures

## 🔍 快速查找

### 按主题查找

| 主题 | 中文文档 | English |
|------|----------|---------|
| 快速开始 | [快速开始](zh/quickstart.md) | - |
| 数据库迁移 | [迁移工作流](zh/database/migration-workflow.md) | [Migration Workflow](en/database/migration-workflow.md) |
| 部署指南 | [部署文档](zh/deployment/deployment-guide.md) | [Deployment Guide](en/deployment/deployment-guide.md) |
| 项目结构 | [项目结构](zh/development/project-structure.md) | - |
| 故障排除 | [常见问题](zh/troubleshooting/common-issues.md) | - |
| 迁移工具 | [迁移工具](zh/database/migration-utilities.md) | [Migration Utilities](en/database/migration-utilities.md) |

### 按用户角色查找

#### 🧑‍💻 开发者
- [快速开始指南](zh/quickstart.md) - 环境设置
- [项目结构](zh/development/project-structure.md) - 代码组织
- [项目维护](zh/development/maintenance.md) - 日常维护和清理
- [迁移工作流](zh/database/migration-workflow.md) - 数据库开发
- [常见问题](zh/troubleshooting/common-issues.md) - 问题解决

#### 🚀 运维人员
- [部署文档](zh/deployment/deployment-guide.md) - 生产部署
- [迁移错误处理](zh/database/migration-errors.md) - 运维故障排除
- [迁移工具](zh/database/migration-utilities.md) - 运维工具

#### 👥 团队负责人
- [主文档](zh/README.md) - 项目概览
- [项目结构](zh/development/project-structure.md) - 技术架构
- [部署文档](zh/deployment/deployment-guide.md) - 部署策略

## 📖 文档贡献

### 文档结构规范

```
docs/
├── README.md              # 文档中心首页
├── zh/                   # 中文文档
│   ├── README.md         # 中文主文档
│   ├── quickstart.md     # 快速开始
│   ├── database/         # 数据库相关
│   ├── deployment/       # 部署相关
│   ├── development/      # 开发相关
│   └── troubleshooting/  # 故障排除
└── en/                   # 英文文档
    ├── database/         # 数据库相关
    └── deployment/       # 部署相关
```

### 文档编写规范

1. **文件命名**: 使用小写字母和连字符
2. **标题层级**: 使用标准的 Markdown 标题层级
3. **代码块**: 指定语言类型以启用语法高亮
4. **链接**: 使用相对路径链接其他文档
5. **图片**: 存放在对应语言目录下的 `images/` 文件夹

### 更新文档

1. 修改相应的 Markdown 文件
2. 确保链接正确
3. 更新相关的索引页面
4. 提交更改

## 🔗 相关资源

- **项目仓库**: [GitHub Repository](https://github.com/your-org/crewai-studio)
- **在线演示**: [Demo Site](https://demo.crewai-studio.com)
- **API 文档**: [API Docs](http://localhost:8000/docs) (本地运行时)
- **问题反馈**: [Issues](https://github.com/your-org/crewai-studio/issues)

## 📞 获取帮助

如果您在文档中没有找到所需信息，可以：

1. 查看 [常见问题](zh/troubleshooting/common-issues.md)
2. 搜索现有的 [GitHub Issues](https://github.com/your-org/crewai-studio/issues)
3. 创建新的 Issue 描述您的问题
4. 联系开发团队

---

**最后更新**: 2025年1月  
**文档版本**: v1.0.0