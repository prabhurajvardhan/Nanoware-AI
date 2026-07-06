import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { AuthProvider } from '@/components/AuthProvider';
import ChatWidgetProvider from '@/components/ChatWidgetProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <AuthProvider>
        <Navigation />
        <main className="flex-1 flex flex-col pt-[88px]">
          {children}
        </main>
        <Footer />
        <ChatWidgetProvider />
      </AuthProvider>
    </div>
  );
}
