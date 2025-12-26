import { useEffect, useMemo, useState } from 'react';
import { Prompt } from '../types';
import {
  getPrompts,
  savePrompts,
  getCustomCategories,
  saveCustomCategories
} from '../services/storageService';
import { STANDARD_CATEGORIES, SPECIAL_CATEGORY_TRASH } from '../constants';

export const usePromptData = () => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [loadedPrompts, loadedCategories] = await Promise.all([
          getPrompts(),
          getCustomCategories()
        ]);
        setPrompts(loadedPrompts);
        setCustomCategories(loadedCategories);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadData();
  }, []);

  // Persist prompts with debounce to avoid excessive writes
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        await savePrompts(prompts);
      } catch (error) {
        console.warn('Failed to save prompts:', error);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [prompts]);

  // Persist custom categories with debounce
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        await saveCustomCategories(customCategories);
      } catch (error) {
        console.warn('Failed to save custom categories:', error);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [customCategories]);

  const activePrompts = useMemo(
    () => prompts.filter(p => !p.deletedAt),
    [prompts]
  );

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    activePrompts.forEach(p => p.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [activePrompts]);

  const topTags = useMemo(() => {
    const counts: Record<string, number> = {};
    activePrompts.forEach(p => p.tags.forEach(t => (counts[t] = (counts[t] || 0) + 1)));
    return Object.entries(counts).sort(([, a], [, b]) => b - a);
  }, [activePrompts]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const all = [...STANDARD_CATEGORIES, ...customCategories, SPECIAL_CATEGORY_TRASH];
    all.forEach(c => (counts[c] = 0));
    counts['All'] = 0;

    prompts.forEach(p => {
      if (p.deletedAt) {
        counts[SPECIAL_CATEGORY_TRASH] += 1;
      } else {
        counts[p.category] = (counts[p.category] || 0) + 1;
        counts['All'] += 1;
      }
    });
    return counts;
  }, [prompts, customCategories]);

  return {
    prompts,
    setPrompts,
    customCategories,
    setCustomCategories,
    activePrompts,
    allTags,
    topTags,
    categoryCounts
  };
};


