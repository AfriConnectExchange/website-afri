"use client";
import dynamic from 'next/dynamic';
import React from 'react';

// react-flags-select is client-only. Load dynamically to avoid SSR issues.
const ReactFlagsSelect = dynamic(() => import('react-flags-select'), { ssr: false } as any) as any;

interface CountrySelectorProps {
  value?: string | null;
  onChange: (code: string) => void;
  placeholder?: string;
}

export function CountrySelector({ value, onChange, placeholder = 'Select nationality' }: CountrySelectorProps) {
  const selected = (value || '').toString().toUpperCase();
  return (
    <div className="w-full">
      {/* @ts-ignore - library types may not be complete */}
      <ReactFlagsSelect
        selected={selected || undefined}
        onSelect={(code: string) => onChange(code)}
        searchable
        selectButtonClassName="w-full h-10 !bg-transparent !border !border-input !text-sm"
        placeholder={placeholder}
      />
    </div>
  );
}
