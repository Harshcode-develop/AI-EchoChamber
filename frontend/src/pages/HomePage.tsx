import HeroSection from '../components/landing/HeroSection';
import FeaturesGrid from '../components/landing/FeaturesGrid';
import HowItWorks from '../components/landing/HowItWorks';
import CTASection from '../components/landing/CTASection';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <FeaturesGrid />
      <HowItWorks />
      <CTASection />
    </main>
  );
}
