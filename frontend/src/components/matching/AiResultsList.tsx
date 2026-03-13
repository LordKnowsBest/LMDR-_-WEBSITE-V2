'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import AiApplicationModal from './AiApplicationModal';

interface AiResultsListProps {
    onReset: () => void;
    onApply: () => void;
}

export default function AiResultsList({ onReset, onApply }: AiResultsListProps) {
    const [selectedCarrier, setSelectedCarrier] = useState<any>(null);

    // Mock results for UI display
    const carriers = [
        {
            id: 1,
            name: "Apex Transportation",
            location: "Dallas, TX",
            matchScore: 98,
            cpm: "$0.65 CPM",
            route: "Regional",
            tags: ["FMCSA Verified", "Top Payer"],
            breakdown: { location: "Excellent", pay: "Excellent", safety: "Good" }
        },
        {
            id: 2,
            name: "Swift Logistics",
            location: "Fort Worth, TX",
            matchScore: 85,
            cpm: "$0.58 CPM",
            route: "OTR",
            tags: ["FMCSA Verified"],
            breakdown: { location: "Good", pay: "Good", safety: "Excellent" }
        }
    ];

    const handleApplyClick = (carrier: any) => {
        setSelectedCarrier(carrier);
    };

    const handleCloseModal = () => {
        setSelectedCarrier(null);
    };

    const handleApplicationComplete = () => {
        setSelectedCarrier(null);
        onApply();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[18px] font-black" style={{ color: '#0f172a' }}>Top Carrier Matches</h2>
                    <p className="text-[12px] font-medium" style={{ color: '#475569' }}>Based on your preferences and FMCSA data.</p>
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
                {carriers.map((carrier) => (
                    <Card key={carrier.id} elevation="sm" className="!p-0 overflow-hidden flex flex-col">
                        {/* Header: Score and Name */}
                        <div className="p-4" style={{ background: '#0f172a', borderBottom: '1px solid var(--neu-border)' }}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[14px] font-black text-white">{carrier.name}</span>
                                <div className="px-2 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1"
                                     style={{ background: '#fbbf24', color: '#0f172a' }}>
                                    <span className="material-symbols-outlined text-[12px]">vital_signs</span>
                                    {carrier.matchScore}% Match
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-medium" style={{ color: '#cbd5e1' }}>
                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px] text-[#2563eb]">location_on</span>{carrier.location}</span>
                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px] text-[#2563eb]">payments</span>{carrier.cpm}</span>
                                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px] text-[#2563eb]">route</span>{carrier.route}</span>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="flex gap-2 p-3 pb-0">
                            {carrier.tags.map(tag => (
                                <span key={tag} className="text-[9px] font-extrabold uppercase px-2 py-1 flex items-center gap-1 rounded-md"
                                      style={{ background: '#dbeafe', color: '#1e40af' }}>
                                    <span className="material-symbols-outlined text-[10px]">shield</span>
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {/* Match Breakdown */}
                        <div className="p-4 pt-3 flex-grow">
                            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#475569' }}>Match Breakdown</p>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(carrier.breakdown).map(([key, val]) => (
                                    <div key={key} className="p-2 rounded-xl text-center" style={{ background: 'var(--neu-bg-soft)' }}>
                                        <p className="text-[9px] font-bold capitalize" style={{ color: '#475569' }}>{key}</p>
                                        <p className="text-[11px] font-black" style={{ color: val === 'Excellent' ? '#16a34a' : '#2563eb' }}>{val as string}</p>
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
                ))}
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
