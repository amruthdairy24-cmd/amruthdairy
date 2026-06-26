import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { HeroSection } from '@/components/home/HeroSection'
import { OurStory } from '@/components/home/OurStory'
import { HowItWorks } from '@/components/home/HowItWorks'
import { ProductsPreview } from '@/components/home/ProductsPreview'
import StatsBar from '@/components/home/StatsBar'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar/>
        <OurStory />
        <HowItWorks />
        <ProductsPreview />
      </main>
      <Footer />
    </>
  )
}
