'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Phone } from 'lucide-react';

const COUNTRIES = [
  { code: '+1',   flag: '🇺🇸', name: 'US / Canada',    maxLen: 10, format: (n: string) => n.replace(/(\d{3})(\d{3})(\d{0,4})/, '$1 $2 $3').trim() },
  { code: '+44',  flag: '🇬🇧', name: 'United Kingdom', maxLen: 10, format: (n: string) => n.replace(/(\d{4})(\d{0,6})/, '$1 $2').trim() },
  { code: '+86',  flag: '🇨🇳', name: 'China',          maxLen: 11, format: (n: string) => n.replace(/(\d{3})(\d{4})(\d{0,4})/, '$1 $2 $3').trim() },
  { code: '+852', flag: '🇭🇰', name: 'Hong Kong',      maxLen: 8,  format: (n: string) => n.replace(/(\d{4})(\d{0,4})/, '$1 $2').trim() },
  { code: '+886', flag: '🇹🇼', name: 'Taiwan',         maxLen: 9,  format: (n: string) => n.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1 $2 $3').trim() },
  { code: '+81',  flag: '🇯🇵', name: 'Japan',          maxLen: 10, format: (n: string) => n.replace(/(\d{3})(\d{4})(\d{0,3})/, '$1 $2 $3').trim() },
  { code: '+82',  flag: '🇰🇷', name: 'South Korea',    maxLen: 10, format: (n: string) => n.replace(/(\d{3})(\d{4})(\d{0,3})/, '$1 $2 $3').trim() },
  { code: '+65',  flag: '🇸🇬', name: 'Singapore',      maxLen: 8,  format: (n: string) => n.replace(/(\d{4})(\d{0,4})/, '$1 $2').trim() },
  { code: '+60',  flag: '🇲🇾', name: 'Malaysia',       maxLen: 10, format: (n: string) => n.replace(/(\d{3})(\d{3,4})(\d{0,4})/, '$1 $2 $3').trim() },
  { code: '+61',  flag: '🇦🇺', name: 'Australia',      maxLen: 9,  format: (n: string) => n.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1 $2 $3').trim() },
  { code: '+91',  flag: '🇮🇳', name: 'India',          maxLen: 10, format: (n: string) => n.replace(/(\d{5})(\d{0,5})/, '$1 $2').trim() },
  { code: '+66',  flag: '🇹🇭', name: 'Thailand',       maxLen: 9,  format: (n: string) => n.replace(/(\d{2})(\d{3})(\d{0,4})/, '$1 $2 $3').trim() },
] as const;

type PhoneInputProps = {
  value: string;                       // E.164 output, e.g. "+85298765432"
  onChange: (e164: string) => void;
  error?: string;
  autoFocus?: boolean;
  id?: string;
};

function parseE164(value: string): { code: string; local: string } {
  if (!value) return { code: '+1', local: '' };
  const sorted = [...COUNTRIES].sort((a, b) => b.code.length - a.code.length);
  for (const c of sorted) {
    if (value.startsWith(c.code)) {
      return { code: c.code, local: value.slice(c.code.length) };
    }
  }
  return { code: '+1', local: value.replace(/^\+/, '') };
}

export function PhoneInput({ value, onChange, error, autoFocus, id }: PhoneInputProps) {
  const parsed = parseE164(value);
  const [countryCode, setCountryCode] = useState(parsed.code);
  const [localNumber, setLocalNumber] = useState(parsed.local);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const country = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];

  // Sync E.164 output whenever parts change
  const emitValue = useCallback((code: string, local: string) => {
    const digits = local.replace(/\D/g, '');
    onChange(digits ? `${code}${digits}` : '');
  }, [onChange]);

  // Handle incoming value changes (e.g. from prefilled search params)
  useEffect(() => {
    const p = parseE164(value);
    if (p.code !== countryCode) setCountryCode(p.code);
    if (p.local !== localNumber.replace(/\D/g, '')) setLocalNumber(p.local);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLocalChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, country.maxLen);
    setLocalNumber(digits);
    emitValue(countryCode, digits);
  };

  const handleSelectCountry = (code: string) => {
    setCountryCode(code);
    setDropdownOpen(false);
    setSearch('');
    emitValue(code, localNumber);
    inputRef.current?.focus();
  };

  const formatted = country.format(localNumber.replace(/\D/g, ''));

  const filteredCountries = search
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search)
      )
    : COUNTRIES;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Country code selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(o => !o)}
            className={`
              flex items-center gap-1.5 h-9 px-3 rounded-md border text-sm font-medium
              whitespace-nowrap transition-colors
              hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
              ${error ? 'border-destructive' : 'border-input'}
            `}
          >
            <span className="text-base leading-none">{country.flag}</span>
            <span className="text-muted-foreground">{countryCode}</span>
            <svg className="h-3.5 w-3.5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 z-50 mt-1 w-64 rounded-md border bg-popover shadow-lg">
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Search country..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredCountries.map(c => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCountry(c.code)}
                    className={`
                      flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors
                      ${c.code === countryCode ? 'bg-accent font-medium' : ''}
                    `}
                  >
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="flex-1 text-left">{c.name}</span>
                    <span className="text-muted-foreground text-xs">{c.code}</span>
                  </button>
                ))}
                {filteredCountries.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">No match</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local number input */}
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            id={id}
            type="tel"
            inputMode="numeric"
            placeholder={country.format('0'.repeat(country.maxLen)).replace(/0/g, '0')}
            value={formatted}
            onChange={e => handleLocalChange(e.target.value)}
            className={`pl-10 ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            autoFocus={autoFocus}
          />
        </div>
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Select your country code, then enter your local number
        </p>
      )}
    </div>
  );
}
