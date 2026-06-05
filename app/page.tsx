import { auth } from "@clerk/nextjs/server";
import Navbar from "@/components/landing/navbar";
import HeroSection from "@/components/landing/hero";
import FeatureSection from "@/components/landing/features";
import HowItWorks from "@/components/landing/how-it-works";
import ProductShowcase from "@/components/landing/showcase";
import AIWorkflowsSection from "@/components/landing/ai-workflows";
import CollaborationSection from "@/components/landing/collaboration";
import UseCasesSection from "@/components/landing/use-cases";
import TrustStats from "@/components/landing/trust-stats";
import PricingSection from "@/components/landing/pricing";
import TestimonialsSection from "@/components/landing/testimonials";
import FAQSection from "@/components/landing/faq";
import FinalCTASection from "@/components/landing/final-cta";
import Footer from "@/components/landing/footer";

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen transition-colors duration-300 bg-white dark:bg-[#050816] text-slate-900 dark:text-slate-100 font-sans antialiased overflow-x-hidden selection:bg-blue-600/30 selection:text-blue-200">
      {/* Sticky Glassmorphism Header */}
      <Navbar userId={userId} />

      {/* Hero Workspace Preview */}
      <HeroSection userId={userId} />

      {/* Grid of 9 Core Features */}
      <FeatureSection />

      {/* 3 Step Interactive Setup Roadmap */}
      <HowItWorks />

      {/* Interactive Feature Sandbox Mocks */}
      <ProductShowcase />

      {/* AI Capabilities Prompt Playground */}
      <AIWorkflowsSection />

      {/* Liveblocks Collaborative Cursor Indicators */}
      <CollaborationSection />

      {/* Persona Audience Tabs */}
      <UseCasesSection />

      {/* Trust Statistics Counters */}
      <TrustStats />

      {/* Billing toggle pricing modules */}
      <PricingSection userId={userId} />

      {/* Testimonials Wall */}
      <TestimonialsSection />

      {/* Accordion Disclosures */}
      <FAQSection />

      {/* High-conversion closing banner */}
      <FinalCTASection userId={userId} />

      {/* Resource Footer map */}
      <Footer />
    </main>
  );
}



