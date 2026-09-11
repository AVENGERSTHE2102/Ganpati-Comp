import { Hero } from '@/components/home/Hero';
import { Categories } from '@/components/home/Categories';
import { SubmissionsShowcase } from '@/components/home/SubmissionsShowcase';
import { InfoSection } from '@/components/home/InfoSection';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen w-full">
      <Hero />
      <Categories />
      <SubmissionsShowcase />
      <InfoSection />
    </div>
  );
}
