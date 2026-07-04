const COLORS = [
  ['#dce9f2', '#155066'],
  ['#d4e8d0', '#2a5e20'],
  ['#d0d8f0', '#1a3a7a'],
  ['#f0d0d8', '#7a1a3a'],
  ['#d8e8f0', '#1a4a5e'],
  ['#e8d4f0', '#4a1a7a'],
]

function getColor(name = '') {
  const idx = name.charCodeAt(0) % COLORS.length
  return COLORS[idx]
}

function initials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
}

export default function UserAvatar({ name = '', size = 'md', avatarUrl }) {
  const [bg, fg] = getColor(name)
  const cls = sizes[size] || sizes.md

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${cls} rounded-full object-cover flex-shrink-0`}
      />
    )
  }

  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center flex-shrink-0 font-medium`}
      style={{ background: bg, color: fg }}
    >
      {initials(name)}
    </div>
  )
}
