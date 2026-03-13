'use client';

interface AdminTopBannerProps {
  onOpenNav: () => void;
  onOpenCopilot: () => void;
}

export function AdminTopBanner({ onOpenNav, onOpenCopilot }: AdminTopBannerProps) {
  return (
    <div
      className="sticky top-0 z-40 w-full px-3 py-1.5 flex items-center justify-between shadow-md"
      style={{
        background: 'linear-gradient(90deg, var(--neu-accent) 0%, var(--neu-accent-deep) 100%)',
      }}
    >
      <button
        onClick={onOpenNav}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all text-white"
        aria-label="Open Admin Navigation"
      >
        <span className="material-symbols-outlined text-[20px]">menu</span>
      </button>

      <span className="text-[10px] uppercase font-black tracking-widest text-white/60">
        AdminOS
      </span>

      <button
        onClick={onOpenCopilot}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all text-white relative"
        aria-label="Open Admin Copilot"
      >
        <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-white opacity-80" />
      </button>
    </div>
  );
}
