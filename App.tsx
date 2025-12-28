import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PromptModal } from './components/PromptModal';
import { Toast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Icons } from './components/Icons';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { Dashboard } from './components/Dashboard';
import { ListView } from './components/ListView';
import { KnowledgeTable } from './components/KnowledgeTable';
import { CommandPalette } from './components/CommandPalette';
import { PromptCard } from './components/PromptCard';
import { StorageMigrationModal } from './components/settings/StorageMigrationModal';
import { SQLConsole } from './components/SQLConsole';
import { ModelSelector } from './components/ModelSelector';
import { Prompt, PromptFormData, Theme, PromptVersion } from './types';
import { getModelsForProvider, ProviderKey } from './services/modelRegistry';
import SearchableSelect from './components/ui/SearchableSelect';
import {
  STANDARD_CATEGORIES,
  SPECIAL_CATEGORY_TRASH,
  PromptView
} from './constants';
import { emptyStateClass } from './components/ui/styleTokens';
import { usePromptData } from './hooks/usePromptData';
import { useFilterState } from './hooks/useFilterState';
import { useThemeManager } from './hooks/useThemeManager';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { initializeStorageMigration } from './services/storageService';
import { dataSyncManager } from './hooks/useDuckDBSync';

// Refined Themes - Professional & Aesthetic
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

