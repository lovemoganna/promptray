import React, { forwardRef } from 'react';
import { getComponentClasses, SizeVariant, ColorVariant } from './styleTokens';

// =============================================================================
// 统一按钮组件 - Button v2.0
// =============================================================================

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮变体 */
  variant?: ColorVariant;
  /** 按钮尺寸 */
  size?: SizeVariant;
  /** 是否显示加载状态 */
  loading?: boolean;
  /** 加载时显示的文本 */
  loadingText?: string;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 自定义样式类名 */
  className?: string;
  /** 测试ID */
  'data-testid'?: string;
}

/**
 * 统一的按钮组件
 *
 * 特性：
 * - 支持多种变体和尺寸
 * - 内置加载状态
 * - 支持图标
 * - 完整的TypeScript类型支持
 * - 统一的设计语言
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   点击我
 * </Button>
 *
 * <Button variant="secondary" loading loadingText="保存中...">
 *   保存
 * </Button>
 *
 * <Button leftIcon={<PlusIcon />} rightIcon={<ChevronDownIcon />}>
 *   添加项目
 * </Button>
 * ```
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  'data-testid': testId,
  ...props
}, ref) => {
  const buttonClasses = getComponentClasses('button', {
    variant,
    size,
    custom: className
  });

  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={isDisabled}
      data-testid={testId}
      {...props}
    >
      {/* 加载状态指示器 */}
      {loading && (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      )}

      {/* 左侧图标 */}
      {leftIcon && !loading && (
        <span className="mr-2 flex-shrink-0">
          {leftIcon}
        </span>
      )}

      {/* 按钮内容 */}
      <span className={loading ? 'opacity-70' : ''}>
        {loading && loadingText ? loadingText : children}
      </span>

      {/* 右侧图标 */}
      {rightIcon && !loading && (
        <span className="ml-2 flex-shrink-0">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

// =============================================================================
// 便捷变体导出
// =============================================================================

/**
 * 主按钮 - 用于主要操作
 */
export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="primary" {...props} />
);
PrimaryButton.displayName = 'PrimaryButton';

/**
 * 次按钮 - 用于次要操作
 */
export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="secondary" {...props} />
);
SecondaryButton.displayName = 'SecondaryButton';

/**
 * 幽灵按钮 - 用于不显眼的辅助操作
 */
export const GhostButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="ghost" {...props} />
);
GhostButton.displayName = 'GhostButton';

/**
 * 危险按钮 - 用于删除、取消等危险操作
 */
export const DangerButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant'>>(
  (props, ref) => <Button ref={ref} variant="danger" {...props} />
);
DangerButton.displayName = 'DangerButton';

export default Button;