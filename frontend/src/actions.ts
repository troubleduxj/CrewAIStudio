'use server';

import type { ResearchOutput } from '@/lib/types';
import type { AdjustTaskParametersInput, AdjustTaskParametersOutput } from '@/lib/ai-types';

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
    // 调用后端CrewAI研究分析API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/research/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ topic }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        data: {
          result: result.result
        }
      };
    } else {
      return {
        success: false,
        error: result.message || 'Research analysis failed'
      };
    }
  } catch (error) {
    console.error('Research error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete research analysis'
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
    // TODO: 实现CrewAI后端API调用来替代adjustTaskParameters
    // const result = await adjustTaskParameters(params);
    
    // 临时返回模拟结果
    const result: AdjustTaskParametersOutput = {
      adjustedParameters: {
        priority: 'medium',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        resources: ['default']
      },
      reasoning: 'Task parameters adjusted based on current workload and agent performance.'
    };
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