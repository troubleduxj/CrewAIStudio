"use client"

import React from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  callback: (event: KeyboardEvent) => void;
  description?: string;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  disabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  target?: HTMLElement | Document | Window | null;
  enabled?: boolean;
}

/**
 * 键盘快捷键 Hook
 * 支持全局和局部快捷键绑定
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { target = document, enabled = true } = options;

  React.useEffect(() => {
    if (!enabled || !target) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // 如果焦点在输入框、文本域或可编辑元素上，跳过快捷键处理
      const activeElement = document.activeElement;
      const isInputFocused = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      // 检查是否匹配任何快捷键
      for (const shortcut of shortcuts) {
        if (shortcut.disabled) continue;

        const keyMatches = shortcut.key.toLowerCase() === event.key.toLowerCase();
        const ctrlMatches = !!shortcut.ctrlKey === event.ctrlKey;
        const altMatches = !!shortcut.altKey === event.altKey;
        const shiftMatches = !!shortcut.shiftKey === event.shiftKey;
        const metaMatches = !!shortcut.metaKey === event.metaKey;

        if (keyMatches && ctrlMatches && altMatches && shiftMatches && metaMatches) {
          // 对于某些快捷键，即使在输入框中也要执行（如 Escape）
          const allowInInput = shortcut.key.toLowerCase() === 'escape';
          
          if (isInputFocused && !allowInInput) {
            continue;
          }

          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }
          if (shortcut.stopPropagation) {
            event.stopPropagation();
          }

          shortcut.callback(event);
          break; // 只执行第一个匹配的快捷键
        }
      }
    };

    const targetElement = target as EventTarget;
    targetElement.addEventListener('keydown', handleKeyDown);

    return () => {
      targetElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts, target, enabled]);
}

/**
 * 常用快捷键组合
 */
export const commonShortcuts = {
  // 基础操作
  save: { key: 's', ctrlKey: true, description: '保存' },
  copy: { key: 'c', ctrlKey: true, description: '复制' },
  paste: { key: 'v', ctrlKey: true, description: '粘贴' },
  cut: { key: 'x', ctrlKey: true, description: '剪切' },
  undo: { key: 'z', ctrlKey: true, description: '撤销' },
  redo: { key: 'y', ctrlKey: true, description: '重做' },
  selectAll: { key: 'a', ctrlKey: true, description: '全选' },
  
  // 导航
  refresh: { key: 'F5', description: '刷新' },
  home: { key: 'Home', description: '回到顶部' },
  end: { key: 'End', description: '跳到底部' },
  
  // 对话框和模态框
  escape: { key: 'Escape', description: '关闭/取消' },
  enter: { key: 'Enter', description: '确认' },
  
  // 搜索
  find: { key: 'f', ctrlKey: true, description: '查找' },
  findNext: { key: 'F3', description: '查找下一个' },
  
  // 应用特定
  newItem: { key: 'n', ctrlKey: true, description: '新建' },
  delete: { key: 'Delete', description: '删除' },
  edit: { key: 'F2', description: '编辑' },
  
  // 开发者工具
  devTools: { key: 'F12', description: '开发者工具' },
  console: { key: 'j', ctrlKey: true, shiftKey: true, description: '控制台' }
};

/**
 * 格式化快捷键显示文本
 */
export function formatShortcut(shortcut: Partial<KeyboardShortcut>): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.metaKey) parts.push('Cmd');
  
  if (shortcut.key) {
    // 特殊键名映射
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Enter': '⏎',
      'Escape': 'Esc',
      'Backspace': '⌫',
      'Delete': 'Del',
      'Tab': '⇥'
    };
    
    const displayKey = keyMap[shortcut.key] || shortcut.key.toUpperCase();
    parts.push(displayKey);
  }
  
  return parts.join(' + ');
}

/**
 * 检查快捷键是否可用（不与浏览器默认快捷键冲突）
 */
export function isShortcutAvailable(shortcut: Partial<KeyboardShortcut>): boolean {
  // 浏览器保留的快捷键组合
  const reservedShortcuts = [
    { key: 't', ctrlKey: true }, // 新标签页
    { key: 'w', ctrlKey: true }, // 关闭标签页
    { key: 'r', ctrlKey: true }, // 刷新
    { key: 'l', ctrlKey: true }, // 地址栏
    { key: 'd', ctrlKey: true }, // 书签
    { key: 'h', ctrlKey: true }, // 历史记录
    { key: 'j', ctrlKey: true }, // 下载
    { key: 'u', ctrlKey: true }, // 查看源码
    { key: 'p', ctrlKey: true }, // 打印
    { key: 'f', ctrlKey: true }, // 查找
    { key: 'g', ctrlKey: true }, // 查找下一个
  ];
  
  return !reservedShortcuts.some(reserved => 
    reserved.key === shortcut.key &&
    reserved.ctrlKey === shortcut.ctrlKey &&
    reserved.altKey === shortcut.altKey &&
    reserved.shiftKey === shortcut.shiftKey &&
    reserved.metaKey === shortcut.metaKey
  );
}

/**
 * 快捷键帮助信息 Hook
 */
export function useShortcutHelp(shortcuts: KeyboardShortcut[]) {
  const [showHelp, setShowHelp] = React.useState(false);
  
  const helpShortcuts = React.useMemo(() => 
    shortcuts.filter(s => s.description && !s.disabled),
    [shortcuts]
  );
  
  // 添加显示帮助的快捷键
  useKeyboardShortcuts([
    {
      key: '?',
      shiftKey: true,
      callback: () => setShowHelp(prev => !prev),
      description: '显示快捷键帮助'
    },
    {
      key: 'Escape',
      callback: () => setShowHelp(false)
    }
  ]);
  
  return {
    showHelp,
    setShowHelp,
    helpShortcuts
  };
}

export default useKeyboardShortcuts;