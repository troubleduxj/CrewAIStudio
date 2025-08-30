'use server';

import type { ResearchOutput } from '@/lib/types';
import type { AdjustTaskParametersInput, AdjustTaskParametersOutput } from '@/lib/ai-types';
import { adjustTaskParameters } from '@/server/ai/flows/adjust-task-parameters';

/**
 * 处理研究请求的服务器动作
 * @param params - 包含研究主题的参数对象
 * @returns 研究结果或错误信息
 */
export async function handleResearch({ topic }: { topic: string }): Promise<{
  success: boolean;
  data?: ResearchOutput;
  error?: string;
}> {
  try {
    // 模拟API调用
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 模拟研究结果
    const mockResult: ResearchOutput = {
      result: `# Research Analysis: ${topic}\n\n## Summary\nThis is a mock research summary for: ${topic}. The analysis shows various insights and findings related to the topic.\n\n## Key Findings\n- Key finding 1: Important insight discovered\n- Key finding 2: Significant trend identified\n- Key finding 3: Notable pattern observed\n\n## Sources\n- https://example.com/source1\n- https://example.com/source2\n- https://example.com/source3\n\n*Analysis completed at: ${new Date().toISOString()}*`
    };

    return {
      success: true,
      data: mockResult
    };
  } catch (error) {
    console.error('Research error:', error);
    return {
      success: false,
      error: 'Failed to complete research analysis'
    };
  }
}

/**
 * 处理任务参数调整的服务器动作
 * @param params - 包含任务ID、反馈和代理性能的参数对象
 * @returns 调整结果或错误信息
 */
export async function handleAdjustTaskParameters(params: AdjustTaskParametersInput): Promise<{
  success: boolean;
  data?: AdjustTaskParametersOutput;
  error?: string;
}> {
  try {
    const result = await adjustTaskParameters(params);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Task adjustment error:', error);
    return {
      success: false,
      error: 'Failed to adjust task parameters'
    };
  }
}