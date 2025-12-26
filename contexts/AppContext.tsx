import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Prompt, Theme } from '../types';

// =============================================================================
// 应用状态管理 - Context + Reducer模式
// =============================================================================

// =============================================================================
// 1. 状态类型定义
// =============================================================================

export interface AppState {
  // 主题状态
  currentThemeId: string;
  availableThemes: Theme[];

  // 模态框状态
  isModalOpen: boolean;
  editingPrompt: Prompt | null;

  // 命令面板状态
  isPaletteOpen: boolean;

  // 导入状态
  isImporting: boolean;

  // Toast状态
  toast: {
    show: boolean;
    message: string;
    type?: 'success' | 'info' | 'error';
  };

  // 确认对话框状态
  confirmDialog: {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  };

  // 侧边栏状态
  isSidebarOpen: boolean;
  isDesktopSidebarOpen: boolean;
}

// =============================================================================
// 2. Action类型定义
// =============================================================================

export type AppAction =
  // 主题相关
  | { type: 'SET_THEME'; payload: string }

  // 模态框相关
  | { type: 'OPEN_MODAL'; payload?: Prompt }
  | { type: 'CLOSE_MODAL' }

  // 命令面板相关
  | { type: 'TOGGLE_PALETTE' }
  | { type: 'OPEN_PALETTE' }
  | { type: 'CLOSE_PALETTE' }

  // 导入相关
  | { type: 'START_IMPORT' }
  | { type: 'END_IMPORT' }

  // Toast相关
  | { type: 'SHOW_TOAST'; payload: { message: string; type?: 'success' | 'info' | 'error' } }
  | { type: 'HIDE_TOAST' }

  // 确认对话框相关
  | { type: 'SHOW_CONFIRM_DIALOG'; payload: { title: string; message: string; onConfirm: () => void; type?: 'danger' | 'warning' | 'info' } }
  | { type: 'HIDE_CONFIRM_DIALOG' }

  // 侧边栏相关
  | { type: 'TOGGLE_MOBILE_SIDEBAR' }
  | { type: 'CLOSE_MOBILE_SIDEBAR' }
  | { type: 'TOGGLE_DESKTOP_SIDEBAR' };

// =============================================================================
// 3. 初始状态
// =============================================================================

const THEMES: Theme[] = [
  {
    id: 'theme-default',
    label: 'Obsidian',
    colors: {
      brand: '#ff5252',
      bg: '#0a0a0b',
      surface: 'rgba(15, 23, 42, 0.8)',
      text: '#ffffff',
      border: 'rgba(255, 255, 255, 0.1)',
      muted: 'rgb(100, 116, 139)'
    },
    radius: '1rem',
    bgPattern: 'noise'
  },
  {
    id: 'theme-midnight',
    label: 'Ocean',
    colors: {
      brand: '#0ea5e9',
      bg: '#020617',
      surface: 'rgba(12, 74, 110, 0.8)',
      text: '#ffffff',
      border: 'rgba(255, 255, 255, 0.1)',
      muted: 'rgb(100, 116, 139)'
    },
    radius: '0.5rem',
    bgPattern: 'none'
  },
  {
    id: 'theme-aurora',
    label: 'Cosmic',
    colors: {
      brand: '#d8b4fe',
      bg: '#0f0519',
      surface: 'rgba(88, 28, 135, 0.8)',
      text: '#ffffff',
      border: 'rgba(255, 255, 255, 0.1)',
      muted: 'rgb(100, 116, 139)'
    },
    radius: '1.5rem',
    bgPattern: 'dots'
  },
  {
    id: 'theme-terminal',
    label: 'Matrix',
    colors: {
      brand: '#22c55e',
      bg: '#000000',
      surface: 'rgba(34, 197, 94, 0.8)',
      text: '#ffffff',
      border: 'rgba(255, 255, 255, 0.1)',
      muted: 'rgb(100, 116, 139)'
    },
    radius: '0px',
    bgPattern: 'grid'
  },
  {
    id: 'theme-light',
    label: 'Light',
    colors: { brand: '#3b82f6', bg: '#ffffff' },
    radius: '0.75rem',
    bgPattern: 'none'
  }
];

const initialState: AppState = {
  currentThemeId: 'theme-default',
  availableThemes: THEMES,
  isModalOpen: false,
  editingPrompt: null,
  isPaletteOpen: false,
  isImporting: false,
  toast: { show: false, message: '' },
  confirmDialog: {
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  },
  isSidebarOpen: false,
  isDesktopSidebarOpen: true
};

