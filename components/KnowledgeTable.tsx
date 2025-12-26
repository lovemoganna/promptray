import React from 'react';
import { Prompt } from '../types';
import { Icons } from './Icons';
import { colors, interactions } from './ui/styleTokens';

interface KnowledgeTableProps {
  prompts: Prompt[];
  onOpenPrompt: (prompt: Prompt) => void;
}

const KnowledgeTableComponent: React.FC<KnowledgeTableProps> = ({ prompts, onOpenPrompt }) => {
  if (prompts.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 ${colors.text.muted} animate-slide-up-fade`}>
        <div className={`w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 transition-all hover:bg-white/10 hover:scale-105 cursor-pointer group`}>
          <Icons.Table size={24} className="opacity-40 group-hover:opacity-60 transition-opacity" />
        </div>
        <p className={`text-lg font-medium ${colors.text.muted} mb-2`}>No prompts in knowledge table yet</p>
        <p className={`text-sm ${colors.text.muted} opacity-70`}>Start by creating your first prompt</p>
      </div>
    );
  }

  const formatDate = (ts?: number) =>
    ts ? new Date(ts).toLocaleDateString() : '-';

  return (
    <div className="w-full pb-20 animate-slide-up-fade">
      {/* 桌面端表格视图 */}
      <div className="hidden md:block overflow-x-auto rounded-theme border border-white/5 bg-gray-900/40 backdrop-blur-sm">
        <table className="w-full text-left border-collapse text-xs md:text-sm" role="table" aria-label="Prompt knowledge table">
          <thead>
            <tr className={`border-b border-white/5 bg-white/5 text-[10px] uppercase font-bold ${colors.text.muted} tracking-wider`}>
              <th scope="col" className="px-2 md:px-4 py-3 min-w-[140px] md:min-w-[180px]">Title</th>
              <th scope="col" className="px-2 md:px-4 py-3 min-w-[160px] md:min-w-[220px] hidden sm:table-cell">English Prompt</th>
              <th scope="col" className="px-2 md:px-4 py-3 min-w-[160px] md:min-w-[220px] hidden md:table-cell">中文提示词</th>
              <th scope="col" className="px-2 md:px-4 py-3 min-w-[60px] md:min-w-[80px]">Output</th>
              <th scope="col" className="px-2 md:px-4 py-3 min-w-[100px] md:min-w-[120px] hidden md:table-cell">应用场景</th>
              <th scope="col" className="px-2 md:px-4 py-3 min-w-[100px] md:min-w-[140px] hidden lg:table-cell">模型</th>
              <th scope="col" className="px-2 md:px-4 py-3 min-w-[120px] md:min-w-[140px] hidden xl:table-cell">技术标签</th>
              <th scope="col" className="px-2 md:px-4 py-3 min-w-[120px] md:min-w-[140px] hidden xl:table-cell">风格标签</th>
              <th scope="col" className="px-2 md:px-4 py-3 min-w-[120px] md:min-w-[140px] hidden lg:table-cell" title="收藏时间">Collected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {prompts.map((p) => (
              <tr
                key={p.id}
                onClick={() => onOpenPrompt(p)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenPrompt(p);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open prompt: ${p.title}`}
                className={`group ${interactions.hover} cursor-pointer transition-all duration-200 hover:scale-[1.002] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:bg-white/5`}
              >
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col gap-1 max-w-xs">
                    <span className={`font-medium ${colors.text.primary} truncate`}>{p.title}</span>
                    <span className={`text-[10px] ${colors.text.muted} font-mono truncate`}>
                      {p.category} · {p.status || 'active'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className={`text-[11px] ${colors.text.secondary} font-mono line-clamp-3 whitespace-pre-wrap`}>
                    {p.englishPrompt || p.content}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className={`text-[11px] ${colors.text.secondary} line-clamp-3 whitespace-pre-wrap`}>
                    {p.chinesePrompt || '-'}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <span className={`inline-flex items-center gap-1 text-[11px] ${colors.text.secondary}`}>
                    {p.outputType ? p.outputType.toUpperCase() : '-'}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <span className={`inline-flex items-center gap-1 text-[11px] ${colors.text.secondary}`}>
                    {p.applicationScene || '-'}
                  </span>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className={`flex flex-col gap-0.5 text-[11px] ${colors.text.secondary}`}>
                    {(p.recommendedModels || []).slice(0, 2).map((m) => (
                      <span key={m} className="truncate">
                        {m}
                      </span>
                    ))}
                    {p.recommendedModels && p.recommendedModels.length > 2 && (
                      <span className={`text-[10px] ${colors.text.muted}`}>
                        +{p.recommendedModels.length - 2} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-top hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {(p.technicalTags || []).slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className={`px-1.5 py-0.5 rounded-full bg-white/5 text-[10px] ${colors.text.secondary}`}
                      >
                        {t}
                      </span>
                    ))}
                    {p.technicalTags && p.technicalTags.length > 3 && (
                      <span className={`text-[10px] ${colors.text.muted}`}>
                        +{p.technicalTags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-top hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                    {(p.styleTags || []).slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className={`px-1.5 py-0.5 rounded-full bg-white/5 text-[10px] ${colors.text.secondary}`}
                      >
                        {t}
                      </span>
                    ))}
                    {p.styleTags && p.styleTags.length > 3 && (
                      <span className={`text-[10px] ${colors.text.muted}`}>
                        +{p.styleTags.length - 3}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className={`flex flex-col gap-0.5 text-[10px] ${colors.text.muted} font-mono`}>
                    <span>Collected: {formatDate(p.collectedAt)}</span>
                    <span>Updated: {formatDate(p.updatedAt || p.createdAt)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 移动端卡片视图 */}
      <div className="md:hidden space-y-3">
        {prompts.map((p) => (
          <div
            key={p.id}
            onClick={() => onOpenPrompt(p)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenPrompt(p);
              }
            }}
            tabIndex={0}
            role="button"
            aria-label={`Open prompt: ${p.title}`}
            className={`rounded-theme border border-white/5 ${colors.bg.card} backdrop-blur-sm p-4 cursor-pointer ${interactions.hover} transition-all duration-200 hover:scale-[1.01] hover:shadow-md active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-brand-500/50`}
          >
            <div className="space-y-3">
              {/* 标题和状态 */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className={`font-medium ${colors.text.primary} truncate text-sm`}>{p.title}</h3>
                  <span className={`text-[10px] ${colors.text.muted} font-mono`}>
                    {p.category} · {p.status || 'active'}
                  </span>
                </div>
                <div className={`text-[11px] ${colors.text.secondary} font-medium px-2 py-1 rounded bg-white/5`}>
                  {p.outputType ? p.outputType.toUpperCase() : '-'}
                </div>
              </div>

              {/* 英文提示词 - 折叠显示 */}
              <div className="space-y-1">
                <div className={`text-[11px] ${colors.text.secondary} font-mono line-clamp-2 leading-relaxed`}>
                  {p.englishPrompt || p.content}
                </div>
              </div>

              {/* 应用场景和模型 */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className={`text-[11px] ${colors.text.secondary}`}>
                  {p.applicationScene || '-'}
                </span>
                <div className="flex items-center gap-1">
                  {(p.recommendedModels || []).slice(0, 2).map((m) => (
                    <span key={m} className={`px-1.5 py-0.5 rounded bg-white/5 text-[10px] ${colors.text.secondary} truncate max-w-[60px]`}>
                      {m}
                    </span>
                  ))}
                  {p.recommendedModels && p.recommendedModels.length > 2 && (
                    <span className={`text-[10px] ${colors.text.muted}`}>
                      +{p.recommendedModels.length - 2}
                    </span>
                  )}
                </div>
              </div>

              {/* 标签 */}
              {(p.technicalTags?.length || p.styleTags?.length) && (
                <div className="flex flex-wrap gap-1">
                  {(p.technicalTags || []).slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className={`px-1.5 py-0.5 rounded bg-white/5 text-[10px] ${colors.text.secondary}`}
                    >
                      {t}
                    </span>
                  ))}
                  {(p.styleTags || []).slice(0, 2).map((t) => (
                    <span
                      key={t}
                      className={`px-1.5 py-0.5 rounded bg-purple-500/10 text-[10px] ${colors.text.secondary}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* 时间信息 */}
              <div className={`text-[10px] ${colors.text.muted} font-mono pt-2 border-t border-white/5`}>
                <div>Collected: {formatDate(p.collectedAt)}</div>
                <div>Updated: {formatDate(p.updatedAt || p.createdAt)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const KnowledgeTable = React.memo(KnowledgeTableComponent);


