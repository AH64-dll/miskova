import Hero from "@/home/Hero";
import CollectionsSection from "@/home/CollectionsSection";
import SummerSection from "@/home/SummerSection";
import BestSellersSection from "@/home/BestSellersSection";
import HimSection from "@/home/HimSection";
import HerSection from "@/home/HerSection";
import StorySection from "@/home/StorySection";
import ArchiveSection from "@/home/ArchiveSection";

export default function Home() {
  return (
    <main>
      <Hero />
      <CollectionsSection />
      <SummerSection />
      <BestSellersSection />
      <HimSection />
      <HerSection />
      <StorySection />
      <ArchiveSection />
    </main>
  );
}
