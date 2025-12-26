import React, { forwardRef } from 'react';
import { getComponentClasses, TextVariant, THEME_COLORS } from './styleTokens';

// =============================================================================
// 统一文本组件 - Text v2.0
// =============================================================================

export interface TextProps extends React.HTMLAttributes<HTMLSpanElement | HTMLParagraphElement | HTMLHeadingElement> {
  /** 文本变体 */
  variant?: TextVariant;
  /** 文本颜色变体 */
  color?: 'primary' | 'secondary' | 'muted' | 'accent' | 'success' | 'warning' | 'error';
  /** 文本大小调整 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 字体权重 */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  /** 是否显示为块级元素 */
  block?: boolean;
  /** 是否截断长文本 */
  truncate?: boolean;
  /** 最大行数（用于多行截断） */
  lineClamp?: number;
  /** 测试ID */
  'data-testid'?: string;
}

/**
 * 统一的文本显示组件
 *
 * 特性：
 * - 支持多种语义变体（标题、正文、标签等）
 * - 灵活的颜色和大小配置
 * - 内置文本截断功能
 * - 语义化的HTML标签选择
 *
 * @example
 * ```tsx
 * <Text variant="h1" color="primary">主标题</Text>
 * <Text variant="body" color="secondary" truncate>长文本内容...</Text>
 * <Text variant="caption" color="muted" lineClamp={2}>多行截断文本</Text>
 * ```
 */
export const Text = forwardRef<HTMLElement, TextProps>(({
  variant = 'body',
  color = 'primary',
  size,
  weight,
  block = false,
  truncate = false,
  lineClamp,
  className = '',
  children,
  'data-testid': testId,
  ...props
}, ref) => {
  // 基础样式类
  const baseClasses = getComponentClasses('text', { variant });

  // 颜色类
  const colorClasses = {
    primary: `text-[${THEME_COLORS.text.primary}]`,
    secondary: `text-[${THEME_COLORS.text.secondary}]`,
    muted: `text-[${THEME_COLORS.text.muted}]`,
    accent: `text-[${THEME_COLORS.text.accent}]`,
    success: `text-[${THEME_COLORS.state.success}]`,
    warning: `text-[${THEME_COLORS.state.warning}]`,
    error: `text-[${THEME_COLORS.state.error}]`
  };

  // 尺寸调整类
  const sizeClasses = size ? `text-${size}` : '';

  // 字体权重类
  const weightClasses = weight ? `font-${weight}` : '';

  // 截断类
  const truncateClasses = truncate ? 'truncate' : '';
  const lineClampClasses = lineClamp ? `line-clamp-${lineClamp}` : '';

  // 块级显示类
  const blockClasses = block ? 'block' : 'inline';

  // 组合所有类名
  const finalClasses = [
    baseClasses,
    colorClasses[color],
    sizeClasses,
    weightClasses,
    truncateClasses,
    lineClampClasses,
    blockClasses,
    className
  ].filter(Boolean).join(' ');

  // 根据变体选择合适的HTML标签
  const getElementType = (): keyof JSX.IntrinsicElements => {
    switch (variant) {
      case 'h1': return 'h1';
      case 'h2': return 'h2';
      case 'h3': return 'h3';
      case 'h4': return 'h4';
      default: return block ? 'p' : 'span';
    }
  };

  const Element = getElementType() as any;

  return (
    <Element
      ref={ref}
      className={finalClasses}
      data-testid={testId}
      {...props}
    >
      {children}
    </Element>
  );
});

Text.displayName = 'Text';

// =============================================================================
// 便捷变体导出
// =============================================================================

/**
 * 标题组件 - H1
 */
export const H1 = forwardRef<HTMLHeadingElement, Omit<TextProps, 'variant'>>(
  (props, ref) => <Text ref={ref} variant="h1" {...props} />
);
H1.displayName = 'H1';

/**
 * 标题组件 - H2
 */
export const H2 = forwardRef<HTMLHeadingElement, Omit<TextProps, 'variant'>>(
  (props, ref) => <Text ref={ref} variant="h2" {...props} />
);
H2.displayName = 'H2';

/**
 * 标题组件 - H3
 */
export const H3 = forwardRef<HTMLHeadingElement, Omit<TextProps, 'variant'>>(
  (props, ref) => <Text ref={ref} variant="h3" {...props} />
);
H3.displayName = 'H3';

/**
 * 标题组件 - H4
 */
export const H4 = forwardRef<HTMLHeadingElement, Omit<TextProps, 'variant'>>(
  (props, ref) => <Text ref={ref} variant="h4" {...props} />
);
H4.displayName = 'H4';

/**
 * 正文文本
 */
export const Body = forwardRef<HTMLParagraphElement, Omit<TextProps, 'variant'>>(
  (props, ref) => <Text ref={ref} variant="body" block {...props} />
);
Body.displayName = 'Body';

/**
 * 说明文本
 */
export const Caption = forwardRef<HTMLSpanElement, Omit<TextProps, 'variant'>>(
  (props, ref) => <Text ref={ref} variant="caption" {...props} />
);
Caption.displayName = 'Caption';

/**
 * 标签文本
 */
export const Label = forwardRef<HTMLSpanElement, Omit<TextProps, 'variant'>>(
  (props, ref) => <Text ref={ref} variant="label" {...props} />
);
Label.displayName = 'Label';

export default Text;
