import React, { useState, useRef, useEffect } from 'react';

interface Props {
  value: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string) => void;
  clearable?: boolean;
  recent?: string[];
  className?: string;
}

const SearchableSelect: React.FC<Props> = ({ value, options, placeholder, onChange, clearable, recent = [], className }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  useEffect(() => {
    setQuery('');
  }, [open]);

  const filtered = options.filter(o => o.toLowerCase().includes((query || value || '').toLowerCase()));

  const handleSelect = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <div className="flex items-center gap-2">
        <input
          value={query || value}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="bg-gray-950/70 rounded px-2 py-1 text-xs text-white w-48"
        />
        {clearable && value && <button onClick={() => onChange('')} className="text-xs px-2 py-1 bg-white/5 rounded">Clear</button>}
      </div>
      {open && (
        <div className="absolute z-40 mt-1 w-56 max-h-40 overflow-auto rounded bg-gray-900 border border-white/10 shadow-lg">
          {query === '' && recent && recent.length > 0 && (
            <div className="p-2 text-xs text-gray-400">Recent</div>
          )}
          { (query === '' ? [...new Set(recent.concat(filtered))] : filtered).map((opt) => (
            <div key={opt} onClick={() => handleSelect(opt)} className="px-3 py-2 text-sm hover:bg-white/5 cursor-pointer text-white">
              {opt}
            </div>
          ))}
          {filtered.length === 0 && <div className="p-3 text-xs text-gray-500">No matches</div>}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;


