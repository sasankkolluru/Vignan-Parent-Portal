import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

/**
 * SearchableDropdown — handles 1000+ options efficiently
 * Props:
 *   options: [{ value, label, sub }]  sub = optional small subtitle
 *   value: current selected value string
 *   onChange(value): callback
 *   placeholder: string
 *   className: extra classes for outer div
 */
export default function SearchableDropdown({ options = [], value, onChange, placeholder = 'Search or select…', className = '' }) {
  const [open, setOpen]     = useState(false);
  const [query, setQuery]   = useState('');
  const inputRef = useRef(null);
  const wrapRef  = useRef(null);

  const selected = options.find(o => o.value === value);

  const filtered = query.trim()
    ? options.filter(o =>
        o.label.toLowerCase().includes(query.toLowerCase()) ||
        o.value.toLowerCase().includes(query.toLowerCase()) ||
        (o.sub && o.sub.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 80)        // cap at 80 for performance
    : options.slice(0, 80);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (opt) => {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  const clear = (e) => { e.stopPropagation(); onChange(''); setQuery(''); };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition dark:text-white hover:border-indigo-400">
        <span className={selected ? 'font-semibold text-slate-800 dark:text-white' : 'text-slate-400'}>
          {selected ? `${selected.value} — ${selected.label}` : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selected && (
            <span role="button" onClick={clear} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md">
              <X size={13} className="text-slate-400"/>
            </span>
          )}
          <ChevronDown size={15} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}/>
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none"/>
              <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Type to search…"
                className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"/>
            </div>
          </div>
          {/* Options */}
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-400 text-sm">No results found</div>
            ) : (
              <>
                {filtered.map(opt => (
                  <button key={opt.value} type="button" onClick={() => select(opt)}
                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors hover:bg-indigo-50 dark:hover:bg-indigo-900/20
                      ${opt.value === value ? 'bg-indigo-50 dark:bg-indigo-900/30 font-bold text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                    <span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-2 text-xs">{opt.value}</span>
                      {opt.label}
                    </span>
                    {opt.sub && <span className="text-xs text-slate-400 ml-2 flex-shrink-0">{opt.sub}</span>}
                  </button>
                ))}
                {options.length > 80 && !query && (
                  <div className="px-4 py-2 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 text-center">
                    Showing 80 of {options.length} — type to search all
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
