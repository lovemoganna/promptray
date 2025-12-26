import React, { useMemo } from 'react';
import { Prompt } from '../types';
import { Icons, getIconForCategory, getColorForCategory } from './Icons';

interface DashboardProps {
  prompts: Prompt[];
  onOpenPrompt: (prompt: Prompt) => void;
  onNavigateToCategory: (category: string) => void;
  onNavigateToTag: (tag: string) => void;
}

// Unified card styles for consistent spacing

const DashboardComponent: React.FC<DashboardProps> = ({
  prompts,
  onOpenPrompt,
  onNavigateToCategory,
  onNavigateToTag
}) => {
  const stats = useMemo(() => {
    const total = prompts.length;
    const favorites = prompts.filter(p => p.isFavorite).length;
    const modelCounts: Record<string, number> = {};
    const categoryDetails: Record<string, {
        count: number;
        favorites: number;
        withVariables: number;
        withExamples: number;
        totalTokens: number;
    }> = {};
    
    // Recent Items (Last 5 modified/created)
    // Sort by createdAt descending
    const recentPrompts = [...prompts]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);

    // Category Stats
    const categoryCounts: Record<string, number> = {};
    // Tag Stats
    const tagCounts: Record<string, number> = {};
    // Activity Stats (Last 7 days)
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const activityData = new Array(7).fill(0);
    
    let totalChars = 0;
    let totalSystemChars = 0;
    let totalExamples = 0;
    let promptsWithVariables = 0;
    let promptsWithSystem = 0;
    let promptsWithExamples = 0;
    let totalSavedRuns = 0;
    let totalHistoryVersions = 0;
    
    // Time-based stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisWeek = new Date(today.getTime() - 7 * oneDay);
    const thisMonth = new Date(today.getTime() - 30 * oneDay);
    
    let createdToday = 0;
    let createdThisWeek = 0;
    let createdThisMonth = 0;

    prompts.forEach(p => {
      // Model distribution
      const modelKey = p.config?.model || 'Unspecified';
      modelCounts[modelKey] = (modelCounts[modelKey] || 0) + 1;

      // Category deep dive
      if (!categoryDetails[p.category]) {
        categoryDetails[p.category] = {
          count: 0,
          favorites: 0,
          withVariables: 0,
          withExamples: 0,
          totalTokens: 0
        };
      }
      const catDetail = categoryDetails[p.category];
      catDetail.count += 1;
      if (p.isFavorite) catDetail.favorites += 1;

      // Rough token estimate for this prompt (4 chars per token)
      catDetail.totalTokens += Math.round(p.content.length / 4);

      // Categories
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      
      // Tags
      p.tags.forEach(t => {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      });

      // Token Estimation (Roughly 4 chars per token)
      totalChars += p.content.length;
      if (p.systemInstruction) {
        totalSystemChars += p.systemInstruction.length;
        promptsWithSystem++;
      }
      
      // Examples
      if (p.examples && p.examples.length > 0) {
        totalExamples += p.examples.length;
        promptsWithExamples++;
        catDetail.withExamples += 1;
      }
      
      // Variables detection
      const hasVariables = /\{[^{}]+\}/.test(p.content) || (p.systemInstruction && /\{[^{}]+\}/.test(p.systemInstruction));
      if (hasVariables) {
        promptsWithVariables++;
        catDetail.withVariables += 1;
      }
      
      // Saved runs
      if (p.savedRuns && p.savedRuns.length > 0) {
        totalSavedRuns += p.savedRuns.length;
      }
      
      // History versions
      if (p.history && p.history.length > 0) {
        totalHistoryVersions += p.history.length;
      }

      // Activity
      const daysAgo = Math.floor((now - p.createdAt) / oneDay);
      if (daysAgo >= 0 && daysAgo < 7) {
        activityData[6 - daysAgo]++; // 6 is today, 0 is 7 days ago
      }
      
      // Time-based creation stats
      const createdDate = new Date(p.createdAt);
      if (createdDate >= today) {
        createdToday++;
      }
      if (createdDate >= thisWeek) {
        createdThisWeek++;
      }
      if (createdDate >= thisMonth) {
        createdThisMonth++;
      }
    });

    const avgTokens = total > 0 ? Math.round((totalChars / 4) / total) : 0;
    const avgSystemTokens = promptsWithSystem > 0 ? Math.round((totalSystemChars / 4) / promptsWithSystem) : 0;
    const avgExamples = promptsWithExamples > 0 ? Math.round(totalExamples / promptsWithExamples) : 0;

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12);

    const categoryData = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([name, count]) => ({
            name,
            count,
            percentage: Math.round((count / total) * 100)
        }));

    const categoryBreakdown = Object.entries(categoryDetails)
        .map(([name, detail]) => ({
            name,
            count: detail.count,
            favorites: detail.favorites,
            withVariables: detail.withVariables,
            withExamples: detail.withExamples,
            avgTokens: detail.count ? Math.round(detail.totalTokens / detail.count) : 0
        }))
        .sort((a, b) => b.count - a.count);

    const modelMix = Object.entries(modelCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([name, count]) => ({
            name,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0
        }));

    return { 
      total, 
      favorites, 
      topTags, 
      categoryData, 
      categoryBreakdown,
      modelMix,
      activityData, 
      recentPrompts, 
      avgTokens,
      avgSystemTokens,
      avgExamples,
      promptsWithVariables,
      promptsWithSystem,
      promptsWithExamples,
      totalSavedRuns,
      totalHistoryVersions,
      createdToday,
      createdThisWeek,
      createdThisMonth,
      totalExamples,
      totalChars,
      totalSystemChars
    };
  }, [prompts]);

  const maxActivity = Math.max(...stats.activityData, 1);

  return (
    <div className="p-8 animate-slide-up-fade pb-20 overflow-y-auto h-full custom-scrollbar">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-900/40 border border-white/5 rounded-theme p-6 relative overflow-hidden group hover:border-brand-500/30 transition-all hover:shadow-lg hover:shadow-brand-500/10">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icons.All size={80} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/0 via-brand-500/0 to-brand-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-widest">
                        <Icons.Code size={14} /> Library
                    </div>
                    <div className="text-2xl font-mono font-bold text-white tracking-tighter">
                        {stats.total}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                        Total Prompts
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/40 border border-white/5 rounded-theme p-6 relative overflow-hidden group hover:border-yellow-500/30 transition-all hover:shadow-lg hover:shadow-yellow-500/10">
                 <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icons.Star size={80} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/0 via-yellow-500/0 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-widest">
                        <Icons.Star size={14} /> Favorites
                    </div>
                    <div className="text-2xl font-mono font-bold text-white tracking-tighter">
                        {stats.favorites}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                        Saved items
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/40 border border-white/5 rounded-theme p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all">
                 <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icons.Run size={80} />
                </div>
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-widest">
                        <Icons.Run size={14} /> Avg. Complexity
                    </div>
                    <div className="text-2xl font-mono font-bold text-white tracking-tighter">
                        ~{stats.avgTokens}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                        Tokens / Prompt
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/40 border border-white/5 rounded-theme p-6 relative overflow-hidden group hover:border-green-500/30 transition-all">
                 <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icons.Activity size={80} />
                </div>
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase tracking-widest">
                        <Icons.Activity size={14} /> Activity
                    </div>
                    <div className="h-[36px] flex items-end gap-1.5">
                        {stats.activityData.map((val, i) => (
                            <div key={i} className="flex-1 flex flex-col justify-end group/bar relative">
                                <div
                                    className="w-full bg-brand-500/20 rounded-t-sm hover:bg-brand-500/50 transition-all"
                                    style={{ height: `${(val / maxActivity) * 100}%`, minHeight: '4px' }}
                                ></div>
                            </div>
                        ))}
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                        Last 7 Days
                    </div>
                </div>
            </div>
        </div>

        {/* Enhanced Statistics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-900/40 border border-white/5 rounded-theme p-4 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">With Variables</div>
                        <div className="text-xl font-mono font-bold text-white">{stats.promptsWithVariables}</div>
                        <div className="text-[10px] text-gray-600">
                            {stats.total > 0 ? Math.round((stats.promptsWithVariables / stats.total) * 100) : 0}% of total
                        </div>
                    </div>
                    <Icons.Code size={24} className="text-purple-400/30" />
                </div>
            </div>

            <div className="bg-gray-900/40 border border-white/5 rounded-theme p-4 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">With System</div>
                        <div className="text-xl font-mono font-bold text-white">{stats.promptsWithSystem}</div>
                        <div className="text-[10px] text-gray-600">
                            Avg: ~{stats.avgSystemTokens} tokens
                        </div>
                    </div>
                    <Icons.System size={24} className="text-cyan-400/30" />
                </div>
            </div>

            <div className="bg-gray-900/40 border border-white/5 rounded-theme p-4 relative overflow-hidden group hover:border-pink-500/30 transition-all">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">With Examples</div>
                        <div className="text-xl font-mono font-bold text-white">{stats.promptsWithExamples}</div>
                        <div className="text-[10px] text-gray-600">
                            Avg: {stats.avgExamples.toFixed(1)} per prompt
                        </div>
                    </div>
                    <Icons.List size={24} className="text-pink-400/30" />
                </div>
            </div>

            <div className="bg-gray-900/40 border border-white/5 rounded-theme p-4 relative overflow-hidden group hover:border-green-500/30 transition-all">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Saved Runs</div>
                        <div className="text-xl font-mono font-bold text-white">{stats.totalSavedRuns}</div>
                        <div className="text-[10px] text-gray-600">
                            Test executions
                        </div>
                    </div>
                    <Icons.Run size={24} className="text-green-400/30" />
                </div>
            </div>
        </div>
        
        {/* Creation Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/40 border border-white/5 rounded-theme p-4 space-y-2">
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Icons.Activity size={12} /> Created Today
                </div>
                <div className="text-2xl font-mono font-bold text-white">{stats.createdToday}</div>
            </div>
            <div className="bg-gray-900/40 border border-white/5 rounded-theme p-4 space-y-2">
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Icons.Activity size={12} /> This Week
                </div>
                <div className="text-2xl font-mono font-bold text-white">{stats.createdThisWeek}</div>
            </div>
            <div className="bg-gray-900/40 border border-white/5 rounded-theme p-4 space-y-2">
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Icons.Activity size={12} /> This Month
                </div>
                <div className="text-2xl font-mono font-bold text-white">{stats.createdThisMonth}</div>
            </div>
        </div>

        {/* Granular Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-900/40 border border-white/5 rounded-theme p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                        <Icons.Analysis size={16} className="text-brand-500" /> Category Breakdown
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">Depth by usage</span>
                </div>
                <div className="divide-y divide-white/5 border border-white/5 rounded-theme overflow-hidden">
                    {stats.categoryBreakdown.length === 0 && (
                        <div className="p-4 text-center text-gray-500">No data yet</div>
                    )}
                    {stats.categoryBreakdown.map((cat) => (
                        <div key={cat.name} className="grid grid-cols-6 gap-3 p-3 items-center hover:bg-white/5 transition-colors">
                            <div className="col-span-2 flex items-center gap-2 text-sm font-medium text-gray-200">
                                <span className="px-2 py-1 rounded bg-white/5 text-gray-400 text-[11px] font-semibold uppercase tracking-wide">{cat.name}</span>
                            </div>
                            <div className="text-xs text-gray-400 text-center">
                                <div className="font-semibold text-white">{cat.count}</div>
                                <div className="text-[10px] text-gray-500">Total</div>
                            </div>
                            <div className="text-xs text-gray-400 text-center">
                                <div className="font-semibold text-amber-300">{cat.favorites}</div>
                                <div className="text-[10px] text-gray-500">Favorites</div>
                            </div>
                            <div className="text-xs text-gray-400 text-center">
                                <div className="font-semibold text-purple-300">{cat.withVariables}</div>
                                <div className="text-[10px] text-gray-500">Vars</div>
                            </div>
                            <div className="text-xs text-gray-400 text-center">
                                <div className="font-semibold text-pink-300">{cat.withExamples}</div>
                                <div className="text-[10px] text-gray-500">Examples</div>
                            </div>
                            <div className="text-xs text-gray-400 text-center">
                                <div className="font-semibold text-blue-300">~{cat.avgTokens}</div>
                                <div className="text-[10px] text-gray-500">Avg tokens</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-gray-900/40 border border-white/5 rounded-theme p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                        <Icons.System size={16} className="text-brand-500" /> Model Mix
                    </h3>
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">Coverage</span>
                </div>
                <div className="space-y-3">
                    {stats.modelMix.length === 0 && (
                        <div className="text-center text-gray-500 py-6">No model data yet</div>
                    )}
                    {stats.modelMix.map((model, i) => (
                        <div key={model.name} className="space-y-1">
                            <div className="flex items-center justify-between text-sm text-gray-300">
                                <span className="font-medium truncate max-w-[160px]" title={model.name}>{model.name}</span>
                                <span className="text-xs text-gray-500 font-mono">{model.count} · {model.percentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-brand-500 to-cyan-400 rounded-full transition-all duration-700"
                                    style={{ width: `${model.percentage}%`, animationDelay: `${i * 80}ms` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
             {/* Recent Activity List - Cleaned Up */}
             <div className="lg:col-span-2 bg-gray-900/40 border border-white/5 rounded-theme p-6 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-6">
                    <Icons.System size={16} className="text-brand-500" /> Recent Updates
                </h3>
                <div className="space-y-1">
                    {stats.recentPrompts.map((p) => {
                        const CategoryIcon = getIconForCategory(p.category);
                        const categoryColor = getColorForCategory(p.category);
                        return (
                            <button 
                                key={p.id}
                                onClick={() => onOpenPrompt(p)}
                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/5 transition-all group text-left"
                            >
                                <div className="flex items-center gap-4 overflow-hidden">
                                    <div className="min-w-0">
                                        <div className="font-medium text-gray-200 text-sm group-hover:text-white truncate">{p.title}</div>
                                        <div className="text-xs text-gray-500 font-mono truncate leading-relaxed">{p.description}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 pl-4 shrink-0">
                                    <div className="flex items-center gap-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
                                        <CategoryIcon size={12} className={categoryColor} />
                                        <span className="text-xs uppercase tracking-wider text-gray-500">{p.category}</span>
                                    </div>
                                    <Icons.Edit size={14} className="text-gray-600 group-hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                            </button>
                        );
                    })}
                    {stats.recentPrompts.length === 0 && (
                        <div className="text-center text-gray-500 py-10">No recent activity</div>
                    )}
                </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-gray-900/40 border border-white/5 rounded-theme p-6 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-6">
                    <Icons.Analysis size={16} className="text-brand-500" /> Distribution
                </h3>
                <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {stats.categoryData.map((cat, i) => (
                        <button 
                            key={cat.name} 
                            onClick={() => onNavigateToCategory(cat.name)}
                            className="w-full group text-left"
                        >
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="font-medium text-gray-300 group-hover:text-white transition-colors">{cat.name}</span>
                                <span className="font-mono text-gray-500 text-xs">{cat.count}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-brand-500 to-purple-600 rounded-full transition-all duration-1000 ease-out group-hover:brightness-125"
                                    style={{ width: `${cat.percentage}%`, animationDelay: `${i * 100}ms` }}
                                ></div>
                            </div>
                        </button>
                    ))}
                </div>
                
                <div className="mt-6 pt-6 border-t border-white/5">
                     <h3 className="text-xs font-semibold text-gray-500 flex items-center gap-2 mb-4 uppercase tracking-widest">
                        <Icons.Tag size={12} /> Top Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {stats.topTags.map(([tag, count]) => (
                            <button
                                key={tag}
                                type="button"
                                onClick={() => onNavigateToTag(tag)}
                                className="text-xs px-2 py-1 rounded bg-white/5 text-gray-400 border border-white/5 hover:bg-brand-500/20 hover:text-white hover:border-brand-500/60 transition-colors"
                            >
                                #{tag} <span className="text-gray-600 ml-1">{count}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export const Dashboard = React.memo(DashboardComponent);