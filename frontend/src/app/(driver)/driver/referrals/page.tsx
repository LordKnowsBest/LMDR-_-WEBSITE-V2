'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui';
import { submitReferral, getReferrals, type Referral } from '../../actions/referrals';
import { getSignedUploadUrl, uploadDocument, extractDocument } from '../../actions/documents';
import { awardXP } from '../../actions/gamification';

const DEMO_DRIVER_ID = 'demo-driver-001';

export default function ReferralsPage() {
    const [activeTab, setActiveTab] = useState('Submit');
    const [friendName, setFriendName] = useState('');
    const [friendPhone, setFriendPhone] = useState('');
    const [friendEmail, setFriendEmail] = useState('');
    const [cdlClass, setCdlClass] = useState('');
    const [notes, setNotes] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedCdl, setUploadedCdl] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [error, setError] = useState('');
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [loadingReferrals, setLoadingReferrals] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadReferrals = useCallback(async () => {
        setLoadingReferrals(true);
        try {
            const result = await getReferrals(DEMO_DRIVER_ID);
            setReferrals(result.referrals || []);
        } catch {
            // Silently handle — may not have referrals yet
        } finally {
            setLoadingReferrals(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === 'My Referrals') {
            loadReferrals();
        }
    }, [activeTab, loadReferrals]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        setError('');

        try {
            // Convert file to base64 for OCR
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    const result = reader.result as string;
                    // Strip the data:image/...;base64, prefix
                    const base64Data = result.split(',')[1] || result;
                    resolve(base64Data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            // Run OCR extraction
            const ocrResult = await extractDocument(base64, 'CDL_FRONT');

            // Populate form from extracted data
            const extracted = ocrResult.extracted || {};
            if (extracted.full_name) setFriendName(extracted.full_name as string);
            if (extracted.first_name && extracted.last_name) {
                setFriendName(`${extracted.first_name} ${extracted.last_name}`);
            }
            if (extracted.cdl_class) setCdlClass(extracted.cdl_class as string);

            // Also upload the document to storage
            try {
                const uploadUrl = await getSignedUploadUrl(
                    `referral-cdl-${Date.now()}-${file.name}`,
                    file.type || 'image/jpeg'
                );
                // Upload the file to signed URL
                await fetch(uploadUrl.url, {
                    method: 'PUT',
                    headers: { 'Content-Type': file.type || 'image/jpeg' },
                    body: file,
                });
                await uploadDocument(DEMO_DRIVER_ID, {
                    docType: 'referral_cdl',
                    fileName: file.name,
                    fileUrl: uploadUrl.filePath,
                });
            } catch {
                // Upload is optional — OCR extraction is the main value
            }

            setUploadedCdl(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'OCR extraction failed. Please enter details manually.');
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmitReferral = async () => {
        if (!friendName.trim() || !friendPhone.trim()) {
            setError('Name and phone number are required.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            await submitReferral(DEMO_DRIVER_ID, {
                name: friendName.trim(),
                phone: friendPhone.trim(),
                email: friendEmail.trim() || undefined,
                cdlClass: cdlClass.trim() || undefined,
                notes: notes.trim() || undefined,
            });

            // Award XP for referral
            try {
                await awardXP(DEMO_DRIVER_ID, 'referral_submitted');
            } catch {
                // XP award is non-blocking
            }

            setSubmitSuccess(true);
            // Reset form after short delay
            setTimeout(() => {
                setFriendName('');
                setFriendPhone('');
                setFriendEmail('');
                setCdlClass('');
                setNotes('');
                setUploadedCdl(false);
                setSubmitSuccess(false);
            }, 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to submit referral. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'hired': return 'var(--neu-accent)';
            case 'applied': return '#10b981';
            case 'invited':
            default: return 'var(--neu-text-muted)';
        }
    };

    const getXpLabel = (status: string) => {
        switch (status) {
            case 'hired': return '+500 XP';
            case 'applied': return '+200 XP';
            default: return 'Pending...';
        }
    };

    return (
        <div className="space-y-4">
            {/* Hidden file input for CDL upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelected}
            />

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

            {/* Error banner */}
            {error && (
                <div className="p-3 rounded-xl text-[11px] font-bold text-red-600" style={{ background: 'rgba(239,68,68,0.1)' }}>
                    {error}
                </div>
            )}

            {activeTab === 'Submit' && (
                <div className="space-y-4 animate-fade-up">
                    {/* Success banner */}
                    {submitSuccess && (
                        <Card elevation="md" className="!p-4" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                            <div className="flex items-center gap-3 text-white">
                                <span className="material-symbols-outlined text-[24px]">check_circle</span>
                                <div>
                                    <p className="text-[13px] font-black">Referral Sent!</p>
                                    <p className="text-[10px] font-bold opacity-80">XP has been awarded to your account.</p>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Rewards Banner */}
                    <Card elevation="md" className="!p-4" style={{ background: 'linear-gradient(135deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)' }}>
                        <div className="flex items-center gap-3 text-white">
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[20px]">redeem</span>
                            </div>
                            <div>
                                <p className="text-[13px] font-black leading-tight">Earn XP for every referral</p>
                                <p className="text-[10px] font-bold opacity-80 mt-0.5">200 XP per signup - 500 XP per hire</p>
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

                        <div>
                            <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--neu-text-muted)' }}>CDL Class (Optional)</label>
                            <div className="neu-in rounded-xl px-3 py-2 flex items-center">
                                <span className="material-symbols-outlined text-[16px] mr-2" style={{ color: 'var(--neu-text-muted)' }}>badge</span>
                                <input
                                    type="text"
                                    placeholder="e.g. Class A"
                                    value={cdlClass}
                                    onChange={(e) => setCdlClass(e.target.value)}
                                    className="w-full bg-transparent border-none outline-none text-[13px] font-semibold"
                                    style={{ color: 'var(--neu-text)' }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmitReferral}
                            disabled={isSubmitting || !friendName.trim() || !friendPhone.trim()}
                            className="w-full py-3 rounded-xl text-[12px] font-bold active:scale-[0.98] transition-transform shadow-md mt-2 disabled:opacity-50"
                            style={{ background: 'var(--neu-accent)', color: '#fff' }}
                        >
                            {isSubmitting ? 'Sending...' : 'Send Referral Invite'}
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

                    {loadingReferrals ? (
                        <div className="flex justify-center py-8">
                            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--neu-accent) transparent transparent transparent' }}></div>
                        </div>
                    ) : referrals.length === 0 ? (
                        <Card elevation="sm" className="!p-6 text-center">
                            <span className="material-symbols-outlined text-[32px] mb-2" style={{ color: 'var(--neu-text-muted)' }}>group_add</span>
                            <p className="text-[12px] font-bold" style={{ color: 'var(--neu-text)' }}>No referrals yet</p>
                            <p className="text-[10px] mt-1" style={{ color: 'var(--neu-text-muted)' }}>Submit your first referral to start earning XP!</p>
                        </Card>
                    ) : (
                        referrals.map((ref) => (
                            <Card key={ref._id} elevation="sm" className="!p-3.5 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full neu-x flex items-center justify-center shrink-0">
                                    <span className="text-[12px] font-black" style={{ color: 'var(--neu-text-muted)' }}>
                                        {ref.referred_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-bold" style={{ color: 'var(--neu-text)' }}>{ref.referred_name}</p>
                                    <p className="text-[10px]" style={{ color: 'var(--neu-text-muted)' }}>
                                        {new Date(ref._createdAt || ref.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-black capitalize" style={{ color: getStatusColor(ref.status) }}>
                                        {ref.status}
                                    </p>
                                    <p className="text-[9px] font-bold mt-0.5" style={{ color: ref.status === 'invited' ? 'var(--neu-text-muted)' : 'var(--neu-accent)' }}>
                                        {getXpLabel(ref.status)}
                                    </p>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
