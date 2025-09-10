import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9998';

export interface Tool {
  name: string;
  type: 'system' | 'custom' | 'api' | 'mcp';
  description?: string;
}

class ToolService {
  private apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api/v1/tools`,
    timeout: 15000,
  });

  async getAvailableTools(): Promise<Tool[]> {
    try {
      const response = await this.apiClient.get('');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch available tools:', error);
      throw error;
    }
  }
}

export const toolService = new ToolService();
