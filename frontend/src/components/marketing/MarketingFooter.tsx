'use client';

import { useEffect, useRef, useState } from 'react';

type FooterLink = {
  label: string;
  href: string;
};

type FooterGroup = {
  title: string;
  accent: string;
  icon: string;
  links: FooterLink[];
  cta?: FooterLink;
};

const DRIVER_LINK = 'https://www.lastmiledr.app/ai-matching';
const DRIVER_HUB_LINK = 'https://www.lastmiledr.app/drivers';
const CARRIER_LINK = 'https://www.lastmiledr.app/carriers-driver-recruiting';
const PRICING_LINK = 'https://www.lastmiledr.app/pricing';
const PHONE_LINK = 'tel:+12145313751';
const PRIVACY_LINK = 'https://www.lastmiledr.app/privacy-policy';
const ABOUT_LINK = 'https://www.lastmiledr.app/about';
const SITEMAP_LINK = 'https://www.lastmiledr.app/sitemap.xml';

const STATS = [
  { target: 200, suffix: 'K+', accent: 'text-white', label: 'Verified Drivers' },
  { target: 48, prefix: '<', suffix: 'h', accent: 'text-amber-400', label: 'Placement Time' },
  { target: 98, suffix: '%', accent: 'text-white', label: 'Retention Rate' },
  { target: 30, suffix: '-Day', accent: 'text-blue-400', label: 'Guarantee' },
];

const FOOTER_GROUPS: FooterGroup[] = [
  {
    title: 'CDL Drivers',
    accent: 'text-amber-400 border-amber-400/20',
    icon: 'local_shipping',
    links: [
      { label: 'Driver Hub', href: DRIVER_HUB_LINK },
      { label: 'Apply for Jobs', href: DRIVER_LINK },
      { label: 'OTR Placement', href: 'https://www.lastmiledr.app/cdl-driver-placement-nationwide' },
      { label: 'Regional Jobs', href: 'https://www.lastmiledr.app/regional-cdl-driver-jobs' },
      { label: 'CDL Job Hub', href: 'https://www.lastmiledr.app/cdl-driver-job-hub' },
    ],
  },
  {
    title: 'Carriers',
    accent: 'text-blue-400 border-blue-400/20',
    icon: 'groups',
    links: [
      { label: 'Carrier Recruiting', href: CARRIER_LINK },
      { label: 'Carrier Welcome', href: 'https://www.lastmiledr.app/carrier-welcome' },
      { label: 'View Pricing', href: PRICING_LINK },
      { label: 'DOT Compliance', href: 'https://www.lastmiledr.app/dot-compliance-assessment' },
    ],
    cta: { label: 'Get Drivers', href: CARRIER_LINK },
  },
  {
    title: 'Insights',
    accent: 'text-purple-400 border-purple-400/20',
    icon: 'lightbulb',
    links: [
      { label: 'Main Blog', href: 'https://www.lastmiledr.app/insights' },
      { label: 'Retention Crisis', href: 'https://www.lastmiledr.app/why-truck-drivers-quit-90-days-retention-crisis' },
      { label: 'The Great CDL Purge', href: 'https://www.lastmiledr.app/post/the-great-cdl-purge-how-3-000-school-closures-just-lit-the-fuse-on-trucking-s-perfect-storm' },
      { label: 'AI Recruitment', href: 'https://www.lastmiledr.app/post/revolutionizing-cdl-recruitment-with-ai' },
      { label: 'Texas CDL Guide', href: 'https://www.lastmiledr.app/post/your-complete-guide-to-getting-a-cdl-in-texas-requirements-costs-and-timeline' },
    ],
  },
  {
    title: 'Company',
    accent: 'text-slate-500 border-slate-700',
    icon: 'info',
    links: [
      { label: 'Home', href: 'https://www.lastmiledr.app' },
      { label: 'About LMDR', href: ABOUT_LINK },
      { label: 'Privacy Policy', href: PRIVACY_LINK },
      { label: 'Quick Apply', href: DRIVER_LINK },
    ],
  },
];

