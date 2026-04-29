import type {Metadata} from 'next';
import { Inter, Sora } from 'next/font/google';
import './globals.css';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const sora = Sora({ subsets: ['latin'], variable: '--font-sora' });

export const metadata: Metadata = {
  title: 'Nanoware AI | Beyond Algorithms. Toward Intelligence.',
  description: 'Nanoware AI builds self-evolving systems with novel neuron architectures.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} antialiased`} scroll-behavior="smooth">
      <body className="bg-white text-slate-900 font-sans selection:bg-brand-accent/30 selection:text-slate-900" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
