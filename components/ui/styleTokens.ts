// =============================================================================
// 统一设计令牌系统 v2.0 - 组件生态优化
// =============================================================================

// =============================================================================
// 1. 基础设计常量 (Foundation)
// =============================================================================

export const FOUNDATION = {
  // 间距系统 (4px基准)
  spacing: {
    xs: '0.25rem',   // 4px
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.5rem',    // 24px
    '2xl': '2rem',   // 32px
    '3xl': '3rem',   // 48px
    '4xl': '4rem',   // 64px
  },

  // 圆角系统
  borderRadius: {
    none: '0px',
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    full: '9999px',
  },

  // 字体大小
  fontSize: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    md: '1rem',      // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
  },

  // 字体权重
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // 阴影系统
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl',
  },

  // 动画时长
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms',
  },
} as const;

// =============================================================================
// 2. 主题变量系统 (Theme System)
// =============================================================================

// 统一的CSS变量颜色系统
export const THEME_COLORS = {
  // 背景色系
  bg: {
    primary: 'hsl(var(--color-bg-primary))',
    secondary: 'hsl(var(--color-bg-secondary))',
    tertiary: 'hsl(var(--color-bg-tertiary))',
    accent: 'hsl(var(--color-bg-accent))',
    overlay: 'hsla(var(--color-bg-primary), 0.8)',
  },

  // 前景色系
  text: {
    primary: 'hsl(var(--color-text-primary))',
    secondary: 'hsl(var(--color-text-secondary))',
    tertiary: 'hsl(var(--color-text-tertiary))',
    muted: 'hsl(var(--color-text-muted))',
    accent: 'hsl(var(--color-brand-primary))',
  },

  // 边框色系
  border: {
    primary: 'hsla(var(--color-text-primary), 0.1)',
    secondary: 'hsla(var(--color-text-primary), 0.05)',
    focus: 'hsl(var(--color-brand-primary))',
    accent: 'hsla(var(--color-brand-primary), 0.2)',
  },

  // 品牌色系
  brand: {
    primary: 'hsl(var(--color-brand-primary))',
    secondary: 'hsl(var(--color-brand-secondary))',
    hover: 'hsl(var(--color-brand-hover))',
    focus: 'hsl(var(--color-brand-focus))',
  },

  // 状态色系
  state: {
    success: 'hsl(142, 76%, 36%)',
    warning: 'hsl(38, 92%, 50%)',
    error: 'hsl(0, 84%, 60%)',
    info: 'hsl(217, 91%, 60%)',
  },
} as const;

// =============================================================================
// 3. 组件样式映射 (Component Styles)
// =============================================================================

