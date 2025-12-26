import React, { ReactNode } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Toast } from '../Toast';
import { ConfirmDialog } from '../ConfirmDialog';
import { CommandPalette } from '../CommandPalette';
import { ErrorBoundary } from '../ui/ErrorBoundary';

// =============================================================================
// 应用布局组件 - AppLayout
// =============================================================================

// =============================================================================
// 1. 背景组件
// =============================================================================

const AmbientBackground: React.FC<{ themeId: string }> = ({ themeId }) => {
  if (themeId === 'theme-terminal') return null; // Clean black for terminal

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Unified Ambient Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-3000"></div>

      {/* Unified Grid Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQwIDBIMHY0MGg0MFoiIGZpbGw9IiMxYTFhMWEiIGZpbGwtb3BhY2l0eT0iMC4wMyIvPgo8L3N2Zz4K')] opacity-30"></div>
    </div>
  );
};

// =============================================================================
// 2. 顶部栏组件
// =============================================================================

interface AppHeaderProps {
  children: ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ children }) => {
  const { state } = useApp();

  return (
    <header className={`flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-gray-900/60 backdrop-blur-xl z-10 border-b border-white/10 shadow-lg ${
      !state.isDesktopSidebarOpen
        ? 'p-3'
        : 'p-4 md:p-6'
    }`}>
      {children}
    </header>
  );
};

// =============================================================================
// 3. 主内容区域组件
// =============================================================================

interface MainContentProps {
  children: ReactNode;
}

const MainContent: React.FC<MainContentProps> = ({ children }) => {
  const { state } = useApp();

  return (
    <main className={`flex-1 relative z-10 flex flex-col transition-all duration-300 ${!state.isDesktopSidebarOpen ? 'w-full' : ''}`}>
      <div
        className={`w-full h-full flex flex-col overflow-hidden transition-all duration-700 ${
          !state.isDesktopSidebarOpen
            ? 'rounded-none border-0 mt-0 mb-0 shadow-none'
            : 'glass-panel border border-white/10 shadow-2xl rounded-3xl mt-4 md:mt-6 mb-4 md:mb-6 mx-4 md:mx-6 lg:mx-8'
        }`}
      >
        {children}
      </div>
    </main>
  );
};

// =============================================================================
// 4. 主应用布局
// =============================================================================

interface AppLayoutProps {
  /** 侧边栏内容 */
  sidebar: ReactNode;
  /** 头部内容 */
  header: ReactNode;
  /** 主内容 */
  children: ReactNode;
  /** 模态框内容 */
  modal?: ReactNode;
}

/**
 * 应用主布局组件
 *
 * 提供统一的页面结构，包括：
 * - 背景和纹理层
 * - 侧边栏
 * - 头部区域
 * - 主内容区域
 * - 全局组件（模态框、Toast等）
 *
 * @example
 * ```tsx
 * <AppLayout
 *   sidebar={<Sidebar />}
 *   header={<AppHeader>Header Content</AppHeader>}
 *   modal={<PromptModal />}
 * >
 *   <MainContent>Page Content</MainContent>
 * </AppLayout>
 * ```
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  sidebar,
  header,
  children,
  modal
}) => {
  const { state } = useApp();

  const currentTheme = state.availableThemes.find(t => t.id === state.currentThemeId) || state.availableThemes[0];

  return (
    <div className={`flex h-screen w-full surface-shell ${state.currentThemeId === 'theme-light' ? 'text-slate-900' : 'text-slate-100'} overflow-hidden text-base transition-all duration-700 relative selection:bg-brand-500/30 animate-theme-transition`} style={{ fontFamily: 'var(--font-ui)' }}>

      {/* Enhanced Background Layer */}
      <AmbientBackground themeId={state.currentThemeId} />

      {/* Noise Texture Overlay with Better Blending */}
      <div className="bg-noise z-[1] opacity-50"></div>

      {/* Simplified texture overlay */}
      <div className={`absolute inset-0 pointer-events-none z-[1] opacity-10 transition-opacity duration-700 ${
        currentTheme.bgPattern === 'dots' ? 'bg-pattern-dots' :
        currentTheme.bgPattern === 'grid' ? 'bg-pattern-grid' : ''
      }`}></div>

      <div className="absolute inset-0 pointer-events-none z-[1] bg-gradient-to-br from-brand-500/5 via-transparent to-purple-500/5"></div>

      {/* Sidebar */}
      {sidebar}

      {/* Main Content Area */}
      <MainContent>
        {header}
        {children}

        {/* Modal */}
        <ErrorBoundary>
          {modal}
        </ErrorBoundary>
      </MainContent>

      {/* Global Components */}
      <CommandPalette
        isOpen={state.isPaletteOpen}
        onClose={() => {}} // Will be handled by context
        themes={state.availableThemes}
        onSelectTheme={() => {}} // Will be handled by context
        onNavigate={() => {}} // Will be handled by context
        onAction={() => {}} // Will be handled by context
      />

      <Toast
        message={state.toast.message}
        isVisible={state.toast.show}
        onClose={() => {}} // Will be handled by context
        type={state.toast.type}
      />

      <ConfirmDialog
        isOpen={state.confirmDialog.isOpen}
        title={state.confirmDialog.title}
        message={state.confirmDialog.message}
        type={state.confirmDialog.type}
        onConfirm={state.confirmDialog.onConfirm}
        onCancel={() => {}} // Will be handled by context
      />
    </div>
  );
};

// =============================================================================
// 5. 便捷导出
// =============================================================================

export { AppHeader, MainContent };
export default AppLayout;
