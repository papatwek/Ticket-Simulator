import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Wyze - ECE Ticket Simulator',
  description: 'Wyze customer support training simulator for live-chat and email ticketing with realistic AI customer scenarios, typing speed tracking, case documentation, and trainer reviews.',
  openGraph: {
    title: 'Wyze - ECE Ticket Simulator',
    description: 'Wyze customer support training simulator for live-chat and email ticketing with realistic AI customer scenarios, typing speed tracking, case documentation, and trainer reviews.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Wyze - ECE Ticket Simulator',
    description: 'Wyze customer support training simulator for live-chat and email ticketing with realistic AI customer scenarios, typing speed tracking, case documentation, and trainer reviews.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