export const COMPONENT_STYLES = {
  // 按钮组件样式
  button: {
    base: `
      inline-flex items-center justify-center font-medium
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent
      disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed
      select-none
    `,
    variants: {
      primary: `
        bg-[${THEME_COLORS.brand.primary}]
        text-white
        hover:bg-[${THEME_COLORS.brand.hover}]
        focus:ring-[${THEME_COLORS.brand.primary}]
        shadow-sm hover:shadow-md
      `,
      secondary: `
        bg-[${THEME_COLORS.bg.secondary}]
        text-[${THEME_COLORS.text.primary}]
        border border-[${THEME_COLORS.border.primary}]
        hover:bg-[${THEME_COLORS.bg.primary}]
        hover:border-[${THEME_COLORS.border.accent}]
        focus:ring-[${THEME_COLORS.brand.primary}]
      `,
      ghost: `
        text-[${THEME_COLORS.text.secondary}]
        hover:text-[${THEME_COLORS.text.primary}]
        hover:bg-[${THEME_COLORS.bg.secondary}]
        focus:ring-[${THEME_COLORS.brand.primary}]
      `,
      danger: `
        bg-[${THEME_COLORS.state.error}]
        text-white
        hover:bg-[hsl(0,84%,50%)]
        focus:ring-[${THEME_COLORS.state.error}]
      `,
    },
    sizes: {
      xs: `px-2.5 py-1.5 text-xs ${FOUNDATION.borderRadius.sm}`,
      sm: `px-3 py-1.5 text-sm ${FOUNDATION.borderRadius.sm}`,
      md: `px-4 py-2 text-base ${FOUNDATION.borderRadius.md}`,
      lg: `px-6 py-3 text-lg ${FOUNDATION.borderRadius.lg}`,
    },
  },

  // 输入框组件样式
  input: {
    base: `
      w-full
      bg-[${THEME_COLORS.bg.secondary}]
      border border-[${THEME_COLORS.border.primary}]
      text-[${THEME_COLORS.text.primary}]
      placeholder:text-[${THEME_COLORS.text.muted}]
      transition-all duration-200 ease-out
      focus:outline-none focus:border-[${THEME_COLORS.border.focus}]
      focus:ring-2 focus:ring-[${THEME_COLORS.brand.primary}]/20
      disabled:opacity-50 disabled:cursor-not-allowed
    `,
    variants: {
      default: '',
      error: 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20',
      success: 'border-green-500/50 focus:border-green-500 focus:ring-green-500/20',
    },
    sizes: {
      sm: `px-3 py-1.5 text-sm ${FOUNDATION.borderRadius.sm}`,
      md: `px-3 py-2 text-base ${FOUNDATION.borderRadius.md}`,
      lg: `px-4 py-3 text-lg ${FOUNDATION.borderRadius.lg}`,
    },
  },

  // 卡片组件样式
  card: {
    base: `
      bg-[${THEME_COLORS.bg.primary}]
      border border-[${THEME_COLORS.border.primary}]
      ${FOUNDATION.borderRadius.lg}
      transition-all duration-300 ease-out
    `,
    variants: {
      default: 'shadow-sm hover:shadow-md',
      elevated: 'shadow-lg hover:shadow-xl',
      glass: 'backdrop-blur-xl bg-[hsla(var(--color-bg-primary),0.8)]',
      flat: 'shadow-none border-transparent',
    },
  },

  // 文本组件样式
  text: {
    variants: {
      h1: `text-2xl font-bold text-[${THEME_COLORS.text.primary}]`,
      h2: `text-xl font-semibold text-[${THEME_COLORS.text.primary}]`,
      h3: `text-lg font-semibold text-[${THEME_COLORS.text.primary}]`,
      h4: `text-base font-semibold text-[${THEME_COLORS.text.primary}]`,
      body: `text-base text-[${THEME_COLORS.text.primary}]`,
      caption: `text-sm text-[${THEME_COLORS.text.secondary}]`,
      label: `text-xs font-medium uppercase tracking-wider text-[${THEME_COLORS.text.muted}]`,
    },
  },
} as const;

// =============================================================================
// 4. 向后兼容层 (Backward Compatibility)
// =============================================================================

// 保留原有接口以确保兼容性
export const colors = {
  bg: {
    primary: COMPONENT_STYLES.card.variants.default.includes('bg-[') ? 'bg-[var(--color-bg-primary)]' : 'bg-gray-900/60',
    secondary: 'bg-[var(--color-bg-secondary)]',
    tertiary: 'bg-[var(--color-bg-tertiary)]',
    accent: 'bg-[var(--color-bg-accent)]',
    card: 'bg-gray-900/60',
    cardDark: 'bg-gray-950/70',
    cardDarker: 'bg-gray-950/80',
    surface: 'bg-gray-950/60',
    surfaceDark: 'bg-gray-950/50',
    muted: 'bg-gray-800/50',
  },
  border: {
    primary: 'border-[var(--color-border-primary)]',
    secondary: 'border-[var(--color-border-secondary)]',
    focus: 'focus:border-[var(--color-brand-primary)]',
    light: 'border-white/10',
    lighter: 'border-white/5',
    muted: 'border-white/8',
  },
  text: {
    primary: 'text-[var(--color-text-primary)]',
    secondary: 'text-[var(--color-text-secondary)]',
    tertiary: 'text-[var(--color-text-tertiary)]',
    muted: 'text-[var(--color-text-muted)]',
    accent: 'text-[var(--color-brand-primary)]',
    label: 'text-gray-300',
    labelMuted: 'text-gray-400',
    description: 'text-gray-600',
    descriptionLight: 'text-gray-500',
    descriptionDark: 'text-gray-700',
    error: 'text-red-400',
    success: 'text-green-300',
    info: 'text-blue-400',
  },
  brand: {
    primary: 'text-[var(--color-brand-primary)]',
    secondary: 'bg-[var(--color-brand-secondary)]',
    border: 'border-[var(--color-brand-border)]',
    hover: 'hover:bg-[var(--color-brand-hover)]',
  }
};

