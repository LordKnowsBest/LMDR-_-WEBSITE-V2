'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui';
import { useApi } from '@/lib/hooks';
import {
    getHealthResources, getHealthTips, searchPetFriendly,
    submitPetFriendlyLocation, reviewPetFriendlyLocation, submitHealthTip,
} from '../../actions/wellness';

const DEMO_DRIVER_ID = 'demo-driver-001';
const DEFAULT_LAT = 32.7767;
const DEFAULT_LNG = -96.7970;

/* ── Mock Fallback Data ── */
const mockRestAreas = [
    { id: 1, name: 'I-20 Rest Stop — Odessa, TX', distance: '12 mi', amenities: ['Showers', 'WiFi', 'Food'], rating: 4.2 },
    { id: 2, name: 'Flying J Travel Center', distance: '24 mi', amenities: ['Diesel', 'Showers', 'WiFi', 'Food'], rating: 4.7 },
    { id: 3, name: 'Pilot Travel Center — Abilene', distance: '47 mi', amenities: ['Diesel', 'Showers', 'Parking'], rating: 4.1 },
];

const mockHealthResources = [
    { icon: 'favorite', label: 'Heart Health for Drivers', category: 'Cardio', helpful: 234, time: '5 min read' },
    { icon: 'fitness_center', label: 'Cab Exercises You Can Do Anywhere', category: 'Fitness', helpful: 189, time: '7 min read' },
    { icon: 'psychology', label: 'Managing Loneliness on Long Hauls', category: 'Mental Health', helpful: 312, time: '4 min read' },
    { icon: 'restaurant', label: 'Eating Healthy at Truck Stops', category: 'Nutrition', helpful: 156, time: '6 min read' },
];

const mockPetFriendly = [
    { id: 1, name: 'Petro Stopping Center — Nashville', distance: '8 mi', amenities: ['Pet Walk Area', 'Vet Nearby', 'Pet Food'], rating: 4.6, pets: '✓' },
    { id: 2, name: 'Love\'s Travel Stop — Bowling Green', distance: '31 mi', amenities: ['Pet Walk Area', 'Water Stations'], rating: 4.3, pets: '✓' },
    { id: 3, name: 'TA Travel Center — Cookeville', distance: '55 mi', amenities: ['Pet Area', 'Showers'], rating: 3.9, pets: '✓' },
];

const TABS = ['Road Tools', 'Health & Wellness', 'Pet Friendly'];

