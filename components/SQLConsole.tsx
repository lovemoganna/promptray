import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Highlight, themes } from 'prism-react-renderer';
import { Icons } from './Icons';
import { useDuckDBSync } from '../hooks/useDuckDBSync';
import { runGeminiPrompt } from '../services/geminiService';
import { FOUNDATION, LAYOUT, colors } from './ui/styleTokens';

// 历史与收藏Tab组件
const HistoryAndFavoritesTab: React.FC<{
  history: SQLHistoryItem[];
  favorites: FavoriteSQL[];
  onExecuteQuery: (sql: string) => void;
  onSwitchToWorkbench: () => void;
  onAddToFavorites: (sql: string, name?: string) => void;
  onUpdateFavoriteName: (id: string, name: string) => void;
  onDeleteFavorite: (id: string) => void;
}> = ({
  history,
  favorites,
  onExecuteQuery,
  onSwitchToWorkbench,
  onAddToFavorites,
  onUpdateFavoriteName,
  onDeleteFavorite
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'history' | 'favorites'>('history');

  const formatTimestamp = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  }, []);

  const formatExecutionTime = useCallback((ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }, []);

  const favoriteFromHistory = useCallback((historyItem: SQLHistoryItem) => {
    onAddToFavorites(historyItem.executedSQL, `来自历史: ${historyItem.executedSQL.substring(0, 30)}...`);
  }, [onAddToFavorites]);

  return (
    <div className="h-full flex flex-col">
      {/* Sub-tabs */}
      <div className="flex border-b border-white/5 bg-gray-900/30">
        <button
          onClick={() => setActiveSubTab('history')}
          className={`flex-1 py-4 px-6 text-sm font-medium transition-all duration-200 border-b-2 flex items-center justify-center gap-2 ${
            activeSubTab === 'history'
              ? 'text-white bg-brand-500/20 border-brand-500'
              : 'text-gray-400 hover:text-white border-transparent'
          }`}
        >
          <Icons.History size={16} />
          历史记录
        </button>
        <button
          onClick={() => setActiveSubTab('favorites')}
          className={`flex-1 py-4 px-6 text-sm font-medium transition-all duration-200 border-b-2 flex items-center justify-center gap-2 ${
            activeSubTab === 'favorites'
              ? 'text-white bg-brand-500/20 border-brand-500'
              : 'text-gray-400 hover:text-white border-transparent'
          }`}
        >
          <Icons.Star size={16} />
          我的收藏
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSubTab === 'history' ? (
          <div className="divide-y divide-white/5">
            {history.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icons.History size={32} className="text-gray-600" />
                </div>
                <div className="text-lg font-medium mb-3">暂无执行历史</div>
                <div className="text-sm text-gray-400 max-w-sm mx-auto">
                  执行 SQL 查询后，历史记录将显示在这里。您可以查看、重新执行或收藏之前的查询。
                </div>
              </div>
            ) : (
              history.map((item) => (
                <div key={item.id} className="p-6 hover:bg-white/5 transition-colors duration-200 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        item.success
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {item.inputType === 'natural' ? '💬 自然语言' : '📝 SQL'}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => {
                          onExecuteQuery(item.executedSQL);
                          onSwitchToWorkbench();
                        }}
                        className="text-gray-400 hover:text-white text-xs flex items-center gap-1 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-all duration-200"
                      >
                        <Icons.Play size={12} />
                        执行
                      </button>
                      <button
                        onClick={() => favoriteFromHistory(item)}
                        className="text-gray-400 hover:text-yellow-400 text-xs flex items-center gap-1 px-3 py-1.5 bg-gray-700/50 hover:bg-yellow-700/50 rounded-lg transition-all duration-200"
                      >
                        <Icons.Star size={12} />
                        收藏
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-300 mb-2 font-mono bg-gray-800/30 p-3 rounded-lg border border-white/5">
                    {item.executedSQL.length > 120 ? `${item.executedSQL.substring(0, 120)}...` : item.executedSQL}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {item.resultCount !== undefined && (
                      <span className="flex items-center gap-1">
                        <Icons.Database size={12} />
                        {item.resultCount} 行
                      </span>
                    )}
                    {item.executionTime && (
                      <span className="flex items-center gap-1">
                        <Icons.Database size={12} />
                        {formatExecutionTime(item.executionTime)}
                      </span>
                    )}
                    {item.success ? (
                      <span className="flex items-center gap-1 text-green-400">
                        <Icons.Check size={12} />
                        成功
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-400">
                        <Icons.Error size={12} />
                        失败
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <FavoritesSubTab
            favorites={favorites}
            onExecuteQuery={onExecuteQuery}
            onSwitchToWorkbench={onSwitchToWorkbench}
            onUpdateName={onUpdateFavoriteName}
            onDelete={onDeleteFavorite}
          />
        )}
      </div>
    </div>
  );
};

// 收藏子Tab组件
const FavoritesSubTab: React.FC<{
  favorites: FavoriteSQL[];
  onExecuteQuery: (sql: string) => void;
  onSwitchToWorkbench: () => void;
  onUpdateName: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}> = ({ favorites, onExecuteQuery, onSwitchToWorkbench, onUpdateName, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleEditName = useCallback((favorite: FavoriteSQL) => {
    setEditingId(favorite.id);
    setEditingName(favorite.name);
  }, []);

  const handleSaveName = useCallback(() => {
    if (editingId && editingName.trim()) {
      onUpdateName(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  }, [editingId, editingName, onUpdateName]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingName('');
  }, []);

  const formatTimestamp = useCallback((timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  }, []);

  return (
    <div className="divide-y divide-white/5">
      {favorites.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Icons.Star size={32} className="text-gray-600" />
          </div>
          <div className="text-lg font-medium mb-3">暂无收藏查询</div>
          <div className="text-sm text-gray-400 max-w-sm mx-auto">
            在 SQL 工作台中执行查询后，可以点击收藏按钮将常用的查询保存到这里。
          </div>
        </div>
      ) : (
        favorites.map((favorite) => (
          <div key={favorite.id} className="p-6 hover:bg-white/5 transition-colors duration-200 group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                {editingId === favorite.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="flex-1 px-3 py-1 text-sm bg-gray-700/50 border border-brand-500/50 rounded text-white focus:outline-none focus:border-brand-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="px-2 py-1 text-xs bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-sm font-medium text-white truncate">{favorite.name}</h4>
                    <button
                      onClick={() => handleEditName(favorite)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity"
                    >
                      <Icons.Edit size={14} />
                    </button>
                  </div>
                )}
                <div className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded inline-block">
                  {formatTimestamp(favorite.createdAt)}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    onExecuteQuery(favorite.sqlText);
                    onSwitchToWorkbench();
                  }}
                  className="text-gray-400 hover:text-white text-xs flex items-center gap-1 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-all duration-200"
                >
                  <Icons.Play size={12} />
                  执行
                </button>
                <button
                  onClick={() => onDelete(favorite.id)}
                  className="text-gray-400 hover:text-red-400 text-xs flex items-center gap-1 px-3 py-1.5 bg-gray-700/50 hover:bg-red-700/50 rounded-lg transition-all duration-200"
                >
                  <Icons.Trash size={12} />
                  删除
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-300 font-mono bg-gray-800/30 p-3 rounded-lg border border-white/5">
              {favorite.sqlText.length > 150 ? `${favorite.sqlText.substring(0, 150)}...` : favorite.sqlText}
            </div>
            {favorite.tags && favorite.tags.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                {favorite.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full border border-blue-500/30">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
};

// TAB类型
type TabType = 'analysis' | 'workbench' | 'history';

// 输入模式
type InputMode = 'natural' | 'sql';

// SQL 查询历史类型
interface SQLHistoryItem {
  id: string;
  inputType: InputMode;
  inputText: string;
  generatedSQL?: string;
  executedSQL: string;
  timestamp: number;
  executionTime?: number;
  resultCount?: number;
  success: boolean;
  error?: string;
}

// 查询结果类型
interface QueryResult {
  columns: string[];
  rows: any[][];
  executionTime: number;
  rowCount: number;
}

// 收藏的SQL类型
interface FavoriteSQL {
  id: string;
  name: string;
  sqlText: string;
  createdAt: number;
  tags?: string[];
}

interface SQLConsoleProps {
  className?: string;
  onClose?: () => void;
}

// SQL 语法高亮编辑器组件
const SQLHighlightEditor: React.FC<{
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  height?: string | number;
  resizable?: boolean;
}> = ({ value, onChange, onKeyDown, placeholder, disabled, className, height = '12rem', resizable = false }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={`relative ${className}`} style={{ height: heightStyle, minHeight: '8rem', maxHeight: '32rem' }}>
      {/* 语法高亮层 */}
      <pre
        ref={preRef}
        className="absolute inset-0 p-4 font-mono text-sm text-gray-200 pointer-events-none overflow-auto bg-transparent"
        style={{
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          height: '100%',
          resize: resizable ? 'vertical' : 'none'
        }}
      >
        <Highlight
          theme={themes.vsDark}
          code={value || placeholder || ''}
          language="sql"
        >
          {({ className: highlightClass, style, tokens, getLineProps, getTokenProps }) => (
            <code className={highlightClass} style={style}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span
                      key={key}
                      {...getTokenProps({ token })}
                      style={{
                        ...getTokenProps({ token }).style,
                        opacity: value ? 1 : 0.5,
                        fontFamily: 'inherit'
                      }}
                    />
                  ))}
                </div>
              ))}
            </code>
          )}
        </Highlight>
      </pre>

      {/* 输入层 */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={handleScroll}
        placeholder=""
        disabled={disabled}
        className={`relative inset-0 w-full h-full p-4 font-mono text-sm text-transparent bg-transparent border border-white/10 rounded-xl focus:outline-none focus:border-brand-500/60 focus:ring-1 focus:ring-brand-500/20 caret-white ${resizable ? 'resize-y' : 'resize-none'}`}
        style={{
          background: 'transparent',
          color: 'transparent',
          caretColor: 'white',
          zIndex: 1,
          minHeight: '8rem',
          maxHeight: '32rem'
        }}
      />

      {/* 占位符 */}
      {!value && placeholder && (
        <div className="absolute top-4 left-4 text-gray-500 pointer-events-none font-mono text-sm">
          {placeholder}
        </div>
      )}

      {/* Resize handle hint */}
      {resizable && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 opacity-50 pointer-events-none">
          ⇅
        </div>
      )}
    </div>
  );
};

