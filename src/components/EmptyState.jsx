export default function EmptyState({ message = 'Nessun contenuto', sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <svg width="48" height="60" viewBox="0 0 36 44" fill="none" className="mb-4 opacity-30">
        <path d="M18 2C18 2 4 20 4 28C4 36.8 10.3 44 18 44C25.7 44 32 36.8 32 28C32 20 18 2 18 2Z"
          fill="#9b7a42"/>
        <path d="M18 6C18 6 7 22 7 28.5C7 35.4 11.9 41 18 41"
          stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <p className="text-stone-500 font-medium text-sm">{message}</p>
      {sub && <p className="text-stone-400 text-xs mt-1">{sub}</p>}
    </div>
  )
}
