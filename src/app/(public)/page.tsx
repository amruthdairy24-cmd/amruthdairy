import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { OurStoryPreview } from '@/components/home/OurStoryPreview'
import { HowItWorks } from '@/components/home/HowItWorks'
import { ProductsPreview } from '@/components/home/ProductsPreview'
import StatsBar from '@/components/home/StatsBar'
import { OurStoryVideos } from '@/components/our-story/OurStoryVideos'
import { PricingSection } from '@/components/subscribe/PricingSection'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <OurStoryVideos />
        <PricingSection/>
        <OurStoryPreview />
        <HowItWorks />
        <ProductsPreview />
      </main>
      <Footer />
    </>
  )
}
