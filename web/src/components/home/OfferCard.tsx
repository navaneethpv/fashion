"use client";

import { MouseEventHandler } from "react";
import { ArrowRight } from "lucide-react";

export type OfferFilters = {
  gender?: "Men" | "Women" | "Kids";
  category?: string[];
  maxPrice?: number;
  colors?: string[];
};

export interface OfferCardProps {
  title: string;
  subtitle: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export default function OfferCard({ title, subtitle, onClick }: OfferCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-left p-4 sm:p-5 md:p-6 text-white shadow-sm hover:shadow-xl transition-all duration-200 border border-white/5 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-slate-900 focus-visible:ring-offset-slate-100"
    >
      <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_top,rgba(244,244,245,0.18),transparent_55%),radial-gradient(circle_at_bottom,rgba(148,163,184,0.35),transparent_55%)]" />

      <div className="relative flex flex-col gap-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-[0.7rem] font-medium tracking-wide uppercase text-slate-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Limited Time
        </div>

        <h3 className="text-sm sm:text-base md:text-lg font-semibold tracking-tight">
          {title}
        </h3>
        <p className="text-[0.7rem] sm:text-xs text-slate-200/80 line-clamp-2">
          {subtitle}
        </p>

        <div className="mt-4 flex items-center justify-between text-[0.7rem] sm:text-xs text-slate-100/90">
          <span className="inline-flex items-center gap-1">
            View curated styles
            <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
          <span className="rounded-full bg-white/10 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-wider">
            Shop Now
          </span>
        </div>
      </div>
    </button>
  );
}


