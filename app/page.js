"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Volume2,
  Sun,
  Users,
  MapPin,
  Clock,
  Share2,
  Brain,
  Heart,
  Zap,
  Coffee,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            backgroundColor: "#e8ebe4",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ flex: 1 }}>
      {/* Hero Section */}
      <section
        style={{
          padding: "80px 24px",
          textAlign: "center",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            backgroundColor: "rgba(150, 168, 127, 0.15)",
            borderRadius: "9999px",
            marginBottom: "24px",
          }}
        >
          <Sparkles size={16} style={{ color: "#96a87f" }} />
          <span
            style={{ fontSize: "14px", color: "#5a7a52", fontWeight: "500" }}
          >
            Powered by Yelp Ai
          </span>
        </div>

        {/* Main Headline */}
        <h1
          style={{
            fontSize: "clamp(40px, 8vw, 64px)",
            fontWeight: "700",
            color: "#3d3d3d",
            lineHeight: "1.1",
            marginBottom: "24px",
            letterSpacing: "-0.02em",
          }}
        >
          Find Your{" "}
          <span
            style={{
              color: "#5a7a52",
              position: "relative",
            }}
          >
            Calm Space
          </span>
        </h1>

        {/* Subheadline */}
        <p
          style={{
            fontSize: "20px",
            color: "#6b6b6b",
            lineHeight: "1.6",
            marginBottom: "40px",
            maxWidth: "600px",
            margin: "0 auto 40px",
          }}
        >
          Discover sensory-friendly restaurants and cafes. AI-powered comfort
          scores help you find venues where you can actually relax.
        </p>

        {/* CTA Buttons */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <Link
            href="/search"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "18px 36px",
              backgroundColor: "#5a7a52",
              color: "white",
              borderRadius: "16px",
              fontSize: "18px",
              fontWeight: "600",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(90, 122, 82, 0.3)",
              transition: "all 0.3s ease",
            }}
          >
            Start Searching
            <ArrowRight size={20} />
          </Link>
          <Link
            href="/onboarding"
            style={{
              fontSize: "15px",
              color: "#6b6b6b",
              textDecoration: "none",
            }}
          >
            Set your sensory preferences first →
          </Link>
        </div>
      </section>

      {/* Who It's For */}
      <section
        style={{
          padding: "60px 24px",
          backgroundColor: "rgba(255,255,255,0.6)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{ maxWidth: "900px", margin: "0 auto", textAlign: "center" }}
        >
          <h2
            style={{
              fontSize: "16px",
              fontWeight: "600",
              color: "#96a87f",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "16px",
            }}
          >
            Built for people who need
          </h2>
          <p
            style={{
              fontSize: "32px",
              fontWeight: "600",
              color: "#3d3d3d",
              marginBottom: "48px",
            }}
          >
            A little more calm in their day
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "24px",
            }}
          >
            {[
              { icon: Brain, label: "Autism", desc: "1 in 36 children" },
              { icon: Zap, label: "ADHD", desc: "6.1 million in US" },
              { icon: Sun, label: "Migraines", desc: "39 million affected" },
              { icon: Heart, label: "Anxiety", desc: "40 million adults" },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                style={{
                  padding: "28px 20px",
                  backgroundColor: "white",
                  borderRadius: "20px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    backgroundColor: "rgba(150, 168, 127, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <Icon size={28} style={{ color: "#5a7a52" }} />
                </div>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#3d3d3d",
                    marginBottom: "4px",
                  }}
                >
                  {label}
                </h3>
                <p style={{ fontSize: "14px", color: "#9a9a9a" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            backgroundColor: "#faf9f7",
            borderRadius: "24px",
            padding: "48px 40px",
            border: "1px solid #f3f1ed",
          }}
        >
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "600",
              color: "#3d3d3d",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            The problem with finding venues
          </h2>
          <div
            style={{
              display: "grid",
              gap: "16px",
              maxWidth: "500px",
              margin: "0 auto",
            }}
          >
            {[
              "Will it be too loud?",
              "Is the lighting harsh or dim?",
              "Will it be packed and overwhelming?",
              "Is there a quiet corner available?",
            ].map((question) => (
              <div
                key={question}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px 20px",
                  backgroundColor: "white",
                  borderRadius: "12px",
                  border: "1px solid #f3f1ed",
                }}
              >
                <span style={{ fontSize: "20px" }}>🤔</span>
                <span style={{ fontSize: "16px", color: "#6b6b6b" }}>
                  {question}
                </span>
              </div>
            ))}
          </div>
          <p
            style={{
              textAlign: "center",
              fontSize: "16px",
              color: "#6b6b6b",
              marginTop: "24px",
            }}
          >
            Traditional review sites don't answer these questions.{" "}
            <strong style={{ color: "#5a7a52" }}>Comfrt does.</strong>
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section
        style={{
          padding: "80px 24px",
          backgroundColor: "rgba(150, 168, 127, 0.08)",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "36px",
              fontWeight: "600",
              color: "#3d3d3d",
              textAlign: "center",
              marginBottom: "60px",
            }}
          >
            How it works
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "32px",
            }}
          >
            {[
              {
                step: "1",
                title: "Set your preferences",
                desc: "Tell us your sensitivities to noise, lighting, and crowds. Takes 30 seconds.",
                icon: "🎛️",
              },
              {
                step: "2",
                title: "Search naturally",
                desc: '"Find a quiet coffee shop to work from" or "Calm Italian restaurant for a date"',
                icon: "💬",
              },
              {
                step: "3",
                title: "Get comfort scores",
                desc: "Each venue gets a 0-100 comfort score with AI-generated insights unique to that place.",
                icon: "✨",
              },
            ].map(({ step, title, desc, icon }) => (
              <div
                key={step}
                style={{
                  backgroundColor: "white",
                  borderRadius: "24px",
                  padding: "36px 28px",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "-16px",
                    left: "28px",
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    backgroundColor: "#5a7a52",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "18px",
                  }}
                >
                  {step}
                </div>
                <div
                  style={{
                    fontSize: "40px",
                    marginBottom: "16px",
                    marginTop: "8px",
                  }}
                >
                  {icon}
                </div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#3d3d3d",
                    marginBottom: "8px",
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    color: "#6b6b6b",
                    lineHeight: "1.6",
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section
        style={{
          padding: "80px 24px",
          maxWidth: "1000px",
          margin: "0 auto",
        }}
      >
        <h2
          style={{
            fontSize: "36px",
            fontWeight: "600",
            color: "#3d3d3d",
            textAlign: "center",
            marginBottom: "16px",
          }}
        >
          Features that make a difference
        </h2>
        <p
          style={{
            fontSize: "18px",
            color: "#6b6b6b",
            textAlign: "center",
            marginBottom: "60px",
          }}
        >
          Every feature designed with sensory-sensitive users in mind
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {[
            {
              icon: Sparkles,
              title: "AI Comfort Analysis",
              desc: "Claude AI analyzes venue data to generate unique comfort insights for each location.",
            },
            {
              icon: Volume2,
              title: "Noise Level Predictions",
              desc: "Know if a venue is quiet, moderate, or loud before you go.",
            },
            {
              icon: MapPin,
              title: "Comfort Map View",
              desc: "See all venues on a color-coded map - green for calm, red for lively.",
            },
            {
              icon: Clock,
              title: "Best Time to Visit",
              desc: "Predictions for when venues are calmest (weekday mornings vs weekend brunch).",
            },
            {
              icon: Users,
              title: "Plan Your Outing",
              desc: "Chain multiple comfort-friendly stops with a total comfort score.",
            },
            {
              icon: Share2,
              title: "Share with Friends",
              desc: "Generate beautiful cards to share your favorite calm spots.",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              style={{
                padding: "28px",
                backgroundColor: "white",
                borderRadius: "20px",
                border: "1px solid #f3f1ed",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  backgroundColor: "rgba(150, 168, 127, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "16px",
                }}
              >
                <Icon size={24} style={{ color: "#5a7a52" }} />
              </div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  color: "#3d3d3d",
                  marginBottom: "8px",
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: "#6b6b6b",
                  lineHeight: "1.6",
                }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section
        style={{
          padding: "80px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#5a7a52",
            borderRadius: "32px",
            padding: "60px 40px",
            color: "white",
          }}
        >
          <Coffee size={48} style={{ marginBottom: "24px", opacity: 0.9 }} />
          <h2
            style={{
              fontSize: "32px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Ready to find your calm space?
          </h2>
          <p
            style={{
              fontSize: "18px",
              opacity: 0.9,
              marginBottom: "32px",
            }}
          >
            Join thousands of people who've found their perfect venues.
          </p>
          <Link
            href="/search"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "18px 36px",
              backgroundColor: "white",
              color: "#5a7a52",
              borderRadius: "16px",
              fontSize: "18px",
              fontWeight: "600",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
            }}
          >
            Start Searching Free
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* Footer Note */}
    </div>
  );
}
