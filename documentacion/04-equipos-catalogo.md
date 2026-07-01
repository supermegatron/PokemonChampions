# Catálogo de equipos — cómo editar

Los equipos plantilla y sus textos **no están hardcodeados en React**. Viven en JSON bajo `data/M-B/teams/`.

## `catalog.json`

```json
{
  "seedVersion": 2,
  "ownedPokemonIds": ["tyranitar", "arcanine", "..."],
  "teams": [
    {
      "id": "team-cover-sand",
      "name": "Cover · Arena (tu roster)",
      "tags": ["cover"],
      "slots": [
        {
          "pokemonId": "tyranitar",
          "ability": "Sand Stream",
          "item": "Assault Vest",
          "moves": ["Rock Slide", "Stone Edge", "Snarl", "Protect"],
          "role": "nucleo",
          "roleLabel": "Setter arena",
          "owned": true
        }
      ]
    }
  ]
}
```

- **`seedVersion`**: súbelo cuando añadas equipos nuevos al catálogo. La web los incorporará al cargar (merge con localStorage).
- **`ownedPokemonIds`**: Pokémon que ya tienes; muestra badge **✓ Tienes** en slots correspondientes.
- **`tags`**: `"cover"` marca equipos montables solo con tu roster.
- **`slots`**: 6 entradas (null o objeto). Roles: `nucleo`, `flex`, `senal`.

## `descriptions.json`

Textos separados del roster (estrategia, bring, fichajes):

```json
{
  "team-cover-sand": {
    "description": "Qué hace el equipo…",
    "recruitHint": "Qué fichar después…",
    "bringHint": "Bring habitual: 1 · 2 · 3 · 4",
    "notes": "Opcional: matchups, leads…"
  }
}
```

La clave es el `id` del equipo en `catalog.json`.

## Flujo recomendado

1. Edita `catalog.json` (Pokémon, sets, roles) y/o `descriptions.json` (textos).
2. Si añades equipos nuevos, incrementa `seedVersion`.
3. Recarga la web. Equipos nuevos aparecen solos.
4. Si ya tenías datos en el navegador: **Sincronizar textos del repo** o **Restaurar plantillas** según necesites.

Ediciones hechas en la UI (sección *Notas del equipo*) se guardan en localStorage con `metaEdited: true` y no se sobrescriben al sincronizar textos.

## Crear equipos desde la web

Usa **+ Nuevo equipo** en la vista Equipos. Esos equipos solo existen en localStorage hasta que los copies manualmente a `catalog.json` si quieres versionarlos en el repo.
