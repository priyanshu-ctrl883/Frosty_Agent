'use client';

import React, { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';

const COMMON_LANGUAGES: { value: string; label: string }[] = [
  { value: 'en', label: 'English (en)' },
  { value: 'hi', label: 'Hindi (hi)' },
  { value: 'es', label: 'Spanish (es)' },
  { value: 'fr', label: 'French (fr)' },
  { value: 'de', label: 'German (de)' },
  { value: 'pt', label: 'Portuguese (pt)' },
  { value: 'ar', label: 'Arabic (ar)' },
  { value: 'zh', label: 'Chinese (zh)' },
  { value: 'ja', label: 'Japanese (ja)' },
  { value: 'ko', label: 'Korean (ko)' },
  { value: 'bn', label: 'Bengali (bn)' },
  { value: 'ta', label: 'Tamil (ta)' },
  { value: 'te', label: 'Telugu (te)' },
  { value: 'mr', label: 'Marathi (mr)' },
  { value: 'gu', label: 'Gujarati (gu)' },
  { value: 'kn', label: 'Kannada (kn)' },
  { value: 'ml', label: 'Malayalam (ml)' },
  { value: 'pa', label: 'Punjabi (pa)' },
  { value: 'ur', label: 'Urdu (ur)' },
  { value: 'ru', label: 'Russian (ru)' },
  { value: 'it', label: 'Italian (it)' },
  { value: 'nl', label: 'Dutch (nl)' },
  { value: 'tr', label: 'Turkish (tr)' },
  { value: 'vi', label: 'Vietnamese (vi)' },
  { value: 'th', label: 'Thai (th)' },
  { value: 'id', label: 'Indonesian (id)' },
];

const parseCodes = (raw: string): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,;\s]+/)) {
    const code = part.trim().toLowerCase();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
};

const joinCodes = (codes: string[]) => codes.join(', ');

type LanguageCodesFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function LanguageCodesField({ value, onChange }: LanguageCodesFieldProps) {
  const codes = useMemo(() => parseCodes(value), [value]);
  const [draft, setDraft] = useState('');
  const [picker, setPicker] = useState('');

  const addCode = (raw: string) => {
    const code = raw.trim().toLowerCase();
    if (!code) return;
    if (codes.includes(code)) {
      setDraft('');
      setPicker('');
      return;
    }
    onChange(joinCodes([...codes, code]));
    setDraft('');
    setPicker('');
  };

  const removeCode = (code: string) => {
    onChange(joinCodes(codes.filter((c) => c !== code)));
  };

  const availableOptions = COMMON_LANGUAGES.filter((opt) => !codes.includes(opt.value));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5 min-h-[34px]">
        {codes.length === 0 ? (
          <span className="text-xs text-muted-foreground italic py-1">No languages yet — pick one or type a code</span>
        ) : (
          codes.map((code) => (
            <span
              key={code}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-muted/30 border border-border text-xs font-bold text-foreground"
            >
              {code}
              <button
                type="button"
                onClick={() => removeCode(code)}
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${code}`}
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 min-w-0">
          <Dropdown
            value={picker}
            onChange={(val) => addCode(String(val))}
            options={[
              { value: '', label: 'Add common language…' },
              ...availableOptions,
            ]}
            size="sm"
            placeholder="Add common language…"
            fullWidth
          />
        </div>
        <div className="flex flex-1 min-w-0 gap-1.5">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value.toLowerCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCode(draft);
              }
            }}
            className="flex-1 min-w-0 px-3 py-2 bg-muted/20 border border-border rounded-xl text-xs text-foreground outline-none focus:border-[#0396A6] font-mono"
            placeholder="Type ISO code (e.g. en)"
            maxLength={12}
          />
          <button
            type="button"
            onClick={() => addCode(draft)}
            disabled={!draft.trim()}
            className="px-3 py-2 rounded-xl border border-border bg-white text-xs font-bold text-[#0396A6] hover:bg-[#0396A6]/5 disabled:opacity-40 shrink-0 flex items-center gap-1"
          >
            <Plus size={13} />
            Add
          </button>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground">
        ISO 639-1 codes. Comma-separated list is saved to your agent config — pick from the menu or type any valid code.
      </p>
    </div>
  );
}
