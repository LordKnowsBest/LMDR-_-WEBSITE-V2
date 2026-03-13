'use client';

import { useEffect, useMemo, useState } from 'react';

type PreviewResponse = {
  success: boolean;
  error?: string;
  preview?: {
    count: number;
    message: string;
    hasMatches: boolean;
    exceedsNeed: boolean | null;
    breakdown?: {
      byClass?: Record<string, number>;
      withEndorsements?: number;
      avgExperience?: number;
    };
  };
};

type SubmitResponse = {
  success: boolean;
  error?: string;
  leadId?: string;
};

type FormState = {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  dotNumber: string;
  staffingType: string;
  driversNeeded: string;
  driverTypes: string[];
  additionalNotes: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

const DRIVER_LINK = 'https://www.lastmiledr.app/ai-matching';
const CARRIER_LINK = 'https://www.lastmiledr.app/pricing';
const INSIGHTS_LINK = 'https://www.lastmiledr.app/insights';
const JOB_HUB_LINK = 'https://www.lastmiledr.app/drivers';
const CONTACT_EMAIL = 'levy@lastmiledr.app';
const CONTACT_PHONE = '(214) 531-3751';
const CONTACT_PHONE_HREF = 'tel:+12145313751';

const INITIAL_FORM: FormState = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  dotNumber: '',
  staffingType: '',
  driversNeeded: '',
  driverTypes: [],
  additionalNotes: '',
};

const TRUST_STATS = [
  { value: '500+', label: 'Drivers Placed' },
  { value: '24hrs', label: 'Avg Match Time' },
  { value: '150+', label: 'Premium Carriers' },
  { value: '95%', label: 'Satisfaction Rate' },
];

const HOW_STEPS = [
  { icon: 'badge', title: '1. Profile', body: '5-minute setup. Tell us your experience and route preferences.' },
  { icon: 'memory', title: '2. AI Match', body: 'Our algorithm scans 150+ carriers to find your perfect fit.' },
  { icon: 'mark_email_read', title: '3. Offers', body: 'Get contacted by vetted carriers within 24 hours.' },
  { icon: 'local_shipping', title: '4. Drive', body: 'Accept the best offer and hit the road. Simple as that.' },
];

const DRIVER_BENEFITS = [
  { icon: 'payments', title: 'Transparent Pay', body: 'See actual ranges. Drivers earn avg. $5k more/year.' },
  { icon: 'home', title: 'Guaranteed Home Time', body: "We match based on your schedule needs, not just the carrier's." },
  { icon: 'privacy_tip', title: 'Data Privacy', body: 'No spam. Only carriers you match with can see your info.' },
];

const CARRIER_BENEFITS = [
  { value: '48 Hours', body: 'Average time to fill an empty seat. Stop losing $500/day on downtime.' },
  { value: '30-Day Guarantee', body: 'If a driver leaves within a month, we replace them for free.' },
  { value: '60% Less Time', body: 'Reduction in time spent reviewing unqualified applications.' },
];

const INSIGHTS = [
  {
    image: 'https://static.wixstatic.com/media/39f69d_683485c4b7094fb0977c9d680bde748f~mv2.png',
    title: 'Strategies to Boost CDL Driver Retention',
    tag: 'Strategy',
  },
  {
    image: 'https://static.wixstatic.com/media/39f69d_770199b7c5df4016895168df84b3adb7~mv2.png',
    title: 'Fix Your Retention Crisis with Recruiting',
    tag: 'Recruiting',
  },
  {
    image: 'https://static.wixstatic.com/media/39f69d_645b302ab33f49e383176ae0cd4b1332~mv2.png',
    title: 'DOT Compliance Excellence Guide',
    tag: 'Compliance',
  },
  {
    image: 'https://static.wixstatic.com/media/39f69d_a98222a9f1b1444e8e8ac1ce000a76d5~mv2.png',
    title: 'Your Complete Guide to Getting a CDL in Texas',
    tag: 'CDL Guide',
  },
];

