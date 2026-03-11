import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'LMDR | Last Mile Driver Recruiting',
  description: 'AI-powered CDL driver-carrier matching platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-neutral-light font-sans antialiased">{children}</body>
    </html>
  );
}
