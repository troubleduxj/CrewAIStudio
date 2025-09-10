/**
 * LLM配置服务 - 处理LLM配置相关的API调用
 */

import axios from 'axios';

// API基础URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// LLM提供商类型
export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'ollama' | 'gemini';

// LLM 连接统计数据接口
export interface LLMConnectionStats {
  total_connections: number;
  today_calls: number;
}

// LLM配置接口
export interface LLMConfig {
  id?: string;
  provider: LLMProvider;
  name: string;
  description?: string;
  api_key?: string;
  api_base?: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  timeout?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 连接测试结果接口
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  model_info?: any;
}

// LLM状态接口
export interface LLMStatus {
  provider: LLMProvider;
  is_connected: boolean;
  last_test_time?: string;
  error_message?: string;
}

// 可用模型接口
export interface AvailableModel {
  id: string;
  name: string;
  description?: string;
}

/**
 * LLM配置服务类
 */
class LLMService {
  private apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api/v1/llm`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  /**
   * 获取支持的LLM提供商列表
   * @returns 提供商列表
   */
  async getProviders(): Promise<LLMProvider[]> {
    try {
      const response = await this.apiClient.get('/providers');
      return response.data;
    } catch (error) {
      console.error('获取LLM提供商列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有LLM配置
   * @returns LLM配置列表
   */
  async getConfigs(): Promise<LLMConfig[]> {
    try {
      const response = await this.apiClient.get('/configs');
      return response.data;
    } catch (error) {
      console.error('获取LLM配置失败:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取LLM配置
   * @param configId 配置ID
   * @returns LLM配置
   */
  async getConfig(configId: string): Promise<LLMConfig> {
    try {
      const response = await this.apiClient.get(`/configs/${configId}`);
      return response.data;
    } catch (error) {
      console.error('获取LLM配置失败:', error);
      throw error;
    }
  }

  /**
   * 将前端配置转换为后端接受的格式
   * @param config 前端LLM配置
   * @returns 后端LLM配置
   */
  private toBackendConfig(config: Partial<LLMConfig>): any {
    const backendConfig: any = {
      provider: config.provider,
      name: config.name,
      description: config.description,
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.max_tokens,
      api_key: config.api_key,
      base_url: config.api_base, // 字段重命名
    };

    // 移除未定义的字段
    Object.keys(backendConfig).forEach(key => {
      if (backendConfig[key] === undefined) {
        delete backendConfig[key];
      }
    });

    return backendConfig;
  }

  /**
   * 创建LLM配置
   * @param config LLM配置数据
   * @returns 创建的配置
   */
  async createConfig(config: Omit<LLMConfig, 'id' | 'created_at' | 'updated_at'>): Promise<LLMConfig> {
    try {
      const backendConfig = this.toBackendConfig(config);
      const response = await this.apiClient.post('/configs', backendConfig);
      return response.data;
    } catch (error) {
      console.error('创建LLM配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新LLM配置
   * @param provider 提供商
   * @param config 更新的配置数据
   * @returns 更新后的配置
   */
  async updateConfig(provider: LLMProvider, config: Partial<LLMConfig>): Promise<LLMConfig> {
    try {
      const backendConfig = this.toBackendConfig(config);
      const response = await this.apiClient.put(`/configs/${provider}`, backendConfig);
      return response.data;
    } catch (error) {
      console.error('更新LLM配置失败:', error);
      throw error;
    }
  }

  /**
   * 删除LLM配置
   * @param configId 配置ID
   */
  async deleteConfig(configId: string): Promise<void> {
    try {
      await this.apiClient.delete(`/configs/${configId}`);
    } catch (error) {
      console.error('删除LLM配置失败:', error);
      throw error;
    }
  }

  /**
   * 测试LLM连接
   * @param config LLM配置
   * @returns 测试结果
   */
  async testConnection(config: LLMConfig): Promise<ConnectionTestResult> {
    try {
      const response = await this.apiClient.post(`/configs/${config.provider}/test`, config);
      return response.data;
    } catch (error) {
      console.error('测试LLM连接失败:', error);
      throw error;
    }
  }

  /**
   * 获取LLM连接状态
   * @param provider 提供商
   * @returns 连接状态
   */
  async getConnectionStatus(provider: LLMProvider): Promise<LLMStatus> {
    try {
      const response = await this.apiClient.get(`/configs/${provider}/status`);
      return response.data;
    } catch (error) {
      console.error('获取LLM连接状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取指定提供商的可用模型列表
   * @param provider 提供商
   * @returns 可用模型列表
   */
  async getAvailableModels(provider: LLMProvider): Promise<AvailableModel[]> {
    try {
      const response = await this.apiClient.get(`/models/${provider}`);
      return response.data;
    } catch (error) {
      console.error('获取可用模型列表失败:', error);
      throw error;
    }
  }

  /**
   * 批量获取所有提供商的连接状态
   * @returns 所有提供商的连接状态
   */
  async getAllConnectionStatus(): Promise<Record<LLMProvider, LLMStatus>> {
    try {
      const providers = await this.getProviders();
      const statusPromises = providers.map(async (provider) => {
        try {
          const status = await this.getConnectionStatus(provider);
          return { provider, status };
        } catch (error) {
          return {
            provider,
            status: {
              provider,
              is_connected: false,
              error_message: '无法获取状态',
            } as LLMStatus,
          };
        }
      });

      const results = await Promise.all(statusPromises);
      const statusMap: Record<LLMProvider, LLMStatus> = {} as any;
      
      results.forEach(({ provider, status }) => {
        statusMap[provider] = status;
      });

      return statusMap;
    } catch (error) {
      console.error('批量获取连接状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取LLM连接的统计数据
   * @returns 统计数据
   */
  async getLLMConnectionStats(): Promise<LLMConnectionStats> {
    try {
      // 注意：这里的 apiClient 基础 URL 是 /api/v1/llm，所以我们需要构建正确的相对路径
      const response = await this.apiClient.get('../stats/llm-connections');
      return response.data;
    } catch (error) {
      console.error('获取LLM连接统计数据失败:', error);
      throw error;
    }
  }
}

// 导出服务实例
export const llmService = new LLMService();
export default llmService;
