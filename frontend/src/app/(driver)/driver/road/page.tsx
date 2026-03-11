'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';

const restAreas = [
    { id: 1, name: 'I-20 Rest Stop — Odessa, TX', distance: '12 mi', amenities: ['Showers', 'WiFi', 'Food'], rating: 4.2 },
    { id: 2, name: 'Flying J Travel Center', distance: '24 mi', amenities: ['Diesel', 'Showers', 'WiFi', 'Food'], rating: 4.7 },
    { id: 3, name: 'Pilot Travel Center — Abilene', distance: '47 mi', amenities: ['Diesel', 'Showers', 'Parking'], rating: 4.1 },
];

const healthResources = [
    { icon: 'favorite', label: 'Heart Health for Drivers', category: 'Cardio', helpful: 234, time: '5 min read' },
    { icon: 'fitness_center', label: 'Cab Exercises You Can Do Anywhere', category: 'Fitness', helpful: 189, time: '7 min read' },
    { icon: 'psychology', label: 'Managing Loneliness on Long Hauls', category: 'Mental Health', helpful: 312, time: '4 min read' },
    { icon: 'restaurant', label: 'Eating Healthy at Truck Stops', category: 'Nutrition', helpful: 156, time: '6 min read' },
];

const petFriendly = [
    { id: 1, name: 'Petro Stopping Center — Nashville', distance: '8 mi', amenities: ['Pet Walk Area', 'Vet Nearby', 'Pet Food'], rating: 4.6, pets: '✓' },
    { id: 2, name: 'Love\'s Travel Stop — Bowling Green', distance: '31 mi', amenities: ['Pet Walk Area', 'Water Stations'], rating: 4.3, pets: '✓' },
    { id: 3, name: 'TA Travel Center — Cookeville', distance: '55 mi', amenities: ['Pet Area', 'Showers'], rating: 3.9, pets: '✓' },
];

const TABS = ['Road Tools', 'Health & Wellness', 'Pet Friendly'];

export default function RoadWellnessPage() {
    const [tab, setTab] = useState('Road Tools');
    const [hosHours, setHosHours] = useState(7);

    const hosRemaining = 11 - hosHours;
    const hosPct = Math.round((hosHours / 11) * 100);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--neu-text)' }}>Road & Wellness</h1>
                <p className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>Road Tools · Health · Pet Friendly Stops</p>
            </div>

            {/* Tabs */}
            <div className="overflow-x-auto -mx-4 px-4 pb-1 no-scrollbar">
                <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
                    {TABS.map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className="px-4 py-2 rounded-full text-[11px] font-bold transition-all shrink-0"
                            style={
                                tab === t
                                    ? { background: 'var(--neu-accent)', color: '#fff' }
                                    : { background: 'var(--neu-bg-soft)', color: 'var(--neu-text-muted)' }
                            }
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Road Tools */}
            {tab === 'Road Tools' && (
                <div className="space-y-4">
                    {/* HOS Calculator */}
                    <Card elevation="lg" className="!p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>timer</span>
                            <p className="text-[13px] font-bold" style={{ color: 'var(--neu-text)' }}>HOS Calculator</p>
                        </div>
                        <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--neu-text-muted)' }}>
                            <span>Hours driven: {hosHours}h</span>
                            <span>{hosRemaining}h remaining of 11</span>
                        </div>
                        <div className="neu-in rounded-full h-3 overflow-hidden mb-2">
                            <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${hosPct}%`,
                                    background: hosPct > 80
                                        ? 'linear-gradient(90deg, #ef4444, #f97316)'
                                        : 'linear-gradient(90deg, var(--neu-accent), var(--neu-accent-deep))',
                                }}
                            />
                        </div>
                        <input
                            type="range" min={0} max={11} step={0.5} value={hosHours}
                            onChange={(e) => setHosHours(Number(e.target.value))}
                            className="w-full accent-blue-500"
                        />
                        <p className="text-[10px] mt-1 text-center" style={{ color: hosPct > 80 ? '#ef4444' : 'var(--neu-text-muted)' }}>
                            {hosPct > 80 ? '⚠ Approaching 11-hour limit' : `Safe to drive ${hosRemaining}h more`}
                        </p>
                    </Card>

                    {/* Rest Areas */}
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                            Nearest Rest Areas
                        </p>
                        <div className="space-y-2.5">
                            {restAreas.map((ra) => (
                                <Card key={ra.id} elevation="sm" className="!p-3.5">
                                    <div className="flex justify-between items-start mb-1.5">
                                        <p className="text-[12px] font-semibold flex-1 mr-2" style={{ color: 'var(--neu-text)' }}>{ra.name}</p>
                                        <span className="text-[10px] font-bold shrink-0" style={{ color: 'var(--neu-accent)' }}>{ra.distance}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 mb-1.5">
                                        {ra.amenities.map((a) => (
                                            <span key={a} className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                                                style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text-muted)' }}>
                                                {a}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-yellow-400 text-[11px]">★</span>
                                        <span className="text-[10px] font-bold" style={{ color: 'var(--neu-text)' }}>{ra.rating}</span>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Health & Wellness */}
            {tab === 'Health & Wellness' && (
                <div className="space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                        Resources
                    </p>
                    {healthResources.map((res, i) => (
                        <Card key={i} elevation="sm" className="!p-3.5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 neu-x">
                                    <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>{res.icon}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-semibold truncate" style={{ color: 'var(--neu-text)' }}>{res.label}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                            style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-accent)' }}>
                                            {res.category}
                                        </span>
                                        <span className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>{res.time}</span>
                                        <span className="text-[9px] flex items-center gap-0.5" style={{ color: 'var(--neu-text-muted)' }}>
                                            <span className="material-symbols-outlined text-[10px]">thumb_up</span>
                                            {res.helpful}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pet Friendly */}
            {tab === 'Pet Friendly' && (
                <div className="space-y-4">
                    <Card elevation="md" className="!p-3.5">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-[20px]">🐾</span>
                            <div>
                                <p className="text-[12px] font-bold" style={{ color: 'var(--neu-text)' }}>Pet-Friendly Mode</p>
                                <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>Showing stops with pet amenities</p>
                            </div>
                            <div className="ml-auto w-10 h-5 rounded-full flex items-center px-0.5 cursor-pointer"
                                style={{ background: 'var(--neu-accent)' }}>
                                <div className="w-4 h-4 rounded-full bg-white ml-auto" />
                            </div>
                        </div>
                    </Card>

                    <div className="space-y-2.5">
                        {petFriendly.map((stop) => (
                            <Card key={stop.id} elevation="sm" className="!p-3.5">
                                <div className="flex justify-between items-start mb-1.5">
                                    <p className="text-[12px] font-semibold flex-1 mr-2" style={{ color: 'var(--neu-text)' }}>{stop.name}</p>
                                    <span className="text-[10px] font-bold shrink-0" style={{ color: 'var(--neu-accent)' }}>{stop.distance}</span>
                                </div>
                                <div className="flex flex-wrap gap-1 mb-1.5">
                                    {stop.amenities.map((a) => (
                                        <span key={a} className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
                                            style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text-muted)' }}>
                                            {a}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <span className="text-yellow-400 text-[11px]">★</span>
                                        <span className="text-[10px] font-bold" style={{ color: 'var(--neu-text)' }}>{stop.rating}</span>
                                    </div>
                                    <span className="text-[10px] text-green-500 font-bold">🐾 Pet Friendly</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
