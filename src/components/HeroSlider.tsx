import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BannerSlide {
  title: string;
  subtitle: string;
  discount: string;
  image: string;
  ctaText: string;
  categorySlug: string;
  badge: string;
}

interface HeroSliderProps {
  onCategorySelect: (slug: string) => void;
}

const SLIDES: BannerSlide[] = [
  {
    title: "Summer Sale Up to 50% Off",
    subtitle: "Discover amazing deals on fashion, electronics & more",
    discount: "EXCLUSIVE SUMMER DEALS",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200",
    ctaText: "Shop Now",
    categorySlug: "all",
    badge: "NEW COLLECTION 2024"
  },
  {
    title: "Premium Tech Innovations",
    subtitle: "Upgrade your lifestyle with next-gen smart gadgets",
    discount: "UP TO 40% OFF",
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=1200",
    ctaText: "Explore Tech",
    categorySlug: "gadgets",
    badge: "SMART FUTURISTIC GEARS"
  }
];

export default function HeroSlider({ onCategorySelect }: HeroSliderProps) {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIdx((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIdx((prev) => (prev === SLIDES.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full h-[280px] sm:h-[380px] lg:h-[450px] overflow-hidden rounded-[2rem] bg-[#ecfdf5]">
      
      {/* Slides Container */}
      {SLIDES.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out flex items-center justify-between px-8 sm:px-16 lg:px-24 ${
            idx === currentIdx ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Banner content */}
          <div className="z-20 flex flex-col justify-center max-w-xl text-gray-900 font-sans">
            <span className="text-brand-green text-[10px] sm:text-xs font-black tracking-widest bg-emerald-50 border border-brand-green/20 px-3 py-1.5 rounded-lg w-max mb-6">
              {slide.badge}
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight mb-4 text-gray-900">
              {slide.title}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base lg:text-lg font-medium leading-relaxed mb-8 hidden sm:block">
              {slide.subtitle}
            </p>
            <div>
              <button
                onClick={() => onCategorySelect(slide.categorySlug)}
                className="bg-brand-green hover:bg-brand-green-dark text-white font-bold text-sm px-10 py-4 rounded-xl shadow-xl shadow-brand-green/20 transition-all flex items-center gap-2"
              >
                <span>{slide.ctaText}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right Side Image (Mocking the photo's woman model) */}
          <div className="hidden lg:block relative h-full w-1/2">
             <img
              src={slide.image}
              alt={slide.title}
              className="h-full w-full object-contain object-bottom transform group-hover:scale-105 duration-700 transition-all"
            />
            {/* Aesthetic circle in background */}
            <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-green/10 rounded-full blur-3xl" />
          </div>
        </div>
      ))}

      {/* Slide Navigation */}
      <button
        onClick={handlePrev}
        className="absolute left-6 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-lg border border-gray-100 transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-6 top-1/2 -translate-y-1/2 z-30 bg-white/80 hover:bg-white text-gray-800 p-2.5 rounded-full shadow-lg border border-gray-100 transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Indicator dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIdx(idx)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              idx === currentIdx ? 'bg-brand-green w-6' : 'bg-brand-green/20'
            }`}
          />
        ))}
      </div>

      {/* Limited Time Offer Floating Tag */}
      <div className="absolute top-12 right-24 hidden xl:block z-30 bg-white/90 p-4 rounded-full border-2 border-brand-green shadow-xl flex flex-col items-center justify-center text-brand-green transform rotate-12">
          <span className="text-[10px] font-black uppercase text-center leading-none">Limited<br/>Time Offer</span>
          <span className="text-xs font-black mt-1 bg-brand-green text-white px-2 py-0.5 rounded-lg">SHOP NOW</span>
      </div>
    </div>
  );
}