const DRIVER_TYPES = [
  { value: 'Class A', label: 'Class A', icon: 'local_shipping' },
  { value: 'Class B', label: 'Class B', icon: 'airport_shuttle' },
  { value: 'Hazmat', label: 'Hazmat', icon: 'science' },
  { value: 'Tanker', label: 'Tanker', icon: 'water_drop' },
  { value: 'Reefer', label: 'Reefer', icon: 'ac_unit' },
  { value: 'Flatbed', label: 'Flatbed', icon: 'view_timeline' },
];

const DRIVER_FAQS: FaqItem[] = [
  {
    question: 'Is LMDR really free for drivers?',
    answer: "Yes, 100% free. We're paid by carriers looking to fill seats, so drivers never pay a dime. No hidden fees, no catches.",
  },
  {
    question: 'How fast will I hear from carriers?',
    answer: 'Most drivers receive their first contact within 24 hours of completing their profile.',
  },
  {
    question: 'What CDL types do you work with?',
    answer: 'We match drivers across Class A, Class B, and Class C CDL holders, including specialized endorsements.',
  },
  {
    question: 'Will my info be sold to recruiters?',
    answer: 'Never. Only carriers that match your preferences can see your profile.',
  },
  {
    question: 'Can I specify home time requirements?',
    answer: 'Absolutely. Our AI only matches you with carriers whose routes align with your schedule preferences.',
  },
  {
    question: 'How does AI actually help me find a job?',
    answer: 'The system scores CDL type, endorsements, experience, preferred lanes, home time, and pay expectations to surface only relevant opportunities.',
  },
];

const CARRIER_FAQS: FaqItem[] = [
  {
    question: 'What does the 48-hour guarantee mean?',
    answer: "We commit to presenting qualified, pre-screened driver candidates within 48 hours of receiving your requirements.",
  },
  {
    question: 'How does your vetting process work?',
    answer: 'Every driver profile is verified across CDL status, MVR checks, employment history, and endorsement validation.',
  },
  {
    question: 'What if a driver leaves within 30 days?',
    answer: 'Free replacement. If a placed driver does not work out within the first 30 days, we restart the search at no additional cost.',
  },
  {
    question: 'How is pricing structured?',
    answer: 'We offer both per-placement and subscription models depending on hiring volume.',
  },
  {
    question: 'Can you handle high-volume hiring?',
    answer: 'Yes. Whether you need 5 drivers or 50, the platform is built to scale without sacrificing speed or quality.',
  },
  {
    question: 'How does your AI matching work for carriers?',
    answer: 'You define CDL class, endorsements, experience minimums, lane requirements, home time policies, and pay range. We score incoming driver profiles against that profile continuously.',
  },
];

const GENERAL_FAQS: FaqItem[] = [
  {
    question: 'What makes LMDR different from job boards?',
    answer: 'Job boards are passive. LMDR actively matches driver qualifications and carrier requirements in real time.',
  },
  {
    question: 'What areas do you service?',
    answer: 'LMDR operates nationwide across all 48 contiguous states, with particular strength in Texas, the Midwest corridor, and Southeast markets.',
  },
  {
    question: 'How do I get started?',
    answer: 'Drivers can complete the free 5-minute match flow. Carriers can submit requirements through the staffing request form or contact sales directly.',
  },
];

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

