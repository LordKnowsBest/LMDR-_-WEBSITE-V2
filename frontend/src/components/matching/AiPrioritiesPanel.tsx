'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';

export default function AiPrioritiesPanel() {
    const defaultWeights = {
        location: 25,
        pay: 20,
        operationType: 15,
        safety: 10,
        turnover: 12,
        truckAge: 8
    };

    const [weights, setWeights] = useState(defaultWeights);

    const handleReset = () => setWeights(defaultWeights);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setWeights(prev => ({
            ...prev,
            [e.target.name]: parseInt(e.target.value, 10)
        }));
    };

    const getLabelForWeight = (val: number) => {
        if (val > 80) return { text: 'Critical', color: '#ef4444', bg: '#fee2e2' };
        if (val > 60) return { text: 'High', color: '#ea580c', bg: '#ffedd5' };
        if (val > 40) return { text: 'Medium', color: '#fbbf24', bg: '#fef3c7' };
        if (val > 15) return { text: 'Standard', color: '#2563eb', bg: '#dbeafe' };
        return { text: 'Low', color: '#475569', bg: '#f1f5f9' };
    };

    const sliders = [
        { name: 'location', label: 'Home Location' },
        { name: 'pay', label: 'Driver Pay' },
        { name: 'operationType', label: 'Route Match' },
        { name: 'safety', label: 'Safety Record' },
        { name: 'turnover', label: 'Driver Retention' },
        { name: 'truckAge', label: 'Fleet Age' }
    ];

    return (
        <Card elevation="xs" className="!p-4 bg-[var(--neu-bg)]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]" style={{ color: '#0f172a' }}>scale</span>
                    <span className="text-[12px] font-bold" style={{ color: '#0f172a' }}>Adjust Match Importance</span>
                </div>
                <button 
                    onClick={handleReset}
                    className="text-[10px] font-bold px-2 py-1 rounded-md transition-all"
                    style={{ background: '#f1f5f9', color: '#475569' }}
                >
                    Reset Defaults
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {sliders.map((s) => {
                    const val = weights[s.name as keyof typeof weights];
                    const badge = getLabelForWeight(val);
                    return (
                        <div key={s.name} className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[11px] font-bold" style={{ color: '#475569' }}>{s.label}</span>
                                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase" style={{ color: badge.color, backgroundColor: badge.bg }}>
                                    {badge.text}
                                </span>
                            </div>
                            {/* LMDR Yellow Accent color on slider */}
                            <input
                                type="range"
                                name={s.name}
                                min="0"
                                max="100"
                                value={val}
                                onChange={handleChange}
                                className="neu-slider w-full"
                                style={{ '--slider-color': '#fbbf24', '--slider-pct': `${val}%` } as React.CSSProperties}
                            />
                        </div>
                    );
                })}
            </div>
        </Card>
    );
}
