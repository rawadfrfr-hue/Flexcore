'use client';

export function SkeletonCard() {
  return (
    <div className="flex flex-col space-y-2.5 animate-pulse">
      <div className="w-full aspect-[2/3] rounded-xl bg-white/5 border border-white/10 skeleton-shimmer relative overflow-hidden">
        <div className="absolute top-2 left-2 w-10 h-4 bg-white/10 rounded-md"></div>
        <div className="absolute top-2 right-2 w-12 h-4 bg-white/10 rounded-full"></div>
      </div>
      <div className="space-y-1.5">
        <div className="h-4 bg-white/10 rounded-md w-3/4 skeleton-shimmer"></div>
        <div className="h-3 bg-white/5 rounded-md w-1/2 skeleton-shimmer"></div>
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="relative w-full aspect-[21/9] min-h-[320px] md:min-h-[420px] rounded-2xl bg-white/5 border border-white/10 skeleton-shimmer overflow-hidden p-6 md:p-10 flex flex-col justify-end space-y-3">
      <div className="w-24 h-5 bg-white/10 rounded-md"></div>
      <div className="w-2/3 h-10 bg-white/15 rounded-lg"></div>
      <div className="w-1/2 h-4 bg-white/10 rounded-md"></div>
      <div className="w-full max-w-lg h-12 bg-white/5 rounded-xl"></div>
    </div>
  );
}

export function SkeletonWatch() {
  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-pulse">
      {/* Top bar skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10">
        <div className="w-32 h-9 bg-white/10 rounded-xl skeleton-shimmer"></div>
        <div className="w-28 h-7 bg-white/10 rounded-full skeleton-shimmer"></div>
      </div>

      {/* Video player skeleton */}
      <div className="w-full aspect-video md:aspect-[21/9] bg-black/80 rounded-2xl border border-white/10 skeleton-shimmer flex items-center justify-center relative">
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <div className="w-6 h-6 bg-white/20 rounded"></div>
        </div>
      </div>

      {/* Movie detail card skeleton */}
      <div className="bg-[#0f0f14] rounded-2xl p-6 md:p-8 border border-white/10 space-y-6">
        <div className="space-y-3">
          <div className="w-3/4 h-10 bg-white/10 rounded-lg skeleton-shimmer"></div>
          <div className="w-1/3 h-5 bg-white/5 rounded-md skeleton-shimmer"></div>
          <div className="flex gap-2">
            <div className="w-20 h-6 bg-white/10 rounded-md"></div>
            <div className="w-20 h-6 bg-white/10 rounded-md"></div>
            <div className="w-20 h-6 bg-white/10 rounded-md"></div>
          </div>
        </div>
        <div className="space-y-2 pt-4 border-t border-white/10">
          <div className="w-full h-4 bg-white/5 rounded"></div>
          <div className="w-5/6 h-4 bg-white/5 rounded"></div>
          <div className="w-4/6 h-4 bg-white/5 rounded"></div>
        </div>
      </div>
    </div>
  );
}
