import React, { useEffect, useState } from 'react';
import { Icons, getIconForCategory } from './Icons';
import { Category } from '../types';
import { STANDARD_CATEGORIES, SPECIAL_CATEGORY_TRASH, PromptView } from '../constants';

interface SidebarProps {
  selectedCategory: Category;
  selectedTag?: string; // New prop for tag selection
  onSelectCategory: (category: Category) => void;
  onSelectTag: (tag: string | undefined) => void; // New prop handler
  counts: Record<string, number>;
  topTags: Array<[string, number]>; // New prop for tag cloud
  customCategories: string[];
  onAddCategory: (name: string) => void;
  onDeleteCategory?: (name: string) => void; // New prop
  currentView: PromptView;
  onViewChange: (view: PromptView) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isDesktopOpen: boolean;
  onToggleDesktop: () => void;
  selectedProvider: string;
  onModelSelectorOpen?: () => void; // Model selector callback
  onDatabaseManagementOpen?: () => void; // Database management callback
}

const SidebarComponent: React.FC<SidebarProps> = ({
    selectedCategory,
    selectedTag,
    onSelectCategory,
    onSelectTag,
    counts,
    topTags,
    customCategories,
    onAddCategory,
    onDeleteCategory,
    currentView,
    onViewChange,
    isMobileOpen,
    onCloseMobile,
    isDesktopOpen,
    onToggleDesktop,
    selectedProvider,
    onModelSelectorOpen,
    onDatabaseManagementOpen
}) => {
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isTagsOpen, setIsTagsOpen] = useState(true);

  const handleCreateCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if (newCategoryName.trim()) {
          onAddCategory(newCategoryName.trim());
          setNewCategoryName('');
          setIsAddingCategory(false);
      }
  };

  const allCategories = [...STANDARD_CATEGORIES.filter(c => c !== 'All'), ...customCategories];

  useEffect(() => {
    const root = document.querySelector('[data-sidebar-root]');
    if (!root) return;
    root.querySelectorAll('*').forEach((node) => {
      if (node.textContent && node.textContent.trim().toUpperCase() === 'PRESS D TO CYCLE THEMES') {
        (node as HTMLElement).remove();
      }
    });
  }, []);

  const sidebarContent = (
    <div className="flex flex-col h-full" data-sidebar-root>
      {/* Header */}
      <div className="px-6 py-8 flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight flex items-center gap-3">
           <div className="bg-gradient-to-br from-brand-500 to-purple-600 p-2 rounded-lg shadow-[0_0_20px_rgba(var(--c-brand),0.5)] transform hover:scale-110 hover:rotate-6 transition-all duration-300 cursor-pointer relative group/logo overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover/logo:translate-x-[100%] transition-transform duration-700"></div>
                <Icons.Run className="w-5 h-5 text-white relative z-10" />
           </div>
           <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100 animate-shimmer bg-[length:200%_auto] hover:from-brand-400 hover:via-purple-400 hover:to-brand-400 transition-all duration-500">
             PromptRay
           </span>
        </h1>
        {/* Mobile Close Button */}
        <button
            onClick={onCloseMobile}
            className="md:hidden p-2 text-gray-400 hover:text-white"
        >
            <Icons.Close size={20} />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="px-4 flex-1 overflow-y-auto custom-scrollbar">
        {/* View Switcher with Model Selector */}
        <div className="mb-6">
            {/* View Switcher */}
            <div className="flex p-1 bg-white/5 rounded-lg border border-white/5 gap-1">
                {/* Model Selector Button - positioned before the sidebar toggle */}
                <button
                    onClick={() => {
                        // This will be handled by parent component
                        if (onModelSelectorOpen) {
                            onModelSelectorOpen();
                            onCloseMobile();
                        }
                    }}
                    className="flex items-center justify-center py-2 px-1 rounded-md transition-all duration-300 transform hover:scale-105 text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    title="选择AI模型"
                >
                    <div className={`transition-all duration-300 rounded ${
                        selectedProvider === 'auto' ? 'bg-yellow-500/10 hover:bg-yellow-500/20' :
                        selectedProvider === 'gemini' ? 'bg-blue-500/10 hover:bg-blue-500/20' :
                        selectedProvider === 'groq' ? 'bg-purple-500/10 hover:bg-purple-500/20' :
                        'bg-green-500/10 hover:bg-green-500/20'
                    } p-1`}>
                        <Icons.Chip size={14} className={`transition-colors duration-300 ${
                            selectedProvider === 'auto' ? 'text-yellow-400' :
                            selectedProvider === 'gemini' ? 'text-blue-400' :
                            selectedProvider === 'groq' ? 'text-purple-400' :
                            'text-green-400'
                        }`} />
                    </div>
                </button>
                <button
                    onClick={() => { onViewChange('dashboard'); onCloseMobile(); }}
                    className={`flex-1 flex items-center justify-center py-2 px-1 rounded-md transition-all duration-300 transform hover:scale-105 ${
                        currentView === 'dashboard' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-lg shadow-brand-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                    title="Dashboard"
                >
                    <Icons.Dashboard size={16} />
                </button>
                <button
                    onClick={() => { onViewChange('grid'); onCloseMobile(); }}
                    className={`flex-1 flex items-center justify-center py-2 px-1 rounded-md transition-all duration-300 transform hover:scale-105 ${
                        currentView === 'grid' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-lg shadow-brand-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                    title="Grid View"
                >
                    <Icons.All size={16} />
                </button>
                <button
                    onClick={() => { onViewChange('table'); onCloseMobile(); }}
                    className={`flex-1 hidden lg:flex items-center justify-center py-2 px-1 rounded-md transition-all duration-300 transform hover:scale-105 ${
                        currentView === 'table' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30 shadow-lg shadow-brand-500/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                    }`}
                    title="Knowledge Table"
                >
                    <Icons.Table size={16} />
                </button>
                {onDatabaseManagementOpen && (
                    <button
                        onClick={() => { onDatabaseManagementOpen(); onCloseMobile(); }}
                        className="flex-1 flex items-center justify-center py-2 px-1 rounded-md transition-all duration-300 transform hover:scale-105 text-gray-500 hover:text-gray-300 hover:bg-white/5"
                        title="Database Management"
                    >
                    <Icons.Database size={16} />
                </button>
                )}
                <button
                    onClick={() => { onToggleDesktop(); onCloseMobile(); }}
                    className="flex-1 flex items-center justify-center py-2 px-1 rounded-md transition-all duration-300 transform hover:scale-105 text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    title={isDesktopOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                    <Icons.Menu size={16} />
                </button>
            </div>
            <div className="mt-3 flex items-center justify-center text-xs text-gray-500 font-mono">
                Total Prompts: <span className="ml-1 text-gray-400 font-semibold">{counts['All'] || 0}</span>
            </div>
        </div>

        {/* Categories Section */}
        <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Library</span>
            <button
                onClick={() => setIsAddingCategory(true)}
                className="hover:text-brand-500 transition-colors p-1 hover:bg-white/5 rounded"
                title="Add Category"
            >
                <Icons.Plus size={12} />
            </button>
        </div>
        
        {/* Add Category Form */}
        {isAddingCategory && (
            <form onSubmit={handleCreateCategory} className="mb-3 animate-fade-in">
                <input
                    autoFocus
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onBlur={() => !newCategoryName && setIsAddingCategory(false)}
                    placeholder="Name..."
                    className="w-full bg-gray-900/50 border border-brand-500/50 rounded-theme px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-brand-500/50 shadow-inner"
                />
            </form>
        )}

        {/* Categories List */}
        <div className="space-y-1">
            {allCategories.map((cat) => {
                const Icon = getIconForCategory(cat);
                const isSelected = (currentView === 'grid' || currentView === 'list') && selectedCategory === cat && !selectedTag;
                const count = counts[cat] || 0;
                const isCustom = !(STANDARD_CATEGORIES as readonly string[]).includes(cat);

                return (
                <div key={cat} className="relative group">
                    <button
                        onClick={() => {
                            if (currentView === 'dashboard') onViewChange('grid');
                            onSelectCategory(cat);
                            onSelectTag(undefined); // Clear tag selection
                            onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-theme text-sm font-medium transition-all duration-500 relative overflow-hidden transform hover:scale-[1.02] ${
                            isSelected
                            ? 'text-white shadow-[0_0_25px_rgba(var(--c-brand),0.25)] border border-brand-500/30 bg-brand-500/10'
                            : 'text-gray-400 hover:text-gray-100 hover:bg-white/8 border border-transparent hover:border-white/10'
                        }`}
                    >
                        {isSelected && (
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/15 via-brand-500/10 to-transparent opacity-100"></div>
                        )}
                        <div className="flex items-center gap-3 relative z-10">
                            <Icon size={18} className={`transition-all duration-500 transform ${isSelected ? 'text-brand-500 drop-shadow-[0_0_12px_rgba(var(--c-brand),0.6)] scale-110' : 'text-gray-500 group-hover:text-gray-300 group-hover:scale-105'}`} />
                            <span className="truncate max-w-[120px] font-semibold">{cat}</span>
                        </div>
                        {count > 0 && (
                        <span className={`text-xs px-2.5 py-1 rounded-full relative z-10 transition-all duration-300 font-semibold ${isSelected ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 transform scale-110' : 'bg-white/8 text-gray-500 hover:bg-white/12'}`}>
                            {count}
                        </span>
                        )}
                    </button>

                    {isCustom && onDeleteCategory && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteCategory(cat);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-all z-20"
                            title="Delete Category"
                        >
                            <Icons.Close size={12} />
                        </button>
                    )}
                </div>
                );
            })}
        </div>

        {/* Trash Bin */}
        <div className="mt-6 pt-4 border-t border-white/5">
             <button
                onClick={() => {
                    if (currentView === 'dashboard') onViewChange('grid');
                    onSelectCategory(SPECIAL_CATEGORY_TRASH);
                    onSelectTag(undefined);
                    onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-theme text-sm font-medium transition-all duration-300 group relative overflow-hidden
                ${selectedCategory === 'Trash'
                    ? 'text-red-400 bg-red-500/10 border border-red-500/20'
                    : 'text-gray-500 hover:text-red-400 hover:bg-white/5 border border-transparent'
                }`}
            >
                <div className="flex items-center gap-3 relative z-10">
                    <Icons.Trash size={16} />
                    <span>Trash</span>
                </div>
                {counts[SPECIAL_CATEGORY_TRASH] > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500">
                        {counts[SPECIAL_CATEGORY_TRASH]}
                    </span>
                )}
            </button>
        </div>

        {/* Trending Tags Section */}
        {topTags.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/5 animate-slide-up-fade space-y-3">
                <button
                    onClick={() => setIsTagsOpen(!isTagsOpen)}
                    className="w-full text-xs font-semibold text-gray-600 uppercase tracking-widest flex items-center justify-between hover:text-gray-400 transition-colors"
                >
                    <span className="flex items-center gap-2"><Icons.Tag size={12} /> Trending Tags</span>
                    {isTagsOpen ? <Icons.ChevronDown size={12} /> : <Icons.ChevronRight size={12} />}
                </button>

                {isTagsOpen && (
                    <div className="flex flex-wrap gap-2 animate-fade-in">
                        {topTags.slice(0, 10).map(([tag, count]) => {
                            const isTagSelected = selectedTag === tag;
                            return (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        if (currentView === 'dashboard') onViewChange('grid');
                                        onSelectTag(isTagSelected ? undefined : tag);
                                        onCloseMobile();
                                    }}
                                    className={`text-xs px-2.5 py-1 rounded-full border transition-all duration-300 flex items-center gap-1.5 ${
                                        isTagSelected
                                        ? 'bg-brand-500 text-white border-brand-500 shadow-lg shadow-brand-500/20'
                                        : 'bg-white/5 text-gray-400 border-white/5 hover:border-white/20 hover:text-gray-200'
                                    }`}
                                >
                                    #{tag}
                                    <span className={`${isTagSelected ? 'text-white/80' : 'text-gray-600'}`}>{count}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        )}
      </div>

    </div>
  );

  return (
    <>
        {/* Mobile Backdrop */}
        <div 
            className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={onCloseMobile}
        ></div>

        {/* Mobile Drawer */}
        <aside className={`fixed inset-y-0 left-0 w-72 bg-[#0a0a0c] z-50 md:hidden transform transition-transform duration-300 ease-out border-r border-white/10 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            {sidebarContent}
        </aside>

        {/* Desktop Sidebar - Conditionally rendered for true fullscreen */}
        <div className="hidden md:block w-64 flex-shrink-0 overflow-hidden">
            {isDesktopOpen && (
                <aside className="w-64 flex-shrink-0 bg-transparent h-screen flex flex-col z-20 relative">
                    {sidebarContent}
                </aside>
            )}
        </div>
        
        {/* Toggle Button - Always visible when sidebar is hidden */}
        {!isDesktopOpen && (
            <button
                onClick={onToggleDesktop}
                className="hidden md:flex fixed left-0 top-24 z-30 p-3 bg-gray-900/90 backdrop-blur-md border-r border-y border-white/10 rounded-r-lg text-gray-400 hover:text-white hover:bg-gray-800/95 transition-all duration-300 transform hover:scale-105 shadow-xl hover:shadow-brand-500/20"
                title="Show Sidebar"
            >
                <Icons.Menu size={20} />
            </button>
        )}
    </>
  );
};

export const Sidebar = React.memo(SidebarComponent);