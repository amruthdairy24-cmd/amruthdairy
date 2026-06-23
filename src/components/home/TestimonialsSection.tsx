export function TestimonialsSection() {
  const reviews = [
    {
      name: 'Ravi Nayak',
      location: 'Padil, Mangalore',
      quote: 'The online skip feature is a lifesaver. We used to forget to WhatsApp the dairy owner, and end up with excess milk. Now we just tap skip before 9 PM on the site, and the credit shows up on our monthly bill automatically. Extremely transparent!',
      rating: 5,
      avatar: 'RN'
    },
    {
      name: 'Priya Shenoy',
      location: 'Urwa, Mangalore',
      quote: 'Fresh, pure milk delivered every morning. We paused deliveries for 10 days while visiting relatives in Bangalore. The vacation feature worked perfectly — not a single drop was delivered, and the exact credit was adjusted in the next bill.',
      rating: 5,
      avatar: 'PS'
    },
    {
      name: 'Anand Kumar',
      location: 'Padil, Mangalore',
      quote: 'We need extra milk on weekends for making tea/sweets. Ordering through the website is so much easier than messaging or calling. The extra pack arrives morning, and is added to our monthly ledger automatically.',
      rating: 5,
      avatar: 'AK'
    }
  ]

  return (
    <section id="testimonials" style={{ background: '#fff', padding: '96px 0' }}>
      <div className="container-page">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: '#e8f5f1', color: '#0D4F4F', borderRadius: '999px',
            padding: '6px 16px', fontSize: '0.72rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px'
          }}>
            Testimonials
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, color: '#0a2e2e', letterSpacing: '-0.02em', lineHeight: 1.15, marginBottom: '12px' }}>
            Trusted by 250+ local families
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(8,46,46,0.5)', maxWidth: '440px', margin: '0 auto', lineHeight: 1.65 }}>
            Hear what our long-term subscribers in Padil have to say about our milk and service.
          </p>
        </div>

        {/* Reviews Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
          {reviews.map((r, i) => (
            <div
              key={i}
              style={{
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '24px',
                padding: '36px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
              }}
            >
              {/* Stars */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', color: '#F59C1A', fontSize: '16px' }}>
                {Array.from({ length: r.rating }).map((_, idx) => (
                  <span key={idx}>★</span>
                ))}
              </div>

              {/* Quote */}
              <p style={{ fontSize: '0.9rem', color: 'rgba(8,46,46,0.65)', lineHeight: 1.65, fontStyle: 'italic', marginBottom: '28px', flex: 1 }}>
                &ldquo;{r.quote}&rdquo;
              </p>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', background: '#0D4F4F', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem'
                }}>
                  {r.avatar}
                </div>
                <div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0a2e2e', lineHeight: 1.2 }}>{r.name}</h4>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(8,46,46,0.4)', fontWeight: 600 }}>{r.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