function RevealCard({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={className} data-reveal style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function FaqBlock({
  title,
  icon,
  items,
  dark = false,
  framed = false,
}: {
  title: string;
  icon: string;
  items: FaqItem[];
  dark?: boolean;
  framed?: boolean;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div data-reveal>
      {title ? (
        <div className="mb-6 flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${dark ? 'bg-[#2563eb]' : framed ? 'bg-gradient-to-br from-blue-600 to-slate-900' : 'bg-[#fbbf24]'}`}
          >
            <Icon name={icon} className={`text-[20px] ${dark || framed ? 'text-white' : 'text-[#0f172a]'}`} />
          </div>
          <h3 className="text-xl font-black text-[#0f172a]">{title}</h3>
        </div>
      ) : null}
      <div className={`overflow-hidden rounded-2xl ${dark ? 'bg-[#0f172a]' : framed ? 'border border-slate-200 bg-white shadow-sm' : 'bg-slate-50'}`}>
        {items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div
              key={item.question}
              className={`border-b ${dark ? 'border-slate-700' : 'border-slate-200'} last:border-b-0`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                className={`flex w-full items-center justify-between p-5 text-left transition-colors ${dark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
              >
                <span className={`pr-4 font-semibold ${dark ? 'text-white' : 'text-[#0f172a]'}`}>{item.question}</span>
                <Icon
                  name="add"
                  className={`shrink-0 text-[20px] transition-transform ${dark ? 'text-[#fbbf24]' : 'text-[#2563eb]'} ${open ? 'rotate-45' : ''}`}
                />
              </button>
              <div className={`grid transition-[grid-template-rows] duration-300 ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <p className={`px-5 pb-5 text-sm leading-6 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{item.answer}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function LandingHomePage() {
  const [revealed, setRevealed] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [preview, setPreview] = useState<PreviewResponse['preview'] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach((element) => element.classList.add('reveal-active'));
      setRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' }
    );

    elements.forEach((element) => observer.observe(element));
    const timeoutId = window.setTimeout(() => {
      elements.forEach((element) => element.classList.add('reveal-active'));
      setRevealed(true);
    }, 500);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    const hasCriteria = Boolean(form.driversNeeded) || form.driverTypes.length > 0;
    if (!hasCriteria) {
      setPreview(null);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const response = await fetch('/api/landing/match-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cdlTypes: form.driverTypes.filter((type) => type.startsWith('Class')).map((type) => type.replace('Class ', '')),
            endorsements: form.driverTypes.filter((type) => !type.startsWith('Class')),
            driversNeeded: form.driversNeeded,
          }),
        });
        const data = (await response.json()) as PreviewResponse;
        setPreview(data.preview || null);
      } catch {
        setPreview(null);
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [form.driversNeeded, form.driverTypes]);

  const previewBullets = useMemo(() => {
    if (!preview?.breakdown) return [];
    const bullets: string[] = [];
    Object.entries(preview.breakdown.byClass || {}).forEach(([driverClass, count]) => {
      bullets.push(`${count} Class ${driverClass}`);
    });
    if (preview.breakdown.withEndorsements) {
      bullets.push(`${preview.breakdown.withEndorsements} Endorsed`);
    }
    if (preview.breakdown.avgExperience) {
      bullets.push(`${preview.breakdown.avgExperience}y Avg Exp`);
    }
    return bullets;
  }, [preview]);

  function updateField<Key extends keyof FormState>(field: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleDriverType(value: string) {
    setForm((current) => ({
      ...current,
      driverTypes: current.driverTypes.includes(value)
        ? current.driverTypes.filter((item) => item !== value)
        : [...current.driverTypes, value],
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setSubmitting(true);

    try {
      const response = await fetch('/api/landing/carrier-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sourceUrl: '/',
        }),
      });

      const data = (await response.json()) as SubmitResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'There was a problem submitting your request. Please try again.');
      }

      setSubmitSuccess('Request submitted. Redirecting to pricing options...');
      setForm(INITIAL_FORM);
      setPreview(null);

      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(
          'lmdr-carrier-lead',
          JSON.stringify({
            email: form.email,
            leadId: data.leadId || '',
            submittedAt: new Date().toISOString(),
          })
        );
      }

      window.setTimeout(() => {
        window.location.href = CARRIER_LINK;
      }, 1500);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'There was a problem submitting your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="scroll-smooth bg-[#f8fafc] text-[#0f172a]">
      <style jsx>{`
        [data-reveal] {
          opacity: 1;
          transform: translateY(0);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }

        @media (prefers-reduced-motion: no-preference) {
          [data-reveal]:not(.reveal-active) {
            opacity: 0;
            transform: translateY(30px);
          }
        }

        .gradient-text {
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-highlight {
          background: linear-gradient(135deg, #f9ff80 0%, #ffd700 100%);
          padding: 0 8px;
          display: inline-block;
          transform: skew(-3deg);
          border-radius: 4px;
        }
      `}</style>

      <section className="overflow-hidden py-12 md:py-20">
        <div className="container mx-auto px-4">
          <RevealCard className="mb-12 text-center">
            <h1 className="mb-6 text-3xl font-black leading-tight sm:text-4xl md:text-6xl">
              Driver Recruiting <br className="hidden md:block" />
              <span className="gradient-text">Solved by AI</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Stop wasting time on job boards. We use intelligent matching algorithms to pair qualified CDL drivers with premium carriers in under 24 hours.
            </p>
          </RevealCard>

          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-2 lg:gap-12">
            <RevealCard className="group relative overflow-hidden rounded-[28px] bg-[#0f172a] p-6 text-white shadow-2xl transition-transform duration-300 hover:-translate-y-2 md:p-8 lg:p-12">
              <div className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-30">
                <img
                  src="https://static.wixstatic.com/media/39f69d_b35e5cdba517490b8b28b2a3315d36b9~mv2.png"
                  alt="Driver"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <span className="mb-6 inline-block rounded-full bg-[#fbbf24] px-3 py-1 text-xs font-black text-[#0f172a]">FOR DRIVERS</span>
                  <h2 className="mb-4 text-3xl font-black md:text-4xl">
                    Find Your <span className="text-yellow-300">Perfect Match</span>
                  </h2>
                  <p className="mb-8 text-lg text-slate-300">Better pay. Home time that matters. 100% Free.</p>
                  <ul className="mb-8 space-y-3">
                    <li className="flex items-center gap-3"><Icon name="check_circle" className="text-[#fbbf24]" /> <span>Zero fees, ever</span></li>
                    <li className="flex items-center gap-3"><Icon name="bolt" className="text-[#fbbf24]" /> <span>Matches in under 24hrs</span></li>
                    <li className="flex items-center gap-3"><Icon name="shield" className="text-[#fbbf24]" /> <span>Vetted Carriers Only</span></li>
                  </ul>
                </div>
                <a
                  href={DRIVER_LINK}
                  className="block w-full rounded-xl bg-[#fbbf24] py-4 text-center font-bold text-[#0f172a] shadow-[0_0_15px_rgba(250,204,21,0.5)] transition-colors hover:bg-yellow-300"
                >
                  Start My Match <Icon name="arrow_right_alt" className="ml-1 inline text-[18px]" />
                </a>
              </div>
            </RevealCard>

            <RevealCard className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl transition-transform duration-300 hover:-translate-y-2 md:p-8 lg:p-12">
              <div className="absolute inset-0 opacity-5 transition-opacity duration-500 group-hover:opacity-10">
                <img
                  src="https://static.wixstatic.com/media/39f69d_3c0f368d403a4b26843db6ff95d792bb~mv2.png"
                  alt="Truck Fleet"
                  className="h-full w-full object-cover grayscale"
                />
              </div>
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div>
                  <span className="mb-6 inline-block rounded-full bg-[#2563eb] px-3 py-1 text-xs font-black text-white">FOR CARRIERS</span>
                  <h2 className="mb-4 text-3xl font-black text-[#0f172a] md:text-4xl">
                    Hire <span className="text-[#2563eb]">Qualified Drivers</span>
                  </h2>
                  <p className="mb-8 text-lg text-slate-600">Pre-vetted candidates. Route-optimized matching.</p>
                  <ul className="mb-8 space-y-3 text-slate-700">
                    <li className="flex items-center gap-3"><Icon name="check_circle" className="text-[#2563eb]" /> <span>48-Hour Placement Guarantee</span></li>
                    <li className="flex items-center gap-3"><Icon name="route" className="text-[#2563eb]" /> <span>Lane Specific Matching</span></li>
                    <li className="flex items-center gap-3"><Icon name="cached" className="text-[#2563eb]" /> <span>Free Replacement (30 Days)</span></li>
                  </ul>
                </div>
                <a
                  href={CARRIER_LINK}
                  className="block w-full rounded-xl bg-[#0f172a] py-4 text-center font-bold text-white shadow-lg transition-colors hover:bg-slate-800"
                >
                  Find Drivers <Icon name="arrow_right_alt" className="ml-1 inline text-[18px]" />
                </a>
              </div>
            </RevealCard>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white py-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {TRUST_STATS.map((stat, index) => (
              <RevealCard key={stat.label} delay={index * 100}>
                <div className="mb-1 text-3xl font-black text-[#0f172a] md:text-4xl">{stat.value}</div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">{stat.label}</div>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-slate-50 py-20">
        <div className="container mx-auto px-4">
          <RevealCard className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-black text-[#0f172a] md:text-5xl">
              Matched in <span className="hero-highlight">4 Simple Steps</span>
            </h2>
            <p className="text-lg text-gray-600">No endless applications. No waiting weeks.</p>
          </RevealCard>

          <div className="relative mx-auto max-w-6xl">
            <div className="absolute left-0 top-12 hidden h-1 w-full bg-gradient-to-r from-slate-200 via-blue-200 to-slate-200 md:block" />
            <div className="grid gap-6 md:grid-cols-4 md:gap-8">
              {HOW_STEPS.map((step, index) => (
                <RevealCard key={step.title} delay={index * 100} className="group relative z-10 text-center">
                  <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-slate-100 bg-white shadow-xl transition-transform duration-300 group-hover:-translate-y-2">
                    <Icon name={step.icon} className="text-[32px] text-[#2563eb]" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-[#0f172a]">{step.title}</h3>
                  <p className="text-sm text-slate-500">{step.body}</p>
                </RevealCard>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <RevealCard>
              <h2 className="mb-6 text-3xl font-black text-[#0f172a] md:text-4xl">
                Why Drivers <span className="text-[#2563eb]">Love LMDR</span>
              </h2>
              <div className="space-y-6">
                {DRIVER_BENEFITS.map((benefit) => (
                  <div key={benefit.title} className="flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#2563eb]">
                      <Icon name={benefit.icon} className="text-[22px]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{benefit.title}</h3>
                      <p className="text-sm text-slate-600">{benefit.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RevealCard>

            <RevealCard delay={200} className="rounded-[28px] bg-[#0f172a] p-6 text-white md:p-10">
              <h2 className="mb-6 text-3xl font-black md:text-4xl">
                Why Carriers <span className="text-[#fbbf24]">Trust Us</span>
              </h2>
              <div className="space-y-8">
                {CARRIER_BENEFITS.map((benefit) => (
                  <div key={benefit.value} className="border-l-4 border-yellow-400 pl-6">
                    <div className="mb-1 text-3xl font-bold">{benefit.value}</div>
                    <p className="text-sm text-slate-400">{benefit.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <a href={CARRIER_LINK} className="font-bold text-[#fbbf24] transition-colors hover:text-white">
                  Carrier Solutions <Icon name="arrow_right_alt" className="ml-1 inline text-[18px]" />
                </a>
              </div>
            </RevealCard>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-black text-[#0f172a] md:text-4xl">
                Industry <span className="text-[#2563eb]">Insights</span>
              </h2>
              <p className="mt-2 text-slate-500">Expert advice on retention and compliance.</p>
            </div>
            <a href={INSIGHTS_LINK} className="hidden font-bold text-[#2563eb] hover:underline md:inline-block">
              View All <Icon name="arrow_right_alt" className="inline text-[18px]" />
            </a>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {INSIGHTS.map((insight, index) => (
              <RevealCard key={insight.title} delay={index * 100}>
                <a href={INSIGHTS_LINK} className="group block overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-xl">
                  <div className="h-40 overflow-hidden">
                    <img src={insight.image} alt={insight.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  </div>
                  <div className="p-5">
                    <h3 className="mb-2 font-bold text-[#0f172a] transition-colors group-hover:text-[#2563eb]">{insight.title}</h3>
                    <span className="text-xs font-bold uppercase text-slate-400">{insight.tag}</span>
                  </div>
                </a>
              </RevealCard>
            ))}
          </div>
        </div>
      </section>

      <section id="carrier-staffing-form" className="relative overflow-hidden bg-[#0f172a] py-20 text-white">
        <div className="absolute right-0 top-0 h-96 w-96 animate-float rounded-full bg-[#2563eb] opacity-20 blur-3xl mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-yellow-500 opacity-10 blur-3xl mix-blend-overlay" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <RevealCard className="mb-10 text-center">
              <h2 className="mb-4 text-4xl font-black md:text-5xl">
                Find <span className="text-[#fbbf24]">Qualified Drivers</span>
              </h2>
              <p className="mb-6 text-xl text-slate-300">Pre-vetted CDL drivers matched to your lanes in 24-48 hours.</p>
              <div className="inline-flex flex-wrap items-center gap-6 text-sm font-bold text-slate-400">
                <span className="flex items-center gap-2"><Icon name="lock" className="text-green-400" /> 256-bit SSL</span>
                <span className="flex items-center gap-2"><Icon name="shield" className="text-green-400" /> 30-Day Guarantee</span>
              </div>
            </RevealCard>

            <div className="overflow-hidden rounded-2xl bg-white p-5 shadow-2xl sm:p-8 md:p-10">
              <form className="space-y-5 text-[#0f172a]" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-[#2563eb]">Company Name <span className="text-red-500">*</span></label>
                    <input required value={form.companyName} onChange={(event) => updateField('companyName', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-[#f8fafc] px-4 py-3 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="Acme Trucking Co." />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-[#2563eb]">Contact Name <span className="text-red-500">*</span></label>
                    <input required value={form.contactName} onChange={(event) => updateField('contactName', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-[#f8fafc] px-4 py-3 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="Jane Doe" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-[#2563eb]">Email <span className="text-red-500">*</span></label>
                    <input required type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-[#f8fafc] px-4 py-3 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="jane@acme.com" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase text-[#2563eb]">Phone <span className="text-red-500">*</span></label>
                    <input required type="tel" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-[#f8fafc] px-4 py-3 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="(555) 123-4567" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#2563eb]">DOT Number <span className="font-normal text-gray-400">(Optional)</span></label>
                  <input value={form.dotNumber} onChange={(event) => updateField('dotNumber', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-[#f8fafc] px-4 py-3 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="e.g., 1234567" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[#2563eb]">Staffing Type <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {[
                      { value: 'Emergency', title: 'Emergency', body: 'Need drivers ASAP', tone: 'red', icon: 'bolt' },
                      { value: 'Strategic', title: 'Strategic', body: 'Planned hiring', tone: 'blue', icon: 'show_chart' },
                    ].map((option) => {
                      const active = form.staffingType === option.value;
                      return (
                        <button key={option.value} type="button" onClick={() => updateField('staffingType', option.value)} className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all active:scale-[0.98] ${active ? option.tone === 'red' ? 'border-red-400 bg-red-50' : 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}>
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${option.tone === 'red' ? 'bg-red-100' : 'bg-blue-100'}`}>
                            <Icon name={option.icon} className={`${option.tone === 'red' ? 'text-red-500' : 'text-blue-500'}`} />
                          </div>
                          <div>
                            <span className="block font-bold text-[#0f172a]">{option.title}</span>
                            <span className="text-xs text-slate-500">{option.body}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#2563eb]">How Many Drivers? <span className="text-red-500">*</span></label>
                  <select required value={form.driversNeeded} onChange={(event) => updateField('driversNeeded', event.target.value)} className="w-full rounded-lg border border-slate-200 bg-[#f8fafc] px-4 py-3 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500">
                    <option value="">Select...</option>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'].map((count) => (
                      <option key={count} value={count}>{count}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-[#2563eb]">Driver Types <span className="font-normal text-gray-400">(Select all)</span></label>
                  <div className="flex flex-wrap gap-2">
                    {DRIVER_TYPES.map((type) => {
                      const active = form.driverTypes.includes(type.value);
                      return (
                        <button key={type.value} type="button" onClick={() => toggleDriverType(type.value)} className={`inline-flex items-center gap-1 rounded-full border-2 px-3 py-2 text-xs font-medium transition-all active:scale-[0.96] ${active ? 'border-[#2563eb] bg-[#2563eb] text-white' : 'border-slate-200 bg-[#f8fafc] text-slate-600 hover:border-blue-400'}`}>
                          <Icon name={type.icon} className="text-[14px]" />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {preview ? (
                  <div className={`transition-all duration-500 ${revealed ? 'opacity-100' : 'opacity-100'}`}>
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-xl">
                      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
                      <div className="relative text-left">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest">Live Match Estimate</span>
                          {previewLoading ? <Icon name="progress_activity" className="animate-spin text-[16px] text-white/70" /> : null}
                        </div>
                        <div className="mb-1 flex items-baseline gap-2">
                          <span className="text-5xl font-black">{preview.count}</span>
                          <span className="text-xl font-bold opacity-80">Drivers</span>
                        </div>
                        <p className="mb-4 text-sm leading-relaxed opacity-90">{preview.message}</p>
                        <div className="mb-4 grid gap-2 text-left sm:grid-cols-2">
                          {previewBullets.map((bullet) => (
                            <div key={bullet} className="flex items-center gap-2 rounded-lg bg-slate-800/20 px-2 py-1 text-[10px] font-black">
                              <Icon name="local_shipping" className="text-[13px] text-cyan-300" />
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                        {preview.exceedsNeed ? (
                          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider shadow-lg">
                            <Icon name="check_circle" className="text-[14px]" /> Exceeds your need
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-[#2563eb]">Additional Details <span className="font-normal text-gray-400">(Optional)</span></label>
                  <textarea rows={2} value={form.additionalNotes} onChange={(event) => updateField('additionalNotes', event.target.value)} className="w-full resize-none rounded-lg border border-slate-200 bg-[#f8fafc] px-4 py-3 text-base outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="Timeline, locations, special requirements..." />
                </div>

                <div className="space-y-3 pt-2">
                  <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-6 py-4 text-base font-bold text-white shadow-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70">
                    <span>{submitting ? 'Processing...' : preview?.count ? `Connect with ${preview.count} Drivers` : 'Start Hiring Drivers Now'}</span>
                    <Icon name={submitting ? 'progress_activity' : 'arrow_right_alt'} className={`${submitting ? 'animate-spin' : ''} text-[18px]`} />
                  </button>
                  <a href={CARRIER_LINK} className="block w-full rounded-xl border border-slate-200 py-3 text-center text-sm font-medium text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-50">
                    Learn More About Our Pricing <Icon name="open_in_new" className="ml-1 inline text-[14px]" />
                  </a>
                </div>

                {submitSuccess ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
                    <div className="flex items-center gap-3">
                      <Icon name="check_circle" className="text-[22px] text-green-600" />
                      <div>
                        <p className="font-bold">Request Submitted!</p>
                        <p className="text-sm">{submitSuccess}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {submitError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
                    <div className="flex items-center gap-3">
                      <Icon name="error" className="text-[22px] text-red-600" />
                      <div>
                        <p className="font-bold">Submission Error</p>
                        <p className="text-sm">{submitError}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </form>

              <p className="mt-4 text-center text-xs text-gray-400">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
            </div>

            <div className="mt-8 text-center">
              <p className="mb-3 text-sm text-slate-400">Are you a driver looking for work?</p>
              <a href={DRIVER_LINK} className="inline-flex items-center gap-2 text-sm font-bold text-[#fbbf24] transition-colors hover:text-white">
                Find Your Perfect Match <Icon name="open_in_new" className="text-[14px]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute left-1/4 top-0 h-64 w-64 animate-float rounded-full bg-[#fbbf24] opacity-30 blur-3xl mix-blend-overlay" />
          <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-[#2563eb] opacity-30 blur-3xl mix-blend-overlay" />
        </div>
        <div className="absolute inset-0 opacity-5">
          <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 transform bg-white" />
          <div className="absolute left-0 right-0 top-1/2 flex -translate-y-1/2 transform justify-around">
            {Array.from({ length: 7 }).map((_, index) => (
              <span key={index} className="h-1 w-16 bg-[#fbbf24]" />
            ))}
          </div>
        </div>

        <div className="container relative z-10 mx-auto px-4">
          <div className="mx-auto max-w-4xl">
            <a href={JOB_HUB_LINK} className="group block" data-reveal>
              <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-yellow-400/30 bg-gradient-to-r from-yellow-400/10 to-yellow-400/5 p-6 transition-all duration-300 hover:border-yellow-400/60 md:flex-row md:p-8">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-400/25 transition-transform duration-300 group-hover:scale-110 md:h-20 md:w-20">
                    <Icon name="route" className="text-[32px] text-[#0f172a]" />
                  </div>
                  <div className="text-left">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[#fbbf24]">New Resource</span>
                      <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-green-400" />
                    </div>
                    <h3 className="text-xl font-black text-white transition-colors group-hover:text-yellow-300 md:text-2xl">CDL Driver Job Hub</h3>
                    <p className="mt-1 text-sm text-slate-400 md:text-base">Browse open positions, compare pay rates &amp; find your next haul.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 font-bold text-[#fbbf24]">
                  <span className="hidden md:inline">Explore Jobs</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-yellow-400/50 transition-all duration-300 group-hover:border-yellow-400 group-hover:bg-[#fbbf24]">
                    <Icon name="arrow_right_alt" className="transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#0f172a]" />
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>
      </section>

      <section id="faq" className="bg-white py-20">
        <div className="container mx-auto px-4">
          <RevealCard className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-black text-[#0f172a] md:text-5xl">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
              Everything you need to know about LMDR&apos;s AI-powered matching platform.
            </p>
          </RevealCard>

          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
              <FaqBlock title="For Drivers" icon="local_shipping" items={DRIVER_FAQS} />
              <FaqBlock title="For Carriers" icon="apartment" items={CARRIER_FAQS} dark />
            </div>

            <div className="mt-12">
              <FaqBlock title="General Questions" icon="help" items={GENERAL_FAQS} framed />
            </div>

            <RevealCard delay={400} className="mt-12 text-center">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8">
                <h4 className="mb-2 text-xl font-bold text-[#0f172a]">Still have questions?</h4>
                <p className="mb-6 text-slate-600">Our team is ready to help you get started.</p>
                <div className="flex flex-col justify-center gap-4 sm:flex-row">
                  <a href={`mailto:${CONTACT_EMAIL}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700">
                    <Icon name="mail" className="text-[18px]" /> Email Us
                  </a>
                  <a href={CONTACT_PHONE_HREF} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f172a] px-6 py-3 font-bold text-white transition-colors hover:bg-slate-800">
                    <Icon name="call" className="text-[18px]" /> {CONTACT_PHONE}
                  </a>
                </div>
              </div>
            </RevealCard>
          </div>
        </div>
      </section>

      <section className="bg-[#2563eb] py-16 text-white">
        <RevealCard className="container mx-auto px-4 text-center">
          <h2 className="mb-8 text-3xl font-black md:text-4xl">Ready to Transform Your Recruiting?</h2>
          <div className="flex flex-wrap justify-center gap-6">
            <a href={`mailto:${CONTACT_EMAIL}`} className="rounded-xl bg-white px-8 py-4 font-bold text-[#2563eb] shadow-lg transition-colors hover:bg-gray-100">
              Contact Sales
            </a>
            <a href={CARRIER_LINK} className="rounded-xl border border-blue-500 bg-blue-800 px-8 py-4 font-bold text-white shadow-lg transition-colors hover:bg-blue-900">
              Carrier Solutions
            </a>
          </div>
        </RevealCard>
      </section>
    </main>
  );
}
