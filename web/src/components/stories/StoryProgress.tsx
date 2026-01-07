"use client";

import { useEffect, useState } from "react";

interface StoryProgressProps {
    current: number;
    total: number;
    activeIndex: number;
    duration?: number;
    onComplete: () => void;
    isPaused: boolean;
}

export default function StoryProgress({
    total,
    activeIndex,
    duration = 5000,
    onComplete,
    isPaused
}: StoryProgressProps) {

    return (
        <div className="absolute top-4 left-0 right-0 z-50 flex gap-1.5 px-3">
            {Array.from({ length: total }).map((_, idx) => (
                <ProgressItem
                    key={idx}
                    index={idx}
                    activeIndex={activeIndex}
                    duration={duration}
                    onComplete={onComplete}
                    isPaused={isPaused}
                />
            ))}
        </div>
    );
}

function ProgressItem({
    index,
    activeIndex,
    duration,
    onComplete,
    isPaused
}: {
    index: number;
    activeIndex: number;
    duration: number;
    onComplete: () => void;
    isPaused: boolean;
}) {
    const isActive = index === activeIndex;
    const isCompleted = index < activeIndex;

    return (
        <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
            <div
                className="h-full bg-white origin-left"
                style={{
                    width: isCompleted ? '100%' : isActive ? '100%' : '0%',
                    transform: isActive ? 'scaleX(0)' : undefined, // Start at 0
                    // If active, we animate scaleX from 0 to 1
                    animation: isActive ? `progress ${duration}ms linear forwards` : undefined,
                    animationPlayState: isPaused ? 'paused' : 'running',
                }}
                onAnimationEnd={() => {
                    if (isActive) onComplete();
                }}
            />
            <style jsx>{`
        @keyframes progress {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
      `}</style>
        </div>
    );
}