// Unified Ambient Background Component
const AmbientBackground = ({ themeId }: { themeId: string }) => {
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

const App: React.FC = () => {
  const {
    prompts,
    setPrompts,
    customCategories,
    setCustomCategories,
    activePrompts,
    allTags,
    topTags,
    categoryCounts
  } = usePromptData();

  const {
    selectedCategory,
    setSelectedCategory,
    selectedTag,
    setSelectedTag,
    searchQuery,
    setSearchQuery,
    currentView,
    setCurrentView,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    setGridPage,
    setListPage,
    filteredPrompts,
    pagedGridPrompts: originalPagedGridPrompts,
    pagedListPrompts,
    favoritesOnly,
    setFavoritesOnly,
    recentOnly,
    setRecentOnly
  } = useFilterState(prompts);

  // Initialize storage migration on app startup
  useEffect(() => {
    const initMigration = async () => {
      console.info('🔄 Starting storage migration initialization...');

      try {
        // First, check if there's data in localStorage
        const localStorageData = localStorage.getItem('prompts_data_v2');
        console.info('📦 localStorage data check:', localStorageData ? `${JSON.parse(localStorageData).length} items` : 'empty');

        const migrationStatus = await initializeStorageMigration();
        console.info('✅ Storage migration initialized:', migrationStatus);

        // Check migration status after initialization
        const finalStatus = await import('./services/storageService').then(m => m.getMigrationStatus());
        console.info('🎯 Final migration status:', finalStatus);

        // Log current storage backend
        console.info('🔧 Current storage backend: hybrid');

        // Force a manual migration check if needed
        if (!migrationStatus.isCompleted && localStorageData) {
          console.info('⚡ Attempting manual migration...');
          const { migrateAllDataToIDB } = await import('./services/storageService');
          const result = await migrateAllDataToIDB();
          console.info('🔄 Manual migration result:', result);
        }

      } catch (error) {
        console.error('❌ Failed to initialize storage migration:', error);
      }
    };

    // Add a debug function to window for manual testing
    (window as any).debugStorageMigration = async () => {
      console.info('🔍 Manual debug: Checking storage state...');

      const localData = localStorage.getItem('prompts_data_v2');
      console.info('📦 localStorage:', localData ? `${JSON.parse(localData).length} items` : 'empty');

      try {
        const { getMigrationStatus, migrateAllDataToIDB } = await import('./services/storageService');
        const status = await getMigrationStatus();
        console.info('📊 Migration status:', status);

        if (!status.isCompleted && localData) {
          console.info('🚀 Starting manual migration...');
          const result = await migrateAllDataToIDB();
          console.info('✅ Migration result:', result);

          // Check final status
          const finalStatus = await getMigrationStatus();
          console.info('🎉 Final status:', finalStatus);
        }
      } catch (error) {
        console.error('❌ Debug migration failed:', error);
      }
    };

    initMigration();
  }, []);

  // Model provider/model filters synchronized with useFilterState
  const [selectedProvider, setSelectedProvider] = useState<string>('groq');
  const [selectedModel, setSelectedModel] = useState<string>('openai/gpt-oss-120b');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // keep filter state in sync with hook's internal state via localStorage (useFilterState persists)

  // Fetch available models when provider changes
  useEffect(() => {
    const fetchModels = async () => {
      try {
        if (selectedProvider === 'All' || selectedProvider === '') {
          // For "All" provider, combine models from all providers
          const [geminiModels, groqModels, openaiModels] = await Promise.all([
            getModelsForProvider('gemini'),
            getModelsForProvider('groq'),
            getModelsForProvider('openai')
          ]);
          setAvailableModels([...geminiModels, ...groqModels, ...openaiModels]);
        } else {
          const models = await getModelsForProvider(selectedProvider as ProviderKey);
          setAvailableModels(models);
        }
      } catch (error) {
        console.warn('Failed to fetch models for filter:', error);
        setAvailableModels([]);
      }
    };

    fetchModels();
  }, [selectedProvider]);
  useEffect(() => {
    try {
      const fs = JSON.parse(localStorage.getItem('prompts_filters_v1') || '{}');
      if (fs.selectedProvider) setSelectedProvider(fs.selectedProvider);
      if (fs.selectedModel) setSelectedModel(fs.selectedModel);
    } catch {}
  }, []);

  const { currentThemeId, setCurrentThemeId, currentThemeObj } = useThemeManager(THEMES);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar state
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); // Desktop sidebar state

  // Use the original paginated grid prompts - no artificial limit in fullscreen mode
  const pagedGridPrompts = originalPagedGridPrompts;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // Command Palette State
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Import Loading State
  const [isImporting, setIsImporting] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean; message: string; type?: 'success' | 'info' | 'error' }>({ 
    show: false, 
    message: '' 
  });
  
  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'warning'
  });

  // Storage Migration Modal State
  const [isStorageMigrationOpen, setIsStorageMigrationOpen] = useState(false);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [sqlConsoleOpen, setSqlConsoleOpen] = useState(false);

  // Model selector state for UX enhancements
  const [modelSelectorFocusMode, setModelSelectorFocusMode] = useState<'overview' | 'selection'>('overview');
  const [previouslyFocusedElement, setPreviouslyFocusedElement] = useState<Element | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'success') => {
      setToast({ show: true, message, type });
    },
    []
  );

  // Determine prev/next prompts for the modal navigation
  const { prevPrompt, nextPrompt } = useMemo(() => {
      if (!editingPrompt) return { prevPrompt: null, nextPrompt: null };
      const currentIndex = filteredPrompts.findIndex(p => p.id === editingPrompt.id);
      if (currentIndex === -1) return { prevPrompt: null, nextPrompt: null };
      
      const prev = currentIndex > 0 ? filteredPrompts[currentIndex - 1] : null;
      const next = currentIndex < filteredPrompts.length - 1 ? filteredPrompts[currentIndex + 1] : null;
      return { prevPrompt: prev, nextPrompt: next };
  }, [filteredPrompts, editingPrompt]);

  const handleCreatePrompt = useCallback((data: PromptFormData) => {
    const newPrompt: Prompt = {
      ...data,
      id: crypto.randomUUID(),
      status: data.status || 'active',
      collectedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: []
    };
    setPrompts(prev => [newPrompt, ...prev]);
    // Notify SQL console about the new prompt
    dataSyncManager.emit({ type: 'PROMPT_CREATED', payload: newPrompt });
    showToast('Prompt created successfully');
  }, [showToast]);

  const handleUpdatePrompt = useCallback((data: PromptFormData) => {
    if (!editingPrompt) return;
    
    // Build updated prompt object based on current editingPrompt and incoming data
    const prevPrompt = editingPrompt;
    const contentChanged = prevPrompt.content !== data.content;
    const systemChanged = prevPrompt.systemInstruction !== data.systemInstruction;
    const configChanged = JSON.stringify(prevPrompt.config) !== JSON.stringify(data.config);
    const examplesChanged = JSON.stringify(prevPrompt.examples) !== JSON.stringify(data.examples);

            const shouldSnapshot = contentChanged || systemChanged || configChanged || examplesChanged;
            
    let newHistory = prevPrompt.history || [];
            if (shouldSnapshot) {
                const snapshot: PromptVersion = {
                    timestamp: Date.now(),
        content: prevPrompt.content,
        systemInstruction: prevPrompt.systemInstruction,
        examples: prevPrompt.examples,
        config: prevPrompt.config,
        title: prevPrompt.title
                };
                newHistory = [snapshot, ...newHistory].slice(0, 10);
            }

    // Merge only defined fields from incoming data to avoid overwriting existing values with undefined.
    const sanitizedIncoming = Object.fromEntries(Object.entries(data as any).filter(([_, v]) => v !== undefined));
    const updatedPrompt: Prompt = {
      ...prevPrompt,
      ...(sanitizedIncoming as any),
                history: newHistory,
                updatedAt: Date.now()
            };
    
    setPrompts(prev => prev.map(p => p.id === updatedPrompt.id ? updatedPrompt : p));
    setEditingPrompt(updatedPrompt);
    // Notify SQL console about the updated prompt
    dataSyncManager.emit({ type: 'PROMPT_UPDATED', payload: updatedPrompt });
    showToast('Prompt updated successfully');
  }, [editingPrompt, showToast]);

  const handleDuplicatePrompt = useCallback((data: PromptFormData) => {
      const newPrompt: Prompt = {
          ...data,
          title: `${data.title} (Copy)`,
          id: crypto.randomUUID(),
          status: data.status || 'active',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          history: [] // Reset history on duplicate
      };
      setPrompts(prev => [newPrompt, ...prev]);
      showToast('Prompt duplicated successfully');
  }, [showToast]);

  const handleDuplicateFromCard = useCallback((id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const promptToClone = prompts.find(p => p.id === id);
      if (promptToClone) {
          const { id: _, createdAt: __, history: ___, deletedAt: ____, ...rest } = promptToClone;
          handleDuplicatePrompt(rest);
      }
  }, [prompts, handleDuplicatePrompt]);

  const handleDeletePrompt = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const prompt = prompts.find(p => p.id === id);
    if (!prompt) return;

    if (prompt.deletedAt) {
        // Permanent Delete
        setConfirmDialog({
            isOpen: true,
            title: 'Permanently Delete Prompt',
            message: 'This action cannot be undone. Are you sure you want to permanently delete this prompt?',
            type: 'danger',
            onConfirm: () => {
                setPrompts(prev => prev.filter(p => p.id !== id));
                // Notify SQL console about the deleted prompt
                dataSyncManager.emit({ type: 'PROMPT_DELETED', payload: { id } });
                showToast('Prompt permanently deleted', 'info');
                setConfirmDialog(prev => ({ ...prev, isOpen: false }));
            }
        });
    } else {
        // Soft Delete - treat as update for SQL console
        const updatedPrompt = { ...prompt, deletedAt: Date.now() };
        setPrompts(prev => prev.map(p => p.id === id ? updatedPrompt : p));
        // Notify SQL console about the updated prompt (soft delete)
        dataSyncManager.emit({ type: 'PROMPT_UPDATED', payload: updatedPrompt });
        showToast('Moved to Trash');
    }
  }, [prompts, showToast]);

  const handleRestorePrompt = useCallback((id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setPrompts(prev => prev.map(p => p.id === id ? { ...p, deletedAt: undefined } : p));
      showToast('Prompt restored');
  }, [showToast]);

  const toggleFavorite = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrompts(prev => {
      const updatedPrompts = prev.map(p => {
        if (p.id === id) {
          const updatedPrompt = { ...p, isFavorite: !p.isFavorite };
          // Notify SQL console about the updated prompt
          dataSyncManager.emit({ type: 'PROMPT_UPDATED', payload: updatedPrompt });
          return updatedPrompt;
        }
        return p;
      });
      return updatedPrompts;
    });
  }, []);

  const copyToClipboard = useCallback((text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  }, [showToast]);

  const handleExport = useCallback(() => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prompts, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "promptray_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showToast('Library exported', 'info');
  }, [prompts, showToast]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
        showToast(`File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`, 'error');
        event.target.value = '';
        return;
    }

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedData = JSON.parse(e.target?.result as string);
            if (Array.isArray(importedData)) {
                const existingIds = new Set(prompts.map(p => p.id));
                // Validate imported items
                const newItems = importedData.filter((p: any) => {
                    return (
                        !existingIds.has(p.id) && 
                        p.title && 
                        p.content &&
                        typeof p.title === 'string' &&
                        typeof p.content === 'string'
                    );
                });
                
                if (newItems.length === 0) {
                    showToast('No valid prompts found in file', 'info');
                } else {
                    setPrompts(prev => [...newItems, ...prev]);
                    showToast(`Imported ${newItems.length} prompt${newItems.length > 1 ? 's' : ''}`, 'success');
                }
            } else {
                showToast('Invalid file format: Expected an array of prompts', 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            showToast(`Failed to import: ${errorMsg}`, 'error');
        } finally {
            setIsImporting(false);
        }
    };
    reader.onerror = () => {
        showToast('Failed to read file', 'error');
        setIsImporting(false);
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [prompts, showToast]);

  const handleAddCategory = useCallback((name: string) => {
      if (!(STANDARD_CATEGORIES as readonly string[]).includes(name) && !customCategories.includes(name)) {
          setCustomCategories(prev => [...prev, name]);
          showToast(`Category "${name}" added`);
      } else {
          showToast(`Category "${name}" already exists`, 'info');
      }
  }, [customCategories, showToast]);

  const handleDeleteCategory = useCallback((name: string) => {
      setConfirmDialog({
          isOpen: true,
          title: `Delete Category "${name}"`,
          message: `Prompts in this category will be moved to 'Misc'. Are you sure you want to delete this category?`,
          type: 'warning',
          onConfirm: () => {
              // Update prompts first
              setPrompts(prev => {
                  const updated = prev.map(p => p.category === name ? { ...p, category: 'Misc' } : p);
                  return updated;
              });
              // Then update categories
              setCustomCategories(prev => prev.filter(c => c !== name));
              // Update selected category if needed
              if (selectedCategory === name) {
                  setSelectedCategory('All');
              }
              // Clear tag selection if it was related to this category
              if (selectedTag) {
                  setSelectedTag(undefined);
              }
              showToast(`Category "${name}" deleted`);
              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          }
      });
  }, [selectedCategory, selectedTag, showToast]);

  const openEditModal = useCallback((prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  }, []);

  const openNewModal = useCallback(() => {
    setEditingPrompt(null);
    setIsModalOpen(true);
  }, []);

  // Enhanced keyboard shortcuts for model selector
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (modelSelectorOpen) {
        switch (e.key) {
          case 'Escape':
            setModelSelectorOpen(false);
            break;
          case 'Enter':
            if (modelSelectorFocusMode === 'overview') {
              // Quick select default model
              setSelectedProvider('groq');
              setSelectedModel('openai/gpt-oss-120b');
              setModelSelectorOpen(false);
              showToast('已选择默认推荐模型', 'success');
            }
            break;
          case 'ArrowRight':
          case 'ArrowLeft':
            setModelSelectorFocusMode(prev => prev === 'overview' ? 'selection' : 'overview');
            break;
          case '1':
            if (e.ctrlKey || e.metaKey) {
              // Smart selection
              setSelectedProvider('auto');
              setSelectedModel('');
              setModelSelectorOpen(false);
              showToast('已启用智能自动选择', 'success');
            }
            break;
          case '2':
            if (e.ctrlKey || e.metaKey) {
              // Select GROQ
              setSelectedProvider('groq');
              setSelectedModel('openai/gpt-oss-120b');
              setModelSelectorOpen(false);
              showToast('已选择 GROQ 快速模型', 'success');
            }
            break;
          case '3':
            if (e.ctrlKey || e.metaKey) {
              // Select OpenAI
              setSelectedProvider('openai');
              setSelectedModel('');
              setModelSelectorOpen(false);
              showToast('已选择 OpenAI 官方模型', 'success');
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modelSelectorOpen, modelSelectorFocusMode, showToast]);

  // Global keyboard shortcuts
  useGlobalShortcuts({
    isModalOpen,
    isPaletteOpen,
    currentThemeId,
    themes: THEMES,
    setCurrentThemeId,
    setIsPaletteOpen,
    openNewModal,
    showToast
  });

  const navigatePrompt = useCallback((direction: 'next' | 'prev') => {
      if (direction === 'next' && nextPrompt) {
          setEditingPrompt(nextPrompt);
      } else if (direction === 'prev' && prevPrompt) {
          setEditingPrompt(prevPrompt);
      }
  }, [nextPrompt, prevPrompt]);

  const handleViewChange = useCallback((view: PromptView) => {
      setCurrentView(view);
      // Close all modals when switching views
      setModelSelectorOpen(false);
      setSqlConsoleOpen(false);
      setIsStorageMigrationOpen(false);
      setIsModalOpen(false);
      // Reset filters so the view always shows full coverage (user feedback)
      setSelectedCategory('All');
      setSelectedTag(undefined);
      setSearchQuery('');
      if (view === 'grid') setGridPage(1);
      if (view === 'list') setListPage(1);
  }, []);

    return (
    <div className={`h-screen w-full surface-shell ${currentThemeId === 'theme-light' ? 'text-slate-900' : 'text-slate-100'} overflow-hidden text-base transition-all duration-700 relative selection:bg-brand-500/30 animate-theme-transition ${
      isDesktopSidebarOpen
        ? 'grid grid-cols-[256px_1fr] items-start'
        : 'flex flex-col'
    }`} style={{ fontFamily: 'var(--font-ui)' }}>
      
      {/* Enhanced Background Layer */}
      <AmbientBackground themeId={currentThemeId} />
      
      {/* Noise Texture Overlay with Better Blending */}
      <div className="bg-noise z-[1] opacity-50"></div>
      
      {/* Simplified texture overlay */}
      <div className={`absolute inset-0 pointer-events-none z-[1] opacity-10 transition-opacity duration-700 ${
          currentThemeObj.bgPattern === 'dots' ? 'bg-pattern-dots' : 
          currentThemeObj.bgPattern === 'grid' ? 'bg-pattern-grid' : ''
      }`}></div>
      
      <div className="absolute inset-0 pointer-events-none z-[1] bg-gradient-to-br from-brand-500/5 via-transparent to-purple-500/5"></div>

      <Sidebar
        selectedCategory={selectedCategory}
        selectedTag={selectedTag}
        onSelectCategory={useCallback((cat: string) => {
            setSelectedCategory(cat);
            if (currentView === 'dashboard') setCurrentView('grid');
        }, [currentView])}
        onSelectTag={setSelectedTag}
        counts={categoryCounts}
        topTags={topTags}
        customCategories={customCategories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
        currentView={currentView}
        onViewChange={handleViewChange}
        isMobileOpen={isSidebarOpen}
        onCloseMobile={useCallback(() => setIsSidebarOpen(false), [])}
        isDesktopOpen={isDesktopSidebarOpen}
        onToggleDesktop={useCallback(() => setIsDesktopSidebarOpen(prev => !prev), [])}
        selectedProvider={selectedProvider}
        onModelSelectorOpen={useCallback(() => {
          // Store the currently focused element for restoration
          setPreviouslyFocusedElement(document.activeElement);

          // Close all other modals before opening model selector
          setSqlConsoleOpen(false);
          setIsStorageMigrationOpen(false);
          setIsModalOpen(false);
          setModelSelectorOpen(true);
        }, [])}
        onSQLConsoleOpen={useCallback(() => {
          // Close all other modals before opening SQL console
          setModelSelectorOpen(false);
          setIsStorageMigrationOpen(false);
          setIsModalOpen(false);
          setSqlConsoleOpen(true);
        }, [])}
      />

      <main className={`relative z-10 flex flex-col transition-all duration-300 flex-1 ${
        !isDesktopSidebarOpen ? 'justify-start' : 'justify-start'
      }`}>
        <div
          className={`w-full flex flex-col transition-all duration-700 ${
            !isDesktopSidebarOpen
              ? 'rounded-none border-0 mt-0 mb-0 mx-0 shadow-none h-full'
              : 'glass-panel border border-white/10 shadow-2xl rounded-3xl mt-4 md:mt-6 mb-4 md:mb-6 mx-4 md:mx-6 lg:mx-8 h-full'
          }`}
        >
        {/* Enhanced Top Bar - Glassmorphic with Better Depth */}
          <header className={`flex flex-col gap-4 md:flex-row ${!isDesktopSidebarOpen ? 'md:items-start' : 'md:items-center'} md:justify-between bg-gray-900/60 backdrop-blur-xl z-10 border-b border-white/10 shadow-lg ${
            !isDesktopSidebarOpen
              ? 'w-[95%] mx-auto px-8 py-8 border border-white/10'
              : 'w-full px-4 py-3 md:px-6 md:py-4'
          }`}>
            <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg border border-white/5 bg-white/5">
                    <Icons.Menu size={18} />
                </button>
                <div className={`relative w-full group ${!isDesktopSidebarOpen ? 'max-w-2xl' : 'max-w-xl'}`}>
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 transition-colors group-focus-within:text-brand-500" />
                    <input 
                        type="text"
                    placeholder={selectedCategory === SPECIAL_CATEGORY_TRASH ? "Search deleted items..." : "Search prompts..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={currentView === 'dashboard'}
                        className="w-full bg-gray-900/70 border border-white/10 rounded-theme pl-10 pr-28 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-brand-500/60 focus:bg-gray-900/90 focus:ring-2 focus:ring-brand-500/30 transition-all duration-300 shadow-md hover:shadow-lg hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-gray-500 backdrop-blur-sm"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 pointer-events-none">
                         <kbd className="bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs text-gray-500 font-mono">⌘K</kbd>
                         <span className="text-[10px] text-gray-600">Jump</span>
                    </div>
                </div>
                <button onClick={() => setIsPaletteOpen(true)} className="hidden md:flex p-2 text-gray-400 hover:text-white bg-white/5 rounded-theme border border-white/10">
                    <Icons.Command size={18} />
                </button>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3 mr-8">
                {/* Sort Controls - Only show in grid/list view */}
                {currentView !== 'dashboard' && (
                    <div className="hidden md:flex items-center gap-2 bg-white/5 rounded-theme border border-white/10 p-1 shadow-sm">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'title' | 'category')}
                            className="bg-transparent text-xs text-gray-300 border-none outline-none cursor-pointer px-2 py-1"
                        >
                            <option value="createdAt">Date</option>
                            <option value="title">Title</option>
                            <option value="category">Category</option>
                        </select>
                        <button
                            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-white/5"
                            title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
                        >
                            {sortOrder === 'asc' ? <Icons.ArrowUp size={14} /> : <Icons.ArrowDown size={14} />}
                        </button>
                    </div>
                )}

                {/* Quick filters */}
                {currentView !== 'dashboard' && (
                  <div className="hidden md:flex items-center gap-2 bg-white/5 rounded-theme border border-white/10 p-1 shadow-sm">
                    <button
                      onClick={() => setFavoritesOnly(prev => !prev)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                        favoritesOnly
                          ? 'bg-amber-500/20 text-amber-100 border-amber-400/40 shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent'
                      }`}
                    >
                      Favorites
                    </button>
                    <button
                      onClick={() => setRecentOnly(prev => !prev)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
                        recentOnly
                          ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/40 shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-white/5 border-transparent'
                      }`}
                      title="Only show items updated in last 30 days"
                    >
                      Recent
                    </button>
                  </div>
                )}

                <input type="file" ref={fileInputRef} onChange={handleImportFile} className="hidden" accept=".json" />
                <div className="hidden md:flex bg-white/5 rounded-theme border border-white/10 p-0.5 shadow-sm">
                    <button 
                        onClick={handleImportClick} 
                        disabled={isImporting}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-theme transition-all disabled:opacity-50 disabled:cursor-not-allowed relative" 
                        title="Import JSON"
                    >
                        {isImporting ? (
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Icons.Upload size={16} />
                        )}
                    </button>
                    <div className="w-[1px] bg-white/10 my-1 mx-0.5"></div>
                    <button onClick={handleExport} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-theme transition-all" title="Export JSON"><Icons.Download size={16} /></button>
                </div>
                <button 
                    onClick={openNewModal} 
                    className="btn-primary flex items-center gap-2 px-3 md:px-4 py-2 text-sm font-semibold relative overflow-hidden group shadow-lg shadow-brand-500/30"
                >
                    <span className="relative z-10 flex items-center gap-2">
                        <Icons.Plus size={16} className="transition-transform duration-300 group-hover:rotate-90" />
                        <span className="hidden sm:inline">Create</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                </button>
            </div>
        </header>

        {/* Content Area - Optimized spacing for fullscreen */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar scroll-smooth border border-white/10 ${
          !isDesktopSidebarOpen ? 'w-[95%] mx-auto p-4 md:p-6' : 'w-full p-4 md:p-6'
        }`}>
            {currentView === 'dashboard' ? (
                <Dashboard
                    prompts={activePrompts}
                    onOpenPrompt={openEditModal}
                />
        ) : currentView === 'list' ? (
            <div className={`max-w-full mx-auto space-y-6 ${
              !isDesktopSidebarOpen ? 'px-2' : 'px-4'
            }`}>
                {/* Filter chips */}
                {(selectedTag || selectedCategory === SPECIAL_CATEGORY_TRASH || favoritesOnly || recentOnly) && (
                    <div className={`mb-4 animate-fade-in`}>
                        {selectedCategory === SPECIAL_CATEGORY_TRASH && (
                            <span className="flex items-center gap-1 bg-red-500/15 text-red-300 border border-red-500/25 px-3 py-1 rounded-full text-sm font-semibold">
                                <Icons.Trash size={14} /> Trash Bin
                            </span>
                        )}
                        {favoritesOnly && (
                          <span className="flex items-center gap-1 bg-amber-500/20 text-amber-100 border border-amber-400/40 px-3 py-1 rounded-full text-sm font-semibold">
                            <Icons.Star size={14} /> Favorites
                            <button onClick={() => setFavoritesOnly(false)} className="hover:text-amber-200/80"><Icons.Close size={12}/></button>
                          </span>
                        )}
                        {recentOnly && (
                          <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-100 border border-emerald-400/30 px-3 py-1 rounded-full text-sm font-semibold">
                            <Icons.Activity size={14} /> Recent 30d
                            <button onClick={() => setRecentOnly(false)} className="hover:text-emerald-200/80"><Icons.Close size={12}/></button>
                          </span>
                        )}
                        {selectedTag && (
                            <span className="flex items-center gap-1 bg-brand-500 text-white px-2 py-1 rounded-full text-sm font-semibold shadow-sm shadow-brand-500/40">
                                #{selectedTag} 
                                <button onClick={() => setSelectedTag(undefined)} className="hover:text-white/80"><Icons.Close size={14}/></button>
                            </span>
                        )}
                    </div>
                )}
                {/* Provider / Model filter controls */}
                <div className="mb-6">
                  <select
                    value={selectedProvider}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSelectedProvider(v);
                      try {
                        const cur = JSON.parse(localStorage.getItem('prompts_filters_v1') || '{}');
                        localStorage.setItem('prompts_filters_v1', JSON.stringify({ ...cur, selectedProvider: v }));
                        window.dispatchEvent(new CustomEvent('prompt_filters_changed'));
                      } catch {}
                    }}
                    className="text-xs bg-gray-950/70 border border-white/10 rounded-lg px-2 py-1 text-white"
                  >
                    <option value="All">All Providers</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="groq">Groq / OpenAI OSS</option>
                  </select>
                  <SearchableSelect
                    value={selectedModel}
                    options={availableModels}
                    placeholder="Model (search)"
                    onChange={(v) => {
                      setSelectedModel(v);
                      try {
                        const cur = JSON.parse(localStorage.getItem('prompts_filters_v1') || '{}');
                        localStorage.setItem('prompts_filters_v1', JSON.stringify({ ...cur, selectedModel: v }));
                        window.dispatchEvent(new CustomEvent('prompt_filters_changed'));
                      } catch {}
                    }}
                    recent={JSON.parse(localStorage.getItem('recent_models') || '[]')}
                    clearable
                  />
                </div>
                <ListView 
                    prompts={pagedListPrompts}
                    onOpenPrompt={openEditModal}
                    onToggleFavorite={toggleFavorite}
                    onDelete={handleDeletePrompt}
                    onDuplicate={handleDuplicateFromCard}
                    onRestore={selectedCategory === SPECIAL_CATEGORY_TRASH ? handleRestorePrompt : undefined}
                    isTrashView={selectedCategory === SPECIAL_CATEGORY_TRASH}
                />
                {pagedListPrompts.length < filteredPrompts.length && (
                  <div className="flex justify-center pt-4 pb-6">
                    <button
                      onClick={() => setListPage(prev => prev + 1)}
                      className="px-4 py-2 text-sm font-semibold rounded-theme bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 shadow-sm transition-all"
                    >
                      Load more ({pagedListPrompts.length}/{filteredPrompts.length})
                    </button>
                  </div>
                )}
            </div>
        ) : currentView === 'table' ? (
            <div className={`max-w-full mx-auto space-y-6 ${
              !isDesktopSidebarOpen ? 'px-2' : 'px-4'
            }`}>
                {(selectedTag || selectedCategory === SPECIAL_CATEGORY_TRASH || favoritesOnly || recentOnly) && (
                    <div className="flex items-center gap-2 animate-fade-in">
                        {selectedCategory === SPECIAL_CATEGORY_TRASH && (
                            <span className="flex items-center gap-1 bg-red-500/15 text-red-300 border border-red-500/25 px-3 py-1 rounded-full text-sm font-semibold">
                                <Icons.Trash size={14} /> Trash Bin
                            </span>
                        )}
                        {favoritesOnly && (
                          <span className="flex items-center gap-1 bg-amber-500/20 text-amber-100 border border-amber-400/40 px-3 py-1 rounded-full text-sm font-semibold">
                            <Icons.Star size={14} /> Favorites
                            <button onClick={() => setFavoritesOnly(false)} className="hover:text-amber-200/80"><Icons.Close size={12}/></button>
                          </span>
                        )}
                        {recentOnly && (
                          <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-100 border border-emerald-400/30 px-3 py-1 rounded-full text-sm font-semibold">
                            <Icons.Activity size={14} /> Recent 30d
                            <button onClick={() => setRecentOnly(false)} className="hover:text-emerald-200/80"><Icons.Close size={12}/></button>
                          </span>
                        )}
                        {selectedTag && (
                            <span className="flex items-center gap-1 bg-brand-500 text-white px-2 py-1 rounded-full text-sm font-semibold shadow-sm shadow-brand-500/40">
                                #{selectedTag}
                                <button onClick={() => setSelectedTag(undefined)} className="hover:text-white/80">
                                    <Icons.Close size={14} />
                                </button>
                            </span>
                        )}
                    </div>
                )}
                <KnowledgeTable
                    prompts={filteredPrompts}
                    onOpenPrompt={openEditModal}
                />
            </div>
        ) : (
            <div className={`max-w-full mx-auto space-y-6 ${
              !isDesktopSidebarOpen ? 'px-2' : 'px-4'
            }`}>
                {/* Filter chips - outside grid container */}
                {(selectedTag || selectedCategory === SPECIAL_CATEGORY_TRASH || favoritesOnly || recentOnly) && (
                    <div className="mb-3 flex items-center gap-2 animate-fade-in">
                        {selectedCategory === SPECIAL_CATEGORY_TRASH && (
                            <span className="flex items-center gap-1 bg-red-500/15 text-red-300 border border-red-500/25 px-3 py-1 rounded-full text-sm font-semibold">
                                <Icons.Trash size={14} /> Trash Bin
                            </span>
                        )}
                        {favoritesOnly && (
                          <span className="flex items-center gap-1 bg-amber-500/20 text-amber-100 border border-amber-400/40 px-3 py-1 rounded-full text-sm font-semibold">
                            <Icons.Star size={14} /> Favorites
                            <button onClick={() => setFavoritesOnly(false)} className="hover:text-amber-200/80"><Icons.Close size={12}/></button>
                          </span>
                        )}
                        {recentOnly && (
                          <span className="flex items-center gap-1 bg-emerald-500/15 text-emerald-100 border border-emerald-400/30 px-3 py-1 rounded-full text-sm font-semibold">
                            <Icons.Activity size={14} /> Recent 30d
                            <button onClick={() => setRecentOnly(false)} className="hover:text-emerald-200/80"><Icons.Close size={12}/></button>
                          </span>
                        )}
                        {selectedTag && (
                            <span className="flex items-center gap-1 bg-brand-500 text-white px-2 py-1 rounded-full text-sm font-semibold shadow-sm shadow-brand-500/40">
                                #{selectedTag}
                                <button onClick={() => setSelectedTag(undefined)} className="hover:text-white/80"><Icons.Close size={14}/></button>
                            </span>
                        )}
                    </div>
                )}

                {/* Grid View - Optimized for fullscreen space utilization */}
                <div className="grid gap-4 justify-center pb-12" style={{
                    gridTemplateColumns: isDesktopSidebarOpen
                      ? 'repeat(auto-fit, minmax(280px, 1fr))'
                      : 'repeat(auto-fit, minmax(240px, 1fr))'
                  }}>
                    {filteredPrompts.length === 0 ? (
                        <div className={emptyStateClass}>
                            <div className="w-20 h-20 rounded-full bg-white/8 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-6 shadow-lg transform hover:scale-110 transition-transform duration-300">
                                {selectedCategory === 'Trash' ? <Icons.Trash size={28} className="opacity-50" /> : <Icons.Search size={28} className="opacity-50" />}
                            </div>
                            <p className="text-lg font-semibold text-gray-300 mb-2">{selectedCategory === 'Trash' ? 'Trash is empty' : 'No prompts found'}</p>
                            <p className="text-sm text-gray-500 mb-4">Try adjusting your filters or create a new prompt</p>
                            {(searchQuery || selectedTag) && (
                                <button 
                                    onClick={() => { setSearchQuery(''); setSelectedTag(undefined); }} 
                                    className="mt-2 px-4 py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-100 rounded-theme border border-brand-500/30 hover:border-brand-500/50 transition-all duration-300 text-sm font-semibold transform hover:scale-105"
                                >
                                    Clear filters
                                </button>
                            )}
                        </div>
                    ) : (
                        pagedGridPrompts.map((prompt, index) => {
                            const isTrash = selectedCategory === SPECIAL_CATEGORY_TRASH;
                            const cardVariant = currentThemeId === 'theme-light' ? 'light' : currentThemeId === 'theme-aurora' ? 'accent' : 'dark';
                            return (
                                <PromptCard
                                    key={prompt.id}
                                    prompt={prompt}
                                    index={index}
                                    isTrash={isTrash}
                                    onOpen={openEditModal}
                                    onToggleFavorite={toggleFavorite}
                                    onDuplicate={handleDuplicateFromCard}
                                    onDelete={handleDeletePrompt}
                                    onRestore={selectedCategory === SPECIAL_CATEGORY_TRASH ? handleRestorePrompt : undefined}
                                    onCopy={copyToClipboard}
                                    themeVariant={cardVariant}
                                />
                            );
                        })
                    )}
                </div>
                {pagedGridPrompts.length < filteredPrompts.length && (
                  <div className="flex justify-center pt-2 pb-6">
                    <button
                      onClick={() => setGridPage(prev => prev + 1)}
                      className="px-4 py-2 text-sm font-semibold rounded-theme bg-white/5 hover:bg-white/10 border border-white/10 text-gray-200 shadow-sm transition-all"
                    >
                      Load more ({pagedGridPrompts.length}/{filteredPrompts.length})
                    </button>
                  </div>
                )}
            </div>
        )}
        </div>

        <ErrorBoundary>
            <PromptModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={editingPrompt ? handleUpdatePrompt : handleCreatePrompt}
                onDuplicate={handleDuplicatePrompt}
                onNotify={showToast}
                initialData={editingPrompt}
                allCategories={[...STANDARD_CATEGORIES, ...customCategories]}
                allAvailableTags={allTags}
                onNext={() => navigatePrompt('next')}
                onPrev={() => navigatePrompt('prev')}
                hasNext={!!nextPrompt}
                hasPrev={!!prevPrompt}
                currentTheme={currentThemeObj}
            />
        </ErrorBoundary>
        
        <CommandPalette 
            isOpen={isPaletteOpen}
            onClose={() => setIsPaletteOpen(false)}
            themes={THEMES}
            onSelectTheme={setCurrentThemeId}
            onNavigate={(view, cat) => {
                if (cat) {
                    setSelectedCategory(cat);
                    setSelectedTag(undefined);
                    setSearchQuery('');
                    setCurrentView(view);
                } else {
                    handleViewChange(view);
                }
            }}
            onAction={(action) => {
                if (action === 'create') openNewModal();
                if (action === 'import') handleImportClick();
                if (action === 'export') handleExport();
                if (action === 'storage-migration') setIsStorageMigrationOpen(true);
            }}
        />

        <Toast 
            message={toast.message} 
            isVisible={toast.show} 
            onClose={() => setToast(prev => ({ ...prev, show: false }))} 
            type={toast.type}
        />
        
        <ConfirmDialog
            isOpen={confirmDialog.isOpen}
            title={confirmDialog.title}
            message={confirmDialog.message}
            type={confirmDialog.type}
            onConfirm={confirmDialog.onConfirm}
            onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        />


        {/* Model Selector Modal - Enhanced Accessibility */}
        {modelSelectorOpen && (
            <div
                className="fixed inset-0 bg-black/85 backdrop-blur-xl z-50 flex items-start justify-center pt-2 pb-2 px-2 sm:pt-6 sm:pb-4 sm:px-4 animate-fade-in"
                role="dialog"
                aria-modal="true"
                aria-labelledby="model-selector-title"
                aria-describedby="model-selector-description"
            >
                <div
                    className={`w-full max-w-[95vw] bg-gradient-to-br from-gray-900/95 via-slate-900/98 to-gray-900/95 border rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up-fade backdrop-blur-2xl ring-1 transition-all duration-300 ${
                        modelSelectorFocusMode === 'overview'
                            ? 'border-violet-400/30 ring-violet-400/20 shadow-violet-500/20'
                            : 'border-blue-400/30 ring-blue-400/20 shadow-blue-500/20'
                    }`}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                            setModelSelectorFocusMode(prev => prev === 'overview' ? 'selection' : 'overview');
                        }
                    }}
                    tabIndex={-1}
                    role="document"
                >
                    {/* Enhanced Header - Multi-layered gradients and improved visual hierarchy */}
                    <div className="relative bg-gradient-to-br from-violet-600/15 via-purple-600/10 to-blue-600/15 border-b border-white/20 overflow-hidden">
                        {/* Animated background layers */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer opacity-30"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-purple-500/5 animate-pulse"></div>

                        <div className="relative flex items-center justify-between p-4 sm:p-8 pb-4 sm:pb-6">
                            <div className="flex items-center gap-3 sm:gap-5">
                                <div className="relative group">
                                    {/* Enhanced icon container with animated border */}
                                    <div className="relative p-3 sm:p-4 bg-gradient-to-br from-violet-500/25 via-purple-500/20 to-blue-500/25 rounded-xl sm:rounded-2xl border border-white/30 shadow-xl shadow-violet-500/20 backdrop-blur-sm">
                                        <Icons.Chip size={24} className="sm:w-7 sm:h-7 text-white drop-shadow-lg" />
                                        {/* Animated ring effect */}
                                        <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 border-violet-400/50 animate-ping opacity-20"></div>
                                    </div>
                                    {/* Status indicator with enhanced glow */}
                                    <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full border-2 sm:border-3 border-gray-900 animate-pulse shadow-emerald-400/80 shadow-[0_0_12px] ring-2 ring-emerald-400/30"></div>
                                </div>
                                <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                                    <h1
                                        id="model-selector-title"
                                        className="text-xl sm:text-3xl font-black text-white tracking-tight bg-gradient-to-r from-white via-white to-gray-200 bg-clip-text text-transparent truncate"
                                    >
                                        AI 模型选择器
                                    </h1>
                                    <p
                                        id="model-selector-description"
                                        className="text-sm sm:text-base text-gray-300 font-medium leading-relaxed hidden sm:block"
                                    >
                                        选择最适合您创作需求的AI模型
                                    </p>
                                    <p className="text-xs text-gray-400 font-medium leading-relaxed sm:hidden" aria-hidden="true">
                                        选择最适合的AI模型
                                    </p>
                                    {/* Subtle accent line */}
                                    <div className="w-12 sm:w-16 h-0.5 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full opacity-80" aria-hidden="true"></div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                  setModelSelectorOpen(false);
                                  // Restore focus to the previously focused element
                                  setTimeout(() => {
                                    if (previouslyFocusedElement && 'focus' in previouslyFocusedElement) {
                                      (previouslyFocusedElement as HTMLElement).focus();
                                    }
                                  }, 100);
                                }}
                                className="group relative p-2 sm:p-3 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-90 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-xl flex-shrink-0"
                                title="关闭 (Esc)"
                                aria-label="关闭模型选择器"
                            >
                                <Icons.Close size={20} className="sm:w-6 sm:h-6 transition-transform duration-200 group-hover:rotate-45" />
                                {/* Subtle glow effect */}
                                <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-r from-red-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </button>
                        </div>
                    </div>

                    {/* Enhanced Content - Improved visual hierarchy and spacing */}
                    <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                            {/* Compact Selection Overview */}
                            <div className={`px-4 py-3 sm:px-6 sm:py-4 border-b bg-gradient-to-b from-white/3 to-transparent transition-all duration-300 ${
                                modelSelectorFocusMode === 'overview'
                                    ? 'border-violet-400/40 bg-gradient-to-b from-violet-500/8 to-transparent'
                                    : 'border-white/8'
                            }`}>
                                {/* Ultra-compact horizontal layout */}
                                <div className="flex gap-3 sm:gap-4">
                                    {/* Default Recommendation - Compact */}
                                    <div className="flex-1 group relative bg-gradient-to-br from-amber-500/10 via-yellow-500/8 to-orange-500/10 border border-amber-400/25 rounded-xl p-3 sm:p-4 shadow-lg shadow-amber-500/15 backdrop-blur-sm overflow-hidden hover:shadow-amber-500/25 transition-all duration-300 cursor-pointer">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="relative">
                                                <div className="w-6 h-6 bg-gradient-to-br from-amber-400/25 to-yellow-400/25 rounded-lg flex items-center justify-center border border-amber-400/40">
                                                    <Icons.Star size={12} className="text-amber-300" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-white truncate">默认推荐</div>
                                                <div className="text-xs text-amber-200/80 font-medium">openai/gpt-oss-120b</div>
                                            </div>
                                            <div className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-200 border border-purple-400/30 font-medium">
                                                ⚡ GROQ
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-300 leading-tight">
                                            超快推理 + 官方品质
                                        </div>
                                    </div>

                                    {/* Current Selection - Compact */}
                                    <div className="flex-1 group relative bg-gradient-to-br from-slate-800/50 via-gray-800/40 to-slate-800/50 border border-white/15 rounded-xl p-3 sm:p-4 shadow-lg shadow-blue-500/8 backdrop-blur-sm overflow-hidden hover:shadow-blue-500/15 transition-all duration-300">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="relative">
                                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 shadow-sm ${
                                                    selectedProvider === 'auto' ? 'bg-gradient-to-br from-yellow-500/25 to-amber-500/25 border-yellow-400/50' :
                                                    selectedProvider === 'gemini' ? 'bg-gradient-to-br from-blue-500/25 to-cyan-500/25 border-blue-400/50' :
                                                    selectedProvider === 'groq' ? 'bg-gradient-to-br from-purple-500/25 to-pink-500/25 border-purple-400/50' :
                                                    'bg-gradient-to-br from-green-500/25 to-emerald-500/25 border-green-400/50'
                                                }`}>
                                                    <Icons.Chip size={12} className={`${
                                                        selectedProvider === 'auto' ? 'text-yellow-300' :
                                                        selectedProvider === 'gemini' ? 'text-blue-300' :
                                                        selectedProvider === 'groq' ? 'text-purple-300' :
                                                        'text-green-300'
                                                    }`} />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-bold text-white truncate">当前选择</div>
                                                <div className="text-xs text-gray-300 truncate">{selectedModel || '默认模型'}</div>
                                            </div>
                                            <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                selectedProvider === 'auto' ? 'bg-yellow-500/15 text-yellow-200 border border-yellow-400/30' :
                                                selectedProvider === 'gemini' ? 'bg-blue-500/15 text-blue-200 border border-blue-400/30' :
                                                selectedProvider === 'groq' ? 'bg-purple-500/15 text-purple-200 border border-purple-400/30' :
                                                'bg-green-500/15 text-green-200 border border-green-400/30'
                                            }`}>
                                                {selectedProvider === 'auto' ? '🤖 AUTO' :
                                                 selectedProvider === 'gemini' ? '🎯 GEMINI' :
                                                 selectedProvider === 'groq' ? '⚡ GROQ' :
                                                 '🏆 OPENAI'}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-400 leading-tight">
                                            {selectedProvider === 'auto' ? '智能自动选择' :
                                             selectedProvider === 'gemini' ? '多模态支持' :
                                             selectedProvider === 'groq' ? '超快推理' :
                                             '业界标准'}
                                        </div>
                                    </div>
                                </div>


                        </div>

                        {/* Enhanced Model Selection Section - Mobile Optimized */}
                        <div className="p-4 sm:p-8">
                            <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                                <div className="relative">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500/25 to-purple-500/25 rounded-lg sm:rounded-xl flex items-center justify-center border border-indigo-400/40 shadow-lg shadow-indigo-500/20">
                                        <Icons.Settings size={16} className="sm:w-5 sm:h-5 text-indigo-300 drop-shadow-sm" />
                                    </div>
                                    {/* Subtle glow */}
                                    <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-indigo-400/20 animate-pulse opacity-50"></div>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-lg sm:text-2xl font-bold text-white tracking-wide truncate">选择新模型</h2>
                                    <p className="text-xs sm:text-sm text-gray-400 font-medium mt-0.5 sm:mt-1 hidden sm:block">探索更多AI模型，发现最佳创作伙伴</p>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5 sm:hidden">探索更多AI模型</p>
                                </div>
                            </div>

                            {/* Enhanced Model Selector Container with focus feedback - Mobile Optimized */}
                            <div className={`relative bg-gradient-to-br from-gray-800/40 via-slate-800/35 to-gray-800/40 border rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl backdrop-blur-sm overflow-hidden transition-all duration-300 ${
                                modelSelectorFocusMode === 'selection'
                                    ? 'border-blue-400/50 ring-2 ring-blue-400/20 shadow-blue-500/30'
                                    : 'border-white/10'
                            }`}>
                                {/* Subtle animated background */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 animate-pulse opacity-30"></div>
                                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-cyan-400/10 to-transparent rounded-full -translate-y-20 translate-x-20"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-violet-400/10 to-transparent rounded-full translate-y-16 -translate-x-16"></div>

                                <div className="relative z-10">
                                    <ModelSelector
                                        value={{ provider: selectedProvider, model: selectedModel }}
                                        onChange={(value) => {
                                            setSelectedProvider(value.provider);
                                            setSelectedModel(value.model);
                                            setModelSelectorOpen(false);
                                        }}
                                        className="w-full"
                                        lastRuntime={{
                                            provider: selectedProvider,
                                            model: selectedModel
                                        }}
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* SQL Console Modal - Optimized responsive sizing */}
        {sqlConsoleOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-lg z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
                <div className="w-full h-full max-w-7xl max-h-[90vh] bg-gray-900/98 border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-slide-up-fade backdrop-blur-xl">
                    <SQLConsole onClose={() => setSqlConsoleOpen(false)} />
                </div>
            </div>
        )}

        <StorageMigrationModal
            isOpen={isStorageMigrationOpen}
            onClose={() => setIsStorageMigrationOpen(false)}
        />
        </div>
      </main>
    </div>
  );
};

export default App;