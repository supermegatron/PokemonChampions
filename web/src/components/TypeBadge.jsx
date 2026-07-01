import { typeStyle } from '../utils/typeColors'

export function TypeBadge({ type }) {
  if (!type) return null
  return (
    <span className="type-badge" style={typeStyle(type)}>
      {type}
    </span>
  )
}
