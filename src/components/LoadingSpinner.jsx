export default function LoadingSpinner({ size = 'md' }) {
  const s = size === 'sm' ? 24 : size === 'lg' ? 56 : 36

  return (
    <div className="flex items-center justify-center py-8">
      <svg width={s} height={Math.round(s * 1.2)} viewBox="0 0 36 44" fill="none" className="droplet-animate">
        <path
          d="M18 2C18 2 4 20 4 28C4 36.8 10.3 44 18 44C25.7 44 32 36.8 32 28C32 20 18 2 18 2Z"
          fill="#8fcae2" opacity="0.3"
        />
        <path
          d="M18 6C18 6 7 22 7 28.5C7 35.4 11.9 41 18 41"
          stroke="#8fcae2" strokeWidth="2" strokeLinecap="round"
        />
      </svg>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="stone-card">
      <div className="flex items-start gap-2.5">
        <div className="skeleton w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-3 w-24 rounded" />
          <div className="skeleton h-4 w-full rounded" />
          <div className="skeleton h-3 w-3/4 rounded" />
        </div>
      </div>
    </div>
  )
}
