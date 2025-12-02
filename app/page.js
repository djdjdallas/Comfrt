'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ChatInterface from '@/components/ChatInterface';
import { isOnboardingComplete } from '@/lib/preferences';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);

    // Check if first visit - optionally redirect to onboarding
    // Commented out to make onboarding optional
    // if (!isOnboardingComplete()) {
    //   router.push('/onboarding');
    // }
  }, [router]);

  if (!mounted) {
    // Prevent hydration mismatch
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
