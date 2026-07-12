export default function SpartanoCard({
  title,
  description,
  onClick,
  children,
  variant = 'default',
  className = '',
}) {
  const variantClasses = {
    default: 'bg-transparent border border-white',
    elevated: 'bg-transparent border border-white',
    interactive: 'bg-transparent border border-white hover:bg-stone-900/50 cursor-pointer active:scale-[0.99]',
  }
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`
        w-full text-left p-sp-lg transition-all rounded-none
        ${variantClasses[variant] || variantClasses.default}
        ${className}
      `}
    >
      {title && (
        <h3 className="font-sp-semibold text-sp-dark mb-sp-sm">{title}</h3>
      )}
      {description && (
        <p className="text-sp-font-size-sm text-sp-pietra mb-sp-md">{description}</p>
      )}
      {children}
    </Component>
  )
}
