import React, { forwardRef } from 'react';
import { getComponentClasses, SizeVariant, InputVariant } from './styleTokens';

// =============================================================================
// 统一输入框组件 - Input v2.0
// =============================================================================

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 输入框标签 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 成功提示 */
  success?: string;
  /** 输入框尺寸 */
  size?: SizeVariant;
  /** 输入框变体（默认/错误/成功） */
  variant?: InputVariant;
  /** 包装器自定义样式 */
  wrapperClassName?: string;
  /** 左侧图标 */
  leftIcon?: React.ReactNode;
  /** 右侧图标 */
  rightIcon?: React.ReactNode;
  /** 帮助文本 */
  helpText?: string;
  /** 测试ID */
  'data-testid'?: string;
}

/**
 * 统一的输入框组件
 *
 * 特性：
 * - 支持多种尺寸和状态变体
 * - 内置错误和成功状态显示
 * - 支持图标
 * - 完整的表单验证反馈
 * - 统一的设计语言
 *
 * @example
 * ```tsx
 * <Input
 *   label="用户名"
 *   placeholder="请输入用户名"
 *   error="用户名不能为空"
 * />
 *
 * <Input
 *   variant="success"
 *   success="用户名可用"
 *   leftIcon={<UserIcon />}
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success,
  size = 'md',
  variant = 'default',
  wrapperClassName = '',
  leftIcon,
  rightIcon,
  helpText,
  className = '',
  'data-testid': testId,
  ...props
}, ref) => {
  // 根据状态确定变体
  const actualVariant = error ? 'error' : success ? 'success' : variant;

  const inputClasses = getComponentClasses('input', {
    variant: actualVariant,
    size,
    custom: className
  });

  const hasIcon = leftIcon || rightIcon;

  return (
    <div className={wrapperClassName}>
      {/* 标签 */}
      {label && (
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* 输入框容器 */}
      <div className="relative">
        {/* 左侧图标 */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
            {leftIcon}
          </div>
        )}

        {/* 输入框 */}
        <input
          ref={ref}
          className={`${inputClasses} ${hasIcon ? (leftIcon ? 'pl-10' : '') + (rightIcon ? ' pr-10' : '') : ''}`}
          data-testid={testId}
          {...props}
        />

        {/* 右侧图标 */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>

      {/* 帮助文本 */}
      {helpText && !error && !success && (
        <div className="text-xs text-[var(--color-text-muted)] mt-1">
          {helpText}
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 成功提示 */}
      {success && !error && (
        <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
          {success}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  /** 文本域标签 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 成功提示 */
  success?: string;
  /** 文本域尺寸 */
  size?: SizeVariant;
  /** 文本域变体 */
  variant?: InputVariant;
  /** 包装器自定义样式 */
  wrapperClassName?: string;
  /** 帮助文本 */
  helpText?: string;
  /** 是否可调整大小 */
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  /** 测试ID */
  'data-testid'?: string;
}

/**
 * 统一的文本域组件
 *
 * 特性：
 * - 与Input组件保持一致的API
 * - 支持自动调整高度
 * - 相同的状态管理和样式
 *
 * @example
 * ```tsx
 * <Textarea
 *   label="描述"
 *   placeholder="请输入详细描述"
 *   rows={4}
 *   resize="vertical"
 * />
 * ```
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  success,
  size = 'md',
  variant = 'default',
  wrapperClassName = '',
  helpText,
  resize = 'vertical',
  className = '',
  'data-testid': testId,
  ...props
}, ref) => {
  // 根据状态确定变体
  const actualVariant = error ? 'error' : success ? 'success' : variant;

  const textareaClasses = getComponentClasses('input', {
    variant: actualVariant,
    size,
    custom: `${className} resize-${resize}`
  });

  return (
    <div className={wrapperClassName}>
      {/* 标签 */}
      {label && (
        <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wider">
          {label}
        </label>
      )}

      {/* 文本域 */}
      <textarea
        ref={ref}
        className={textareaClasses}
        data-testid={testId}
        {...props}
      />

      {/* 帮助文本 */}
      {helpText && !error && !success && (
        <div className="text-xs text-[var(--color-text-muted)] mt-1">
          {helpText}
        </div>
      )}

      {/* 错误信息 */}
      {error && (
        <div className="text-xs text-red-400 mt-1 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 成功提示 */}
      {success && !error && (
        <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
          {success}
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;


