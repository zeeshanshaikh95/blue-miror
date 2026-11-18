type LoadingStateProps = {
  label?: string;
  cards?: number;
};

export function LoadingState({ label = 'Loading content', cards = 3 }: LoadingStateProps) {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label={label}
    >
      {Array.from({ length: cards }).map((_, index) => (
        <div key={index} className="border border-brand-line bg-brand-porcelain">
          <div className="aspect-[4/5] animate-pulse bg-brand-line/70" />
          <div className="space-y-4 p-6">
            <div className="h-2 w-20 animate-pulse bg-brand-line" />
            <div className="h-7 w-3/4 animate-pulse bg-brand-line" />
            <div className="h-3 w-full animate-pulse bg-brand-line" />
            <div className="h-3 w-5/6 animate-pulse bg-brand-line" />
          </div>
        </div>
      ))}
    </div>
  );
}
