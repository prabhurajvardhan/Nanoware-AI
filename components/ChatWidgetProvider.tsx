'use client';

import dynamic from 'next/dynamic';

const GlobalChatWidget = dynamic(() => import('./GlobalChatWidget'), {
  ssr: false,
  loading: () => null,
});

export default function ChatWidgetProvider() {
  return <GlobalChatWidget />;
}