// 尺寸和间距
export const spacing = {
  padding: {
    card: 'p-6',
    input: 'px-3 py-2',
    button: 'px-3 py-1.5',
  },
  margin: {
    section: 'space-y-6',
    element: 'space-y-4',
    item: 'space-y-2',
  },
  borderRadius: 'rounded-lg',
  height: {
    input: 'h-9',
    button: 'h-auto',
  }
};

// 交互状态
export const interactions = {
  focus: 'focus:outline-none focus:ring-1 focus:ring-brand-500/40 transition-all',
  hover: 'hover:bg-gray-800/90 transition-all',
  disabled: 'disabled:opacity-50',
};

// =============================================================================
// 组件专用样式类
// =============================================================================

// 卡片容器
export const cardClass = `${colors.bg.primary} ${colors.border.primary} ${spacing.borderRadius} ${spacing.padding.card}`;

// 内嵌输入框
export const innerInputClass = `w-full ${colors.bg.tertiary} ${colors.border.primary} ${spacing.borderRadius} ${spacing.padding.input} text-sm ${colors.text.primary} ${spacing.height.input} ${interactions.focus}`;

// 紧凑选择器
export const compactSelectClass = `w-full ${colors.bg.secondary} ${colors.border.primary} ${spacing.borderRadius} px-2 text-sm ${colors.text.primary} ${spacing.height.input} focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/30 transition-all appearance-none cursor-pointer backdrop-blur-sm`;

// 标签样式
export const labelClass = "text-xs font-semibold text-gray-400 uppercase tracking-wider";

// 按钮基础样式
export const buttonBaseClass = "text-xs font-medium rounded-lg border transition-all flex items-center gap-1.5";

// 功能按钮变体
export const buttonVariants = {
  primary: `${buttonBaseClass} ${colors.brand.secondary} ${colors.text.primary} ${colors.brand.border} ${colors.brand.hover}`,
  secondary: `${buttonBaseClass} bg-gray-500/15 text-gray-300 border-gray-500/30 hover:bg-gray-500/25`,
  success: `${buttonBaseClass} bg-green-500/15 text-green-300 border-green-500/30 hover:bg-green-500/25`,
  danger: `${buttonBaseClass} bg-red-500/15 text-red-300 border-red-500/30 hover:bg-red-500/25`,
  ghost: `${buttonBaseClass} bg-transparent text-gray-400 border-transparent hover:text-white hover:bg-white/10`,
};

// 编辑区域样式
export const editorClass = `w-full ${colors.bg.secondary} ${colors.border.secondary} ${spacing.borderRadius} ${spacing.padding.input} text-sm font-mono ${colors.text.primary} leading-relaxed`;

// 展开/折叠容器
export const collapsibleClass = `${colors.bg.tertiary} ${colors.border.primary} ${spacing.borderRadius} p-2 transition-all`;

// 状态指示器
export const statusIndicator = {
  brand: "w-1.5 h-1.5 rounded-full bg-brand-400",
  green: "w-1.5 h-1.5 rounded-full bg-green-400",
  blue: "w-1.5 h-1.5 rounded-full bg-blue-400",
};

// =============================================================================
// 新增统一组件样式
// =============================================================================

// 标题样式
export const headingClass = "text-sm font-semibold uppercase tracking-wider";

// 副标题样式
export const subheadingClass = "text-xs font-semibold uppercase tracking-wider flex items-center gap-2";

// 描述文本样式
export const descriptionClass = "text-xs";

