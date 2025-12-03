import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import BackgroundBlobs from '@/components/BackgroundBlobs';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: 'Comfrt - Find Your Calm Space',
  description: 'Discover sensory-friendly restaurants and venues. Perfect for people with autism, ADHD, migraines, anxiety, or anyone who prefers calm, quiet spaces.',
  keywords: 'sensory friendly, quiet restaurants, autism friendly, ADHD, calm venues, peaceful dining',
  openGraph: {
    title: 'Comfrt - Find Your Calm Space',
    description: 'Discover sensory-friendly restaurants and venues.',
    type: 'website',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#fdfcfa',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="min-h-screen bg-bg-main antialiased">
        <BackgroundBlobs />
        <div className="relative z-10 flex flex-col min-h-screen w-full items-stretch">
          {/* Header */}
          <header className="sticky top-0 z-50 glass-soft border-b border-warm-100">
            <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
              <a href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 rounded-xl bg-sage-400 flex items-center justify-center
                              group-hover:bg-sage-500 transition-colors duration-300">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
                    <path d="M17 4a2 2 0 0 0 2 2a2 2 0 0 0 -2 2a2 2 0 0 0 -2 -2a2 2 0 0 0 2 -2" />
                  </svg>
                </div>
                <span className="text-xl font-semibold text-text-primary">Comfrt</span>
              </a>

              <nav className="flex items-center gap-1">
                <a
                  href="/search"
                  className="text-sm text-text-secondary hover:text-text-primary
                           transition-colors duration-300 px-3 py-2 rounded-xl
                           hover:bg-warm-100"
                >
                  Search
                </a>
                <a
                  href="/map"
                  className="text-sm text-text-secondary hover:text-text-primary
                           transition-colors duration-300 px-3 py-2 rounded-xl
                           hover:bg-warm-100"
                >
                  Map
                </a>
                <a
                  href="/planner"
                  className="text-sm text-text-secondary hover:text-text-primary
                           transition-colors duration-300 px-3 py-2 rounded-xl
                           hover:bg-warm-100"
                >
                  Planner
                </a>
                <a
                  href="/onboarding"
                  className="text-sm text-text-secondary hover:text-text-primary
                           transition-colors duration-300 px-3 py-2 rounded-xl
                           hover:bg-warm-100"
                >
                  Preferences
                </a>
              </nav>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col w-full">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-warm-100 py-6 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-sm text-text-muted">
                Made with care for people who need calm spaces
              </p>
              <p className="text-xs text-text-muted mt-2">
                Powered by Claude AI + Yelp Fusion API
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
