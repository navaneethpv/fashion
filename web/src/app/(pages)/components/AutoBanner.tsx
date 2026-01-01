"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const banners = [
  {
    id: 1,
    subtitle: "New Collection",
    title: "The Art of Summer",
    description: "Effortless elegance for the warmer days ahead.",
    buttonText: "Explore Collection",
    link: "/product?gender=women",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&h=1080&fit=crop",
  },
  {
    id: 2,
    subtitle: "Featured",
    title: "Modern Tailoring",
    description: "Impeccable fits defined by precision and style.",
    buttonText: "Shop Men",
    link: "/product?gender=men",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&h=1080&fit=crop",
  },
  {
    id: 3,
    subtitle: "Essentials",
    title: "Quiet Luxury",
    description: "Timeless pieces that speak volumes in silence.",
    buttonText: "View Essentials",
    link: "/product",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=1080&fit=crop",
  },
  {
    id: 4,
    subtitle: "Urban Edge",
    title: "Streetwear Redefined",
    description: "Bold statements for the concrete jungle.",
    buttonText: "Shop Streetwear",
    link: "/product?q=Streetwear",
    image: "https://images.unsplash.com/photo-1523396864712-ecc4a2401d41?w=1920&h=1080&fit=crop",
  },
  {
    id: 5,
    subtitle: "Formal Elegance",
    title: "The Evening Edit",
    description: "Sophisticated attire for your most memorable nights.",
    buttonText: "View Formal Wear",
    link: "/product?q=Formal",
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1920&h=1080&fit=crop",
  },
  {
    id: 6,
    subtitle: "Accessorize",
    title: "Finishing Touches",
    description: "Elevate your look with our curated accessories.",
    buttonText: "Discover Accessories",
    link: "/product?q=Accessory",
    image: "https://images.unsplash.com/photo-1618453292459-53424688f279?w=1920&h=1080&fit=crop",
  },
];

export default function AutoBanner() {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const STRICT_DURATION = 4000;

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const animate = (time: number) => {
      if (!isPaused) {
        const delta = time - lastTime;
        setProgress((prev) => {
          const nextProgress = prev + (delta / STRICT_DURATION) * 100;
          if (nextProgress >= 100) {
            setCurrent((c) => (c + 1) % banners.length);
            return 0;
          }
          return nextProgress;
        });
      }
      lastTime = time;
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPaused]);

  const next = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
    setProgress(0);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
    setProgress(0);
  };

  return (
    <div
      className="relative w-full h-[600px] md:h-[85vh] overflow-hidden bg-gray-100 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <AnimatePresence mode="popLayout">
        <motion.div
          key={current}
          initial={{ opacity: 0.8, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${banners[current].image})` }}
          />
          {/* Cinematic Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center text-center p-6">
            <div className="max-w-4xl">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-white/90 text-sm md:text-base uppercase tracking-[0.2em] mb-4 font-medium"
              >
                {banners[current].subtitle}
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-5xl md:text-7xl lg:text-8xl font-serif text-white mb-6 leading-none"
              >
                {banners[current].title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-white/80 text-lg md:text-xl font-light mb-10 max-w-xl mx-auto"
              >
                {banners[current].description}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0, duration: 0.5 }}
              >
                <Link
                  href={banners[current].link}
                  className="inline-block border border-white/40 rounded-lg bg-white/10 backdrop-blur-sm text-white px-10 py-4 font-medium tracking-wide hover:bg-white hover:text-black transition-all duration-300"
                >
                  {banners[current].buttonText}
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full hover:bg-white hover:text-black text-white hidden md:block"
      >
        <ChevronLeft className="w-8 h-8 font-thin" strokeWidth={1} />
      </button>
      <button
        onClick={next}
        className="absolute right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-full hover:bg-white hover:text-black text-white hidden md:block"
      >
        <ChevronRight className="w-8 h-8 font-thin" strokeWidth={1} />
      </button>

      {/* Progress Indicators (Flipkart Style) */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-3 z-20">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => { setCurrent(idx); setProgress(0); }}
            className={`relative h-1 rounded-full overflow-hidden transition-all duration-300 ease-out ${idx === current ? "w-12 bg-white/30" : "w-3 bg-white/50"
              }`}
          >
            {/* Progress Bar Fill - Only for Active Slide */}
            {idx === current && (
              <div
                className="absolute left-0 top-0 bottom-0 bg-white transition-all duration-[50ms] ease-linear"
                style={{ width: `${progress}%` }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