const DIRECTORY_GROUPS = [
  {
    title: 'Job Categories',
    accent: 'hover:text-amber-400',
    links: [
      { label: 'Regional CDL Jobs', href: 'https://www.lastmiledr.app/regional-cdl-driver-jobs' },
      { label: 'Nationwide OTR Jobs', href: 'https://www.lastmiledr.app/cdl-driver-placement-nationwide' },
      { label: 'CDL Job Hub', href: 'https://www.lastmiledr.app/cdl-driver-job-hub' },
      { label: 'Rapid Response', href: 'https://www.lastmiledr.app/cdl-a-b-rapid-response' },
      { label: 'Driver Portal', href: DRIVER_HUB_LINK },
    ],
  },
  {
    title: 'Popular Locations',
    accent: 'hover:text-blue-400',
    links: [
      { label: 'Fort Worth, TX', href: 'https://www.lastmiledr.app/driver-jobs/full-time/regional/tx/fort-worth' },
      { label: 'Houston, TX', href: 'https://www.lastmiledr.app/driver-jobs/full-time/regional/tx/houston' },
      { label: 'Dallas, TX', href: 'https://www.lastmiledr.app/driver-jobs/full-time/regional/tx/dallas' },
      { label: 'Arlington, TX', href: 'https://www.lastmiledr.app/driver-jobs/full-time/regional/tx/arlington' },
      { label: 'Shreveport, LA', href: 'https://www.lastmiledr.app/driver-jobs/full-time/regional/louisiana/hiring-in-shreveport' },
    ],
  },
  {
    title: 'Featured Articles',
    accent: 'hover:text-purple-400',
    links: [
      { label: 'Fix Retention Crisis', href: 'https://www.lastmiledr.app/post/last-mile-driver-recruiting-can-fix-your-retention-crisis' },
      { label: 'Quality Crisis', href: 'https://www.lastmiledr.app/post/the-quality-crisis-carriers-can-t-ignore-why-your-driver-shortage-isn-t-about-numbers' },
      { label: 'Health on the Road', href: 'https://www.lastmiledr.app/post/the-10-minute-ritual-that-could-save-your-life-and-your-cdl' },
      { label: 'AI-Driven Recruiting', href: 'https://www.lastmiledr.app/post/ai-data-driven-truck-driver-recruiting-2025' },
      { label: 'Dallas CDL Guide', href: 'https://www.lastmiledr.app/post/dallas-cdl-jobs-the-complete-2025-market-analysis-salary-guide' },
    ],
  },
  {
    title: 'Resources',
    accent: 'hover:text-emerald-400',
    links: [
      { label: 'Industry News', href: 'https://www.lastmiledr.app/insights' },
      { label: 'DOT Assessment', href: 'https://www.lastmiledr.app/dot-compliance-assessment' },
      { label: 'Carrier Welcome', href: 'https://www.lastmiledr.app/carrier-welcome' },
      { label: 'Our Mission', href: ABOUT_LINK },
      { label: 'XML Sitemap', href: SITEMAP_LINK },
    ],
  },
];

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function FooterAnchor({
  href,
  label,
  className = '',
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {label}
    </a>
  );
}

