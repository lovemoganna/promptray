import { useEffect, useMemo, useState } from 'react';
import { Prompt } from '../types';
import { PAGE_SIZE, PromptView, SortBy, SortOrder, SPECIAL_CATEGORY_TRASH } from '../constants';
import { getFilterState, saveFilterState, FilterState } from '../services/storageService';

export const useFilterState = (prompts: Prompt[]) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<PromptView>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [gridPage, setGridPage] = useState(1);
  const [listPage, setListPage] = useState(1);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [recentOnly, setRecentOnly] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);

  // Restore filter state
  useEffect(() => {
    const loadFilterState = async () => {
      try {
        const savedFilters = await getFilterState();
        if (savedFilters) {
          setSelectedCategory(savedFilters.selectedCategory);
          setSelectedTag(savedFilters.selectedTag);
          setSearchQuery(savedFilters.searchQuery);
          setCurrentView(savedFilters.currentView);
          if (savedFilters.sortBy) setSortBy(savedFilters.sortBy);
          if (savedFilters.sortOrder) setSortOrder(savedFilters.sortOrder);
          if (typeof savedFilters.favoritesOnly === 'boolean') setFavoritesOnly(savedFilters.favoritesOnly);
          if (typeof savedFilters.recentOnly === 'boolean') setRecentOnly(savedFilters.recentOnly);
          if (savedFilters.selectedProvider) setSelectedProvider(savedFilters.selectedProvider);
          if (savedFilters.selectedModel) setSelectedModel(savedFilters.selectedModel);
        }
      } catch (error) {
        console.warn('Failed to load filter state:', error);
      }
    };

    loadFilterState();
  }, []);

  // Debounce search query (300ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Persist filter state
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        await saveFilterState({
          selectedCategory,
          selectedTag,
          searchQuery,
          currentView,
          sortBy,
          sortOrder,
          favoritesOnly,
          recentOnly
        });
      } catch (error) {
        console.warn('Failed to save filter state:', error);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, selectedTag, searchQuery, currentView, sortBy, sortOrder, favoritesOnly, recentOnly]);
  
  // Persist provider/model selection
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        const existing = await getFilterState() || {
          selectedCategory: 'All',
          searchQuery: '',
          currentView: 'grid' as const,
          sortBy: 'createdAt' as const,
          sortOrder: 'desc' as const,
          favoritesOnly: false,
          recentOnly: false,
          selectedProvider: 'All',
          selectedModel: undefined
        };
        const merged: FilterState = {
          ...existing,
          selectedProvider,
          selectedModel
        };
        await saveFilterState(merged);
      } catch (error) {
        console.warn('Failed to save provider/model filter state:', error);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedProvider, selectedModel]);

  // Reset pagination when filters or sort change
  useEffect(() => {
    setGridPage(1);
    setListPage(1);
  }, [selectedCategory, selectedTag, debouncedSearchQuery, sortBy, sortOrder, favoritesOnly, recentOnly]);

  const filteredPrompts = useMemo(() => {
    const filtered = prompts.filter((p) => {
      // 1. Soft Delete Check
      if (selectedCategory === SPECIAL_CATEGORY_TRASH) {
        return p.deletedAt !== undefined;
      }
      if (p.deletedAt !== undefined) return false;

      // 2. Standard Filters
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchesProvider = (selectedProvider === 'All' || !selectedProvider) ? true : ((p.config && p.config.modelProvider === selectedProvider) || false);
      const matchesModel = !selectedModel || (p.config && (p.config.modelName === selectedModel || (p.config.model || '').includes(selectedModel)));
      const matchesTag = !selectedTag || p.tags.includes(selectedTag);
      const matchesFavorite = !favoritesOnly || p.isFavorite;
      const matchesRecent = !recentOnly || ((p.updatedAt ?? p.createdAt) >= (Date.now() - 30 * 24 * 60 * 60 * 1000));

      // Deep Search: Title, Desc, Tags, Content, SystemInstruction, Bilingual + knowledge fields
      const query = debouncedSearchQuery.toLowerCase();
      const matchesSearch =
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        (p.systemInstruction && p.systemInstruction.toLowerCase().includes(query)) ||
        (p.englishPrompt && p.englishPrompt.toLowerCase().includes(query)) ||
        (p.chinesePrompt && p.chinesePrompt.toLowerCase().includes(query)) ||
        (p.usageNotes && p.usageNotes.toLowerCase().includes(query)) ||
        (p.cautions && p.cautions.toLowerCase().includes(query)) ||
        (p.outputType && p.outputType.toLowerCase().includes(query)) ||
        (p.applicationScene && p.applicationScene.toLowerCase().includes(query)) ||
        (p.previewMediaUrl && p.previewMediaUrl.toLowerCase().includes(query)) ||
        (p.source && p.source.toLowerCase().includes(query)) ||
        (p.sourceAuthor && p.sourceAuthor.toLowerCase().includes(query)) ||
        (p.sourceUrl && p.sourceUrl.toLowerCase().includes(query)) ||
        p.tags.some((t) => t.toLowerCase().includes(query)) ||
        (p.technicalTags && p.technicalTags.some(t => t.toLowerCase().includes(query))) ||
        (p.styleTags && p.styleTags.some(t => t.toLowerCase().includes(query))) ||
        (p.customLabels && p.customLabels.some(t => t.toLowerCase().includes(query))) ||
        (p.recommendedModels && p.recommendedModels.some(m => m.toLowerCase().includes(query)));

      return matchesCategory && matchesTag && matchesSearch && matchesFavorite && matchesRecent && matchesProvider && matchesModel;
    });

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'createdAt':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [prompts, selectedCategory, selectedTag, debouncedSearchQuery, sortBy, sortOrder]);

  const pagedGridPrompts = useMemo(
    () => filteredPrompts.slice(0, gridPage * PAGE_SIZE),
    [filteredPrompts, gridPage]
  );

  const pagedListPrompts = useMemo(
    () => filteredPrompts.slice(0, listPage * PAGE_SIZE),
    [filteredPrompts, listPage]
  );

  return {
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
    gridPage,
    setGridPage,
    listPage,
    setListPage,
    filteredPrompts,
    pagedGridPrompts,
    pagedListPrompts,
    favoritesOnly,
    setFavoritesOnly,
    recentOnly,
    setRecentOnly
  };
};