export default function RoadWellnessPage() {
    const [tab, setTab] = useState('Road Tools');
    const [hosHours, setHosHours] = useState(7);

    /* ── Geolocation state ── */
    const [userLat, setUserLat] = useState(DEFAULT_LAT);
    const [userLng, setUserLng] = useState(DEFAULT_LNG);
    const [geoStatus, setGeoStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

    /* ── Pet location submission ── */
    const [showPetSubmit, setShowPetSubmit] = useState(false);
    const [petName, setPetName] = useState('');
    const [petAddress, setPetAddress] = useState('');
    const [petAmenities, setPetAmenities] = useState('');
    const [petSubmitting, setPetSubmitting] = useState(false);

    /* ── Pet review state ── */
    const [reviewingPetId, setReviewingPetId] = useState<string | number | null>(null);
    const [petRating, setPetRating] = useState(4);
    const [petComment, setPetComment] = useState('');
    const [reviewSubmitting, setReviewSubmitting] = useState(false);

    /* ── Health tip submission ── */
    const [showTipForm, setShowTipForm] = useState(false);
    const [tipTitle, setTipTitle] = useState('');
    const [tipContent, setTipContent] = useState('');
    const [tipCategory, setTipCategory] = useState('Fitness');
    const [tipSubmitting, setTipSubmitting] = useState(false);

    /* ── Request geolocation on mount ── */
    useEffect(() => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) {
            setGeoStatus('denied');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLat(pos.coords.latitude);
                setUserLng(pos.coords.longitude);
                setGeoStatus('granted');
            },
            () => {
                setGeoStatus('denied');
            },
            { timeout: 5000 }
        );
    }, []);

    const { data: healthResourcesData } = useApi<Record<string, unknown>[]>(
        () => getHealthResources().then(d => ({ data: d as unknown as Record<string, unknown>[] })),
        []
    );
    const { data: healthTipsData } = useApi<Record<string, unknown>[]>(
        () => getHealthTips().then(d => ({ data: d as unknown as Record<string, unknown>[] })),
        []
    );
    const { data: petFriendlyData } = useApi<Record<string, unknown>[]>(
        () => searchPetFriendly(userLat, userLng, 50).then(d => ({ data: d as unknown as Record<string, unknown>[] })),
        [userLat, userLng]
    );

    const restAreas = mockRestAreas; // No server action for rest areas yet
    const healthResources = (healthResourcesData as typeof mockHealthResources) ?? mockHealthResources;
    const petFriendly = (petFriendlyData as typeof mockPetFriendly) ?? mockPetFriendly;

    const hosRemaining = 11 - hosHours;
    const hosPct = Math.round((hosHours / 11) * 100);

    /* ── Pet location submit handler ── */
    const handlePetSubmit = useCallback(async () => {
        if (!petName.trim() || !petAddress.trim()) return;
        setPetSubmitting(true);
        try {
            await submitPetFriendlyLocation({
                name: petName.trim(),
                lat: userLat,
                lng: userLng,
                address: petAddress.trim(),
                amenities: petAmenities.split(',').map(a => a.trim()).filter(Boolean),
                driverId: DEMO_DRIVER_ID,
            });
            setPetName('');
            setPetAddress('');
            setPetAmenities('');
            setShowPetSubmit(false);
        } catch (err) {
            console.error('Failed to submit pet location:', err);
        } finally {
            setPetSubmitting(false);
        }
    }, [petName, petAddress, petAmenities, userLat, userLng]);

    /* ── Pet review handler ── */
    const handlePetReview = useCallback(async () => {
        if (!reviewingPetId) return;
        setReviewSubmitting(true);
        try {
            await reviewPetFriendlyLocation(String(reviewingPetId), {
                driverId: DEMO_DRIVER_ID,
                rating: petRating,
                comment: petComment.trim() || undefined,
            });
            setReviewingPetId(null);
            setPetComment('');
            setPetRating(4);
        } catch (err) {
            console.error('Failed to submit review:', err);
        } finally {
            setReviewSubmitting(false);
        }
    }, [reviewingPetId, petRating, petComment]);

    /* ── Health tip handler ── */
    const handleTipSubmit = useCallback(async () => {
        if (!tipTitle.trim() || !tipContent.trim()) return;
        setTipSubmitting(true);
        try {
            await submitHealthTip({
                driverId: DEMO_DRIVER_ID,
                category: tipCategory,
                title: tipTitle.trim(),
                content: tipContent.trim(),
            });
            setTipTitle('');
            setTipContent('');
            setShowTipForm(false);
        } catch (err) {
            console.error('Failed to submit health tip:', err);
        } finally {
            setTipSubmitting(false);
        }
    }, [tipTitle, tipContent, tipCategory]);

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--neu-text)' }}>Road & Wellness</h1>
                <p className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>
                    Road Tools · Health · Pet Friendly Stops
                    {geoStatus === 'granted' && <span className="ml-1 text-green-500 font-bold">· GPS Active</span>}
                    {geoStatus === 'denied' && <span className="ml-1 text-yellow-500 font-bold">· Using default location</span>}
                </p>
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
                            {hosPct > 80 ? 'Approaching 11-hour limit' : `Safe to drive ${hosRemaining}h more`}
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
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                            Resources
                        </p>
                        <button
                            onClick={() => setShowTipForm(v => !v)}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg"
                            style={{ background: 'var(--neu-accent)', color: '#fff' }}
                        >
                            {showTipForm ? 'Cancel' : '+ Share Tip'}
                        </button>
                    </div>

                    {/* Health Tip Submission Form */}
                    {showTipForm && (
                        <Card elevation="md" className="!p-4 space-y-3">
                            <input
                                type="text"
                                placeholder="Tip title..."
                                value={tipTitle}
                                onChange={(e) => setTipTitle(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-[12px] neu-in outline-none"
                                style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text)' }}
                            />
                            <textarea
                                placeholder="Share your health tip with fellow drivers..."
                                value={tipContent}
                                onChange={(e) => setTipContent(e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg text-[12px] neu-in outline-none resize-none"
                                style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text)' }}
                            />
                            <select
                                value={tipCategory}
                                onChange={(e) => setTipCategory(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-[12px] neu-in outline-none"
                                style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text)' }}
                            >
                                <option value="Fitness">Fitness</option>
                                <option value="Nutrition">Nutrition</option>
                                <option value="Mental Health">Mental Health</option>
                                <option value="Cardio">Cardio</option>
                                <option value="Sleep">Sleep</option>
                            </select>
                            <button
                                onClick={handleTipSubmit}
                                disabled={tipSubmitting || !tipTitle.trim()}
                                className="w-full py-2 rounded-lg text-[11px] font-bold disabled:opacity-50"
                                style={{ background: 'var(--neu-accent)', color: '#fff' }}
                            >
                                {tipSubmitting ? 'Submitting...' : 'Submit Tip'}
                            </button>
                        </Card>
                    )}

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

                    {/* Submit new pet location */}
                    <button
                        onClick={() => setShowPetSubmit(v => !v)}
                        className="w-full py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5"
                        style={{ background: 'linear-gradient(135deg, var(--neu-accent), var(--neu-accent-deep))', color: '#fff' }}
                    >
                        <span className="material-symbols-outlined text-[14px]">{showPetSubmit ? 'close' : 'add_location'}</span>
                        {showPetSubmit ? 'Cancel' : 'Add Pet-Friendly Location'}
                    </button>

                    {showPetSubmit && (
                        <Card elevation="md" className="!p-4 space-y-3">
                            <input
                                type="text"
                                placeholder="Location name..."
                                value={petName}
                                onChange={(e) => setPetName(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-[12px] neu-in outline-none"
                                style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text)' }}
                            />
                            <input
                                type="text"
                                placeholder="Address..."
                                value={petAddress}
                                onChange={(e) => setPetAddress(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-[12px] neu-in outline-none"
                                style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text)' }}
                            />
                            <input
                                type="text"
                                placeholder="Amenities (comma separated)..."
                                value={petAmenities}
                                onChange={(e) => setPetAmenities(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg text-[12px] neu-in outline-none"
                                style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text)' }}
                            />
                            <p className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>
                                Using your current GPS coordinates ({userLat.toFixed(4)}, {userLng.toFixed(4)})
                            </p>
                            <button
                                onClick={handlePetSubmit}
                                disabled={petSubmitting || !petName.trim()}
                                className="w-full py-2 rounded-lg text-[11px] font-bold disabled:opacity-50"
                                style={{ background: 'var(--neu-accent)', color: '#fff' }}
                            >
                                {petSubmitting ? 'Submitting...' : 'Submit Location'}
                            </button>
                        </Card>
                    )}

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
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-green-500 font-bold">🐾 Pet Friendly</span>
                                        <button
                                            onClick={() => setReviewingPetId(reviewingPetId === stop.id ? null : stop.id)}
                                            className="text-[9px] font-bold px-2 py-1 rounded-lg"
                                            style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-accent)' }}
                                        >
                                            Review
                                        </button>
                                    </div>
                                </div>

                                {/* Inline Review Form */}
                                {reviewingPetId === stop.id && (
                                    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--neu-bg-soft)' }}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold" style={{ color: 'var(--neu-text)' }}>Rating:</span>
                                            <div className="flex gap-1">
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <button
                                                        key={v}
                                                        onClick={() => setPetRating(v)}
                                                        className="text-[14px]"
                                                    >
                                                        {v <= petRating ? '★' : '☆'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Comment (optional)..."
                                            value={petComment}
                                            onChange={(e) => setPetComment(e.target.value)}
                                            className="w-full px-2 py-1.5 rounded-lg text-[11px] neu-in outline-none"
                                            style={{ background: 'var(--neu-bg-soft)', color: 'var(--neu-text)' }}
                                        />
                                        <button
                                            onClick={handlePetReview}
                                            disabled={reviewSubmitting}
                                            className="w-full py-1.5 rounded-lg text-[10px] font-bold disabled:opacity-50"
                                            style={{ background: 'var(--neu-accent)', color: '#fff' }}
                                        >
                                            {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                                        </button>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
