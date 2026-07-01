# Team Lab — Web local de equipos



Aplicación localhost para explorar el pool M-B, montar equipos y configurar cada Pokémon con habilidad, objeto y movimientos legales en Champions.



## Arrancar



```bash

cd web

npm install

npm run dev

```



Abre [http://localhost:5173](http://localhost:5173).



Build de producción:



```bash

npm run build

npm run preview

```



## Qué incluye



| Vista | Función |

|-------|---------|

| **Caja PC** | Grid con los 315 Pokémon del pool M-B. Búsqueda por nombre y filtro por tipo. Click → ir al equipo con ese Pokémon pendiente de colocar. |

| **Equipos** | Selector de equipos arriba. **+ Nuevo equipo** para crear los tuyos. Badge **✓ Tienes** según tu roster en catálogo. |

| **Editor** | Habilidad, naturaleza, objeto y 4 movimientos. Desplegables con **inglés + castellano oficial** (PokeAPI + WikiDex para objetos Gen 9). |

| **Notas del equipo** | Nombre, descripción, bring y fichajes editables en la UI (se guardan en localStorage). |



Los equipos se guardan en **localStorage** (`pokemon-champions-teams-v4`).



- **Restaurar plantillas** — vuelve roster y textos de los equipos del repo (`catalog.json` + `descriptions.json`). Conserva equipos que hayas creado tú.

- **Sincronizar textos del repo** — actualiza descripciones desde `descriptions.json` sin tocar slots (solo equipos de catálogo que no hayas editado en la UI).



## Editar equipos y textos (sin tocar React)



Plantillas en `data/M-B/teams/`:



| Archivo | Contenido |

|---------|-----------|

| `catalog.json` | `seedVersion`, `ownedPokemonIds`, array `teams` (id, name, tags, slots con movimientos/objetos/roles). |

| `descriptions.json` | Textos por `team id`: `description`, `recruitHint`, `bringHint`, `notes`. |



Al subir `seedVersion` en `catalog.json`, la app **añade** equipos nuevos del catálogo al arrancar (no borra los tuyos).



Ver también: [04-equipos-catalogo.md](./04-equipos-catalogo.md).



## Datos que usa



- `data/M-B/pokemon.json` — stats, tipos, habilidades, movimientos

- `data/M-B/items.json` — objetos equipables

- `data/M-B/teams/catalog.json` — plantillas de equipos

- `data/M-B/teams/descriptions.json` — textos de estrategia

- `web/public/sprites/` — sprites descargados de [PokemonDB](https://pokemondb.net/sprites)



- `data/M-B/translations/moves_es.json` — movimientos EN→ES (PokeAPI)
- `data/M-B/translations/abilities_es.json` — habilidades
- `data/M-B/translations/items_es.json` — objetos

Regenerar traducciones:

```bash
python scripts/build_i18n_es.py
```

La app importa los JSON vía alias `@data` definido en `web/vite.config.js`.



## Sprites



Descarga / actualización:



```bash

python scripts/download_sprites.py

```



## Estructura `web/`



```

web/

├── public/sprites/

├── src/

│   ├── App.jsx

│   ├── components/

│   │   ├── PcBox.jsx

│   │   ├── TeamBuilder.jsx

│   │   ├── TeamMetaEditor.jsx

│   │   ├── PokemonEditor.jsx

│   │   ├── PokemonSprite.jsx

│   │   └── TypeBadge.jsx

│   ├── hooks/useGameData.js

│   └── utils/

│       ├── storage.js

│       ├── teamCatalog.js

│       └── i18nEs.js

└── vite.config.js

```



## Próximas mejoras posibles



- Export/import de equipos (JSON o paste VGC)

- Mega Stone automática en megas

- Nature / Stat Alignment cuando tengamos esos datos

- Lista de objetos scrapeada de Game8 (ahora es lista curada competitiva)

