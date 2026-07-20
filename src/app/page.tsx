import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import {
  HeroSection,
  StatsSection,
  HowItWorksSection,
  FeaturesSection,
  AISection,
  TestimonialsSection,
  CTASection,
} from "@/components/landing";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <HowItWorksSection />
        <FeaturesSection />
        <AISection />
        <TestimonialsSection />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
