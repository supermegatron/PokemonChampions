# Proceso de extracción de datos — Regulation M-B

Documento de referencia sobre cómo se generó la base de datos local de Pokémon Champions (Regulation M-B) y cómo mantenerla actualizada.

**Fecha:** 30 de junio de 2026  
**Regulation activa:** M-B (17 jun → 2 sep 2026)

---

## Objetivo

Tener en el repositorio una fuente de verdad **offline** con la que el asistente (y tú) podáis consultar rápido:

- Pool completo de Pokémon elegibles
- Stats, tipos, habilidades (con descripción) y movimientos disponibles en Champions
- Metadatos de la regulation (reglas, megas nuevas, fechas)

Sin depender de abrir webs en cada conversación.

---

## Fuentes utilizadas

| Fuente | URL | Qué aporta |
|--------|-----|------------|
| **Game8 — Stats index** | [Lista por stats (archives/593888)](https://game8.co/games/Pokemon-Champions/archives/593888) | Roster principal (277 entradas), stats y enlace a la ficha de cada Pokémon |
| **Game8 — Ficha individual** | Una URL por Pokémon (`Stats, Moves, and How to Get Fast`) | Pool de movimientos, habilidades con descripción, tipos |
| **Game8 — Novedades M-B** | [New Pokemon Season 3 (archives/605517)](https://game8.co/games/Pokemon-Champions/archives/605517) | 38 Pokémon/megas añadidos en M-B que aún no estaban en la tabla bulk |
| **Victory Road** | [Champions Regulations](https://victoryroad.pro/champions-regulations/) | Contexto VGC, fechas, reglas oficiales |
| **Pokémon HOME** | [Regulation Set M-B](https://news.pokemon-home.com/en/page/776.html) | Confirmación oficial de regulation y megas nuevas |

**Nota:** Game8 fue la fuente principal porque concentra stats + learnsets de Champions en un formato scrapeable. Victory Road y HOME sirven para validar regulation y reglas, no para el detalle movepool.

---

## Estructura generada en el repo

```
data/M-B/
├── regulation.json       # Meta: fechas, reglas, megas nuevas, fuentes
├── index.json            # Roster ligero (id, nombre, tipos, BST) — escaneo rápido
├── pokemon.json          # Dataset principal keyed by slug (~315 entradas, ~4 MB)
└── abilities_index.json  # Lookup inverso: habilidad → Pokémon que la tienen

scripts/
├── build_dataset.py      # Scraper principal
├── patch_dataset.py      # Parche tipos + Pokémon nuevos M-B
└── cache/
    └── scrape_cache.json # Cache para no re-descargar todas las fichas
```

### Formato de cada Pokémon (`pokemon.json`)

Cada entrada usa un **slug** como clave (`incineroar`, `gholdengo`, `mega-blaziken`):

```json
{
  "id": "incineroar",
  "name": "Incineroar",
  "regulation": "M-B",
  "types": ["Fire", "Dark"],
  "stats": {
    "hp": 170, "atk": 135, "def": 110,
    "spa": 100, "spd": 110, "spe": 80, "bst": 705
  },
  "abilities": [
    {
      "name": "Intimidate",
      "description": "When the Pokémon enters a battle...",
      "hidden": true
    }
  ],
  "moves": [
    {
      "name": "Fake Out",
      "power": 40,
      "accuracy": 100,
      "pp": 12,
      "description": "..."
    }
  ],
  "mega_evolution": false,
  "source_url": "https://game8.co/games/Pokemon-Champions/archives/592334"
}
```

Los añadidos en el parche M-B llevan además `"added_in": "M-B"`.

---

## Proceso técnico (resumen)

### 1. Roster + stats bulk

`build_dataset.py` descarga la tabla de [Game8 stats index](https://game8.co/games/Pokemon-Champions/archives/593888):

- Columnas: Pokémon, HP, Atk, Def, SpAtk, SpDef, Spe, Total
- Cada fila enlaza a la ficha individual del Pokémon

### 2. Detalle por Pokémon

Para cada enlace, el script parsea la ficha **Stats, Moves, and How to Get Fast**:

- **Habilidades:** tabla `Ability | Effect`
- **Movimientos:** tabla `Move | Type | Cat | Pow | Acc | PP` (+ descripción en la fila siguiente)
- **Tipos:** meta description / primer párrafo (`Fire/Dark-type`)

Los resultados se guardan en `scripts/cache/scrape_cache.json` para reanudar si se interrumpe.

### 3. Parche M-B (`patch_dataset.py`)

Game8 actualizó la regulation antes que la tabla bulk. El parche:

1. Corrige tipos que faltaban (regex `is a/an X-type` en meta description)
2. Añade 38 entradas desde la página de novedades M-B (Gholdengo, Annihilape, megas Hoenn/Z-A, etc.)

### 4. Índices auxiliares

- `index.json` — lista compacta para ver el pool entero
- `abilities_index.json` — “¿quién tiene Intimidate?” sin recorrer 315 fichas

---

## Cifras finales (30-jun-2026)

| Métrica | Valor |
|---------|-------|
| Entradas totales | **315** |
| Con movimientos | 315/315 (~62 moves de media) |
| Con habilidades + descripción | 315/315 |
| Con tipos | 315/315 |
| Añadidos vía parche M-B | 38 |

### Por qué 315 y no ~150

Champions cuenta **formas y megas como entradas separadas** (p. ej. `Charizard`, `Mega Charizard X`, `Alolan Raichu`, `Rotom` + formas). Eso encaja mejor para montar equipos que una lista de especies únicas.

### Matiz sobre los stats

Los números **no son los base stats clásicos** de la Pokédex mainline. Game8 documenta los **stats de Champions a nivel 50 con IVs máximos** (p. ej. Incineroar BST 705 vs 530 en mainline). Son los valores que importan en ranked.

---

## Cómo refrescar los datos

Cuando salga una nueva regulation (M-C, etc.) o Game8 actualice fichas:

```bash
# Desde la raíz del proyecto
python scripts/build_dataset.py
python scripts/patch_dataset.py
```

- `build_dataset.py` regenera `data/M-B/` desde cero (usa caché si existe).
- `patch_dataset.py` aplica correcciones y novedades que la tabla bulk aún no tenga.

**Recomendación:** crear una carpeta `data/M-C/` cuando cambie la regulation, en lugar de sobrescribir M-B, para conservar histórico.

---

## Limitaciones conocidas

1. **Dependencia de Game8** — si cambian el HTML, puede romperse el scraper.
2. **Lag en novedades** — los Pokémon nuevos pueden tardar en aparecer en la tabla bulk; el parche manual cubre ese hueco.
3. **Items y megas permitidas** — aún no scrapeados; están en regulation pero no en `pokemon.json`.
4. **Validación in-game** — conviene contrastar con la lista “Eligible Pokémon” del juego si hay duda tras un parche.

---

## Próximos documentos (carpeta `documentacion/`)

Espacio reservado para:

- Estrategias propias y arquetipos
- Resultados de ladder / torneos
- Equipos meta y matchups
- Notas de regulation por temporada

---

## Comandos y archivos clave

| Acción | Comando / archivo |
|--------|-------------------|
| Regenerar dataset | `python scripts/build_dataset.py` |
| Aplicar parche M-B | `python scripts/patch_dataset.py` |
| Consultar un Pokémon | `data/M-B/pokemon.json` → clave slug |
| Ver pool rápido | `data/M-B/index.json` |
| Buscar por habilidad | `data/M-B/abilities_index.json` |
