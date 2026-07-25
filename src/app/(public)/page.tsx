import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { OurStoryPreview } from '@/components/home/OurStoryPreview'
import { HowItWorks } from '@/components/home/HowItWorks'
import { ProductsPreview } from '@/components/home/ProductsPreview'
import StatsBar from '@/components/home/StatsBar'
import { OurStoryVideos } from '@/components/our-story/OurStoryVideos'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <OurStoryVideos />
        <OurStoryPreview />
        <HowItWorks />
        <ProductsPreview />
      </main>
      <Footer />
    </>
  )
}
