"use client"
import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Download, ExternalLink, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from '@/components/layout/main-layout';

/**
 * Marketplace页面组件
 * 功能：展示和管理各种工具、模板和插件的市场
 * @returns Marketplace页面JSX元素
 */
export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // 2列 x 4行

  // 模拟市场数据
  const marketplaceItems = [
    {
      id: 1,
      name: 'Web Scraper Tool',
      description: '强大的网页数据抓取工具，支持多种网站结构',
      category: 'tools',
      rating: 4.8,
      downloads: 1250,
      price: 'Free',
      tags: ['scraping', 'web', 'data'],
      author: 'CrewAI Team'
    },
    {
      id: 2,
      name: 'Email Marketing Agent',
      description: '自动化邮件营销代理，智能内容生成和发送',
      category: 'agents',
      rating: 4.6,
      downloads: 890,
      price: '$29',
      tags: ['marketing', 'email', 'automation'],
      author: 'Marketing Pro'
    },
    {
      id: 3,
      name: 'Data Analysis Workflow',
      description: '完整的数据分析工作流模板，包含清洗、分析和可视化',
      category: 'workflows',
      rating: 4.9,
      downloads: 2100,
      price: 'Free',
      tags: ['data', 'analysis', 'visualization'],
      author: 'Data Science Hub'
    },
    {
      id: 4,
      name: 'Social Media Monitor',
      description: '社交媒体监控工具，实时追踪品牌提及和情感分析',
      category: 'tools',
      rating: 4.7,
      downloads: 756,
      price: '$19',
      tags: ['social', 'monitoring', 'sentiment'],
      author: 'Social Insights'
    },
    {
      id: 5,
      name: 'Customer Service Bot',
      description: '智能客服机器人，24/7自动回复客户咨询',
      category: 'agents',
      rating: 4.5,
      downloads: 1680,
      price: '$49',
      tags: ['customer service', 'bot', 'automation'],
      author: 'Service AI'
    },
    {
      id: 6,
      name: 'Content Creation Pipeline',
      description: '内容创作流水线，从构思到发布的完整自动化流程',
      category: 'workflows',
      rating: 4.8,
      downloads: 945,
      price: '$39',
      tags: ['content', 'creation', 'pipeline'],
      author: 'Content Masters'
    }
  ];

  const categories = [
    { value: 'all', label: '全部' },
    { value: 'tools', label: '工具' },
    { value: 'agents', label: 'Agents' },
    { value: 'workflows', label: '工作流' },
    { value: 'templates', label: '模板' }
  ];

  // 过滤项目
  const filteredItems = marketplaceItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 分页逻辑
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // 当筛选条件改变时重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  /**
   * 渲染星级评分
   * @param rating - 评分数值
   * @returns 星级评分JSX元素
   */
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-muted-foreground ml-1">{rating}</span>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-6 p-6">
        {/* 页面头部 */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-muted-foreground">
            发现和安装强大的工具、代理和工作流模板
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索工具、代理、工作流..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="mr-2 h-4 w-4" />
              筛选
            </Button>
          </div>
        </div>

        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.value}
              variant={selectedCategory === category.value ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.value)}
              className="text-sm"
            >
              {category.label}
            </Button>
          ))}
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">

          <TabsContent value={selectedCategory} className="mt-6">
            {/* 项目网格 */}
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              {paginatedItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{item.name}</CardTitle>
                        <CardDescription className="text-xs text-muted-foreground">
                          by {item.author}
                        </CardDescription>
                      </div>
                      <Badge variant={item.price === 'Free' ? 'secondary' : 'default'}>
                        {item.price}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                    
                    {/* 标签 */}
                    <div className="flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    
                    {/* 评分和下载量 */}
                    <div className="flex items-center justify-between text-sm">
                      {renderStars(item.rating)}
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Download className="h-4 w-4" />
                        {item.downloads.toLocaleString()}
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm">
                        安装
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* 空状态 */}
            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">没有找到匹配的项目</p>
                <p className="text-sm text-muted-foreground mt-1">
                  尝试调整搜索条件或浏览其他分类
                </p>
              </div>
            )}

            {/* 分页控件 */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  上一页
                </Button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  下一页
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
