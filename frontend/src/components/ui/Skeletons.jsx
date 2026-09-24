export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="skeleton aspect-[3/4] rounded-sm mb-3" />
      <div className="skeleton h-3 w-16 rounded mb-2" />
      <div className="skeleton h-4 w-40 rounded mb-2" />
      <div className="skeleton h-3 w-24 rounded" />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="skeleton aspect-[4/5] rounded-sm" />
        <div className="space-y-4">
          <div className="skeleton h-6 w-32 rounded" />
          <div className="skeleton h-8 w-64 rounded" />
          <div className="skeleton h-5 w-24 rounded" />
          <div className="skeleton h-20 w-full rounded" />
          <div className="skeleton h-12 w-full rounded" />
        </div>
      </div>
    </div>
  );
}

export function BannerSkeleton() {
  return <div className="skeleton h-[70vh] w-full" />;
}