export function MarketingFooter() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [counts, setCounts] = useState<number[]>(() => STATS.map(() => 0));

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          setVisible(true);
          observer.disconnect();
        });
      },
      { threshold: 0.12 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;

    const start = performance.now();
    const duration = 1800;
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCounts(STATS.map((stat) => Math.round(stat.target * progress)));
      if (progress < 1) {
        frame = window.requestAnimationFrame(tick);
      }
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [visible]);

  return (
    <footer ref={rootRef} className="relative overflow-hidden bg-slate-900 text-white">
      <style jsx>{`
        .perspective-grid {
          background-size: 50px 50px;
          background-image:
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
          transform: perspective(500px) rotateX(60deg);
          transform-origin: top center;
          animation: gridMove 20s linear infinite;
        }

        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 1000px; }
        }

        .driver-gradient {
          background: linear-gradient(135deg, #f9ff80 0%, #ffd700 100%);
        }

        .btn-shine {
          position: relative;
          overflow: hidden;
        }

        .btn-shine::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
          transform: skewX(-25deg);
          animation: shineSweep 3s infinite;
        }

        @keyframes shineSweep {
          0% { left: -100%; }
          20% { left: 200%; }
          100% { left: 200%; }
        }

        .hover-card {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .hover-card:hover {
          transform: translateY(-8px);
        }
      `}</style>

      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30">
        <div className="perspective-grid absolute -left-1/2 -top-1/2 h-[200%] w-[200%]" />
      </div>
      <div className="pointer-events-none absolute left-0 top-0 h-[500px] w-[500px] animate-pulse rounded-full bg-blue-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[500px] w-[500px] animate-pulse rounded-full bg-yellow-400/10 blur-[100px]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />

      <section className="relative z-10 border-b border-slate-800/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 lg:gap-12">
          <div className="hover-card group relative overflow-hidden rounded-3xl border border-slate-700 bg-slate-800/40 p-8 backdrop-blur-md hover:border-amber-400 hover:shadow-[0_0_30px_rgba(251,191,36,0.15)]">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl transition-all duration-500 group-hover:bg-amber-400/20" />
            <div className="relative z-10">
              <span className="inline-block rounded-full bg-amber-400 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-900 shadow-lg shadow-amber-400/20">
                For Drivers
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight lg:text-4xl">
                Better Routes. <br />
                <span className="text-amber-400">Better Pay.</span>
              </h2>
              <p className="mt-3 text-lg font-light leading-relaxed text-gray-400">
                AI-matched to carriers that fit your life. Apply once, get matched fast.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <FooterAnchor
                  href={DRIVER_LINK}
                  label='Apply Now'
                  className='btn-shine rounded-xl bg-amber-400 px-6 py-4 text-center font-bold text-slate-900 shadow-lg shadow-amber-400/20 transition-all hover:scale-[1.02] hover:bg-amber-300'
                />
                <FooterAnchor
                  href={PHONE_LINK}
                  label='(214) 531-3751'
                  className='rounded-xl border border-slate-600 bg-slate-700/50 px-6 py-4 text-center font-bold text-white backdrop-blur-sm transition-all hover:border-slate-500 hover:bg-slate-600'
                />
              </div>
            </div>
          </div>

          <div className="hover-card group relative overflow-hidden rounded-3xl border border-slate-600 bg-white/5 p-8 backdrop-blur-md hover:border-blue-500 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(37,99,235,0.2)]">
            <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-blue-600/20 blur-2xl transition-all duration-500 group-hover:bg-blue-600/30" />
            <div className="relative z-10">
              <span className="inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-blue-600/30">
                For Carriers
              </span>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white lg:text-4xl">
                Stop Losing <br />
                <span className="text-blue-400">$500/Day</span>
              </h2>
              <p className="mt-3 text-lg font-light leading-relaxed text-slate-300">
                Pre-qualified CDL-A drivers delivered in 48 hours. 30-day guarantee.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <FooterAnchor
                  href={CARRIER_LINK}
                  label='Get Drivers'
                  className='btn-shine rounded-xl bg-blue-600 px-6 py-4 text-center font-bold text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] hover:bg-blue-500'
                />
                <FooterAnchor
                  href={PRICING_LINK}
                  label='View Pricing'
                  className='rounded-xl border border-slate-500 bg-transparent px-6 py-4 text-center font-bold text-white backdrop-blur-sm transition-all hover:border-white hover:bg-white/5'
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-b border-slate-800 bg-slate-900/50 py-10 backdrop-blur-sm">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 text-center md:grid-cols-4">
          {STATS.map((stat, index) => (
            <div key={stat.label} className='group border-l border-slate-800/50 first:border-l-0'>
              <p className={`text-4xl font-black transition-colors group-hover:text-blue-200 lg:text-5xl ${stat.accent}`}>
                {stat.prefix || ''}
                {counts[index]}
                {stat.suffix || ''}
              </p>
              <p className='mt-2 text-xs font-bold uppercase tracking-widest text-slate-500'>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-5 lg:gap-12">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <a href="https://www.lastmiledr.app" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3">
              <div className="driver-gradient flex h-12 w-12 items-center justify-center rounded-xl shadow-[0_0_15px_rgba(251,191,36,0.5)] transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_25px_rgba(251,191,36,0.8)]">
                <span className="text-lg font-black text-slate-900">LM</span>
              </div>
              <div>
                <p className="text-lg font-black leading-tight text-white transition-colors group-hover:text-blue-300">Last Mile</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Driver Recruiting</p>
              </div>
            </a>
            <p className="mt-4 text-sm font-light leading-relaxed text-gray-400">
              AI-powered CDL driver placement. Connecting elite drivers with premier carriers. 48-hour placement. 30-day guarantee.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
                <Icon name="shield" className="text-[14px] text-blue-400" /> DOT Compliant
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs text-slate-300">
                <Icon name="schedule" className="text-[14px] text-amber-400" /> 48hr Match
              </span>
            </div>
            <div className="mt-8 flex gap-3">
              {[
                { href: 'https://www.facebook.com/LastMileDriverRecruiting/', label: 'Facebook', icon: 'public' },
                { href: 'https://instagram.com/last_mile_driver_recruiting', label: 'Instagram', icon: 'photo_camera' },
                { href: 'https://www.linkedin.com/company/last-mile-driver-recruiting', label: 'LinkedIn', icon: 'business_center' },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-slate-700 hover:text-white"
                >
                  <Icon name={social.icon} className="text-[18px]" />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h5 className={`mb-6 inline-block border-b pb-2 text-xs font-bold uppercase tracking-widest ${group.accent}`}>
                <Icon name={group.icon} className="mr-2 inline text-[14px]" />
                {group.title}
              </h5>
              <ul className="space-y-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <FooterAnchor
                      href={link.href}
                      label={link.label}
                      className='group inline-flex w-full items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white'
                    />
                  </li>
                ))}
                {group.cta ? (
                  <li className="pt-2">
                    <FooterAnchor
                      href={group.cta.href}
                      label={group.cta.label}
                      className='inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                    />
                  </li>
                ) : null}
              </ul>
              {group.title === 'Company' ? (
                <div className="mt-8 rounded-xl border border-slate-700 bg-slate-800/60 p-5 backdrop-blur-sm">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-blue-400">
                    <Icon name="support_agent" className="mr-1 inline text-[13px]" /> 24/7 Support
                  </p>
                  <a href={PHONE_LINK} className="mb-1 block text-xl font-black text-white transition-colors hover:text-amber-400">
                    (214) 531-3751
                  </a>
                  <p className="text-xs text-slate-500">Dallas, TX • Nationwide</p>
                </div>
              ) : null}
            </nav>
          ))}
        </div>
      </div>

      <section className="relative z-10 border-t border-slate-800/60 bg-slate-900/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-10 flex items-center justify-center gap-3 opacity-75">
            <div className="h-px w-16 bg-slate-700" />
            <h4 className="text-xs font-bold uppercase tracking-widest text-white">
              <Icon name="account_tree" className="mr-2 inline text-[14px] text-amber-400" />
              Site Directory
            </h4>
            <div className="h-px w-16 bg-slate-700" />
          </div>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {DIRECTORY_GROUPS.map((group) => (
              <div key={group.title}>
                <h6 className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">{group.title}</h6>
                <ul className="space-y-2 text-xs">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <FooterAnchor
                        href={link.href}
                        label={link.label}
                        className={`text-slate-400 transition-colors ${group.accent}`}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative z-10 border-t border-slate-800 bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-500">
              <span>© 2025 Last Mile Driver Recruiting</span>
              <span className="hidden text-slate-700 md:inline">•</span>
              <FooterAnchor href={PRIVACY_LINK} label="Privacy" className='transition-colors hover:text-blue-400' />
              <span className="hidden text-slate-700 md:inline">•</span>
              <FooterAnchor href={ABOUT_LINK} label="About" className='transition-colors hover:text-blue-400' />
              <span className="hidden text-slate-700 md:inline">•</span>
              <FooterAnchor href={SITEMAP_LINK} label="Sitemap" className='transition-colors hover:text-blue-400' />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-slate-600">
              Engineered by <span className="font-bold text-slate-500">LMMA™</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