// 数据分析会话类型
interface AnalysisSession {
  id: string;
  fileName: string;
  fileType: string;
  aiResponse: string;
  createdAt: number;
}

// 数据分析Tab组件
const DataAnalysisTab: React.FC<{
  onExecuteQuery: (sql: string) => void;
  onSwitchToWorkbench: () => void;
  onSaveAnalysisSession: (session: AnalysisSession) => void;
}> = ({ onExecuteQuery, onSwitchToWorkbench, onSaveAnalysisSession }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportedFormats = ['.csv', '.xlsx', '.xls', '.json', '.md', '.txt'];

  const handleFileSelect = useCallback((file: File) => {
    if (!supportedFormats.some(format => file.name.toLowerCase().endsWith(format))) {
      setError('不支持的文件格式。请上传 CSV、Excel、JSON 或 Markdown 文件。');
      return;
    }

    setUploadedFile(file);
    setError('');
    setAnalysisResult('');

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
  }, [supportedFormats]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const analyzeData = useCallback(async () => {
    if (!uploadedFile || !fileContent) return;

    setIsAnalyzing(true);
    setError('');
    setAnalysisResult('');

    try {
      const fileType = uploadedFile.name.split('.').pop()?.toLowerCase();

      const analysisPrompt = `
你是一位专业的数据分析师。请分析以下${fileType?.toUpperCase()}格式的数据文件内容，基于数据本身进行全面分析。

数据文件信息：
- 文件名: ${uploadedFile.name}
- 文件类型: ${fileType}
- 文件大小: ${(uploadedFile.size / 1024).toFixed(2)} KB

数据内容预览（前1000字符）：
${fileContent.substring(0, 1000)}${fileContent.length > 1000 ? '\n\n[数据内容较长，已截断显示]' : ''}

请按照MECE原则（相互独立，完全穷尽），从以下维度进行数据分析：

1. **数据结构分析**：描述数据的基本结构、字段类型、数据量级等
2. **数据质量评估**：检查数据完整性、异常值、重复记录等
3. **关键洞察发现**：识别数据中的重要模式、趋势或异常情况
4. **业务价值建议**：基于数据特征提出可能的分析方向

对于每个分析维度，请提供：
【维度名称】

解读：对关键数据特征进行分析，<总体结论>，反映<业务含义>，需关注<注意事项>

说明：<自然语言描述这个分析维度包含什么>

SQL建议：<具体的SQL查询语句，用于深入分析这个维度>

请确保SQL语句符合SQLite/DuckDB语法，并且能够实际执行。
`;

      const result = await runGeminiPrompt(analysisPrompt, {
        model: 'gemini-2.5-flash',
        temperature: 0.3,
        maxOutputTokens: 4000
      });

      setAnalysisResult(result);

      // 保存分析会话
      const session: AnalysisSession = {
        id: `analysis_${Date.now()}`,
        fileName: uploadedFile.name,
        fileType: fileType || 'unknown',
        aiResponse: result,
        createdAt: Date.now()
      };
      onSaveAnalysisSession(session);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '分析过程中发生错误';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [uploadedFile, fileContent, onSaveAnalysisSession]);

  const executeSQLFromAnalysis = useCallback((sql: string) => {
    onExecuteQuery(sql);
    onSwitchToWorkbench();
  }, [onExecuteQuery, onSwitchToWorkbench]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Icons.Analysis size={20} className="text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">数据分析</h3>
            <p className="text-sm text-gray-400">上传文件，AI 自动生成分析报告和 SQL</p>
          </div>
        </div>

        {/* File Upload Area */}
        <div
          className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-brand-500/50 transition-colors duration-200 cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={supportedFormats.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="w-16 h-16 bg-brand-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icons.Upload size={24} className="text-brand-400" />
          </div>
          <div className="text-white font-medium mb-2">
            {uploadedFile ? `已选择: ${uploadedFile.name}` : '拖拽文件到此处或点击上传'}
          </div>
          <div className="text-sm text-gray-400 mb-4">
            支持 CSV、Excel、JSON、Markdown 等格式
          </div>
          {!uploadedFile && (
            <button className="px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-medium transition-colors duration-200">
              选择文件
            </button>
          )}
        </div>

        {/* Supported Formats */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {['CSV', 'Excel', 'JSON', 'Markdown'].map(format => (
            <span key={format} className="px-3 py-1 bg-gray-800/50 text-gray-300 text-xs rounded-full border border-white/10">
              {format}
            </span>
          ))}
        </div>

        {/* Analyze Button */}
        {uploadedFile && fileContent && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={analyzeData}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-8 py-3 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Icons.Loader size={16} className="animate-spin" />
                  AI 分析中...
                </>
              ) : (
                <>
                  <Icons.Analysis size={16} />
                  开始 AI 分析
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-6 mb-0">
            <div className="p-6 bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Icons.Error size={16} className="text-red-400" />
                </div>
                <span className="text-red-400 font-semibold text-lg">分析失败</span>
              </div>
              <div className="text-red-300 text-sm font-mono bg-red-900/10 p-4 rounded-lg border border-red-500/20">
                {error}
              </div>
            </div>
          </div>
        )}

        {analysisResult && (
          <div className="p-6">
            <AnalysisResultDisplay
              result={analysisResult}
              onExecuteSQL={executeSQLFromAnalysis}
            />
          </div>
        )}

        {!uploadedFile && !error && (
          <div className="p-6 text-center">
            <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icons.Analysis size={32} className="text-gray-600" />
            </div>
            <div className="text-gray-400 text-lg font-medium mb-3">AI 数据分析功能</div>
            <div className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
              上传数据文件后，AI 将自动分析数据结构，生成专业的分析报告，并提供相应的 SQL 查询语句，帮助您快速理解和查询数据。
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 分析结果展示组件
const AnalysisResultDisplay: React.FC<{
  result: string;
  onExecuteSQL: (sql: string) => void;
}> = ({ result, onExecuteSQL }) => {
  const extractSQLBlocks = useCallback((text: string) => {
    const sqlBlocks: { title: string; sql: string }[] = [];
    const lines = text.split('\n');

    let currentTitle = '';
    let currentSQL = '';
    let inSQLBlock = false;

    for (const line of lines) {
      if (line.startsWith('【') && line.includes('】')) {
        if (currentTitle && currentSQL.trim()) {
          sqlBlocks.push({ title: currentTitle, sql: currentSQL.trim() });
        }
        currentTitle = line;
        currentSQL = '';
        inSQLBlock = false;
      } else if (line.toLowerCase().includes('sql') && line.includes(':')) {
        inSQLBlock = true;
      } else if (inSQLBlock && (line.trim().startsWith('SELECT') || line.trim().startsWith('INSERT') || line.trim().startsWith('UPDATE') || line.trim().startsWith('DELETE'))) {
        currentSQL += line + '\n';
      } else if (inSQLBlock && line.trim() === '') {
        // 空行可能表示SQL块结束
        continue;
      } else if (inSQLBlock && currentSQL) {
        currentSQL += line + '\n';
      }
    }

    if (currentTitle && currentSQL.trim()) {
      sqlBlocks.push({ title: currentTitle, sql: currentSQL.trim() });
    }

    return sqlBlocks;
  }, []);

  const sqlBlocks = extractSQLBlocks(result);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
          <Icons.Check size={16} className="text-green-400" />
        </div>
        <span className="text-green-400 font-semibold text-lg">分析完成</span>
      </div>

      {/* 分析报告文本 */}
      <div className="bg-gray-800/30 border border-white/10 rounded-lg p-6">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
          {result}
        </pre>
      </div>

      {/* SQL 执行按钮组 */}
      {sqlBlocks.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <Icons.Code size={20} className="text-brand-400" />
            可执行的 SQL 查询
          </h4>
          {sqlBlocks.map((block, index) => (
            <div key={index} className="bg-gray-800/50 border border-white/10 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-200">{block.title}</h5>
                <button
                  onClick={() => onExecuteSQL(block.sql)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-sm rounded-lg transition-all duration-200 hover:shadow-lg"
                >
                  <Icons.Play size={14} />
                  执行查询
                </button>
              </div>
              <pre className="text-xs text-gray-400 bg-gray-900/50 p-3 rounded border border-white/5 font-mono overflow-x-auto">
                {block.sql}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 增强型数据表格组件
const EnhancedDataTable: React.FC<{
  columns: string[];
  rows: any[][];
  onExecuteSQL: (sql: string) => void;
}> = ({ columns, rows, onExecuteSQL }) => {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState<Record<number, string>>({});
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  // 排序和筛选数据
  const processedData = useMemo(() => {
    let data = rows.map((row: any[], index: number) => ({ row, originalIndex: index }));

    // 应用筛选
    Object.entries(filters).forEach(([colIndex, filterValue]) => {
      if (filterValue.trim()) {
        const col = parseInt(colIndex);
        data = data.filter(({ row }) => {
          const cellValue = String(row[col] || '').toLowerCase();
          return cellValue.includes(filterValue.toLowerCase());
        });
      }
    });

    // 应用排序
    if (sortColumn !== null) {
      data.sort((a, b) => {
        const aVal = a.row[sortColumn];
        const bVal = b.row[sortColumn];

        let comparison = 0;
        if (aVal === null || aVal === undefined) comparison = -1;
        else if (bVal === null || bVal === undefined) comparison = 1;
        else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return data;
  }, [rows, sortColumn, sortDirection, filters]);

  const handleSort = useCallback((columnIndex: number) => {
    if (sortColumn === columnIndex) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnIndex);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  const handleFilterChange = useCallback((columnIndex: number, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnIndex]: value
    }));
  }, []);

  const handleCellEdit = useCallback((rowIndex: number, colIndex: number, value: any) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    setEditValue(String(value || ''));
  }, []);

  const handleCellSave = useCallback(() => {
    if (!editingCell) return;

    // 这里可以生成UPDATE SQL语句
    const { row: rowIndex, col: colIndex } = editingCell;
    const originalRow = processedData[rowIndex];
    const columnName = columns[colIndex];
    const newValue = editValue;

    // 生成UPDATE语句（这里只是示例，实际需要根据主键来构造）
    const updateSQL = `UPDATE prompts SET ${columnName} = '${newValue}' WHERE id = '${originalRow.row[columns.indexOf('id')]}';`;

    onExecuteSQL(updateSQL);
    setEditingCell(null);
    setEditValue('');
  }, [editingCell, processedData, columns, editValue, onExecuteSQL]);

  const handleCellCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  const handleDeleteRow = useCallback((rowIndex: number) => {
    const originalRow = processedData[rowIndex];
    const idValue = originalRow.row[columns.indexOf('id')];

    if (idValue) {
      const deleteSQL = `DELETE FROM prompts WHERE id = '${idValue}';`;
      onExecuteSQL(deleteSQL);
    }
  }, [processedData, columns, onExecuteSQL]);

  const exportToCSV = useCallback(() => {
    const csvContent = [
      columns.join(','),
      ...processedData.map(({ row }) => row.map(cell => {
        if (cell === null || cell === undefined) return '';
        const str = String(cell);
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'query_results.csv';
    link.click();
  }, [columns, processedData]);

  const exportToJSON = useCallback(() => {
    const jsonData = processedData.map(({ row }) => {
      const obj: any = {};
      columns.forEach((col, index) => {
        obj[col] = row[index];
      });
      return obj;
    });

    const jsonContent = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'query_results.json';
    link.click();
  }, [columns, processedData]);

  return (
    <div className="p-4 space-y-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span>显示 {processedData.length} / {rows.length} 行</span>
          {Object.keys(filters).length > 0 && (
            <button
              onClick={() => setFilters({})}
              className="text-brand-400 hover:text-brand-300 text-xs"
            >
              清除筛选
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white text-sm rounded-lg transition-all duration-200"
          >
            <Icons.Download size={14} />
            CSV
          </button>
          <button
            onClick={exportToJSON}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white text-sm rounded-lg transition-all duration-200"
          >
            <Icons.Download size={14} />
            JSON
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-auto max-h-96">
          <table className="w-full text-sm">
            <thead className="bg-gray-800/50 sticky top-0">
              <tr>
                {columns.map((column, index) => (
                  <th key={index} className="px-4 py-3 text-left border-r border-white/10 last:border-r-0">
                    <div className="flex flex-col gap-2">
                      {/* Column Header with Sort */}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-300 font-semibold">{column}</span>
                        <button
                          onClick={() => handleSort(index)}
                          className={`text-gray-500 hover:text-white transition-colors ${
                            sortColumn === index ? 'text-brand-400' : ''
                          }`}
                        >
                          {sortColumn === index ? (
                            sortDirection === 'asc' ?
                              <Icons.ArrowUp size={14} /> :
                              <Icons.ArrowDown size={14} />
                          ) : (
                            <Icons.ArrowUp size={14} className="opacity-50" />
                          )}
                        </button>
                      </div>

                      {/* Filter Input */}
                      <input
                        type="text"
                        placeholder="筛选..."
                        value={filters[index] || ''}
                        onChange={(e) => handleFilterChange(index, e.target.value)}
                        className="w-full px-2 py-1 text-xs bg-gray-900/50 border border-white/10 rounded text-gray-300 placeholder-gray-500 focus:outline-none focus:border-brand-500/50"
                      />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-gray-300 font-semibold border-l border-white/10">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {processedData.map(({ row }: { row: any[] }, rowIndex: number) => (
                <tr key={rowIndex} className="border-b border-white/5 hover:bg-white/5 transition-colors duration-150">
                    {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 text-gray-200 border-r border-white/5 last:border-r-0 max-w-xs"
                    >
                      {editingCell?.row === rowIndex && editingCell?.col === cellIndex ? (
                        <input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellSave();
                            if (e.key === 'Escape') handleCellCancel();
                          }}
                          onBlur={handleCellSave}
                          className="w-full px-2 py-1 text-sm bg-gray-700 border border-brand-500/50 rounded text-white focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <div
                          className="cursor-pointer hover:bg-gray-700/50 rounded px-1 py-0.5 -mx-1 -my-0.5 transition-colors"
                          onClick={() => handleCellEdit(rowIndex, cellIndex, cell)}
                          title="点击编辑"
                        >
                          {cell === null || cell === undefined ? (
                            <span className="text-gray-500 italic text-xs bg-gray-700/50 px-2 py-1 rounded">NULL</span>
                          ) : typeof cell === 'boolean' ? (
                            <span className={`text-xs px-2 py-1 rounded font-medium ${
                              cell ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {cell ? 'TRUE' : 'FALSE'}
                            </span>
                          ) : (
                            <span className={`${
                              typeof cell === 'number' ? 'text-blue-300 font-mono' :
                              typeof cell === 'string' && cell.length > 50 ? 'truncate block' : ''
                            }`}>
                              {String(cell)}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center border-l border-white/10">
                    <button
                      onClick={() => handleDeleteRow(rowIndex)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded px-2 py-1 transition-colors"
                      title="删除行"
                    >
                      <Icons.Trash size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const SQLConsole: React.FC<SQLConsoleProps> = ({
  className = '',
  onClose
}) => {
  const {
    executeSQL,
    isInitialized,
    syncState,
    initializeSQLTables,
    saveSQLHistory,
    saveSQLFavorite,
    deleteSQLFavorite,
    updateSQLFavoriteName,
    saveAnalysisSession,
    loadSQLHistory,
    loadSQLFavorites,
    createPrompt,
    updatePrompt,
    deletePromptById
  } = useDuckDBSync();

  // TAB状态
  const [activeTab, setActiveTab] = useState<TabType>('workbench');

  // SQL工作台状态
  const [query, setQuery] = useState('');
  const [inputMode] = useState<InputMode>('sql');
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<SQLHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteSQL[]>([]);

  // 编辑器配置状态
  const [editorHeight] = useState<number>(192); // 默认12rem (192px)

  // 初始化和数据加载
  useEffect(() => {
    if (isInitialized) {
      // 初始化SQL表
      initializeSQLTables();

      // 加载历史数据
      const loadData = async () => {
        try {
          const historyData = await loadSQLHistory();
          const favoritesData = await loadSQLFavorites();

          // 转换数据格式
          const formattedHistory: SQLHistoryItem[] = historyData.map(item => ({
            id: item.id,
            inputType: item.inputType as InputMode,
            inputText: item.inputText,
            generatedSQL: item.generatedSQL,
            executedSQL: item.executedSQL,
            timestamp: item.timestamp,
            executionTime: item.executionTime,
            resultCount: item.resultCount,
            success: item.success === 1,
            error: item.error
          }));

          const formattedFavorites: FavoriteSQL[] = favoritesData.map(item => ({
            id: item.id,
            name: item.name,
            sqlText: item.sqlText,
            createdAt: item.createdAt,
            tags: item.tags ? JSON.parse(item.tags) : undefined
          }));

          setHistory(formattedHistory);
          setFavorites(formattedFavorites);
        } catch (error) {
          console.error('Failed to load SQL console data:', error);
        }
      };

      loadData();
    }
  }, [isInitialized, initializeSQLTables, loadSQLHistory, loadSQLFavorites]);

  // 执行查询
  const executeQuery = useCallback(async () => {
    if (!query.trim() || isExecuting) return;

    setIsExecuting(true);
    setError(null);
    setResult(null);

    const startTime = Date.now();
    try {
      const sqlResult = await executeSQL(query.trim());
      const executionTime = Date.now() - startTime;

      // 检查结果是否为空
      if (!sqlResult || sqlResult.length === 0) {
        setResult({
          columns: ['message'],
          rows: [['查询成功，返回 0 条记录']],
          executionTime,
          rowCount: 0
        });

        // 添加到历史记录
        const historyItem: SQLHistoryItem = {
          id: `query_${Date.now()}`,
          inputType: inputMode,
          inputText: query.trim(),
          executedSQL: query.trim(),
          timestamp: Date.now(),
          executionTime,
          resultCount: 0,
          success: true
        };

        setHistory(prev => [historyItem, ...prev.slice(0, 49)]);
        saveSQLHistory(historyItem);
      } else {
        const processedResult: QueryResult = {
          columns: sqlResult.length > 0 ? Object.keys(sqlResult[0]) : [],
          rows: sqlResult.map(row => Object.values(row)),
          executionTime,
          rowCount: sqlResult.length
        };

        setResult(processedResult);

        // 添加到历史记录
        const historyItem: SQLHistoryItem = {
          id: `query_${Date.now()}`,
          inputType: inputMode,
          inputText: query.trim(),
          executedSQL: query.trim(),
          timestamp: Date.now(),
          executionTime,
          resultCount: sqlResult.length,
          success: true
        };

        setHistory(prev => [historyItem, ...prev.slice(0, 49)]);
        saveSQLHistory(historyItem);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '执行失败';
      setError(errorMessage);

      // 添加失败的查询到历史记录
      const historyItem: SQLHistoryItem = {
        id: `query_${Date.now()}`,
        inputType: inputMode,
        inputText: query.trim(),
        executedSQL: query.trim(),
        timestamp: Date.now(),
        executionTime: Date.now() - startTime,
        resultCount: 0,
        success: false,
        error: errorMessage
      };

      setHistory(prev => [historyItem, ...prev.slice(0, 49)]);
      saveSQLHistory(historyItem);
    } finally {
      setIsExecuting(false);
    }
  }, [query, inputMode, isExecuting, executeSQL, saveSQLHistory]);

  // 清空结果
  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  // 格式化时间
  const formatExecutionTime = useCallback((ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }, []);


  // 添加到收藏
  const addToFavorites = useCallback((sql: string, name?: string) => {
    const favorite: FavoriteSQL = {
      id: `fav_${Date.now()}`,
      name: name || `收藏查询 ${favorites.length + 1}`,
      sqlText: sql,
      createdAt: Date.now(),
      tags: []
    };
    setFavorites(prev => [favorite, ...prev]);
    saveSQLFavorite(favorite);
  }, [favorites.length, saveSQLFavorite]);



  // 键盘事件处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      executeQuery();
    }
  }, [executeQuery]);

  // Early return for initialization
  if (!isInitialized) {
    return (
      <div className={`bg-gray-900/98 border border-white/10 rounded-3xl shadow-2xl overflow-hidden ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Icons.Database size={48} className="text-gray-600 mx-auto mb-4" />
            <div className="text-gray-400">正在初始化 DuckDB...</div>
            {syncState.error && (
              <div className="text-red-400 text-sm mt-2">{syncState.error}</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full ${colors.bg.cardDarker} ${colors.border.light} ${FOUNDATION.borderRadius['2xl']} ${LAYOUT.elevation.max} overflow-hidden flex flex-col ${className}`}>
      {/* Header - Compact spacing */}
      <div className="relative bg-gradient-to-br from-brand-500/10 via-purple-500/5 to-blue-500/10 border-b border-white/10 flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        <div className="relative flex items-center justify-between p-3 sm:p-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-brand-500/20 to-purple-500/20 rounded-xl flex items-center justify-center border border-brand-500/30 flex-shrink-0">
              <Icons.Database size={18} className="sm:w-5 sm:h-5 text-brand-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate">DuckDB 数据控制台</h1>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">数据分析 • SQL 工作台 • 执行历史</p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 transform hover:scale-105 touch-manipulation ml-2 flex-shrink-0"
            >
              <Icons.Close size={20} />
            </button>
          )}
        </div>
      </div>

      {/* TAB Navigation - Using design tokens */}
      <div className={`${colors.bg.surface} ${colors.border.lighter} border-b flex-shrink-0`}>
        <div className="flex">
          {[
            { id: 'analysis' as TabType, label: '💬 数据分析', icon: Icons.Analysis },
            { id: 'workbench' as TabType, label: '📝 SQL 工作台', icon: Icons.Code },
            { id: 'history' as TabType, label: '📁 历史 & 收藏', icon: Icons.History }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'text-white bg-brand-500/20 border-brand-500 shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area - Optimized for space utilization */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === 'workbench' && (
          <div className="h-full flex flex-col">
            {/* SQL Editor - Compact layout */}
            <div className="p-4 border-b border-white/5 flex-shrink-0">
              <div className="space-y-4">
                {/* 标题区域 */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Icons.Code size={20} className="text-brand-400" />
                    SQL 编辑器
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-800/50 px-2 py-1 rounded">Ctrl+Enter 执行</span>
                    <span className="bg-gray-800/50 px-2 py-1 rounded hidden sm:inline">Ctrl+/ 格式化</span>
                    <span className="bg-gray-800/50 px-2 py-1 rounded hidden md:inline">⇅ 可调节高度</span>
                  </div>
                </div>

                {/* SQL 语法高亮编辑器 - Resizable height */}
                <SQLHighlightEditor
                  value={query}
                  onChange={setQuery}
                  onKeyDown={handleKeyDown}
                  placeholder="输入 DuckDB SQL 查询..."
                  disabled={isExecuting}
                  className="w-full"
                  height={editorHeight}
                  resizable={true}
                />

                {/* Action Buttons - Mobile responsive */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <button
                      onClick={clearResult}
                      className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 ${colors.bg.muted} hover:${colors.bg.surface} ${colors.text.secondary} hover:${colors.text.primary} text-sm ${FOUNDATION.borderRadius.lg} ${colors.border.light} hover:${colors.border.primary} transition-all duration-200 min-h-[44px] touch-manipulation`}
                    >
                      <Icons.Trash size={14} />
                      <span className="hidden xs:inline">清空结果</span>
                    </button>
                    <button
                      onClick={() => {
                        // 简单的SQL格式化
                        const formatted = query
                          .replace(/\s+/g, ' ')
                          .replace(/\s*([(),;])\s*/g, '$1 ')
                          .replace(/\s*(\bSELECT|FROM|WHERE|ORDER BY|GROUP BY|LIMIT|INSERT|UPDATE|DELETE|INTO|VALUES|SET)\b\s*/gi, '\n$1 ')
                          .trim();
                        setQuery(formatted);
                      }}
                      disabled={!query.trim()}
                      className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-purple-700/80 hover:bg-purple-600/80 disabled:bg-gray-700/50 disabled:text-gray-500 text-purple-300 hover:text-white disabled:cursor-not-allowed text-sm rounded-lg border border-purple-500/30 hover:border-purple-400/50 disabled:border-gray-600/30 transition-all duration-200 min-h-[44px] touch-manipulation"
                    >
                      <Icons.Code size={14} />
                      <span className="hidden xs:inline">格式化</span>
                    </button>
                    <button
                      onClick={() => addToFavorites(query)}
                      disabled={!query.trim()}
                      className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-yellow-700/80 hover:bg-yellow-600/80 disabled:bg-gray-700/50 disabled:text-gray-500 text-yellow-300 hover:text-white disabled:cursor-not-allowed text-sm rounded-lg border border-yellow-500/30 hover:border-yellow-400/50 disabled:border-gray-600/30 transition-all duration-200 min-h-[44px] touch-manipulation"
                    >
                      <Icons.Star size={14} />
                      <span className="hidden xs:inline">收藏</span>
                    </button>
                  </div>

                  {/* 执行按钮 */}
                  <button
                    onClick={executeQuery}
                    disabled={!query.trim() || isExecuting}
                    className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-gray-700/50 disabled:text-gray-500 text-white disabled:cursor-not-allowed text-sm font-medium rounded-lg border border-brand-500/50 hover:border-brand-400/70 disabled:border-gray-600/30 transition-all duration-200 shadow-sm hover:shadow-md min-h-[44px] touch-manipulation w-full sm:w-auto"
                  >
                    {isExecuting ? (
                      <>
                        <Icons.Loader size={14} className="animate-spin" />
                        执行中...
                      </>
                    ) : (
                      <>
                        <Icons.Play size={14} />
                        执行查询
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Area - Optimized for space utilization */}
            <div className="flex-1 overflow-hidden min-h-0">
              {error && (
                <div className="mx-4 mt-4 mb-0">
                  <div className="p-4 bg-red-900/20 border-l-4 border-red-500 rounded-r-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                        <Icons.Error size={16} className="text-red-400" />
                      </div>
                      <span className="text-red-400 font-semibold text-lg">执行失败</span>
                    </div>
                    <div className="text-red-300 text-sm font-mono bg-red-900/10 p-4 rounded-lg border border-red-500/20 ml-11">
                      {error}
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div className="h-full flex flex-col">
                  {/* Results Header - Compact and efficient */}
                  <div className="flex items-center justify-between p-3 bg-gray-800/50 border-b border-white/5">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-green-400">
                        <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
                          <Icons.Check size={14} />
                        </div>
                        <span className="font-medium">执行成功</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        {result.columns.length > 0 ? (
                          <>
                            <span className="bg-gray-700/50 px-2 py-1 rounded">
                              {result.rowCount} 行 × {result.columns.length} 列
                            </span>
                            <span className="bg-gray-700/50 px-2 py-1 rounded">
                              {formatExecutionTime(result.executionTime)}
                            </span>
                          </>
                        ) : (
                          <span className="bg-gray-700/50 px-2 py-1 rounded">
                            {formatExecutionTime(result.executionTime)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.columns.length > 0 && (
                        <>
                          <button
                            onClick={() => navigator.clipboard.writeText(JSON.stringify(result.rows, null, 2))}
                            className="text-gray-400 hover:text-white text-sm flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-all duration-200"
                          >
                            <Icons.Copy size={14} />
                            复制结果
                          </button>
                          <button
                            onClick={() => {
                              const csv = [result.columns.join(','), ...result.rows.map(row => row.join(','))].join('\n');
                              navigator.clipboard.writeText(csv);
                            }}
                            className="text-gray-400 hover:text-white text-sm flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition-all duration-200"
                          >
                            <Icons.Download size={14} />
                            CSV
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Enhanced Results Table */}
                  <div className="flex-1 overflow-auto">
                    {result.columns.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icons.Check size={32} className="text-green-400" />
                        </div>
                        <div className="text-gray-300 font-medium text-lg mb-2">
                          {result.rowCount === 0 ? '查询成功，返回 0 条记录' : `执行成功，影响 ${result.rowCount} 行`}
                        </div>
                        <div className="text-gray-500 text-sm">
                          执行时间: {formatExecutionTime(result.executionTime)}
                        </div>
                      </div>
                    ) : (
                      <EnhancedDataTable
                        columns={result.columns}
                        rows={result.rows}
                        onExecuteSQL={executeQuery}
                      />
                    )}
                  </div>
                </div>
              )}

              {!result && !error && (
                <div className="p-6">
                  {/* SQL 查询模板 - MECE 原则组织 */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Icons.Code size={20} className="text-brand-400" />
                      SQL 查询模板
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {/* 基础查询 */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          <Icons.Database size={16} />
                          基础查询
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={() => setQuery('SELECT COUNT(*) as total FROM prompts WHERE deletedAt IS NULL;')}
                            className="text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 group"
                          >
                            <div className="text-sm font-medium text-gray-200 group-hover:text-white">统计总数</div>
                            <div className="text-xs text-gray-500 mt-1">COUNT(*)</div>
                          </button>
                          <button
                            onClick={() => setQuery('SELECT * FROM prompts WHERE deletedAt IS NULL LIMIT 5;')}
                            className="text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 group"
                          >
                            <div className="text-sm font-medium text-gray-200 group-hover:text-white">查看前5条</div>
                            <div className="text-xs text-gray-500 mt-1">LIMIT 5</div>
                          </button>
                          <button
                            onClick={() => setQuery('SELECT DISTINCT category FROM prompts WHERE deletedAt IS NULL;')}
                            className="text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 group"
                          >
                            <div className="text-sm font-medium text-gray-200 group-hover:text-white">所有分类</div>
                            <div className="text-xs text-gray-500 mt-1">DISTINCT category</div>
                          </button>
                        </div>
                      </div>

                      {/* 条件查询 */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          <Icons.Search size={16} />
                          条件查询
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={() => setQuery('SELECT * FROM prompts WHERE category = \'Code\' AND deletedAt IS NULL;')}
                            className="text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 group"
                          >
                            <div className="text-sm font-medium text-gray-200 group-hover:text-white">Code分类</div>
                            <div className="text-xs text-gray-500 mt-1">WHERE category = \'Code\'</div>
                          </button>
                          <button
                            onClick={() => setQuery('SELECT * FROM prompts WHERE isFavorite = 1 AND deletedAt IS NULL;')}
                            className="text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 group"
                          >
                            <div className="text-sm font-medium text-gray-200 group-hover:text-white">收藏夹</div>
                            <div className="text-xs text-gray-500 mt-1">WHERE isFavorite = 1</div>
                          </button>
                          <button
                            onClick={() => setQuery('SELECT * FROM prompts WHERE tags LIKE \'%AI%\' AND deletedAt IS NULL;')}
                            className="text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 group"
                          >
                            <div className="text-sm font-medium text-gray-200 group-hover:text-white">AI相关</div>
                            <div className="text-xs text-gray-500 mt-1">WHERE tags LIKE \'%AI%\'</div>
                          </button>
                        </div>
                      </div>

                      {/* 高级查询 */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          <Icons.Analysis size={16} />
                          高级查询
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={() => setQuery('SELECT category, COUNT(*) as count FROM prompts WHERE deletedAt IS NULL GROUP BY category ORDER BY count DESC;')}
                            className="text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 group"
                          >
                            <div className="text-sm font-medium text-gray-200 group-hover:text-white">分类统计</div>
                            <div className="text-xs text-gray-500 mt-1">GROUP BY + ORDER BY</div>
                          </button>
                          <button
                            onClick={() => setQuery('SELECT * FROM prompts WHERE deletedAt IS NULL ORDER BY createdAt DESC LIMIT 10;')}
                            className="text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 group"
                          >
                            <div className="text-sm font-medium text-gray-200 group-hover:text-white">最新创建</div>
                            <div className="text-xs text-gray-500 mt-1">ORDER BY createdAt DESC</div>
                          </button>
                          <button
                            onClick={() => setQuery('SELECT * FROM prompts WHERE deletedAt IS NULL ORDER BY LENGTH(content) DESC LIMIT 5;')}
                            className="text-left p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-white/10 hover:border-white/20 rounded-lg transition-all duration-200 group"
                          >
                            <div className="text-sm font-medium text-gray-200 group-hover:text-white">最长内容</div>
                            <div className="text-xs text-gray-500 mt-1">ORDER BY LENGTH()</div>
                          </button>
                        </div>
                      </div>

                      {/* 直接 CRUD 操作 */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                          <Icons.Edit size={16} />
                          直接 CRUD 操作
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                          <button
                            onClick={async () => {
                              try {
                                const newPrompt = {
                                  id: `demo_${Date.now()}`,
                                  title: 'SQL控制台创建的示例提示词',
                                  content: '这是一个通过SQL控制台直接创建的提示词示例。',
                                  description: '通过SQL控制台CRUD操作创建的演示提示词',
                                  category: 'Demo',
                                  tags: ['SQL控制台', '演示'],
                                  isFavorite: false,
                                  createdAt: Date.now(),
                                  updatedAt: Date.now()
                                };
                                await createPrompt(newPrompt);
                                // 显示成功消息
                                setResult({
                                  columns: ['message'],
                                  rows: [['提示词创建成功！']],
                                  executionTime: 0,
                                  rowCount: 1
                                });
                                setError(null);
                              } catch (err) {
                                setError(`创建失败: ${err instanceof Error ? err.message : '未知错误'}`);
                              }
                            }}
                            className="text-left p-3 bg-green-900/20 hover:bg-green-800/30 border border-green-500/30 hover:border-green-400/50 rounded-lg transition-all duration-200 group"
                          >
                            <div className="text-sm font-medium text-green-200 group-hover:text-white">创建示例提示词</div>
                            <div className="text-xs text-green-400/70 mt-1">直接插入数据</div>
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                // 获取第一个提示词进行演示更新
                                const response = await executeSQL('SELECT * FROM prompts WHERE deletedAt IS NULL LIMIT 1');
                                if (response.length > 0) {
                                  const prompt = response[0];
                                  await updatePrompt({
                                    ...prompt,
                                    title: prompt.title + ' (已更新)',
                                    updatedAt: Date.now()
                                  });
                                  setResult({
                                    columns: ['message'],
                                    rows: [['提示词更新成功！']],
                                    executionTime: 0,
                                    rowCount: 1
                                  });
                                  setError(null);
                                } else {
                                  setError('没有可更新的提示词');
                                }
                              } catch (err) {
                                setError(`更新失败: ${err instanceof Error ? err.message : '未知错误'}`);
                              }
                            }}
                            className="text-left p-3 bg-blue-900/20 hover:bg-blue-800/30 border border-blue-500/30 hover:border-blue-400/50 rounded-lg transition-all duration-200 group"
                          >
                            <div className="text-sm font-medium text-blue-200 group-hover:text-white">更新第一个提示词</div>
                            <div className="text-xs text-blue-400/70 mt-1">直接修改数据</div>
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                // 获取最后一个提示词进行演示删除
                                const response = await executeSQL('SELECT id FROM prompts WHERE deletedAt IS NULL ORDER BY createdAt DESC LIMIT 1');
                                if (response.length > 0) {
                                  const promptId = response[0].id;
                                  await deletePromptById(promptId);
                                  setResult({
                                    columns: ['message'],
                                    rows: [['提示词删除成功！']],
                                    executionTime: 0,
                                    rowCount: 1
                                  });
                                  setError(null);
                                } else {
                                  setError('没有可删除的提示词');
                                }
                              } catch (err) {
                                setError(`删除失败: ${err instanceof Error ? err.message : '未知错误'}`);
                              }
                            }}
                            className="text-left p-3 bg-red-900/20 hover:bg-red-800/30 border border-red-500/30 hover:border-red-400/50 rounded-lg transition-all duration-200 group"
                          >
                            <div className="text-sm font-medium text-red-200 group-hover:text-white">删除最新提示词</div>
                            <div className="text-xs text-red-400/70 mt-1">直接删除数据</div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 空状态提示 */}
                  <div className="text-center text-gray-500">
                    <Icons.Database size={48} className="text-gray-600 mx-auto mb-4" />
                    <div className="text-lg font-medium mb-2">开始查询</div>
                    <div className="text-sm">选择上方模板或直接输入 SQL 查询</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <DataAnalysisTab
            onExecuteQuery={setQuery}
            onSwitchToWorkbench={() => setActiveTab('workbench')}
            onSaveAnalysisSession={saveAnalysisSession}
          />
        )}

        {activeTab === 'history' && (
          <HistoryAndFavoritesTab
            history={history}
            favorites={favorites}
            onExecuteQuery={setQuery}
            onSwitchToWorkbench={() => setActiveTab('workbench')}
            onAddToFavorites={addToFavorites}
            onUpdateFavoriteName={async (id, name) => {
              // 更新收藏名称
              setFavorites(prev => prev.map(f => f.id === id ? { ...f, name } : f));
              await updateSQLFavoriteName(id, name);
            }}
            onDeleteFavorite={async (id) => {
              // 删除收藏
              setFavorites(prev => prev.filter(f => f.id !== id));
              await deleteSQLFavorite(id);
            }}
          />
        )}
      </div>
    </div>
  );
};