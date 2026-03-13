'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui';

// Components
import AiSearchForm from '@/components/matching/AiSearchForm';
import AiResultsList from '@/components/matching/AiResultsList';
import AiApplicationsTracker from '@/components/matching/AiApplicationsTracker';

// Server actions
import { findJobs, searchJobs } from '../../actions/matching';
import { getApplications } from '../../actions/cockpit';

const DEMO_DRIVER_ID = 'demo-driver-001';

export interface MatchResult {
    position: number;
    carrierId: string;
    carrierName: string;
    score: number;
    factors: Record<string, number>;
    dotNumber: number;
}

export default function AiMatchingPage() {
    const [activeTab, setActiveTab] = useState('Find Matches');
    const [isSearching, setIsSearching] = useState(false);
    const [hasResults, setHasResults] = useState(false);
    const [results, setResults] = useState<MatchResult[]>([]);
    const [totalScored, setTotalScored] = useState(0);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [appCount, setAppCount] = useState(0);
    const [applications, setApplications] = useState<any[]>([]);
    const [appsLoading, setAppsLoading] = useState(false);

    const loadApplications = useCallback(async () => {
        setAppsLoading(true);
        try {
            const data = await getApplications(DEMO_DRIVER_ID, 50);
            const records = (data as any)?.records ?? (data as any)?.items ?? [];
            const total = (data as any)?.total ?? (data as any)?.totalCount ?? records.length;
            setApplications(records);
            setAppCount(total);
        } catch (err) {
            console.error('[AiMatching] Failed to load applications:', err);
        } finally {
            setAppsLoading(false);
        }
    }, []);

    // Load application count on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadApplications(); }, []);

    const handleSearch = async (filters?: { cdlClass?: string; jobType?: string; state?: string }) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            let data: any;
            if (filters && (filters.cdlClass || filters.jobType || filters.state)) {
                // Filter-based search
                data = await searchJobs({ ...filters, limit: 20 });
                // searchJobs returns { items, totalCount } — normalize to match format
                const items = data?.items ?? [];
                setResults(items.map((item: any, idx: number) => ({
                    position: idx + 1,
                    carrierId: item.carrierId ?? item._id ?? String(idx),
                    carrierName: item.carrierName ?? item.carrier_name ?? 'Unknown Carrier',
                    score: item.score ?? item.match_score ?? 0,
                    factors: item.factors ?? {},
                    dotNumber: item.dotNumber ?? item.dot_number ?? 0,
                })));
                setTotalScored(data?.totalCount ?? items.length);
            } else {
                // AI-powered matching
                data = await findJobs(DEMO_DRIVER_ID, 20);
                const matches = data?.matches ?? [];
                setResults(matches);
                setTotalScored(data?.totalScored ?? matches.length);
            }
            setHasResults(true);
        } catch (err: any) {
            console.error('[AiMatching] Search failed:', err);
            setSearchError(err?.message ?? 'Search failed. Please try again.');
            setHasResults(false);
        } finally {
            setIsSearching(false);
        }
    };

    const handleReset = () => {
        setHasResults(false);
        setIsSearching(false);
        setResults([]);
        setSearchError(null);
    };

    const handleApplyComplete = () => {
        setAppCount(prev => prev + 1);
        // Refresh applications list
        loadApplications();
    };

    return (
        <div className="space-y-4">
            {/* Header / Guest Banner Logic (Assuming logged in for DriverOS, but can show welcome) */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]" style={{ color: '#2563eb' }}>verified</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#2563eb' }}>FMCSA Verified • AI-Powered</span>
                </div>
                <h1 className="text-2xl font-black" style={{ color: '#0f172a' }}>Find Your Carrier</h1>
                <p className="text-[12px] font-medium" style={{ color: '#475569' }}>Real safety data. Real driver reviews. Real matches.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[
                    { id: 'Find Matches', label: 'Find Matches' },
                    { id: 'My Applications', label: `My Applications ${appCount > 0 ? `(${appCount})` : ''}` }
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all duration-200"
                        style={
                            activeTab === t.id
                                ? { background: '#0f172a', color: '#fbbf24', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }
                                : { background: 'var(--neu-bg-soft)', color: 'var(--neu-text-muted)', boxShadow: 'inset 2px 2px 4px var(--neu-shadow-d), inset -2px -2px 4px var(--neu-shadow-l)' }
                        }
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            {activeTab === 'Find Matches' && (
                <div className="animate-fade-up">
                    {!isSearching && !hasResults && (
                        <>
                            <AiSearchForm onSearch={handleSearch} />
                            {searchError && (
                                <Card elevation="flat" className="!p-4 mt-4 text-center">
                                    <p className="text-[12px] font-bold" style={{ color: '#ef4444' }}>{searchError}</p>
                                    <button onClick={() => setSearchError(null)} className="text-[11px] font-bold mt-2" style={{ color: '#2563eb' }}>Dismiss</button>
                                </Card>
                            )}
                        </>
                    )}

                    {isSearching && (
                        <Card elevation="flat" className="!p-8 flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin" style={{ borderColor: '#2563eb transparent transparent transparent' }}></div>
                            <div>
                                <h3 className="text-[16px] font-black" style={{ color: '#0f172a' }}>Finding Your Matches</h3>
                                <p className="text-[12px] font-medium" style={{ color: '#475569' }}>Analyzing carriers with verified safety data...</p>
                            </div>
                            
                            <div className="w-full max-w-xs space-y-2 mt-4 text-left">
                                {[
                                    { label: 'Searching by location...', done: true },
                                    { label: 'Pulling FMCSA safety records...', done: false },
                                    { label: 'Scoring matches...', done: false },
                                    { label: 'Building your report...', done: false }
                                ].map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        {step.done ? (
                                            <span className="material-symbols-outlined text-[14px]" style={{ color: '#2563eb' }}>check_circle</span>
                                        ) : (
                                            <span className="material-symbols-outlined text-[14px] animate-pulse" style={{ color: '#cbd5e1' }}>radio_button_unchecked</span>
                                        )}
                                        <span className="text-[11px] font-medium" style={{ color: step.done ? '#0f172a' : '#94a3b8' }}>{step.label}</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}

                    {hasResults && !isSearching && (
                        <AiResultsList
                            results={results}
                            totalScored={totalScored}
                            loading={false}
                            onReset={handleReset}
                            onApply={handleApplyComplete}
                        />
                    )}
                </div>
            )}

            {activeTab === 'My Applications' && (
                <div className="animate-fade-up">
                    <AiApplicationsTracker
                        applications={applications}
                        loading={appsLoading}
                        onRefresh={loadApplications}
                    />
                </div>
            )}
        </div>
    );
}
