'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';

interface AiSearchFormProps {
  onSearch: (filters?: { cdlClass?: string; jobType?: string; state?: string }) => void;
}

export default function AiSearchForm({ onSearch }: AiSearchFormProps) {
  const [location, setLocation] = useState('');
  const [truckType, setTruckType] = useState('any');
  const [searchMode, setSearchMode] = useState<'ai' | 'filter'>('ai');

  const handleSubmit = () => {
    if (searchMode === 'ai') {
      // AI-powered matching — no filters needed
      onSearch();
    } else {
      // Filter-based search
      onSearch({
        state: location.trim() || undefined,
        jobType: truckType !== 'any' ? truckType : undefined,
      });
    }
  };

  return (
    <Card elevation="sm" className="!p-5 space-y-4">
      <div className="space-y-1">
        <h3 className="text-[14px] font-bold" style={{ color: 'var(--neu-text)' }}>Search Criteria</h3>
        <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>Tell us what you're looking for</p>
      </div>

      {/* Search Mode Toggle */}
      <div className="flex gap-2">
        {[
          { id: 'ai' as const, label: 'AI Match', icon: 'auto_awesome' },
          { id: 'filter' as const, label: 'Filter Search', icon: 'filter_list' },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSearchMode(mode.id)}
            className="flex-1 py-2 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1"
            style={
              searchMode === mode.id
                ? { background: '#0f172a', color: '#fbbf24' }
                : { background: 'var(--neu-bg-soft)', color: 'var(--neu-text-muted)', border: '1px solid var(--neu-border)' }
            }
          >
            <span className="material-symbols-outlined text-[12px]">{mode.icon}</span>
            {mode.label}
          </button>
        ))}
      </div>

      {searchMode === 'ai' && (
        <div className="p-3 rounded-xl text-center" style={{ background: 'var(--neu-bg-soft)', border: '1px solid var(--neu-border)' }}>
          <span className="material-symbols-outlined text-[24px] mb-1 block" style={{ color: '#2563eb' }}>auto_awesome</span>
          <p className="text-[11px] font-bold" style={{ color: '#0f172a' }}>AI-Powered Matching</p>
          <p className="text-[10px] font-medium" style={{ color: '#475569' }}>Uses your profile, CDL class, location, and preferences to find the best carriers.</p>
        </div>
      )}

      {searchMode === 'filter' && (
        <>
          {/* Location */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>Preferred Location</label>
            <div className="neu-in rounded-xl px-3 py-2">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="State (e.g. TX, CA)"
                className="w-full bg-transparent border-none outline-none text-[12px] font-medium"
                style={{ color: 'var(--neu-text)' }}
              />
            </div>
          </div>

          {/* Truck Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>Equipment Type</label>
            <div className="neu-in rounded-xl px-3 py-2">
              <select
                value={truckType}
                onChange={(e) => setTruckType(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-[12px] font-medium"
                style={{ color: 'var(--neu-text)' }}
              >
                <option value="any">Any</option>
                <option value="dry_van">Dry Van</option>
                <option value="reefer">Reefer</option>
                <option value="flatbed">Flatbed</option>
                <option value="tanker">Tanker</option>
              </select>
            </div>
          </div>
        </>
      )}

      {/* Search Button */}
      <button
        onClick={handleSubmit}
        className="w-full py-3 rounded-xl text-[13px] font-bold text-white transition-transform active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
          boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[16px]">{searchMode === 'ai' ? 'auto_awesome' : 'search'}</span>
          {searchMode === 'ai' ? 'Find AI Matches' : 'Search Carriers'}
        </span>
      </button>
    </Card>
  );
}