// =============================================================================
// 4. Reducer函数
// =============================================================================

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, currentThemeId: action.payload };

    case 'OPEN_MODAL':
      return {
        ...state,
        isModalOpen: true,
        editingPrompt: action.payload || null
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        isModalOpen: false,
        editingPrompt: null
      };

    case 'TOGGLE_PALETTE':
      return { ...state, isPaletteOpen: !state.isPaletteOpen };

    case 'OPEN_PALETTE':
      return { ...state, isPaletteOpen: true };

    case 'CLOSE_PALETTE':
      return { ...state, isPaletteOpen: false };

    case 'START_IMPORT':
      return { ...state, isImporting: true };

    case 'END_IMPORT':
      return { ...state, isImporting: false };

    case 'SHOW_TOAST':
      return {
        ...state,
        toast: { show: true, ...action.payload }
      };

    case 'HIDE_TOAST':
      return {
        ...state,
        toast: { ...state.toast, show: false }
      };

    case 'SHOW_CONFIRM_DIALOG':
      return {
        ...state,
        confirmDialog: { isOpen: true, ...action.payload }
      };

    case 'HIDE_CONFIRM_DIALOG':
      return {
        ...state,
        confirmDialog: { ...state.confirmDialog, isOpen: false }
      };

    case 'TOGGLE_MOBILE_SIDEBAR':
      return { ...state, isSidebarOpen: !state.isSidebarOpen };

    case 'CLOSE_MOBILE_SIDEBAR':
      return { ...state, isSidebarOpen: false };

    case 'TOGGLE_DESKTOP_SIDEBAR':
      return { ...state, isDesktopSidebarOpen: !state.isDesktopSidebarOpen };

    default:
      return state;
  }
}

// =============================================================================
// 5. Context和Provider
// =============================================================================

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    // 主题相关
    setTheme: (themeId: string) => void;

    // 模态框相关
    openModal: (prompt?: Prompt) => void;
    closeModal: () => void;

    // 命令面板相关
    togglePalette: () => void;
    openPalette: () => void;
    closePalette: () => void;

    // 导入相关
    startImport: () => void;
    endImport: () => void;

    // Toast相关
    showToast: (message: string, type?: 'success' | 'info' | 'error') => void;
    hideToast: () => void;

    // 确认对话框相关
    showConfirmDialog: (config: {
      title: string;
      message: string;
      onConfirm: () => void;
      type?: 'danger' | 'warning' | 'info';
    }) => void;
    hideConfirmDialog: () => void;

    // 侧边栏相关
    toggleMobileSidebar: () => void;
    closeMobileSidebar: () => void;
    toggleDesktopSidebar: () => void;
  };
}

const AppContext = createContext<AppContextValue | null>(null);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const actions = {
    setTheme: (themeId: string) => dispatch({ type: 'SET_THEME', payload: themeId }),

    openModal: (prompt?: Prompt) => dispatch({ type: 'OPEN_MODAL', payload: prompt }),
    closeModal: () => dispatch({ type: 'CLOSE_MODAL' }),

    togglePalette: () => dispatch({ type: 'TOGGLE_PALETTE' }),
    openPalette: () => dispatch({ type: 'OPEN_PALETTE' }),
    closePalette: () => dispatch({ type: 'CLOSE_PALETTE' }),

    startImport: () => dispatch({ type: 'START_IMPORT' }),
    endImport: () => dispatch({ type: 'END_IMPORT' }),

    showToast: (message: string, type: 'success' | 'info' | 'error' = 'success') =>
      dispatch({ type: 'SHOW_TOAST', payload: { message, type } }),
    hideToast: () => dispatch({ type: 'HIDE_TOAST' }),

    showConfirmDialog: (config: {
      title: string;
      message: string;
      onConfirm: () => void;
      type?: 'danger' | 'warning' | 'info';
    }) => dispatch({ type: 'SHOW_CONFIRM_DIALOG', payload: config }),
    hideConfirmDialog: () => dispatch({ type: 'HIDE_CONFIRM_DIALOG' }),

    toggleMobileSidebar: () => dispatch({ type: 'TOGGLE_MOBILE_SIDEBAR' }),
    closeMobileSidebar: () => dispatch({ type: 'CLOSE_MOBILE_SIDEBAR' }),
    toggleDesktopSidebar: () => dispatch({ type: 'TOGGLE_DESKTOP_SIDEBAR' })
  };

  const value: AppContextValue = {
    state,
    dispatch,
    actions
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// =============================================================================
// 6. Hook使用
// =============================================================================

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export default AppContext;
