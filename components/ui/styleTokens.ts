// Compact, cleaned design tokens used across UI components.
// This file provides the minimal, consistent token surface required by components
// (editorClass, SECTION_STYLES, THEME_COLORS, colors, spacing, utility functions).
// It's intentionally concise to avoid duplicate/contradictory declarations.

export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ColorVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type CardVariant = 'default' | 'elevated' | 'glass' | 'flat';
export type TextVariant = 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'label';
export type InputVariant = 'default' | 'error' | 'success';

// =============================================================================
// FOUNDATION - 基础设计常量
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

  // 字体系统 - 扩展为完整的字体规范
  fontSize: {
    xs: '0.75rem',   // 12px - 辅助文字、标签
    sm: '0.875rem',  // 14px - 正文字体
    md: '1rem',      // 16px - 标准正文
    lg: '1.125rem',  // 18px - 标题、小标题
    xl: '1.25rem',   // 20px - 主要标题
    '2xl': '1.5rem', // 24px - 大标题
    '3xl': '1.875rem', // 30px - 页面标题
    '4xl': '2.25rem',  // 36px - 英雄标题
  },

  // 字体权重 - 扩展权重系统
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  // 字体家族 - 统一的字体栈
  fontFamily: {
    sans: `ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,
    mono: `ui-monospace, SFMono-Regular, "SF Mono", Monaco, Inconsolata, "Fira Code", "Droid Sans Mono", "Source Code Pro", "Roboto Mono", Consolas, "Courier New", monospace`,
    serif: `ui-serif, Georgia, Cambria, "Times New Roman", Times, serif`,
  },

  // 行高系统 - 基于字体大小的相对行高
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },

  // 字间距系统
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
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
// LAYOUT - 统一布局常量
// =============================================================================

export const LAYOUT = {
  // 容器宽度
  container: {
    sm: 'max-w-sm',    // 384px
    md: 'max-w-md',    // 448px
    lg: 'max-w-lg',    // 512px
    xl: 'max-w-xl',    // 576px
    '2xl': 'max-w-2xl', // 672px
    '3xl': 'max-w-3xl', // 768px
    '4xl': 'max-w-4xl', // 896px
    '5xl': 'max-w-5xl', // 1024px
    '6xl': 'max-w-6xl', // 1152px
    '7xl': 'max-w-7xl', // 1280px
  },

  // 侧边栏宽度
  sidebar: {
    width: 'w-64',      // 256px
    collapsed: 'w-16',   // 64px (折叠时)
  },

  // 响应式断点
  breakpoints: {
    mobile: 'sm:',      // 640px+
    tablet: 'md:',      // 768px+
    desktop: 'lg:',     // 1024px+
    wide: 'xl:',        // 1280px+
    ultra: '2xl:',      // 1536px+
  },

  // 统一间距应用
  spacing: {
    // 页面级间距
    page: 'p-6',                    // 24px
    pageMobile: 'p-4 md:p-6',       // 16px/24px

    // 区块间距
    section: 'space-y-6',           // 24px
    sectionSmall: 'space-y-4',      // 16px

    // 组件间距
    component: 'p-6',               // 24px
    componentSmall: 'p-4',          // 16px

    // 元素间距
    element: 'space-y-4',           // 16px
    elementSmall: 'space-y-2',      // 8px

    // 内边距
    padding: {
      card: 'p-6',
      input: 'px-3 py-2',
      button: 'px-3 py-1.5',
    },

    // 外边距
    margin: {
      section: 'mb-6',
      element: 'mb-4',
      item: 'mb-2',
    },
  },

  // 栅格系统
  grid: {
    // 统计卡片行 (4列)
    stats: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',

    // 指标行 (2-4列)
    metrics: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',

    // 内容布局 (3列)
    content: 'grid-cols-1 lg:grid-cols-3',

    // 卡片网格
    cards: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',

    // 紧凑网格
    compact: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  },

  // 阴影层次
  elevation: {
    none: 'shadow-none',
    low: 'shadow-sm hover:shadow-md',
    medium: 'shadow-md hover:shadow-lg',
    high: 'shadow-lg hover:shadow-xl',
    max: 'shadow-xl hover:shadow-2xl',
  },
} as const;

// 交互状态
export const interactions = {
  focus: 'focus:outline-none focus:ring-1 focus:ring-brand-500/40 transition-all',
  hover: 'hover:bg-gray-800/90 transition-all',
  disabled: 'disabled:opacity-50',
};

// Basic color map used by components
export const colors = {
  bg: {
    primary: 'bg-gray-900',
    secondary: 'bg-gray-800',
    tertiary: 'bg-gray-800/60',
    card: 'bg-gray-900/60',
    cardDarker: 'bg-gray-950/70',
    surface: 'bg-gray-950/60',
    surfaceDark: 'bg-gray-950/50',
    muted: 'bg-gray-800/50',
  },
  border: {
    primary: 'border-white/10',
    secondary: 'border-white/10',
    focus: 'border-blue-500/50',
    light: 'border-white/10',
    lighter: 'border-white/5',
    muted: 'border-white/8',
  },
  text: {
    primary: 'text-white',
    secondary: 'text-gray-300',
    muted: 'text-gray-400',
    accent: 'text-blue-400',
    warning: 'text-yellow-300',
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
    primary: 'text-blue-400',
    secondary: 'bg-blue-600',
    border: 'border-blue-500',
    hover: 'hover:bg-blue-600/90',
  },
  region: {
    prompt: 'text-blue-300',
    meta: 'text-purple-300',
    examples: 'text-purple-300',
    system: 'text-blue-300',
    basic: 'text-gray-400'
  },
  state: {
    success: 'text-green-300',
    error: 'text-red-400',
    warning: 'text-yellow-300'
  }
} as const;

// Editor class used by many components
export const editorClass = `w-full ${colors.bg.cardDarker} ${colors.border.secondary} rounded-md px-3 py-2 text-sm font-mono ${colors.text.primary} leading-relaxed`;

// SECTION_STYLES used by PromptEditTab and PromptMetaPanel
export const SECTION_STYLES = {
  container: {
    base: `${colors.bg.primary} ${colors.border.primary} rounded-lg`,
    // 统一的增强容器样式 - 用于所有主要区块
    enhanced: `${colors.bg.primary} ${colors.border.primary} rounded-lg p-3 space-y-3 shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-300`,
    // 简化的容器样式 - 用于次级区块
    simple: `${colors.bg.primary} ${colors.border.primary} rounded-lg p-4`,
    // 紧凑的容器样式 - 用于需要更小间距的区块
    compact: `${colors.bg.primary} ${colors.border.primary} rounded-lg p-2 space-y-2 shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-300`,
    accent: {
      basic: '',
      prompt: '',
      examples: '',
      meta: '',
      system: ''
    }
  },
  content: {
    sectionTitle: 'text-lg font-semibold',
    sectionTitleColor: colors.text.primary,
    subsectionTitle: 'text-md font-semibold',
    fieldLabel: 'text-sm uppercase tracking-wide',
    fieldLabelColor: colors.text.secondary,
    fieldDescription: 'text-xs text-gray-400',
    titleInput: `w-full px-3 py-2 ${colors.bg.secondary} ${colors.border.primary} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20`,
    input: `w-full px-3 py-2 ${colors.bg.secondary} ${colors.border.primary} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20`,
    select: `w-full px-3 py-2 ${colors.bg.secondary} ${colors.border.primary} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20`,
  },
  icons: {
    indicator: {
      variants: {
        purple: 'bg-purple-500',
        blue: 'bg-blue-500',
        green: 'bg-green-500'
      }
    },
    action: { size: 14 },
    status: { size: 12 }
  },
  buttons: {
    primary: `px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg`,
    secondary: `px-3 py-1.5 text-sm font-medium ${colors.text.secondary} ${colors.bg.secondary} rounded-lg`,
    icon: `p-2 ${colors.text.secondary} ${colors.bg.secondary} rounded-lg`
  },
  status: {
    indicator: 'w-2 h-2 rounded-full',
    variants: {
      success: 'bg-green-400',
      error: 'bg-red-400',
      warning: 'bg-yellow-400',
      info: 'bg-blue-400',
      loading: 'bg-blue-400 animate-pulse'
    },
    text: 'text-xs font-medium transition-colors',
    textVariants: {
      success: 'text-green-300',
      error: 'text-red-300',
      warning: 'text-yellow-300',
      info: 'text-blue-300',
      loading: 'text-blue-400',
      muted: 'text-gray-400'
    }
  }
} as const;

export const THEME_COLORS = {
  bg: {
    primary: 'hsl(var(--color-bg-primary, 210 20% 98%))',
    secondary: 'hsl(var(--color-bg-secondary, 210 20% 95%))',
    tertiary: colors.bg.tertiary,
    surface: colors.bg.surface
  },
  border: {
    primary: colors.border.primary,
    secondary: colors.border.secondary,
    focus: colors.border.focus
  },
  text: {
    primary: colors.text.primary,
    secondary: colors.text.secondary,
    muted: colors.text.muted,
    accent: colors.text.accent
  },
  brand: {
    primary: colors.brand.primary,
    secondary: colors.brand.secondary
  },
  region: colors.region,
  state: colors.state
} as const;

export const TYPOGRAPHY = {
  letterSpacing: { uppercase: 'tracking-wide' },
  fontSize: { 'label-md': 'text-sm', 'heading-6': 'text-base' },
  fontWeight: { semibold: 'font-semibold', medium: 'font-medium' }
} as const;

export const spacing = {
  padding: { card: 'p-6', input: 'px-3 py-2', button: 'px-3 py-1.5' },
  borderRadius: 'rounded-lg'
} as const;

// Minimal component styles mapping used by getComponentClasses
export const COMPONENT_STYLES = {
  button: {
    base: 'inline-flex items-center justify-center font-medium transition-all',
    variants: {
      primary: 'bg-blue-600 text-white',
      secondary: 'bg-gray-800 text-gray-200',
      ghost: 'bg-transparent text-gray-300',
      danger: 'bg-red-600 text-white'
    },
    sizes: {
      xs: 'px-2.5 py-1.5 text-xs',
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    }
  },
  card: {
    base: `bg-[var(--color-bg-primary, #0b0f13)] border ${colors.border.primary} rounded-lg`,
    variants: {
      default: 'shadow-sm hover:shadow-md',
      elevated: 'shadow-lg hover:shadow-xl',
      glass: 'backdrop-blur-xl bg-opacity-60',
      flat: 'shadow-none'
    },
    sizes: {}
  },
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
    }
  },
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
    base: '',
    sizes: {}
  }
} as const;

export const getComponentClasses = (
  component: keyof typeof COMPONENT_STYLES,
  options: { variant?: string; size?: SizeVariant; custom?: string } = {}
) => {
  const comp = (COMPONENT_STYLES as any)[component] || {};
  const classes: string[] = [];
  if (comp.base) classes.push(comp.base);
  if (options.variant && comp.variants && comp.variants[options.variant]) classes.push(comp.variants[options.variant]);
  if (options.size && comp.sizes && comp.sizes[options.size]) classes.push(comp.sizes[options.size]);
  if (options.custom) classes.push(options.custom);
  return classes.join(' ');
};

// =============================================================================
// 组件类型定义 (Component Types)
// =============================================================================

// 空状态容器样式
export const emptyStateClass = `w-full h-64 md:h-72 xl:h-80 bg-gray-950/60 border border-white/8 rounded-lg p-6 flex items-center justify-center`;

export default {
  colors,
  SECTION_STYLES,
  THEME_COLORS,
  TYPOGRAPHY,
  spacing,
  editorClass,
  getComponentClasses,
  emptyStateClass,
  LAYOUT,
  interactions,
  FOUNDATION
};



