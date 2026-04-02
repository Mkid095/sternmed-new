import { useState, useEffect } from 'react';
import { Banner } from '../../../types';
import { ChevronLeft, ChevronRight, ArrowRight, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeroCarouselProps {
  banners: Banner[];
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const nextBanner = () => setCurrentIndex((prev) => (prev + 1) % banners.length);
  const prevBanner = () => setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);

  return (
    <section className="relative w-full h-[280px] sm:h-[400px] md:h-[500px] bg-gradient-to-br from-slate-900 to-slate-800 overflow-hidden">
      {/* Banners */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <img
            src={banner.imageUrl}
            alt={`Banner ${index + 1}`}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      ))}

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
          Sternmed Afrika
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 max-w-2xl">
          Your Trusted Medical Equipment Partner
        </p>
        <button
          onClick={() => navigate('/shop')}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <ShoppingBag size={20} />
          Shop Now
        </button>
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevBanner}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all backdrop-blur-sm"
            aria-label="Previous banner"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextBanner}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all backdrop-blur-sm"
            aria-label="Next banner"
          >
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  index === currentIndex ? 'bg-primary-500 scale-110' : 'bg-white/60 hover:bg-white/80'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
