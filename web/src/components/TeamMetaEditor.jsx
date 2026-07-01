/** Editable team metadata — collapsed by default; persisted in localStorage. */
export function TeamMetaEditor({ team, onChange, onClose }) {
  if (!team) return null

  const set = (patch) => onChange({ ...team, ...patch, metaEdited: true })

  return (
    <div className="team-meta">
      <div className="team-meta__head">
        <span>Editar información</span>
        {onClose && (
          <button type="button" className="btn btn--text" onClick={onClose}>
            Cerrar
          </button>
        )}
      </div>

      <div className="team-meta__grid">
        <label className="field field--compact">
          <span>Nombre</span>
          <input
            type="text"
            value={team.name}
            onChange={(e) => set({ name: e.target.value })}
          />
        </label>

        <label className="field field--compact field--wide">
          <span>Estrategia</span>
          <textarea
            rows={2}
            value={team.description || ''}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="Qué hace el equipo…"
          />
        </label>

        <label className="field field--compact">
          <span>Bring habitual</span>
          <input
            type="text"
            value={team.bringHint || ''}
            onChange={(e) => set({ bringHint: e.target.value })}
            placeholder="Ej. 1 · 2 · 3 · 4"
          />
        </label>

        <label className="field field--compact">
          <span>Próximos fichajes</span>
          <input
            type="text"
            value={team.recruitHint || ''}
            onChange={(e) => set({ recruitHint: e.target.value })}
            placeholder="Qué reclutar"
          />
        </label>

        <label className="field field--compact field--wide">
          <span>Notas</span>
          <textarea
            rows={2}
            value={team.notes || ''}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="Matchups, leads…"
          />
        </label>
      </div>
    </div>
  )
}
