'use client';

import { useState } from 'react';
import { Card } from '@/components/ui';
import { applyToJob } from '@/app/(driver)/actions/cockpit';

const DEMO_DRIVER_ID = 'demo-driver-001';

interface AiApplicationModalProps {
    carrier: {
        carrierId?: string;
        carrierName: string;
        dotNumber?: number;
        score?: number;
        // Legacy mock fields
        name?: string;
        route?: string;
    };
    onClose: () => void;
    onComplete: () => void;
}

export default function AiApplicationModal({ carrier, onClose, onComplete }: AiApplicationModalProps) {
    const [step, setStep] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Step 2 OCR specific state
    const [uploadedCdl, setUploadedCdl] = useState(false);

    const carrierName = carrier.carrierName ?? carrier.name ?? 'Unknown Carrier';
    const carrierDot = carrier.dotNumber ? String(carrier.dotNumber) : (carrier.carrierId ?? '');

    const totalSteps = 4; // Contact -> Documents -> Safety -> Submit

    const handleNext = () => setStep(s => Math.min(s + 1, totalSteps));
    const handlePrev = () => setStep(s => Math.max(s - 1, 1));

    const handleUploadClick = () => {
        setIsUploading(true);
        // CDL upload is still simulated — real OCR endpoint not yet available
        setTimeout(() => {
            setIsUploading(false);
            setUploadedCdl(true);
        }, 2000);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const result = await applyToJob(DEMO_DRIVER_ID, carrierDot);
            if ((result as any)?.success === false) {
                throw new Error('Application was not accepted. Please try again.');
            }
            setSubmitSuccess(true);
            // Brief delay to show success state before closing
            setTimeout(() => {
                onComplete();
            }, 1500);
        } catch (err: any) {
            console.error('[AiApplicationModal] Apply failed:', err);
            setSubmitError(err?.message ?? 'Failed to submit application. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }}>
            <Card elevation="xs" className="w-full max-w-lg max-h-[90vh] flex flex-col !p-0 overflow-hidden relative" style={{ background: 'var(--neu-bg)' }}>
                {/* Header */}
                <div className="p-4 flex items-center justify-between" style={{ background: '#0f172a' }}>
                    <div>
                        <h3 className="text-[16px] font-black text-white">Express Apply</h3>
                        <p className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>
                            {carrierName}
                            {carrier.dotNumber ? ` • DOT ${carrier.dotNumber}` : ''}
                        </p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-all bg-white/10 text-white hover:bg-white/20">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1" style={{ background: '#334155' }}>
                    <div className="h-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%`, background: '#2563eb' }}></div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-grow" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-right">
                            <h4 className="text-[14px] font-black mb-4" style={{ color: '#0f172a' }}>Contact Information</h4>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold" style={{ color: '#475569' }}>Full Name</label>
                                    <input type="text" className="w-full py-2 px-3 rounded-xl text-[13px] outline-none" placeholder="John Doe"
                                           style={{ background: 'var(--neu-bg-soft)', border: '1px solid var(--neu-border)' }} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold" style={{ color: '#475569' }}>Phone Number</label>
                                    <input type="tel" className="w-full py-2 px-3 rounded-xl text-[13px] outline-none" placeholder="(555) 123-4567"
                                           style={{ background: 'var(--neu-bg-soft)', border: '1px solid var(--neu-border)' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4 animate-fade-right">
                            <h4 className="text-[14px] font-black mb-2" style={{ color: '#0f172a' }}>CDL Verification</h4>
                            <p className="text-[11px] font-medium mb-4" style={{ color: '#475569' }}>We use AI to automatically extract your details securely.</p>

                            {!uploadedCdl ? (
                                <button
                                    onClick={handleUploadClick}
                                    disabled={isUploading}
                                    className="w-full h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all"
                                    style={{
                                        borderColor: isUploading ? '#2563eb' : 'var(--neu-border)',
                                        background: 'var(--neu-bg-soft)'
                                    }}
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#2563eb transparent transparent transparent' }}></div>
                                            <span className="text-[11px] font-bold" style={{ color: '#2563eb' }}>Scanning Details with OCR...</span>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#2563eb', color: '#fff' }}>
                                                <span className="material-symbols-outlined text-[20px]">add_a_photo</span>
                                            </div>
                                            <span className="text-[12px] font-bold" style={{ color: '#475569' }}>Tap to capture CDL Front</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="w-full p-4 rounded-xl flex items-center justify-between" style={{ background: 'var(--neu-bg-soft)', border: '1px solid #10b981' }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <span className="material-symbols-outlined text-[20px] text-emerald-600">check</span>
                                        </div>
                                        <div>
                                            <p className="text-[12px] font-bold text-emerald-700">CDL Processed Successfully</p>
                                            <p className="text-[10px] font-medium text-emerald-600 mt-0.5">Details extracted and secure</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setUploadedCdl(false)} className="text-[11px] font-bold text-[#475569] hover:underline">Retake</button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4 animate-fade-right">
                            <h4 className="text-[14px] font-black mb-4" style={{ color: '#0f172a' }}>Experience & Safety</h4>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold" style={{ color: '#475569' }}>Total Years Driving (Class A)</label>
                                    <select className="w-full py-2 px-3 rounded-xl text-[13px] outline-none"
                                            style={{ background: 'var(--neu-bg-soft)', border: '1px solid var(--neu-border)' }}>
                                        <option>0-1 Years</option>
                                        <option>1-3 Years</option>
                                        <option>3-5 Years</option>
                                        <option>5+ Years</option>
                                    </select>
                                </div>
                                <div className="space-y-1 mt-4">
                                    <label className="text-[11px] font-bold" style={{ color: '#475569' }}>Moving Violations (Last 3 Yrs)</label>
                                    <select className="w-full py-2 px-3 rounded-xl text-[13px] outline-none"
                                            style={{ background: 'var(--neu-bg-soft)', border: '1px solid var(--neu-border)' }}>
                                        <option>0</option>
                                        <option>1</option>
                                        <option>2</option>
                                        <option>3+</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 4 && !submitSuccess && (
                        <div className="space-y-4 animate-fade-right text-center flex flex-col items-center py-6">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#dbeafe', color: '#1e40af' }}>
                                <span className="material-symbols-outlined text-[32px]">task_alt</span>
                            </div>
                            <h4 className="text-[16px] font-black" style={{ color: '#0f172a' }}>Ready to Submit!</h4>
                            <p className="text-[12px] font-medium max-w-xs" style={{ color: '#475569' }}>
                                By submitting, {carrierName} will be notified immediately of your interest. Expected response time: <strong style={{ color: '#0f172a' }}>24 hrs</strong>.
                            </p>
                            {submitError && (
                                <div className="w-full p-3 rounded-xl mt-2" style={{ background: '#fef2f2', border: '1px solid #fca5a5' }}>
                                    <p className="text-[11px] font-bold" style={{ color: '#dc2626' }}>{submitError}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 4 && submitSuccess && (
                        <div className="space-y-4 animate-fade-right text-center flex flex-col items-center py-6">
                            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: '#dcfce7', color: '#16a34a' }}>
                                <span className="material-symbols-outlined text-[32px]">check_circle</span>
                            </div>
                            <h4 className="text-[16px] font-black" style={{ color: '#16a34a' }}>Application Sent!</h4>
                            <p className="text-[12px] font-medium max-w-xs" style={{ color: '#475569' }}>
                                Your application to {carrierName} has been submitted successfully.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 pt-3 flex items-center justify-between border-t border-[var(--neu-border)] bg-[var(--neu-bg)]">
                    <button
                        onClick={handlePrev}
                        disabled={step === 1 || isSubmitting || submitSuccess}
                        className={`text-[12px] font-bold px-4 py-2 transition-all ${step === 1 || submitSuccess ? 'opacity-30' : 'hover:text-[#2563eb]'}`}
                        style={{ color: '#475569' }}
                    >
                        Back
                    </button>

                    {step < totalSteps ? (
                        <button
                            onClick={handleNext}
                            className="bg-[#2563eb] text-white text-[12px] font-black px-6 py-2.5 rounded-xl transition-all hover:-translate-y-0.5"
                            style={{ boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)' }}
                        >
                            Next Step
                        </button>
                    ) : submitSuccess ? (
                        <button
                            onClick={onClose}
                            className="bg-[#16a34a] text-white text-[12px] font-black px-6 py-2.5 rounded-xl transition-all"
                        >
                            Done
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-[#fbbf24] text-[#0f172a] text-[12px] font-black px-6 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                            style={{ boxShadow: '0 4px 6px -1px rgba(251, 191, 36, 0.4)' }}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[14px]">send</span>
                                    Submit Application
                                </>
                            )}
                        </button>
                    )}
                </div>
            </Card>
        </div>
    );
}
