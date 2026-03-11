'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
// TODO: wire to referrals server action when available
import { useApi } from '@/lib/hooks';

export default function ReferralsPage() {
    const [activeTab, setActiveTab] = useState('Submit');
    const [friendName, setFriendName] = useState('');
    const [friendPhone, setFriendPhone] = useState('');
    const [friendEmail, setFriendEmail] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedCdl, setUploadedCdl] = useState(false);

    // Mock API hook call pattern
    const handleUploadClick = () => {
        setIsUploading(true);
        // Simulate OCR processing time
        setTimeout(() => {
            setIsUploading(false);
            setUploadedCdl(true);
            setFriendName('John Doe'); // Simulated OCR extraction
        }, 2000);
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div>
                <h1 className="text-xl font-extrabold" style={{ color: 'var(--neu-text)' }}>Refer a Driver</h1>
                <p className="text-[12px]" style={{ color: 'var(--neu-text-muted)' }}>Help friends find jobs & earn up to 1,500 XP</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {['Submit', 'My Referrals'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className="flex-1 py-2 rounded-xl text-[11px] font-bold transition-all duration-200"
                        style={
                            activeTab === t
                                ? { background: 'var(--neu-accent)', color: '#fff' }
                                : { background: 'var(--neu-bg-soft)', color: 'var(--neu-text-muted)' }
                        }
                    >
                        {t}
                    </button>
                ))}
            </div>

            {activeTab === 'Submit' && (
                <div className="space-y-4 animate-fade-up">
                    {/* Rewards Banner */}
                    <Card elevation="md" className="!p-4" style={{ background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)' }}>
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <span className="text-[20px] font-black">🎁</span>
                            </div>
                            <div>
                                <p className="text-[13px] font-black leading-tight">Earn XP for every referral</p>
                                <p className="text-[10px] font-bold opacity-80 mt-0.5">200 XP per signup • 500 XP per hire</p>
                            </div>
                        </div>
                    </Card>

                    {/* Upload CDL Section */}
                    <Card elevation="lg" className="!p-4 space-y-3">
                        <div>
                            <p className="text-[13px] font-bold" style={{ color: 'var(--neu-text)' }}>Fast Track: Upload their CDL</p>
                            <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>We'll automatically extract their information using AI.</p>
                        </div>

                        {!uploadedCdl ? (
                            <button
                                onClick={handleUploadClick}
                                disabled={isUploading}
                                className="w-full h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all"
                                style={{
                                    borderColor: isUploading ? 'var(--neu-accent)' : 'var(--neu-border)',
                                    background: 'var(--neu-bg-soft)'
                                }}
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--neu-accent) transparent transparent transparent' }}></div>
                                        <span className="text-[10px] font-bold" style={{ color: 'var(--neu-accent)' }}>Extracting details with OCR...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--neu-accent)', color: '#fff' }}>
                                            <span className="material-symbols-outlined text-[16px]">add_a_photo</span>
                                        </div>
                                        <span className="text-[11px] font-bold" style={{ color: 'var(--neu-text-muted)' }}>Tap to take a photo of CDL front</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="w-full p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--neu-bg-soft)', border: '1px solid #10b981' }}>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px] text-green-500">check_circle</span>
                                    <div>
                                        <p className="text-[11px] font-bold" style={{ color: 'var(--neu-text)' }}>CDL Extracted Successfully</p>
                                        <p className="text-[9px]" style={{ color: 'var(--neu-text-muted)' }}>Information mapped below.</p>
                                    </div>
                                </div>
                                <button onClick={() => setUploadedCdl(false)} className="text-[10px] font-bold text-red-500">Remove</button>
                            </div>
                        )}
                    </Card>

                    {/* Manual Entry Form */}
                    <Card elevation="lg" className="!p-4 space-y-3">
                        <p className="text-[13px] font-bold" style={{ color: 'var(--neu-text)' }}>Friend's Details</p>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--neu-text-muted)' }}>Full Name</label>
                            <div className="neu-in rounded-xl px-3 py-2 flex items-center">
                                <span className="material-symbols-outlined text-[16px] mr-2" style={{ color: 'var(--neu-text-muted)' }}>person</span>
                                <input
                                    type="text"
                                    placeholder="e.g. Mike Rodriguez"
                                    value={friendName}
                                    onChange={(e) => setFriendName(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-[13px] font-semibold"
                                    style={{ color: 'var(--neu-text)' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--neu-text-muted)' }}>Phone Number</label>
                            <div className="neu-in rounded-xl px-3 py-2 flex items-center">
                                <span className="material-symbols-outlined text-[16px] mr-2" style={{ color: 'var(--neu-text-muted)' }}>call</span>
                                <input
                                    type="tel"
                                    placeholder="(555) 123-4567"
                                    value={friendPhone}
                                    onChange={(e) => setFriendPhone(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-[13px] font-semibold"
                                    style={{ color: 'var(--neu-text)' }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--neu-text-muted)' }}>Email Address (Optional)</label>
                            <div className="neu-in rounded-xl px-3 py-2 flex items-center">
                                <span className="material-symbols-outlined text-[16px] mr-2" style={{ color: 'var(--neu-text-muted)' }}>mail</span>
                                <input
                                    type="email"
                                    placeholder="friend@example.com"
                                    value={friendEmail}
                                    onChange={(e) => setFriendEmail(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-[13px] font-semibold"
                                    style={{ color: 'var(--neu-text)' }}
                                />
                            </div>
                        </div>

                        <button
                            className="w-full py-3 rounded-xl text-[12px] font-bold active:scale-[0.98] transition-transform shadow-md mt-2"
                            style={{ background: 'var(--neu-accent)', color: '#fff' }}
                        >
                            Send Referral Invite
                        </button>
                        <p className="text-[9px] text-center px-4" style={{ color: 'var(--neu-text-muted)' }}>
                            We'll send them a text message with your unique referral code.
                        </p>
                    </Card>
                </div>
            )}

            {activeTab === 'My Referrals' && (
                <div className="space-y-3 animate-fade-up">
                    <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--neu-text-muted)' }}>
                        Track Your Invites
                    </p>

                    {[
                        { name: 'Sarah Chen', status: 'Hired', date: 'Mar 1, 2026', xp: '+500 XP' },
                        { name: 'Marcus Jones', status: 'Applied', date: 'Mar 5, 2026', xp: '+200 XP' },
                        { name: 'Alex Rivera', status: 'Invited', date: 'Yesterday', xp: 'Pending...' },
                    ].map((ref, i) => (
                        <Card key={i} elevation="sm" className="!p-3.5 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full neu-x flex items-center justify-center shrink-0">
                                <span className="text-[12px] font-black" style={{ color: 'var(--neu-text-muted)' }}>
                                    {ref.name.split(' ').map(n => n[0]).join('')}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-bold" style={{ color: 'var(--neu-text)' }}>{ref.name}</p>
                                <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>{ref.date}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] font-black" style={{ color: ref.status === 'Hired' ? 'var(--neu-accent)' : (ref.status === 'Applied' ? '#10b981' : 'var(--neu-text-muted)') }}>
                                    {ref.status}
                                </p>
                                <p className="text-[9px] font-bold mt-0.5" style={{ color: ref.status === 'Invited' ? 'var(--neu-text-muted)' : 'var(--neu-accent)' }}>
                                    {ref.xp}
                                </p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
