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
// 统一布局常量 (Layout Constants)
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

// =============================================================================
// 2. 主题变量系统 (Theme System)
// =============================================================================

// 统一的设计色彩令牌系统
export const DESIGN_TOKENS = {
  // 基础色彩
  colors: {
    // 主色调 - 蓝色系
    primary: {
      50: 'hsl(217, 91%, 95%)',
      100: 'hsl(217, 91%, 90%)',
      200: 'hsl(217, 91%, 80%)',
      300: 'hsl(217, 91%, 70%)',
      400: 'hsl(217, 91%, 60%)',
      500: 'hsl(217, 91%, 50%)', // 主色
      600: 'hsl(217, 91%, 40%)',
      700: 'hsl(217, 91%, 30%)',
      800: 'hsl(217, 91%, 20%)',
      900: 'hsl(217, 91%, 10%)',
    },

    // 成功色 - 绿色系
    success: {
      50: 'hsl(142, 76%, 95%)',
      100: 'hsl(142, 76%, 90%)',
      200: 'hsl(142, 76%, 80%)',
      300: 'hsl(142, 76%, 70%)',
      400: 'hsl(142, 76%, 60%)',
      500: 'hsl(142, 76%, 50%)', // 主色
      600: 'hsl(142, 76%, 40%)',
      700: 'hsl(142, 76%, 30%)',
      800: 'hsl(142, 76%, 20%)',
      900: 'hsl(142, 76%, 10%)',
    },

    // 警告色 - 橙色系
    warning: {
      50: 'hsl(38, 92%, 95%)',
      100: 'hsl(38, 92%, 90%)',
      200: 'hsl(38, 92%, 80%)',
      300: 'hsl(38, 92%, 70%)',
      400: 'hsl(38, 92%, 60%)',
      500: 'hsl(38, 92%, 50%)', // 主色
      600: 'hsl(38, 92%, 40%)',
      700: 'hsl(38, 92%, 30%)',
      800: 'hsl(38, 92%, 20%)',
      900: 'hsl(38, 92%, 10%)',
    },

    // 错误色 - 红色系
    error: {
      50: 'hsl(0, 84%, 95%)',
      100: 'hsl(0, 84%, 90%)',
      200: 'hsl(0, 84%, 80%)',
      300: 'hsl(0, 84%, 70%)',
      400: 'hsl(0, 84%, 60%)',
      500: 'hsl(0, 84%, 50%)', // 主色
      600: 'hsl(0, 84%, 40%)',
      700: 'hsl(0, 84%, 30%)',
      800: 'hsl(0, 84%, 20%)',
      900: 'hsl(0, 84%, 10%)',
    },

    // 中性色 - 灰色系
    neutral: {
      50: 'hsl(210, 20%, 98%)',
      100: 'hsl(210, 20%, 95%)',
      200: 'hsl(210, 20%, 90%)',
      300: 'hsl(210, 20%, 85%)',
      400: 'hsl(210, 20%, 70%)',
      500: 'hsl(210, 20%, 50%)',
      600: 'hsl(210, 20%, 30%)',
      700: 'hsl(210, 20%, 20%)',
      800: 'hsl(210, 20%, 15%)',
      900: 'hsl(210, 20%, 10%)',
    },
  },

  // 语义色彩映射
  semantic: {
    primary: 'hsl(217, 91%, 50%)',
    secondary: 'hsl(210, 20%, 70%)',
    success: 'hsl(142, 76%, 50%)',
    warning: 'hsl(38, 92%, 50%)',
    error: 'hsl(0, 84%, 50%)',
    info: 'hsl(217, 91%, 50%)',

    // 文字色彩
    text: {
      primary: 'hsl(210, 20%, 10%)',   // 深色文字
      secondary: 'hsl(210, 20%, 30%)', // 次级文字
      tertiary: 'hsl(210, 20%, 50%)',  // 辅助文字
      inverse: 'hsl(210, 20%, 98%)',   // 深色背景上的文字
    },

    // 背景色彩
    background: {
      primary: 'hsl(210, 20%, 98%)',
      secondary: 'hsl(210, 20%, 95%)',
      tertiary: 'hsl(210, 20%, 90%)',
      overlay: 'hsla(210, 20%, 10%, 0.8)',
    },
  },
} as const;

// 统一的CSS变量颜色系统 (向后兼容)
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

// 编辑区域样式 - 提升深色背景下的对比度
export const editorClass = `w-full ${colors.bg.cardDarker} ${colors.border.secondary} ${spacing.borderRadius} ${spacing.padding.input} text-sm font-mono ${colors.text.primary} leading-relaxed`;

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
// 5. PromptEditTab 区域统一样式系统 (PromptEditTab Section Styles)
// =============================================================================

