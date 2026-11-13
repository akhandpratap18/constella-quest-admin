import type { Metadata } from 'next';
import './globals.css';
import BackgroundGlow from '@/components/BackgroundGlow';

export const metadata: Metadata = {
  title: 'Constella Quest Admin | AI Space Quest Engine',
  description: 'AI-powered weekly quest authoring portal for Constella iOS astronomy app.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#000000] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">
        <BackgroundGlow />
        {children}
      </body>
    </html>
  );
}
