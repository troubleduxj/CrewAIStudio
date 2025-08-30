# CrewAI Studio 前端开发标准

## 1. 项目概述

本文档定义了 CrewAI Studio 前端开发的标准和规范，确保代码质量、可维护性和团队协作效率。

### 1.1 技术栈

- **框架**: Next.js 13+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + CSS Modules
- **UI组件**: Radix UI + shadcn/ui
- **状态管理**: React Hook Form + Context API
- **图标**: Lucide React
- **国际化**: next-i18next
- **工作流可视化**: React Flow

## 2. 项目结构规范

### 2.1 目录结构

```
frontend/
├── components/           # 可复用组件
│   ├── ui/              # 基础UI组件 (shadcn/ui)
│   ├── layout/          # 布局组件
│   ├── dashboard/       # 仪表板相关组件
│   ├── workflow/        # 工作流相关组件
│   └── common/          # 通用组件
├── pages/               # 页面组件 (Pages Router)
├── src/
│   ├── lib/             # 工具函数和配置
│   ├── hooks/           # 自定义 Hooks
│   ├── types/           # TypeScript 类型定义
│   └── utils/           # 工具函数
├── styles/              # 全局样式
├── public/              # 静态资源
└── messages/            # 国际化文件
```

### 2.2 文件命名规范

- **组件文件**: 使用 kebab-case，如 `workflow-visualizer.tsx`
- **页面文件**: 使用 kebab-case，如 `dashboard.tsx`
- **工具函数**: 使用 camelCase，如 `apiClient.ts`
- **类型文件**: 使用 camelCase，如 `workflowTypes.ts`
- **常量文件**: 使用 UPPER_SNAKE_CASE，如 `API_CONSTANTS.ts`

## 3. 组件开发规范

### 3.1 组件结构

```typescript
/**
 * 组件功能描述
 * @param props 组件属性
 * @returns JSX元素
 */
export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks
  const [state, setState] = useState();
  const { t } = useTranslation();
  
  // 2. 事件处理函数
  const handleClick = useCallback(() => {
    // 处理逻辑
  }, []);
  
  // 3. 副作用
  useEffect(() => {
    // 副作用逻辑
  }, []);
  
  // 4. 渲染逻辑
  return (
    <div className="component-container">
      {/* JSX内容 */}
    </div>
  );
}

// 5. 类型定义
interface ComponentProps {
  prop1: string;
  prop2?: number;
}
```

### 3.2 组件分类

#### 3.2.1 基础UI组件 (`components/ui/`)
- 使用 shadcn/ui 组件库
- 保持组件的原子性和可复用性
- 不包含业务逻辑

#### 3.2.2 业务组件 (`components/dashboard/`, `components/workflow/`)
- 包含特定业务逻辑
- 可以组合多个基础组件
- 负责数据获取和状态管理

#### 3.2.3 布局组件 (`components/layout/`)
- 定义页面整体布局
- 处理导航和侧边栏
- 管理全局状态

### 3.3 Props 设计原则

- 使用 TypeScript 接口定义 Props
- 提供默认值和可选属性
- 使用描述性的属性名
- 避免过度嵌套的对象属性

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}
```

## 4. 状态管理规范

### 4.1 本地状态

使用 `useState` 和 `useReducer` 管理组件内部状态：

```typescript
// 简单状态
const [isLoading, setIsLoading] = useState(false);

// 复杂状态
const [state, dispatch] = useReducer(reducer, initialState);
```

### 4.2 全局状态

使用 Context API 管理跨组件状态：

```typescript
// 创建 Context
const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// Provider 组件
export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  
  const value = {
    workflows,
    setWorkflows,
    // 其他状态和方法
  };
  
  return (
    <WorkflowContext.Provider value={value}>
      {children}
    </WorkflowContext.Provider>
  );
}

// 自定义 Hook
export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within WorkflowProvider');
  }
  return context;
}
```

### 4.3 表单状态

使用 React Hook Form 管理表单状态：

```typescript
const {
  register,
  handleSubmit,
  formState: { errors },
  setValue,
  watch
} = useForm<FormData>({
  defaultValues: {
    name: '',
    description: ''
  }
});
```

## 5. 样式规范

### 5.1 Tailwind CSS 使用规范

- 优先使用 Tailwind 工具类
- 保持类名的可读性和一致性
- 使用 `cn()` 函数合并条件类名

```typescript
import { cn } from '@/lib/utils';

function Button({ variant, className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md font-medium transition-colors',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'primary',
          'bg-secondary text-secondary-foreground hover:bg-secondary/80': variant === 'secondary',
        },
        className
      )}
      {...props}
    />
  );
}
```

### 5.2 响应式设计

- 移动优先的设计原则
- 使用 Tailwind 的响应式前缀
- 确保在不同设备上的良好体验

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 内容 */}
</div>
```