// 区域容器样式系统 - 确保三个区域视觉统一
export const SECTION_STYLES = {
  // 区域容器基础样式
  container: {
    base: 'bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-lg transition-all duration-300',
    padding: 'p-6',
    spacing: 'space-y-6',
    // 区域特色边框 - 区分不同区域
    accent: {
      basic: 'border-l-4 border-l-gray-400/50',      // 基础信息 - 灰色
      meta: 'border-l-4 border-l-purple-400/50',      // 元数据 - 紫色
      prompt: 'border-l-4 border-l-blue-400/50'       // 提示词 - 蓝色
    }
  },

  // 内容层次样式 - 统一字体和间距
  content: {
    // 区域标题 (如：基础信息、参照示例)
    sectionTitle: 'text-sm font-semibold uppercase tracking-wider flex items-center gap-2 mb-4',
    sectionTitleColor: 'text-[var(--color-text-primary)]',

    // 子区域标题 (如：中文提示词、英文提示词)
    subsectionTitle: 'text-xs font-semibold uppercase tracking-wider flex items-center gap-2 mb-2',
    subsectionTitleColor: 'text-[var(--color-text-secondary)]',

    // 字段标签
    fieldLabel: 'text-xs font-medium uppercase tracking-wider mb-2 block',
    fieldLabelColor: 'text-[var(--color-text-muted)]',

    // 字段描述
    fieldDescription: 'text-xs mt-1',
    fieldDescriptionColor: 'text-[var(--color-text-secondary)]',

    // 输入框统一样式
    input: 'w-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-md px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-all duration-200 focus:outline-none focus:border-[var(--color-border-focus)] focus:ring-2 focus:ring-[var(--color-brand-primary)]/20',

    // 选择器统一样式
    select: 'w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-md px-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-brand-primary)]/50 focus:ring-1 focus:ring-[var(--color-brand-primary)]/30 transition-all appearance-none cursor-pointer',
  },

  // 图标规范系统 - 统一图标大小和颜色
  icons: {
    // 区域指示图标
    section: { size: 16, className: 'text-[var(--color-text-accent)]' },

    // 操作按钮图标
    action: { size: 14, className: 'text-[var(--color-text-secondary)]' },

    // 状态指示图标
    status: { size: 12, className: 'text-[var(--color-text-secondary)]' },

    // 小指示点
    indicator: { size: 8, variants: {
      gray: 'text-gray-400',
      blue: 'text-blue-400',
      green: 'text-green-400',
      purple: 'text-purple-400',
      red: 'text-red-400'
    }},

    // 展开/收起图标
    expand: { size: 12, className: 'text-[var(--color-text-muted)]' },
  },

  // 按钮统一样式系统
  buttons: {
    // 主操作按钮 (保存、添加等)
    primary: 'px-4 py-2 text-sm font-medium bg-gradient-to-r from-[var(--color-brand-primary)]/80 to-[var(--color-brand-secondary)]/80 hover:from-[var(--color-brand-primary)]/90 hover:to-[var(--color-brand-secondary)]/90 text-white border border-[var(--color-brand-primary)]/50 hover:border-[var(--color-brand-primary)]/70 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl flex items-center justify-center gap-2',

    // 次操作按钮 (取消、编辑等)
    secondary: 'px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] hover:border-[var(--color-border-accent)] rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95',

    // 图标按钮
    icon: 'p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95',

    // 开关按钮 (自动保存开关)
    toggle: 'relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/50 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-primary)] disabled:opacity-50',
    toggleOn: 'bg-[var(--color-brand-primary)] shadow-lg',
    toggleOff: 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)]',
    toggleThumb: 'inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200',
    toggleThumbOn: 'translate-x-6',
    toggleThumbOff: 'translate-x-1',
  },

  // 状态指示器样式
  status: {
    indicator: 'w-2 h-2 rounded-full',
    variants: {
      success: 'bg-green-400',
      error: 'bg-red-400',
      warning: 'bg-yellow-400',
      info: 'bg-blue-400',
      loading: 'bg-[var(--color-brand-primary)] animate-pulse'
    },
    text: 'text-xs font-medium transition-colors',
    textVariants: {
      success: 'text-green-300',
      error: 'text-red-300',
      warning: 'text-yellow-300',
      info: 'text-blue-300',
      loading: 'text-[var(--color-brand-primary)]',
      muted: 'text-[var(--color-text-muted)]'
    }
  }
} as const;

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