// 表单输入框样式（带验证状态）
export const formInputClass = {
  base: `w-full ${colors.bg.cardDarker} border rounded-lg px-3 py-2 text-sm text-white focus:outline-none transition-all`,
  normal: 'border-white/10 focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30',
  error: 'border-red-500/50 focus:border-red-500/70 focus:ring-1 focus:ring-red-500/30',
  success: 'border-green-500/50 focus:border-green-500/70 focus:ring-1 focus:ring-green-500/30',
};

// 自动保存按钮样式
export const autoSaveButtonClass = "px-4 py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-all duration-200 hover:bg-white/10 rounded-lg border border-white/10 flex items-center gap-2";

// 空状态容器样式
export const emptyStateClass = `w-full h-64 md:h-72 xl:h-80 bg-gray-950/60 border border-white/8 rounded-lg p-6 flex items-center justify-center`;

// 图标容器样式
export const iconContainerClass = "w-12 h-12 mx-auto bg-gray-800/50 rounded-full flex items-center justify-center border border-white/10 mb-3";

// 示例卡片样式
export const exampleCardClass = "bg-gray-950/50 border border-white/5 rounded-lg p-4 space-y-4";

// 展开控制按钮样式
export const expandButtonClass = "absolute bottom-2 right-2 z-10";

// Token计数样式
export const tokenCountClass = {
  normal: 'font-mono text-gray-500',
  warning: 'font-mono text-red-400',
};

// =============================================================================
// 4. 组件类型定义 (Component Types)
// =============================================================================

export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ColorVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type CardVariant = 'default' | 'elevated' | 'glass' | 'flat';
export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';
export type InputVariant = 'default' | 'error' | 'success';

// =============================================================================
// 5. 样式工具函数 (Utility Functions)
// =============================================================================

/**
 * 生成组件的完整样式类名
 */
export const getComponentClasses = (
  component: keyof typeof COMPONENT_STYLES,
  options: {
    variant?: string;
    size?: SizeVariant;
    custom?: string;
  } = {}
) => {
  const { variant = 'default', size = 'md', custom = '' } = options;
  const componentStyle = COMPONENT_STYLES[component];

  if (!componentStyle) {
    console.warn(`Component style not found: ${component}`);
    return custom;
  }

  const classes: string[] = [];

  // 添加基础样式（如果存在）
  if ('base' in componentStyle && componentStyle.base) {
    classes.push(componentStyle.base);
  }

  // 添加变体样式
  if (componentStyle.variants && componentStyle.variants[variant as keyof typeof componentStyle.variants]) {
    classes.push(componentStyle.variants[variant as keyof typeof componentStyle.variants]);
  }

  // 添加尺寸样式
  if ('sizes' in componentStyle && componentStyle.sizes && componentStyle.sizes[size as keyof typeof componentStyle.sizes]) {
    classes.push(componentStyle.sizes[size as keyof typeof componentStyle.sizes]);
  }

  // 添加自定义样式
  if (custom) {
    classes.push(custom);
  }

  return classes.join(' ');
};

/**
 * 获取主题CSS变量值
 */
export const getThemeValue = (path: string): string => {
  const keys = path.split('.');
  let value: any = THEME_COLORS;

  for (const key of keys) {
    value = value?.[key];
  }

  return value || '';
};

/**
 * 生成响应式类名
 */
export const getResponsiveClasses = (
  base: string,
  responsive?: Partial<Record<'sm' | 'md' | 'lg' | 'xl', string>>
): string => {
  if (!responsive) return base;

  const classes = [base];

  if (responsive.sm) classes.push(`sm:${responsive.sm}`);
  if (responsive.md) classes.push(`md:${responsive.md}`);
  if (responsive.lg) classes.push(`lg:${responsive.lg}`);
  if (responsive.xl) classes.push(`xl:${responsive.xl}`);

  return classes.join(' ');
};

// =============================================================================
// 向后兼容 - 保留原有接口
// =============================================================================
export const panelCardClass = cardClass;
export const panelCardSpaceClass = `${cardClass} space-y-3`;
export const panelInnerInputClass = innerInputClass;
export const panelLabelClass = labelClass;


