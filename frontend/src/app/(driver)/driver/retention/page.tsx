'use client';

import { Card, ProgressBar } from '@/components/ui';

const bestPractices = [
    { id: 1, title: 'Communicating Home Time Needs', reads: 1420, category: 'Communication', time: '4 min read' },
    { id: 2, title: 'Understanding Your Pay Structure', reads: 890, category: 'Compensation', time: '6 min read' },
    { id: 3, title: 'Building a Relationship with Dispatch', reads: 2100, category: 'Operations', time: '5 min read' },
];

export default function RetentionPage() {
    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--neu-text)' }}>Retention Center</h1>
                <p className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>Career Coaching · Best Practices</p>
            </div>

            <Card elevation="lg" className="!p-4 sm:!p-5" style={{ background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)' }}>
                <div className="flex items-start justify-between mb-3 text-white">
                    <div>
                        <h2 className="text-[15px] font-black tracking-tight leading-tight">Career Health Check</h2>
                        <p className="text-[11px] font-bold opacity-80 mt-0.5">Your relationship with Swift Transportation is strong.</p>
                    </div>
                    <span className="material-symbols-outlined text-[28px] opacity-90">health_and_safety</span>
                </div>

                <div className="bg-white/10 rounded-xl p-3 mb-3">
                    <div className="flex justify-between items-center text-white mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider">Satisfaction Index</span>
                        <span className="text-[12px] font-black">92%</span>
                    </div>
                    <div className="h-2 rounded-full bg-black/20 overflow-hidden">
                        <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: '92%' }}></div>
                    </div>
                </div>

                <button className="w-full py-2.5 rounded-xl bg-white text-[12px] font-bold active:scale-[0.98] transition-transform" style={{ color: 'var(--neu-accent)' }}>
                    Request Career Review
                </button>
            </Card>

            <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--neu-text-muted)' }}>
                        Retention Best Practices
                    </p>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--neu-accent)' }}>View All</span>
                </div>

                <div className="space-y-3">
                    {bestPractices.map((bp) => (
                        <Card key={bp.id} elevation="sm" className="!p-3.5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center neu-x shrink-0">
                                <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--neu-accent)' }}>auto_stories</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold mb-1 truncate" style={{ color: 'var(--neu-text)' }}>{bp.title}</p>
                                <div className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                                    <span className="px-1.5 py-0.5 rounded-sm bg-[var(--neu-bg-soft)] font-bold">{bp.category}</span>
                                    <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">visibility</span> {bp.reads}</span>
                                    <span>{bp.time}</span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-[14px]" style={{ color: 'var(--neu-text-muted)' }}>arrow_forward</span>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
