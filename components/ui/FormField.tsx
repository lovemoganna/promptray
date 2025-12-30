import { forwardRef } from 'react';
import { Input, InputProps } from './Input';
import { Textarea, TextareaProps } from './Input';
import { Text } from './Text';

// =============================================================================
// 表单字段组件 - FormField v1.0
// =============================================================================

export interface FormFieldProps {
  /** 字段标签 */
  label?: string;
  /** 字段描述 */
  description?: string;
  /** 错误信息 */
  error?: string;
  /** 成功提示 */
  success?: string;
  /** 帮助文本 */
  helpText?: string;
  /** 是否必填 */
  required?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 包装器自定义样式 */
  className?: string;
  /** 测试ID */
  'data-testid'?: string;
}

export interface InputFieldProps extends FormFieldProps, Omit<InputProps, 'error' | 'success' | 'helpText'> {}
export interface TextareaFieldProps extends FormFieldProps, Omit<TextareaProps, 'error' | 'success' | 'helpText'> {}

/**
 * 输入框表单字段
 *
 * 组合了标签、输入框、描述、错误提示等表单元素
 *
 * @example
 * ```tsx
 * <InputField
 *   label="用户名"
 *   description="请输入您的用户名"
 *   error="用户名不能为空"
 *   required
 * />
 * ```
 */
export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(({
  label,
  description,
  error,
  success,
  helpText,
  required,
  disabled,
  className = '',
  'data-testid': testId,
  ...inputProps
}, ref) => {
  return (
    <div className={`space-y-2 ${className}`} data-testid={testId}>
      {/* 标签行 */}
      {(label || required) && (
        <div className="flex items-center gap-2">
          {label && (
            <Text variant="label" className="text-[var(--color-text-secondary)]">
              {label}
            </Text>
          )}
          {required && (
            <span className="text-red-400 text-xs">*</span>
          )}
        </div>
      )}

      {/* 描述文本 */}
      {description && (
        <Text variant="caption" color="muted" className="text-xs">
          {description}
        </Text>
      )}

      {/* 输入框 */}
      <Input
        ref={ref}
        error={error}
        success={success}
        helpText={helpText}
        disabled={disabled}
        required={required}
        {...inputProps}
      />
    </div>
  );
});

InputField.displayName = 'InputField';

/**
 * 文本域表单字段
 *
 * 组合了标签、文本域、描述、错误提示等表单元素
 *
 * @example
 * ```tsx
 * <TextareaField
 *   label="描述"
 *   description="请输入详细描述"
 *   rows={4}
 *   resize="vertical"
 * />
 * ```
 */
export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(({
  label,
  description,
  error,
  success,
  helpText,
  required,
  disabled,
  className = '',
  'data-testid': testId,
  ...textareaProps
}, ref) => {
  return (
    <div className={`space-y-2 ${className}`} data-testid={testId}>
      {/* 标签行 */}
      {(label || required) && (
        <div className="flex items-center gap-2">
          {label && (
            <Text variant="label" className="text-[var(--color-text-secondary)]">
              {label}
            </Text>
          )}
          {required && (
            <span className="text-red-400 text-xs">*</span>
          )}
        </div>
      )}

      {/* 描述文本 */}
      {description && (
        <Text variant="caption" color="muted" className="text-xs">
          {description}
        </Text>
      )}

      {/* 文本域 */}
      <Textarea
        ref={ref}
        error={error}
        success={success}
        helpText={helpText}
        disabled={disabled}
        required={required}
        {...textareaProps}
      />
    </div>
  );
});

TextareaField.displayName = 'TextareaField';

// =============================================================================
// 选择器字段组件
// =============================================================================

export interface SelectFieldProps extends FormFieldProps {
  /** 选择器选项 */
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  /** 当前选中值 */
  value?: string;
  /** 值变更回调 */
  onValueChange?: (value: string) => void;
  /** 占位符 */
  placeholder?: string;
  /** 选择器自定义样式 */
  selectClassName?: string;
  /** 成功提示 */
  success?: string;
  /** 帮助文本 */
  helpText?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(({
  label,
  description,
  error,
  success,
  helpText,
  required,
  disabled,
  className = '',
  options,
  value,
  onValueChange,
  placeholder,
  selectClassName = '',
  'data-testid': testId,
  ...props
}, ref) => {
  const selectClasses = `w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 appearance-none cursor-pointer ${selectClassName}`;

  return (
    <div className={`space-y-2 ${className}`} data-testid={testId}>
      {/* 标签行 */}
      {(label || required) && (
        <div className="flex items-center gap-2">
          {label && (
            <Text variant="label" className="text-[var(--color-text-secondary)]">
              {label}
            </Text>
          )}
          {required && (
            <span className="text-red-400 text-xs">*</span>
          )}
        </div>
      )}

      {/* 描述文本 */}
      {description && (
        <Text variant="caption" color="muted" className="text-xs">
          {description}
        </Text>
      )}

      {/* 选择器 */}
      <select
        ref={ref}
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        disabled={disabled}
        required={required}
        className={selectClasses}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {/* 错误信息 */}
      {error && (
        <div className="text-xs text-red-400 mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* 成功提示 */}
      {success && !error && (
        <div className="text-xs text-green-400 mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* 帮助文本 */}
      {helpText && !error && !success && (
        <div className="text-xs text-[var(--color-text-muted)] mt-1 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-muted)] flex-shrink-0" />
          {helpText}
        </div>
      )}
    </div>
  );
});

SelectField.displayName = 'SelectField';

export default { InputField, TextareaField, SelectField };
