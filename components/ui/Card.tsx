import React, { forwardRef } from 'react';
import { getComponentClasses, CardVariant, THEME_COLORS } from './styleTokens';

// =============================================================================
// 统一卡片组件 - Card v2.0
// =============================================================================

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** 卡片标题 */
  title?: React.ReactNode;
  /** 标题图标 */
  icon?: React.ReactNode;
  /** 头部操作按钮 */
  actions?: React.ReactNode;
  /** 卡片内容 */
  children?: React.ReactNode;
  /** 卡片变体 */
  variant?: CardVariant;
  /** 头部变体 */
  headerVariant?: 'gradient' | 'solid' | 'transparent' | 'accent';
  /** 自定义头部样式 */
  headerClassName?: string;
  /** 自定义内容样式 */
  contentClassName?: string;
  /** 测试ID */
  'data-testid'?: string;
}

// 头部样式变体
const headerVariants = {
  gradient: 'bg-gradient-to-r from-purple-700 via-purple-600 to-purple-500',
  solid: `bg-[${THEME_COLORS.bg.secondary}] border-b border-[${THEME_COLORS.border.primary}]`,
  transparent: 'bg-transparent',
  accent: `bg-[${THEME_COLORS.brand.primary}] text-white`
};

/**
 * 统一的卡片组件
 *
 * 特性：
 * - 支持多种变体（默认、浮动、玻璃、扁平）
 * - 可配置头部样式
 * - 完整的TypeScript类型支持
 * - 响应式设计
 *
 * @example
 * ```tsx
 * <Card title="项目标题" icon={<ProjectIcon />}>
 *   <p>卡片内容</p>
 * </Card>
 *
 * <Card variant="glass" headerVariant="accent" actions={<Button>操作</Button>}>
 *   <div>高级卡片内容</div>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(({
  title,
  icon,
  actions,
  children,
  className = '',
  headerClassName = '',
  contentClassName = '',
  variant = 'default',
  headerVariant = 'gradient',
  'data-testid': testId,
  ...props
}, ref) => {
  const cardClasses = getComponentClasses('card', {
    variant,
    custom: className
  });

  const hasHeader = title || icon || actions;

  return (
    <div
      ref={ref}
      className={cardClasses}
      data-testid={testId}
      {...props}
    >
      {/* 头部区域 */}
      {hasHeader && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 ${headerVariants[headerVariant]} ${headerClassName}`}>
          <div className="flex items-center gap-3 min-w-0">
            {icon && <div className="flex-shrink-0">{icon}</div>}
            {title && (
              <div className="min-w-0 truncate text-sm font-semibold text-[var(--color-text-primary)]">
                {title}
              </div>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* 内容区域 */}
      {children && (
        <div className={`px-4 py-4 ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
});

Card.displayName = 'Card';

export default Card;


