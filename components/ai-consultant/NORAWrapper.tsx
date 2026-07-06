'use client';

import dynamic from 'next/dynamic';
import AuditSection from '@/components/AuditSection';

const NORAAuditExperience = dynamic(
  () => import('./NORAAuditExperience'),
  { 
    ssr: false, 
    loading: () => (
      <div className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto px-6">
          <AuditSection />
        </div>
      </div>
    )
  }
);

export default function NORAWrapper() {
  return <NORAAuditExperience />;
}
