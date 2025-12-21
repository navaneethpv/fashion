"use client"
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const banners = [
  {
    id: 1,
    title: "Summer Collection 2025",
    subtitle: "Discover the hottest trends",
    description: "Up to 50% off on selected items",
    buttonText: "Shop Now",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&h=600&fit=crop",
  },
  {
    id: 2,
    title: "New Arrivals",
    subtitle: "Fresh styles every week",
    description: "Be the first to shop the latest collections",
    buttonText: "Explore",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&h=600&fit=crop",
  },
  {
    id: 3,
    title: "Premium Quality",
    subtitle: "Luxury fashion for everyone",
    description: "Exclusive designs at affordable prices",
    buttonText: "View Collection",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=600&fit=crop",
  },
  {
    id: 4,
    title: "Sale Ends Soon",
    subtitle: "Don't miss out",
    description: "Extra 20% off with code: FASHION20",
    buttonText: "Shop Sale",
    image: "https://images.unsplash.com/photo-1558769132-cb1aea88f296?w=1920&h=600&fit=crop",
  },
];

export default function AutoBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 5000); // Change every 5 seconds

    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden group">
      {/* Slides */}
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${banner.image})` }}
          >
            <div className="absolute inset-0 bg-black/40"></div>
          </div>

          {/* Content */}
          <div className="relative z-20 h-full flex items-center justify-center text-center px-4">
            <div className="max-w-4xl animate-fade-in">
              <h2 className="text-sm md:text-lg font-semibold text-white/90 mb-2 uppercase tracking-widest">
                {banner.subtitle}
              </h2>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 tracking-tight">
                {banner.title}
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-8 font-medium">
                {banner.description}
              </p>
              <button className="px-8 py-4 bg-white text-gray-900 font-bold text-lg rounded-full hover:bg-gray-100 transition-all hover:scale-105 shadow-xl">
                {banner.buttonText}
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide
                ? 'w-12 h-3 bg-white'
                : 'w-3 h-3 bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
      `}</style>
    </div>
  );
}
