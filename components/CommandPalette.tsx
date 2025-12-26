import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Icons } from './Icons';
import { Theme } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  themes: Theme[];
  onSelectTheme: (id: string) => void;
  onNavigate: (view: 'grid' | 'dashboard', category?: string) => void;
  onAction: (action: 'create' | 'import' | 'export' | 'storage-migration') => void;
}

type CommandGroup = 'Navigation' | 'Actions' | 'Themes';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  group: CommandGroup;
  shortcut?: string[];
  action: () => void;
}

const CommandPaletteComponent: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  themes,
  onSelectTheme,
  onNavigate,
  onAction
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Define all available commands
  const commands: CommandItem[] = useMemo(() => [
    // Navigation
    { 
      id: 'nav-dashboard', 
      label: 'Go to Dashboard', 
      icon: <Icons.Dashboard size={14} />, 
      group: 'Navigation', 
      action: () => onNavigate('dashboard') 
    },
    { 
      id: 'nav-all', 
      label: 'Go to All Prompts', 
      icon: <Icons.All size={14} />, 
      group: 'Navigation', 
      action: () => onNavigate('grid', 'All') 
    },
    { 
      id: 'nav-code', 
      label: 'Go to Code', 
      icon: <Icons.Code size={14} />, 
      group: 'Navigation', 
      action: () => onNavigate('grid', 'Code') 
    },
    { 
      id: 'nav-writing', 
      label: 'Go to Writing', 
      icon: <Icons.Writing size={14} />, 
      group: 'Navigation', 
      action: () => onNavigate('grid', 'Writing') 
    },
    
    // Actions
    { 
      id: 'act-create', 
      label: 'Create New Prompt', 
      icon: <Icons.Plus size={14} />, 
      group: 'Actions',
      shortcut: ['C'], 
      action: () => onAction('create') 
    },
    { 
      id: 'act-import', 
      label: 'Import JSON', 
      icon: <Icons.Upload size={14} />, 
      group: 'Actions', 
      action: () => onAction('import') 
    },
    {
      id: 'act-export',
      label: 'Export Library',
      icon: <Icons.Download size={14} />,
      group: 'Actions',
      action: () => onAction('export')
    },
    {
      id: 'act-storage-migration',
      label: 'Storage Migration',
      icon: <Icons.Settings size={14} />,
      group: 'Actions',
      action: () => onAction('storage-migration')
    },

    // Themes
    ...themes.map(t => ({
      id: `theme-${t.id}`,
      label: `Theme: ${t.label}`,
      icon: <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.colors.brand }}></div>,
      group: 'Themes' as CommandGroup,
      action: () => onSelectTheme(t.id)
    }))
  ], [themes, onNavigate, onAction, onSelectTheme]);

  // Filter commands
  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerQuery) || 
      cmd.group.toLowerCase().includes(lowerQuery)
    );
  }, [query, commands]);

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  // Auto-scroll to selected item
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
      ></div>

      {/* Palette */}
      <div className="w-full max-w-xl bg-[#0c0c0e] border border-white/10 rounded-xl shadow-2xl overflow-hidden relative z-10 animate-slide-up-fade ring-1 ring-white/5 flex flex-col max-h-[60vh]">
        {/* Input */}
        <div className="flex items-center px-4 py-4 border-b border-white/5 gap-3">
          <Icons.Search className="text-gray-500 w-5 h-5" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg font-medium"
            placeholder="Type a command or search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            spellCheck={false}
          />
          <div className="flex gap-1">
             <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-500 font-mono">
                <span className="text-xs">↑</span>
                <span className="text-xs">↓</span>
                to navigate
             </kbd>
             <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-gray-500 font-mono">
                esc
             </kbd>
          </div>
        </div>

        {/* List */}
        <div 
            ref={listRef}
            className="flex-1 overflow-y-auto custom-scrollbar p-2 scroll-smooth"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p className="text-sm">No commands found.</p>
            </div>
          ) : (
            filteredCommands.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm transition-colors duration-100 group ${
                    isSelected 
                      ? 'bg-brand-500 text-white shadow-md' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1 rounded ${isSelected ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                        {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {item.shortcut && (
                        <div className="flex gap-1">
                            {item.shortcut.map(key => (
                                <span key={key} className={`text-[10px] px-1.5 py-0.5 rounded border font-mono ${
                                    isSelected 
                                    ? 'bg-white/20 border-white/20 text-white' 
                                    : 'bg-white/5 border-white/10 text-gray-500'
                                }`}>
                                    {key}
                                </span>
                            ))}
                        </div>
                    )}
                    {item.group === 'Themes' && isSelected && (
                        <span className="text-[10px] uppercase opacity-80 font-bold tracking-wider">Switch</span>
                    )}
                    {item.group !== 'Themes' && !item.shortcut && (
                        <span className={`text-[10px] uppercase tracking-wider ${isSelected ? 'opacity-70' : 'text-gray-600'}`}>
                            {item.group}
                        </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
        
        {/* Footer Hint */}
        {filteredCommands.length > 0 && (
             <div className="px-4 py-2 bg-gray-900/50 border-t border-white/5 text-[10px] text-gray-500 flex justify-between">
                <span>PromptRay Command Menu</span>
                <span>{filteredCommands.length} results</span>
             </div>
        )}
      </div>
    </div>
  );
};

export const CommandPalette = React.memo(CommandPaletteComponent);