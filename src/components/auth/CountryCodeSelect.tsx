"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export interface Country {
  name: string;
  code: string;
  flag: string;
  iso: string;
  minDigits: number;
  maxDigits: number;
  placeholder: string;
  label?: string;
}

export const DEFAULT_COUNTRY: Country = {
  name: "India",
  code: "+91",
  flag: "🇮🇳",
  iso: "IN",
  minDigits: 10,
  maxDigits: 10,
  placeholder: "98765 43210",
  label: "10-digit mobile number",
};

export const COUNTRIES: Country[] = [
  DEFAULT_COUNTRY,
  { name: "United States", code: "+1", flag: "🇺🇸", iso: "US", minDigits: 10, maxDigits: 10, placeholder: "202 555 0143", label: "10-digit phone number" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧", iso: "GB", minDigits: 10, maxDigits: 11, placeholder: "7911 123456", label: "10-11 digit phone number" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪", iso: "AE", minDigits: 9, maxDigits: 9, placeholder: "50 123 4567", label: "9-digit phone number" },
  { name: "Singapore", code: "+65", flag: "🇸🇬", iso: "SG", minDigits: 8, maxDigits: 8, placeholder: "8123 4567", label: "8-digit phone number" },
  { name: "Canada", code: "+1", flag: "🇨🇦", iso: "CA", minDigits: 10, maxDigits: 10, placeholder: "416 555 0192", label: "10-digit phone number" },
  { name: "Australia", code: "+61", flag: "🇦🇺", iso: "AU", minDigits: 9, maxDigits: 9, placeholder: "412 345 678", label: "9-digit mobile number" },
  { name: "Germany", code: "+49", flag: "🇩🇪", iso: "DE", minDigits: 10, maxDigits: 11, placeholder: "151 23456789", label: "10-11 digit phone number" },
  { name: "Saudi Arabia", code: "+966", flag: "🇸🇦", iso: "SA", minDigits: 9, maxDigits: 9, placeholder: "50 123 4567", label: "9-digit phone number" },
  { name: "Qatar", code: "+974", flag: "🇶🇦", iso: "QA", minDigits: 8, maxDigits: 8, placeholder: "3312 3456", label: "8-digit phone number" },
  { name: "Oman", code: "+968", flag: "🇴🇲", iso: "OM", minDigits: 8, maxDigits: 8, placeholder: "9123 4567", label: "8-digit phone number" },
  { name: "Kuwait", code: "+965", flag: "🇰🇼", iso: "KW", minDigits: 8, maxDigits: 8, placeholder: "9123 4567", label: "8-digit phone number" },
  { name: "Bahrain", code: "+973", flag: "🇧🇭", iso: "BH", minDigits: 8, maxDigits: 8, placeholder: "3912 3456", label: "8-digit phone number" },
  { name: "France", code: "+33", flag: "🇫🇷", iso: "FR", minDigits: 9, maxDigits: 9, placeholder: "6 12 34 56 78", label: "9-digit phone number" },
  { name: "Japan", code: "+81", flag: "🇯🇵", iso: "JP", minDigits: 10, maxDigits: 10, placeholder: "90 1234 5678", label: "10-digit phone number" },
  { name: "Netherlands", code: "+31", flag: "🇳🇱", iso: "NL", minDigits: 9, maxDigits: 9, placeholder: "6 12345678", label: "9-digit phone number" },
  { name: "Malaysia", code: "+60", flag: "🇲🇾", iso: "MY", minDigits: 9, maxDigits: 10, placeholder: "12 345 6789", label: "9-10 digit phone number" },
  { name: "Bangladesh", code: "+880", flag: "🇧🇩", iso: "BD", minDigits: 10, maxDigits: 10, placeholder: "1712 345678", label: "10-digit phone number" },
  { name: "Sri Lanka", code: "+94", flag: "🇱🇰", iso: "LK", minDigits: 9, maxDigits: 9, placeholder: "71 234 5678", label: "9-digit phone number" },
  { name: "Nepal", code: "+977", flag: "🇳🇵", iso: "NP", minDigits: 10, maxDigits: 10, placeholder: "9812345678", label: "10-digit phone number" },
  { name: "South Africa", code: "+27", flag: "🇿🇦", iso: "ZA", minDigits: 9, maxDigits: 9, placeholder: "71 234 5678", label: "9-digit phone number" },
  { name: "New Zealand", code: "+64", flag: "🇳🇿", iso: "NZ", minDigits: 8, maxDigits: 10, placeholder: "21 123 4567", label: "8-10 digit phone number" },
  { name: "Ireland", code: "+353", flag: "🇮🇪", iso: "IE", minDigits: 9, maxDigits: 9, placeholder: "83 123 4567", label: "9-digit phone number" },
];

interface CountryCodeSelectProps {
  value: string;
  onChange: (country: Country) => void;
  disabled?: boolean;
}

export function CountryCodeSelect({ value, onChange, disabled }: CountryCodeSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry: Country = COUNTRIES.find((c) => c.code === value) ?? DEFAULT_COUNTRY;

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.includes(search) ||
      c.iso.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className="h-9 px-2.5 bg-[#F7FDFD] border border-r-0 border-[#D9EDEE] rounded-l-lg flex items-center gap-1 text-xs font-semibold text-slate-700 hover:bg-[#EAF8F8] focus:outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed select-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-sm leading-none">{selectedCountry.flag}</span>
        <span className="text-[11px] text-slate-600 font-bold">{selectedCountry.code}</span>
        <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-64 max-h-64 bg-white border border-[#D9EDEE] rounded-xl shadow-lg z-50 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-100">
          <div className="p-2 border-b border-[#D9EDEE] bg-[#F7FDFD]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code..."
                className="w-full pl-8 pr-2.5 py-1 text-xs bg-white border border-[#D9EDEE] rounded-md focus:outline-none focus:border-[#0396A6] text-slate-800 placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-1" role="listbox">
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-2 text-xs text-slate-400 text-center">No countries found</div>
            ) : (
              filteredCountries.map((c) => (
                <button
                  key={`${c.iso}-${c.code}`}
                  type="button"
                  onClick={() => {
                    onChange(c);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between text-left transition-colors ${
                    c.code === selectedCountry.code && c.iso === selectedCountry.iso
                      ? "bg-[#EAF8F8] text-[#0396A6] font-bold"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  role="option"
                  aria-selected={c.code === selectedCountry.code}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-sm">{c.flag}</span>
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="text-slate-500 font-mono text-[11px] shrink-0 ml-2">{c.code}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
