'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import { isOnboardingComplete } from '@/lib/preferences';

export default function SearchPage() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-warm-100 animate-gentle-pulse" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col w-full">
      <ChatInterface />
    </div>
  );
}
