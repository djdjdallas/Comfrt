import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import BackgroundBlobs from "@/components/BackgroundBlobs";
import Header from "@/components/Header";
import AnalyticsProvider from "@/components/AnalyticsProvider";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "Comfrt - Find Your Calm Space",
  description:
    "Discover sensory-friendly restaurants and venues. Perfect for people with autism, ADHD, migraines, anxiety, or anyone who prefers calm, quiet spaces.",
  keywords:
    "sensory friendly, quiet restaurants, autism friendly, ADHD, calm venues, peaceful dining",
  openGraph: {
    title: "Comfrt - Find Your Calm Space",
    description: "Discover sensory-friendly restaurants and venues.",
    type: "website",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#fdfcfa",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="min-h-screen bg-bg-main antialiased">
        <BackgroundBlobs />
        <div className="relative z-10 flex flex-col min-h-screen w-full items-stretch">
          {/* Header */}
          <Header />

          {/* Main Content */}
          <main className="flex-1 flex flex-col w-full">
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </main>

          {/* Footer */}
          <footer className="border-t border-warm-100 py-6 px-4">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-sm text-text-muted">
                Made with care for people who need calm spaces
              </p>
              <p className="text-xs text-text-muted mt-2">
                Powered by Claude AI + Yelp AI API
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
