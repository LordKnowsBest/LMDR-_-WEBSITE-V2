'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';

interface AiSearchFormProps {
  onSearch: () => void;
}

export default function AiSearchForm({ onSearch }: AiSearchFormProps) {
  const [location, setLocation] = useState('');
  const [truckType, setTruckType] = useState('any');

  return (
    <Card elevation="sm" className="!p-5 space-y-4">
      <div className="space-y-1">
        <h3 className="text-[14px] font-bold" style={{ color: 'var(--neu-text)' }}>Search Criteria</h3>
        <p className="text-[11px]" style={{ color: 'var(--neu-text-muted)' }}>Tell us what you're looking for</p>
      </div>

      {/* Location */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>Preferred Location</label>
        <div className="neu-in rounded-xl px-3 py-2">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, state, or zip code"
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

      {/* Search Button */}
      <button
        onClick={onSearch}
        className="w-full py-3 rounded-xl text-[13px] font-bold text-white transition-transform active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
          boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[16px]">search</span>
          Find Matches
        </span>
      </button>
    </Card>
  );
}
