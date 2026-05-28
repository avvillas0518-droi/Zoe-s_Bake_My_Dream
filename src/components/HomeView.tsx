import React, { useState, useEffect } from "react";
import { Sparkles, Croissant, Cookie, Cake, Star } from "lucide-react";
import { Product, Testimonial, Promotion } from "../types";

interface HomeViewProps {
  products: Product[];
  promotion: Promotion;
  testimonials: Testimonial[];
  setActiveTab: (tab: string) => void;
  setSelectedCategory: (category: string) => void;
  onAddToCart: (product: Product) => void;
  triggerNotification: (message: string, type?: "success" | "error" | "info") => void;
}

export default function HomeView({
  products,
  promotion,
  testimonials,
  setActiveTab,
  setSelectedCategory,
  onAddToCart,
  triggerNotification,
}: HomeViewProps) {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const difference = +new Date(promotion.endDate) - +new Date();
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft({ hours, minutes, seconds });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [promotion.endDate]);

  const featured = products.filter((p) => p.isFeatured && p.available).slice(0, 4);

  return (
    <div className="bg-alabaster">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-alabaster py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cream/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-center lg:text-left">
            <span className="px-3.5 py-1.5 rounded-full bg-burgundy/10 border border-burgundy/20 text-burgundy font-semibold text-xs tracking-widest inline-block">
              Artisanal & Handcrafted
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold text-charcoal leading-tight">
              Freshly Baked <br />
              <span className="text-burgundy font-serif italic">Happiness</span> Every Day
            </h1>
            <p className="text-base sm:text-lg text-clay max-w-lg mx-auto lg:mx-0 leading-relaxed font-sans">
              We offer soft, chewy and  not too sweet crinkles made with quality ingredients.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <button
                onClick={() => setActiveTab('menu')}
                className="px-8 py-4.5 bg-burgundy hover:bg-burgundy/90 text-white font-bold rounded-full shadow-lg hover:shadow-burgundy/10 transition-all text-center text-xs tracking-wider uppercase cursor-pointer"
              >
                Explore our Menu
              </button>
              <button
                onClick={() => {
                  const target = document.getElementById('promo-banner-section');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4.5 bg-white hover:bg-cream border border-putty text-charcoal font-semibold rounded-full shadow-sm hover:shadow transition-all text-center text-xs tracking-wider uppercase cursor-pointer"
              >
                Today's Special Deal
              </button>
            </div>
          </div>

          {/* Hero Image Block */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-burgundy/10 to-transparent rounded-3xl transform rotate-2 scale-95 -z-10"></div>
            <img
              src="https://scontent-mnl1-2.xx.fbcdn.net/v/t39.30808-6/655431153_1246843630978955_5731427153594308894_n.jpg?stp=cp6_dst-jpg_s960x960_tt6&_nc_cat=106&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeGXpkI3a_P68lpmRmZqHzMJkBWuezEAl1uQFa57MQCXW7ar3ScvxsOjFyrCo60pdxlpHBPNM-DRvu6pD22WIuPT&_nc_ohc=xOswOUNg3nAQ7kNvwHuHV3L&_nc_oc=AdrltlC8y72SeLGc3SPPSHqkOpp1e_NCex0-RqhnrbGeSnjocx3ILY_l1THdCJMxbns&_nc_zt=23&_nc_ht=scontent-mnl1-2.xx&_nc_gid=No6X-DJoMhMdILYrOqusgQ&_nc_ss=7b2a8&oh=00_Af4z_gx_z-3SSZDc-avO7Ans5v5YUsypNgkkmBjC6QOJog&oe=6A1CA2E0"
              alt="Artisan baker kneading flour with fresh brioche loaves"
              className="rounded-3xl shadow-xl w-full h-[360px] sm:h-[420px] object-cover border-4 border-white"
            />
            <div className="absolute -bottom-5 -left-5 bg-white p-4 rounded-2xl shadow-lg border border-putty hidden sm:flex items-center gap-3">
              <div className="p-2.5 bg-burgundy/10 text-burgundy rounded-full">
                <Cookie className="w-8 h-8" />
              </div>
              <div>
                <p className="text-[10px] text-clay font-bold uppercase tracking-wider">Premium Chocolate crinkles</p>
                <p className="font-serif font-bold text-charcoal">Crinklelicious in every Bites</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Category Hub */}
      <section className="py-12 bg-cream/40 border-y border-putty">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center font-serif text-xs text-clay tracking-[0.25em] uppercase mb-8">Choose Your Perfect Craving</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-3xl mx-auto">
            {[
              { name: 'Crinkles', icon: Cookie },
              { name: 'Cakes', icon: Cake },
              { name: 'Bread', icon: Sparkles }
            ].map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  setActiveTab('menu');
                }}
                className="flex flex-col items-center gap-3.5 p-5 rounded-2xl border border-putty bg-white hover:border-burgundy hover:bg-cream/20 transition-all group cursor-pointer shadow-xs"
              >
                <div className="text-clay group-hover:text-burgundy transition-colors">
                  <cat.icon className="w-7 h-7" />
                </div>
                <span className="font-semibold text-xs text-clay tracking-wider uppercase group-hover:text-burgundy">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Signature Specialties */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-xl mx-auto mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-charcoal mb-3">Today's Standout Bakes</h2>
          <div className="w-14 h-1 bg-burgundy mx-auto mb-4 rounded-full"></div>
          <p className="text-sm text-clay font-sans leading-relaxed">
            Lovingly sculpted with unbleached organic grain flour, high-fat pasture dairy, and premium chocolate blocks. These sell out quickly!
          </p>
        </div>

        {featured.length === 0 ? (
          <p className="text-center text-sm text-clay italic">No featured bakes listed currently.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featured.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-putty hover:border-burgundy/40 group flex flex-col h-full">
                <div className="relative overflow-hidden aspect-[4/3] bg-cream/30">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-burgundy text-white rounded-full shadow-sm">
                    {item.category}
                  </span>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="font-serif font-bold text-lg text-charcoal group-hover:text-burgundy transition-colors mb-2 line-clamp-1">{item.name}</h3>
                  <p className="text-clay text-xs leading-relaxed line-clamp-2 mb-4 flex-grow">{item.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-cream">
                    <span className="font-serif font-black text-burgundy text-lg">₱{item.price.toFixed(2)}</span>
                    <button
                      onClick={() => onAddToCart(item)}
                      className="px-4.5 py-2 text-xs font-bold text-burgundy hover:text-white bg-burgundy/10 hover:bg-burgundy rounded-full transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Pre-Order
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Countdown Promo Banner */}
      <section id="promo-banner-section" className="py-16 bg-cream border-y border-putty text-charcoal relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full border border-burgundy/5 pointer-events-none"></div>
        <div className="absolute -left-10 -top-10 w-48 h-48 rounded-full border border-burgundy/5 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <span className="px-3 py-1.5 rounded-full bg-burgundy/10 border border-burgundy/20 text-burgundy font-semibold text-xs tracking-widest inline-block mb-6">
            Seasonal Celebration Offer
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-extrabold mb-4 text-charcoal">{promotion.title}</h2>
          <p className="text-sm sm:text-base text-clay max-w-xl mx-auto mb-8 font-light leading-relaxed">
            {promotion.description} Just copy code <span className="font-mono bg-white border border-putty px-2.5 py-1 rounded text-burgundy font-bold text-xs tracking-wider">{promotion.code}</span> in your request note!
          </p>

          {/* Countdown Clock Face */}
          <div className="flex justify-center gap-4 sm:gap-6 mb-10">
            {[
              { label: 'Hours', value: timeLeft.hours },
              { label: 'Minutes', value: timeLeft.minutes },
              { label: 'Seconds', value: timeLeft.seconds }
            ].map((unit, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="bg-white rounded-2xl w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center border border-putty shadow-sm">
                  <span className="font-serif text-2xl sm:text-3xl font-black text-burgundy">{String(unit.value).padStart(2, '0')}</span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-clay mt-2">{unit.label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => {
              setSelectedCategory('All');
              setActiveTab('menu');
            }}
            className="px-8 py-4.5 bg-burgundy hover:bg-burgundy/90 text-white font-extrabold rounded-full transition-all text-xs tracking-widest uppercase cursor-pointer shadow-md"
          >
            Claim Brioche Combo Deal
          </button>
        </div>
      </section>

      {/* Customer Review Carousel */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-alabaster px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <span className="text-xs font-bold text-burgundy uppercase tracking-widest">Patron Statements</span>
              <h2 className="font-serif text-3xl font-extrabold text-charcoal mt-2">Love in Every Single Layer</h2>
            </div>

            {/* Display active index review card */}
            <div className="relative bg-white p-8 sm:p-12 rounded-3xl border border-putty shadow-sm text-center space-y-6">
              <div className="flex justify-center text-amber-500">
                {[...Array(testimonials[testimonialIndex]?.rating || 5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
              </div>

              <p className="font-serif italic text-base sm:text-lg text-charcoal leading-relaxed max-w-2xl mx-auto">
                "{testimonials[testimonialIndex]?.text}"
              </p>

              <div className="flex items-center justify-center gap-3 pt-2">
                <img 
                  src={testimonials[testimonialIndex]?.image} 
                  alt={testimonials[testimonialIndex]?.name} 
                  className="w-12 h-12 rounded-full object-cover border-2 border-putty shadow-md"
                />
                <div className="text-left">
                  <p className="font-serif font-bold text-charcoal text-sm leading-tight">{testimonials[testimonialIndex]?.name}</p>
                  <p className="text-[10px] text-clay font-semibold uppercase mt-0.5">{testimonials[testimonialIndex]?.role}</p>
                </div>
              </div>

              {/* Navigation Arrows */}
              <div className="absolute top-1/2 -translate-y-1/2 left-3 sm:-left-6 right-3 sm:-right-6 flex justify-between pointer-events-none">
                <button
                  type="button"
                  onClick={() => setTestimonialIndex(prev => prev === 0 ? testimonials.length - 1 : prev - 1)}
                  className="p-2 sm:p-2.5 rounded-full bg-white border border-putty text-burgundy hover:bg-cream hover:text-burgundy focus:outline-none shadow pointer-events-auto cursor-pointer transition-all"
                  aria-label="Previous Review"
                >
                  &larr;
                </button>
                <button
                  type="button"
                  onClick={() => setTestimonialIndex(prev => prev === testimonials.length - 1 ? 0 : prev + 1)}
                  className="p-2 sm:p-2.5 rounded-full bg-white border border-putty text-burgundy hover:bg-cream hover:text-burgundy focus:outline-none shadow pointer-events-auto cursor-pointer transition-all"
                  aria-label="Next Review"
                >
                  &rarr;
                </button>
              </div>
            </div>

            {/* Slider Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setTestimonialIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                    i === testimonialIndex ? 'bg-burgundy w-6' : 'bg-putty hover:bg-clay'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reseller Call-to-Action Section */}
      <section className="bg-cream/40 border-t border-putty py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cream/15 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto space-y-8 relative z-10 font-sans">
          <div className="space-y-4">
            <span className="px-3 py-1.5 rounded-full bg-burgundy/10 border border-burgundy/20 text-burgundy font-bold text-[10px] uppercase tracking-widest inline-block">
              Business Partnerships
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-charcoal leading-tight">
              Become a Zoe's Bakehouse Reseller
            </h2>
            <p className="text-xs sm:text-sm text-clay max-w-2xl mx-auto leading-relaxed font-sans">
              Partner with Camille to distribute premium, unbleached giant chunk cookies and delicate French butter-enriched brioche breads in your local cafes, restaurants, or specialty grocery stores. Contact Camille directly to receive tiered volume pricing options.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-xs pt-2">
            {/* WhatsApp option */}
            <a 
              href="https://wa.me/15550199?text=Hello%20Camille!%20I'm%20extremely%20interested%20in%20becoming%20an%20authorized%20reseller%20for%2520your%2520gourmet%2520bakery."
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider rounded-full transition flex items-center justify-center gap-2 shadow"
            >
              <span>Partner via WhatsApp</span>
            </a>

            {/* Messenger option */}
            <a 
              href="https://m.me/zoesbakehouse" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full sm:w-auto px-6 py-3.5 bg-[#0084FF] hover:bg-[#0072db] text-white font-bold uppercase tracking-wider rounded-full transition flex items-center justify-center gap-2 shadow"
            >
              <span>Direct on Messenger</span>
            </a>

            {/* Email Option */}
            <a 
              href="mailto:bakehouse@zoesdream.com?subject=Reseller%20Partnership%20Inquiry%2520-%2520Zoe's%2520Bakehouse"
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-cream border border-putty text-charcoal font-bold uppercase tracking-wider rounded-full transition flex items-center justify-center gap-2 shadow hover:text-burgundy"
            >
              <span>Send Email Proposal</span>
            </a>
          </div>
        </div>
      </section>

      {/* Specialty Inquiry Box */}
      <section className="bg-cream border-t border-putty py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-charcoal">Specialized celebration orders & catering</h3>
          <p className="text-xs sm:text-sm text-clay font-sans leading-relaxed">
            Planning romantic anniversaries, graduation banquets, corporate meetings, or fairy-tale weddings? Our master decorator designs your edible fantasy.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => {
                setSelectedCategory('All');
                setActiveTab('menu');
                setTimeout(() => {
                  const form = document.getElementById('booking-section');
                  if (form) form.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="px-6 py-3.5 bg-burgundy text-white hover:bg-burgundy/90 text-xs font-bold uppercase tracking-wider rounded-full shadow cursor-pointer transition-all"
            >
              Custom Pre-Order Form
            </button>
            <a 
              href="https://wa.me/15550199?text=Hello%20Camille!%2520I'd%2520like%2520to%2520inquire%2520about%2520your%2520custom%2520pastries."
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full transition-all flex items-center justify-center gap-1.5 shadow"
            >
              Order on WhatsApp
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}