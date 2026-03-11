'use client';

interface DriverTopBannerProps {
    onOpenNav: () => void;
    onOpenChat: () => void;
}

export function DriverTopBanner({ onOpenNav, onOpenChat }: DriverTopBannerProps) {
    return (
        <div
            className="sticky top-0 z-40 w-full px-3 py-1.5 flex items-center justify-between shadow-md"
            style={{
                background: 'linear-gradient(90deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
            }}
        >
            {/* Left Menu Toggle */}
            <button
                onClick={onOpenNav}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all text-white"
                aria-label="Open Navigation"
            >
                <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>

            {/* Decorative center element or Logo text could go here, keeping simple for now */}
            <span className="text-[10px] uppercase font-black tracking-widest text-white/50">DriverOS</span>

            {/* Right AI/Chat Toggle */}
            <button
                onClick={onOpenChat}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all text-white relative"
                aria-label="Open AI Assistant"
            >
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                {/* Subtle dot indicator */}
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white opacity-80" />
            </button>
        </div>
    );
}
