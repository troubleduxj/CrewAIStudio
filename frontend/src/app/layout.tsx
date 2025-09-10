import type { Metadata, Viewport } from 'next';
import '../../styles/globals.css';

export const metadata: Metadata = {
  title: 'CrewAI Studio',
  description: 'AI工作流设计和执行平台',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CrewAI Studio',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}