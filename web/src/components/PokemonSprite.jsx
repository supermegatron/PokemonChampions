export function PokemonSprite({ id, name, size = 64, className = '' }) {
  return (
    <img
      className={`pokemon-sprite ${className}`}
      src={`/sprites/${id}.png`}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      onError={(e) => {
        if (!e.currentTarget.src.endsWith('_placeholder.svg')) {
          e.currentTarget.src = '/sprites/_placeholder.svg'
        }
      }}
    />
  )
}
