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
    <section id="testimonials" className="bg-white dark:bg-warm-white py-24">
      <div className="container-page">
        {/* Header */}
        <div className="text-center mb-16 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 bg-[#e8f5f1] dark:bg-teal-950/40 text-[#0D4F4F] dark:text-teal-400 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-4">
            Testimonials
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-955 dark:text-white tracking-tight leading-tight mb-3">
            Trusted by 250+ local families
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-brown-600 max-w-[440px] mx-auto leading-relaxed">
            Hear what our long-term subscribers in Padil have to say about our milk and service.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border rounded-[24px] p-9 flex flex-col shadow-sm text-left"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-5 text-amber-500 text-base">
                {Array.from({ length: r.rating }).map((_, idx) => (
                  <span key={idx}>★</span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic mb-7 flex-1">
                &ldquo;{r.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0D4F4F] dark:bg-teal-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {r.avatar}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-950 dark:text-white leading-tight">{r.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">{r.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
