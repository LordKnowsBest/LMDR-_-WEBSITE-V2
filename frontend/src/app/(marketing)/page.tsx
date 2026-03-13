import type { Metadata } from 'next';

import { LandingHomePage } from '@/components/marketing/LandingHomePage';

export const metadata: Metadata = {
  title: 'LMDR - AI-Powered Driver & Carrier Matching',
  description: 'Connect with top carriers or find qualified drivers in 24 hours using AI matching.',
};

export default function HomePage() {
  return <LandingHomePage />;
}
