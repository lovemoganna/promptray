import React from 'react';
import Markdown from 'react-markdown';
import { PromptConfig, SavedRun } from '../../types';
import { Icons } from '../Icons';
import { CodeBlock } from '../CodeBlock';

interface PromptTestTabProps {
  config: PromptConfig | undefined;
  detectedVariables: string[];
  variableValues: Record<string, string>;
  testResult: string | null;
  isTesting: boolean;
  isFilling: boolean;
  sortedRuns: SavedRun[];
  onConfigChange: (key: keyof PromptConfig, value: any) => void;
  onVariableChange: (name: string, value: string) => void;
  onMagicFill: () => void;
  onRun: () => void;
  onSaveRun: (name?: string, description?: string, isCheckpoint?: boolean) => void;
  onLoadRun: (run: SavedRun) => void;
  onRateRun: (runId: string, rating: 'good' | 'bad') => void;
  onDeleteRun: (runId: string) => void;
  onResumeFromCheckpoint?: (run: SavedRun) => void;
}

export const PromptTestTab: React.FC<PromptTestTabProps> = ({
  config,
  detectedVariables,
  variableValues,
  testResult,
  isTesting,
  isFilling,
  sortedRuns,
  onConfigChange,
  onVariableChange,
  onMagicFill,
  onRun,
  onSaveRun,
  onLoadRun,
  onRateRun,
  onDeleteRun,
  onResumeFromCheckpoint,
}) => {
  const [showSaveDialog, setShowSaveDialog] = React.useState(false);
  const [saveName, setSaveName] = React.useState('');
  const [saveDescription, setSaveDescription] = React.useState('');
  const [saveAsCheckpoint, setSaveAsCheckpoint] = React.useState(false);
  return (
    <div className="space-y-6 w-full animate-slide-up-fade">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Variables & Settings */}
        <div className="md:col-span-1 space-y-6">
          {/* Enhanced Parameters Box */}
          <div className="bg-gray-900/50 border border-white/10 rounded-theme p-5 space-y-5 backdrop-blur-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Icons.Activity size={16} className="text-brand-400" /> Model Config
            </h3>

            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium">Model</label>
              <select
                value={config?.model}
                onChange={(e) => onConfigChange('model', e.target.value)}
                className="w-full bg-gray-950/80 border border-white/15 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20 transition-all hover:border-white/20 backdrop-blur-sm cursor-pointer"
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Legacy)</option>
                <option value="gemini-3-pro-preview">Gemini 3 Pro</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2.5">
                <span className="text-gray-400">Temperature</span>
                <span className="font-mono text-brand-400 font-bold">{config?.temperature}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config?.temperature}
                onChange={(e) => onConfigChange('temperature', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2.5">
                <span className="text-gray-400">Max Tokens</span>
                <span className="font-mono text-brand-400 font-bold">{config?.maxOutputTokens}</span>
              </div>
              <input
                type="range"
                min="100"
                max="32768"
                step="100"
                value={config?.maxOutputTokens}
                onChange={(e) => onConfigChange('maxOutputTokens', parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2.5">
                <span className="text-gray-400">Top P</span>
                <span className="font-mono text-brand-400 font-bold">{config?.topP}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={config?.topP}
                onChange={(e) => onConfigChange('topP', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>
          </div>

          {/* Enhanced Variables Box */}
          {detectedVariables.length > 0 && (
            <div className="space-y-3 bg-gray-900/50 border border-white/10 rounded-theme p-5 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Icons.Code size={16} className="text-purple-400" /> Variables
                </h3>
                <button
                  onClick={onMagicFill}
                  disabled={isFilling}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-purple-500/15 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-500/30 hover:bg-purple-500/25 hover:border-purple-500/40 disabled:opacity-50 transition-all duration-200 transform hover:scale-105 active:scale-95"
                  title="Generate sample values with AI"
                >
                  {isFilling ? <span className="animate-pulse">...</span> : <><Icons.Magic size={12} /> Auto-Fill</>}
                </button>
              </div>
              {detectedVariables.map((v) => (
                <div key={v} className="flex flex-col gap-2">
                  <label className="text-xs text-brand-400 font-mono font-bold">{`{${v}}`}</label>
                  <textarea
                    value={variableValues[v] || ''}
                    onChange={(e) => onVariableChange(v, e.target.value)}
                    placeholder={`Enter value for ${v}...`}
                    className="bg-gray-950/80 border border-white/15 rounded-lg px-3 py-2 text-sm text-white_font-mono focus:border-brand-500/50 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all shadow-inner min-h-[80px] resize-y hover:border-white/20 backdrop-blur-sm"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Col: Output & History */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-gray-900/60 border border-white/15 rounded-theme p-1 flex justify-center items-center min-h-[360px] max-h-[480px] relative backdrop-blur-sm">
            {!testResult && !isTesting && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/8 rounded-full flex items-center justify-center mx-auto text-gray-400 border border-white/10">
                  <Icons.Run size={24} />
                </div>
                <p className="text-gray-400 text-sm font-medium">Ready to generate content.</p>
                <div className="text-xs text-gray-600">
                  {sortedRuns.length > 0 && (
                    <span className="flex items-center justify-center gap-1.5">
                      <Icons.List size={12} /> Using {sortedRuns.length} saved runs history
                    </span>
                  )}
                </div>
                <button
                  onClick={onRun}
                  className="px-8 py-3 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-lg transition-all duration-200 shadow-lg shadow-brand-500/30 transform hover:scale-105 active:scale-95"
                >
                  Generate
                </button>
              </div>
            )}

            {isTesting && !testResult && (
              <div className="text-center space-y-4 animate-pulse">
                <div className="w-16 h-16 bg-brand-500/15 rounded-full flex items-center justify-center mx-auto text-brand-400 border-2 border-brand-500/30">
                  <Icons.Sparkles size={24} />
                </div>
                <p className="text-brand-400 text-sm font-mono font-medium">Connecting to Gemini...</p>
              </div>
            )}

            {(testResult || (isTesting && testResult)) && (
              <div className="absolute inset-0 flex flex-col rounded-theme overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gray-900/70 backdrop-blur-sm">
                  <span className="text-xs font-bold text-gray-300 uppercase flex items-center gap-2">
                    Output {isTesting && <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />}
                  </span>
                  <div className="flex gap-2">
                    {!isTesting && (
                      <>
                        <button
                          onClick={() => setShowSaveDialog(true)}
                          className="text-xs flex items-center gap-1.5 bg-brand-500/15 hover:bg-brand-500/25 text-brand-400 px-3 py-1.5 rounded-lg border border-brand-500/30 hover:border-brand-500/40 transition-all duration-200 transform hover:scale-105 active:scale-95"
                          title="Save test case with name and description"
                        >
                          <Icons.Check size={12} /> Save As...
                        </button>
                        <button
                          onClick={() => onSaveRun()}
                          className="text-xs flex items-center gap-1.5 bg-gray-500/15 hover:bg-gray-500/25 text-gray-400 px-3 py-1.5 rounded-lg border border-gray-500/30 hover:border-gray-500/40 transition-all duration-200 transform hover:scale-105 active:scale-95"
                          title="Quick save (auto-named)"
                        >
                          <Icons.Check size={12} /> Quick Save
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => navigator.clipboard.writeText(testResult || '')}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all_duration-200 transform hover:scale-110 active:scale-95"
                      title="Copy output"
                    >
                      <Icons.Copy size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar text-gray-200 text-sm leading-relaxed markdown-body bg-gray-950/50">
                  <Markdown
                    components={{
                      code(props) {
                        const { children, className, ...rest } = props as any;
                        const match = /language-(\w+)/.exec(className || '');
                        if (match) {
                          return (
                            <CodeBlock
                              language={match[1]}
                              code={String(children).replace(/\n$/, '')}
                            />
                          );
                        }
                        return (
                          <code className={className || ''} {...rest}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {testResult || ''}
                  </Markdown>
                </div>
              </div>
            )}
          </div>

          {testResult && !isTesting && (
            <div className="flex justify-end">
              <button
                onClick={onRun}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-brand-500/10 transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <Icons.Run size={12} /> Regenerate
              </button>
            </div>
          )}

          {/* Enhanced Saved Runs List */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Icons.History size={16} className="text-brand-400" /> Saved Runs ({sortedRuns.length})
            </h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
              {sortedRuns.length === 0 && (
                <p className="text-xs text-gray-600 italic text-center py-4">
                  No runs saved yet.
                </p>
              )}
              {sortedRuns.map((run) => (
                <div
                  key={run.id}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 group cursor-pointer hover:scale-[1.02] ${run.rating === 'good'
                      ? 'bg-green-500/8 border-green-500/25 hover:bg-green-500/12'
                      : 'bg-gray-900/50 border-white/10 hover:bg-white/5 hover:border-white/15'
                    }`}
                >
                  <div
                    className="flex-1 flex flex-col gap-1"
                    onClick={() => onLoadRun(run)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {run.name && (
                        <span className="text-xs font-semibold text-gray-200">
                          {run.name}
                        </span>
                      )}
                      <span
                        className={`text-xs font-mono font-medium ${run.rating === 'good'
                            ? 'text-green-400'
                            : run.rating === 'bad'
                              ? 'text-red-400 line-through opacity-70'
                              : 'text-gray-300'
                          }`}
                      >
                        {new Date(run.timestamp).toLocaleString()}
                      </span>
                      <span className="text-[10px] text-gray-500 border border-white/10 px-1.5 py-0.5 rounded bg-white/5">
                        {run.model.split('-').slice(-1)[0]}
                      </span>
                      {run.isCheckpoint && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          断点
                        </span>
                      )}
                    </div>
                    {run.description && (
                      <div className="text-[10px] text-gray-500 italic">
                        {run.description}
                      </div>
                    )}
                    <div className="text-[10px] text-gray-500 truncate max-w-[200px]">
                      {run.output.slice(0, 60)}...
                    </div>
                  </div>

                  {/* Enhanced Action Buttons */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => onRateRun(run.id, 'good')}
                      className={`p-1.5 rounded-lg hover:bg-green-500/15 transition-all duration-200 transform hover:scale-110 active:scale-95 ${run.rating === 'good'
                          ? 'text-green-400'
                          : 'text-gray-500 hover:text-green-400'
                        }`}
                      title="Mark as Good"
                    >
                      <Icons.ThumbsUp size={12} />
                    </button>
                    <button
                      onClick={() => onRateRun(run.id, 'bad')}
                      className={`p-1.5 rounded-lg hover:bg-red-500/15 transition-all duration-200 transform hover:scale-110 active:scale-95 ${run.rating === 'bad'
                          ? 'text-red-400'
                          : 'text-gray-500 hover:text-red-400'
                        }`}
                      title="Mark as Bad"
                    >
                      <Icons.ThumbsDown size={12} />
                    </button>
                    {onResumeFromCheckpoint && (run.isCheckpoint || run.partialOutput) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onResumeFromCheckpoint(run);
                        }}
                        className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/15 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                        title="Resume from checkpoint"
                      >
                        <Icons.Run size={12} />
                      </button>
                    )}
                    <div className="w-[1px] h-4 bg-white/10 mx-1" />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteRun(run.id);
                      }}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
                      title="Delete"
                    >
                      <Icons.Close size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="bg-gray-900 border border-white/20 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-white mb-4">Save Test Case</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Name</label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="Test Case Name"
                  className="w-full bg-gray-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Description (Optional)</label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="What does this test case verify?"
                  className="w-full bg-gray-950 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500/50 resize-y min-h-[80px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="checkpoint"
                  checked={saveAsCheckpoint}
                  onChange={(e) => setSaveAsCheckpoint(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-gray-950 text-purple-500 focus:ring-purple-500"
                />
                <label htmlFor="checkpoint" className="text-xs text-gray-400">
                  Save as checkpoint (for resume)
                </label>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowSaveDialog(false);
                    setSaveName('');
                    setSaveDescription('');
                    setSaveAsCheckpoint(false);
                  }}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onSaveRun(saveName || undefined, saveDescription || undefined, saveAsCheckpoint);
                    setShowSaveDialog(false);
                    setSaveName('');
                    setSaveDescription('');
                    setSaveAsCheckpoint(false);
                  }}
                  className="px-4 py-2 text-sm bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


