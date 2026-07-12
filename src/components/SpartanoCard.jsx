export default function SpartanoCard({
  title,
  description,
  onClick,
  children,
  variant = 'default',
  className = '',
}) {
  const variantClasses = {
    default: 'bg-sp-white border border-sp-pietra/20',
    elevated: 'bg-sp-white shadow-sp',
    interactive: 'bg-sp-white border border-sp-pietra/20 hover:shadow-sp cursor-pointer active:opacity-90',
  }
  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`
        w-full text-left rounded-sp-md p-sp-lg transition-all
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
