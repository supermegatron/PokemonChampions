import { useState } from 'react'

export function MoveDescButton({ move }) {
  const [open, setOpen] = useState(false)
  const description = move?.description?.trim()
  if (!description || description === '—') return null

  return (
    <div className="move-desc">
      <button
        type="button"
        className={`move-desc__btn ${open ? 'is-open' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        aria-expanded={open}
        aria-label="Ver descripción del movimiento"
        title="Descripción"
      >
        i
      </button>
      {open && (
        <p className="move-desc__text" onClick={(e) => e.stopPropagation()}>
          {description}
        </p>
      )}
    </div>
  )
}