### 5.3 主题和设计系统

- 使用 CSS 变量定义主题色彩
- 保持设计的一致性
- 支持深色模式

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
}
```

## 6. TypeScript 规范

### 6.1 类型定义

- 为所有组件定义 Props 接口
- 使用联合类型定义枚举值
- 避免使用 `any` 类型

```typescript
// 基础类型
type Status = 'pending' | 'running' | 'completed' | 'failed';

// 接口定义
interface Agent {
  id: string;
  name: string;
  role: string;
  goal: string;
  backstory: string;
  tools: Tool[];
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

// 泛型使用
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
```

### 6.2 类型文件组织

```typescript
// types/index.ts
export * from './agent';
export * from './task';
export * from './workflow';
export * from './api';

// types/agent.ts
export interface Agent {
  // Agent 相关类型
}

export interface AgentCreateRequest {
  // 创建请求类型
}
```

## 7. API 集成规范

### 7.1 API 客户端

```typescript
// lib/api.ts
class ApiClient {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
  
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`);
    return response.json();
  }
  
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}

export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
```

### 7.2 数据获取 Hooks

```typescript
// hooks/useAgents.ts
export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchAgents() {
      try {
        setLoading(true);
        const response = await apiClient.get<Agent[]>('/agents');
        setAgents(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchAgents();
  }, []);
  
  return { agents, loading, error, refetch: fetchAgents };
}
```

## 8. 性能优化

### 8.1 组件优化

- 使用 `React.memo` 避免不必要的重渲染
- 使用 `useCallback` 和 `useMemo` 优化计算
- 合理使用 `useEffect` 的依赖数组

```typescript
const MemoizedComponent = React.memo(function Component({ data }: Props) {
  const expensiveValue = useMemo(() => {
    return computeExpensiveValue(data);
  }, [data]);
  
  const handleClick = useCallback(() => {
    // 处理点击
  }, []);
  
  return <div onClick={handleClick}>{expensiveValue}</div>;
});
```

### 8.2 代码分割

- 使用动态导入进行路由级别的代码分割
- 懒加载非关键组件

```typescript
// 页面级别的代码分割
const DashboardPage = dynamic(() => import('./dashboard'), {
  loading: () => <div>Loading...</div>,
});

// 组件级别的懒加载
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

## 9. 测试规范

### 9.1 单元测试

使用 Jest 和 React Testing Library：

```typescript
// __tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 9.2 集成测试

```typescript
// __tests__/AgentList.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import AgentList from '../AgentList';

const server = setupServer(
  rest.get('/api/agents', (req, res, ctx) => {
    return res(ctx.json({ data: mockAgents }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('displays agents after loading', async () => {
  render(<AgentList />);
  
  await waitFor(() => {
    expect(screen.getByText('Agent 1')).toBeInTheDocument();
  });
});
```

## 10. 错误处理

### 10.1 错误边界

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    
    return this.props.children;
  }
}
```

### 10.2 异步错误处理

```typescript
async function handleAsyncOperation() {
  try {
    const result = await apiCall();
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      // 处理 API 错误
      showErrorToast(error.message);
    } else {
      // 处理其他错误
      console.error('Unexpected error:', error);
      showErrorToast('An unexpected error occurred');
    }
    throw error;
  }
}
```

## 11. 国际化规范

### 11.1 文本外部化

```typescript
// 使用 useTranslation Hook
const { t } = useTranslation('common');

return (
  <div>
    <h1>{t('dashboard.title')}</h1>
    <p>{t('dashboard.description')}</p>
  </div>
);
```

### 11.2 翻译文件结构

```json
// messages/en.json
{
  "dashboard": {
    "title": "Dashboard",
    "description": "Welcome to CrewAI Studio"
  },
  "agents": {
    "create": "Create Agent",
    "edit": "Edit Agent"
  }
}
```

## 12. 代码质量

### 12.1 ESLint 配置

```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### 12.2 Prettier 配置

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## 13. 部署和构建

### 13.1 环境变量

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=CrewAI Studio
```

### 13.2 构建优化

```javascript
// next.config.js
module.exports = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['example.com'],
  },
  webpack: (config) => {
    // 自定义 webpack 配置
    return config;
  },
};
```

## 14. 最佳实践总结

1. **组件设计**: 保持组件的单一职责和可复用性
2. **类型安全**: 充分利用 TypeScript 的类型系统
3. **性能优化**: 合理使用 React 的优化 API
4. **代码组织**: 保持清晰的文件结构和命名规范
5. **错误处理**: 提供友好的错误提示和恢复机制
6. **测试覆盖**: 编写全面的单元测试和集成测试
7. **文档维护**: 保持代码注释和文档的及时更新

---

本文档将随着项目的发展持续更新，确保开发标准与最佳实践保持同步。