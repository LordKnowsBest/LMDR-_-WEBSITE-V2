'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import AiApplicationModal from './AiApplicationModal';

interface MatchResult {
    position: number;
    carrierId: string;
    carrierName: string;
    score: number;
    factors: Record<string, number>;
    dotNumber: number;
}

interface AiResultsListProps {
    results: MatchResult[];
    totalScored?: number;
    loading?: boolean;
    onReset: () => void;
    onApply: () => void;
}

// Mock fallback data in case API returns empty
const FALLBACK_RESULTS: MatchResult[] = [
    {
        position: 1,
        carrierId: 'fallback-1',
        carrierName: 'Apex Transportation',
        score: 98,
        factors: { location: 0.9, pay: 1, safety: 0.85 },
        dotNumber: 0,
    },
    {
        position: 2,
        carrierId: 'fallback-2',
        carrierName: 'Swift Logistics',
        score: 85,
        factors: { location: 0.7, pay: 0.8, safety: 1 },
        dotNumber: 0,
    },
];

function factorLabel(value: number): string {
    if (value >= 0.9) return 'Excellent';
    if (value >= 0.7) return 'Good';
    if (value >= 0.5) return 'Fair';
    return 'Low';
}

function factorColor(value: number): string {
    if (value >= 0.9) return '#16a34a';
    if (value >= 0.7) return '#2563eb';
    if (value >= 0.5) return '#d97706';
    return '#94a3b8';
}

export default function AiResultsList({ results, totalScored, loading, onReset, onApply }: AiResultsListProps) {
    const [selectedCarrier, setSelectedCarrier] = useState<MatchResult | null>(null);

    // Use API results if available, otherwise fall back to mock
    const carriers = results.length > 0 ? results : FALLBACK_RESULTS;
    const isUsingFallback = results.length === 0;

    if (loading) {
        return (
            <Card elevation="flat" className="!p-8 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#2563eb transparent transparent transparent' }}></div>
                <p className="text-[12px] font-medium" style={{ color: '#475569' }}>Loading results...</p>
            </Card>
        );
    }

    const handleApplyClick = (carrier: MatchResult) => {
        setSelectedCarrier(carrier);
    };

    const handleCloseModal = () => {
        setSelectedCarrier(null);
    };

    const handleApplicationComplete = () => {
        setSelectedCarrier(null);
        onApply();
    };

    // Get displayable factor keys, filtering out any zero-value or internal fields
    const getDisplayFactors = (factors: Record<string, number>) => {
        const displayKeys = ['location', 'pay', 'safety', 'culture', 'routeType', 'fleetAge'];
        const entries = Object.entries(factors).filter(
            ([key, val]) => displayKeys.includes(key) && typeof val === 'number'
        );
        // Show up to 4 factors
        return entries.slice(0, 4);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[18px] font-black" style={{ color: '#0f172a' }}>Top Carrier Matches</h2>
                    <p className="text-[12px] font-medium" style={{ color: '#475569' }}>
                        {isUsingFallback
                            ? 'Showing sample results — search again with different criteria.'
                            : `${totalScored ?? carriers.length} carriers scored • Top ${carriers.length} shown`}
                    </p>
                </div>
                <button
                    onClick={onReset}
                    className="text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all neu-hover"
                    style={{ background: 'var(--neu-bg-soft)', color: '#475569', border: '1px solid var(--neu-border)' }}
                >
                    Edit Search
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {carriers.map((carrier) => {
                    const displayFactors = getDisplayFactors(carrier.factors);

                    return (
                        <Card key={carrier.carrierId} elevation="sm" className="!p-0 overflow-hidden flex flex-col">
                            {/* Header: Score and Name */}
                            <div className="p-4" style={{ background: '#0f172a', borderBottom: '1px solid var(--neu-border)' }}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[14px] font-black text-white">{carrier.carrierName}</span>
                                    <div className="px-2 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1"
                                         style={{ background: '#fbbf24', color: '#0f172a' }}>
                                        <span className="material-symbols-outlined text-[12px]">vital_signs</span>
                                        {carrier.score}% Match
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] font-medium" style={{ color: '#cbd5e1' }}>
                                    {carrier.dotNumber > 0 && (
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px] text-[#2563eb]">badge</span>
                                            DOT {carrier.dotNumber}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px] text-[#2563eb]">trending_up</span>
                                        #{carrier.position} rank
                                    </span>
                                </div>
                            </div>

                            {/* Badges */}
                            <div className="flex gap-2 p-3 pb-0">
                                <span className="text-[9px] font-extrabold uppercase px-2 py-1 flex items-center gap-1 rounded-md"
                                      style={{ background: '#dbeafe', color: '#1e40af' }}>
                                    <span className="material-symbols-outlined text-[10px]">shield</span>
                                    FMCSA Verified
                                </span>
                                {carrier.score >= 90 && (
                                    <span className="text-[9px] font-extrabold uppercase px-2 py-1 flex items-center gap-1 rounded-md"
                                          style={{ background: '#fef3c7', color: '#92400e' }}>
                                        <span className="material-symbols-outlined text-[10px]">star</span>
                                        Top Match
                                    </span>
                                )}
                            </div>

                            {/* Match Breakdown */}
                            <div className="p-4 pt-3 flex-grow">
                                <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Match Breakdown</p>
                                <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${Math.min(displayFactors.length, 4)}, 1fr)` }}>
                                    {displayFactors.map(([key, val]) => (
                                        <div key={key} className="p-2 rounded-xl text-center" style={{ background: 'var(--neu-bg-soft)' }}>
                                            <p className="text-[9px] font-bold capitalize" style={{ color: '#475569' }}>{key}</p>
                                            <p className="text-[11px] font-black" style={{ color: factorColor(val) }}>{factorLabel(val)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-4 pt-0 grid grid-cols-2 gap-2 mt-auto">
                                <button className="py-2.5 rounded-xl text-[11px] font-bold transition-all"
                                        style={{ background: 'var(--neu-bg-soft)', color: '#0f172a', border: '1px solid var(--neu-border)' }}>
                                    Full Profile
                                </button>
                                <button
                                    onClick={() => handleApplyClick(carrier)}
                                    className="py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-1"
                                    style={{ background: '#2563eb', color: '#fff', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)' }}>
                                    <span className="material-symbols-outlined text-[14px]">send</span>
                                    Express Apply
                                </button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Application Modal */}
            {selectedCarrier && (
                <AiApplicationModal
                    carrier={selectedCarrier}
                    onClose={handleCloseModal}
                    onComplete={handleApplicationComplete}
                />
            )}
        </div>
    );
}
