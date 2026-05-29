"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

type SearchableSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: readonly string[];
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  allowManual?: boolean;
  loading?: boolean;
  emptyHint?: string;
  manualLabel?: (query: string) => string;
};

const MAX_VISIBLE = 80;

export function SearchableSelect({
  id,
  value,
  onChange,
  onBlur,
  options,
  placeholder = "Search…",
  disabled = false,
  invalid = false,
  allowManual = true,
  loading = false,
  emptyHint,
  manualLabel = (q) => `Use "${q}" (manual entry)`,
}: SearchableSelectProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? options.filter((o) => o.toLowerCase().includes(q))
      : [...options];
    return list.slice(0, MAX_VISIBLE);
  }, [options, query]);

  const trimmed = query.trim();
  const exactMatch = options.some((o) => o.toLowerCase() === trimmed.toLowerCase());
  const showManual =
    allowManual && trimmed.length >= 2 && !exactMatch && open && !loading;

  function selectOption(next: string) {
    onChange(next);
    setQuery(next);
    setOpen(false);
  }

  function handleBlur() {
    setOpen(false);
    if (trimmed && trimmed !== value) {
      onChange(trimmed);
    }
    onBlur?.();
  }

  return (
    <div className="searchableSelect" ref={rootRef}>
      <input
        type="text"
        id={inputId}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder={placeholder}
        disabled={disabled || loading}
        value={query}
        className={invalid ? "invalid" : undefined}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          if (!e.target.value.trim()) onChange("");
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            setQuery(value);
          }
        }}
      />

      {open && !disabled ? (
        <ul id={listId} className="searchableSelectList" role="listbox">
          {loading ? (
            <li className="searchableSelectHint">Loading…</li>
          ) : filtered.length === 0 && !showManual ? (
            <li className="searchableSelectHint">
              {emptyHint ?? "No matches. Type to search or enter manually below."}
            </li>
          ) : (
            filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  role="option"
                  aria-selected={opt === value}
                  className={opt === value ? "isSelected" : undefined}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(opt)}
                >
                  {opt}
                </button>
              </li>
            ))
          )}
          {showManual ? (
            <li className="searchableSelectManual">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectOption(trimmed)}
              >
                {manualLabel(trimmed)}
              </button>
            </li>
          ) : null}
          {!loading && filtered.length === MAX_VISIBLE ? (
            <li className="searchableSelectHint">Showing first {MAX_VISIBLE} matches — keep typing to narrow.</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
