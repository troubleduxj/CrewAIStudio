"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Cog, Search, Globe, Calculator, FileText, Database, Code, Zap } from 'lucide-react';
import type { Tool } from '@/lib/types';
import { DragEvent } from 'react';



/**
 * 可用工具列表 - 包含各种类型的工具
 */
const availableTools: {name: Tool, label: string, description: string, category: string, type: string, icon: any}[] = [
    { name: 'browser', label: 'Browser', description: '网页浏览和搜索工具', category: 'Network', type: 'tool', icon: Globe },
    { name: 'calculator', label: 'Calculator', description: '数学计算和公式处理', category: 'System', type: 'tool', icon: Calculator },
    { name: 'file_reader', label: 'File Reader', description: '文件读取和解析工具', category: 'Files', type: 'tool', icon: FileText },
    { name: 'database', label: 'Database', description: '数据库查询和操作', category: 'System', type: 'tool', icon: Database },
    { name: 'code_executor', label: 'Code Executor', description: '代码执行和调试工具', category: 'System', type: 'tool', icon: Code },
    { name: 'api_client', label: 'API Client', description: 'API调用和集成工具', category: 'Network', type: 'tool', icon: Zap },
];

/**
 * 工具分类
 */
const toolCategories = [
    { name: '全部', value: 'all' },
    { name: 'System', value: 'System' },
    { name: 'Network', value: 'Network' },
    { name: 'Files', value: 'Files' },
];

/**
 * 处理拖拽开始事件
 * @param e 拖拽事件
 * @param item 拖拽项目对象
 * @param onDragStartCallback 拖拽开始回调函数
 */
const handleDragStart = (e: DragEvent, item: any, onDragStartCallback?: () => void) => {
  // 只处理工具拖拽
  const itemData = JSON.stringify({ 
    name: item.name, 
    label: item.label, 
    type: 'tool' 
  });
  // 当拖拽工具时，通知父组件
  onDragStartCallback?.();
  e.dataTransfer.setData('application/json', itemData);
  e.dataTransfer.effectAllowed = 'move';
}

/**
 * 工具面板组件 - 专门用于显示和管理工具
 * @param props 组件属性
 * @returns 工具面板JSX元素
 */
export default function WorkflowToolPanel({ tools, onToolSelect, onDragStart, onDragEnd }: {
  tools?: any[];
  onToolSelect?: (tool: any) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 只显示工具项目
  const allItems = availableTools;

  // 过滤项目
  const filteredItems = allItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索工具..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        {toolCategories.map(category => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
            className="text-xs h-7"
          >
            {category.name}
          </Button>
        ))}
      </div>

      {/* 项目列表 */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {filteredItems.map((item, index) => {
          const IconComponent = item.icon;
          const itemKey = item.name || `${item.type}-${index}`;
          return (
            <Card 
              key={itemKey}
              className="p-3 cursor-grab hover:bg-accent/50 transition-all duration-200 border-border/50 hover:border-primary/30 hover:shadow-sm"
              draggable={true}
              onDragStart={(e) => handleDragStart(e, item, onDragStart)}
              onDragEnd={onDragEnd}
              onClick={() => onToolSelect?.(item)}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                  <IconComponent className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{item.label}</h4>
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
        
        {/* 空状态 */}
        {filteredItems.length === 0 && (
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-sm font-medium mb-1">未找到匹配的项目</div>
            <div className="text-xs text-muted-foreground">尝试调整搜索条件或分类筛选</div>
          </div>
        )}
      </div>
    </div>
  );
}
