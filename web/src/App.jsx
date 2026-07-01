import { useState, useEffect, useCallback } from 'react'
import { useGameData } from './hooks/useGameData'
import {
  loadTeams,
  saveTeams,
  resetFromCatalog,
  syncDescriptions,
  addTeam,
  removeTeam,
  buildSlotFromPokemon,
} from './utils/storage'
import {
  loadWishlist,
  saveWishlist,
  addWishlistItem,
  updateWishlistItem,
  removeWishlistItem,
} from './utils/wishlistStorage'
import { PcBox } from './components/PcBox'
import { TeamBuilder } from './components/TeamBuilder'
import { Wishlist } from './components/Wishlist'
import { loadOwnedIds, saveOwnedIds, toggleOwnedId } from './utils/ownedStorage'
import './App.css'

export default function App() {
  const { pokemonList, pokemonById, items, natures } = useGameData()
  const [tab, setTab] = useState('team')
  const [teamState, setTeamState] = useState(loadTeams)
  const [wishlistState, setWishlistState] = useState(loadWishlist)
  const [ownedIds, setOwnedIds] = useState(loadOwnedIds)
  const [selectedSlotIndex, setSelectedSlotIndex] = useState(0)

  const activeTeam = teamState.teams.find((t) => t.id === teamState.activeTeamId) || teamState.teams[0]

  useEffect(() => {
    saveTeams(teamState)
  }, [teamState])

  useEffect(() => {
    saveWishlist(wishlistState)
  }, [wishlistState])

  useEffect(() => {
    saveOwnedIds(ownedIds)
  }, [ownedIds])

  const setActiveTeamId = useCallback((teamId) => {
    setTeamState((prev) => ({ ...prev, activeTeamId: teamId }))
    setSelectedSlotIndex(0)
  }, [])

  const updateTeam = useCallback((updater) => {
    setTeamState((prev) => ({
      ...prev,
      teams: prev.teams.map((t) =>
        t.id === prev.activeTeamId ? { ...t, ...updater(t) } : t
      ),
    }))
  }, [])

  const handleResetCatalog = () => {
    if (
      !window.confirm(
        '¿Resetear los equipos predefinidos?\n\nVuelven los Pokémon, movimientos y textos originales. Los equipos que hayas creado tú no se borran.'
      )
    )
      return
    setTeamState(resetFromCatalog(teamState))
    setSelectedSlotIndex(0)
  }

  const handleSyncDescriptions = () => {
    if (
      !window.confirm(
        '¿Recuperar descripciones por defecto?\n\nSolo cambia nombre, estrategia y notas. Los Pokémon del equipo no se tocan.'
      )
    )
      return
    setTeamState(syncDescriptions(teamState))
  }

  const handleAddTeam = () => {
    const name = window.prompt('Nombre del nuevo equipo:', 'Nuevo equipo')
    if (name == null || !name.trim()) return
    setTeamState(addTeam(teamState, name.trim()))
    setSelectedSlotIndex(0)
  }

  const handleDeleteTeam = () => {
    if (!window.confirm(`¿Eliminar "${activeTeam.name}"?`)) return
    setTeamState(removeTeam(teamState, activeTeam.id))
    setSelectedSlotIndex(0)
  }

  const handleUpdateTeamMeta = (nextTeam) => {
    updateTeam(() => nextTeam)
  }

  const handleToggleOwned = (pokemonId) => {
    setOwnedIds((prev) => toggleOwnedId(prev, pokemonId))
  }

  const handleAddToSlot = (slotIndex, pokemon) => {
    updateTeam((team) => {
      const slots = [...team.slots]
      slots[slotIndex] = buildSlotFromPokemon(pokemon)
      return { slots }
    })
    setSelectedSlotIndex(slotIndex)
  }

  const handleUpdateSlot = (index, slot) => {
    if (index == null) return
    updateTeam((team) => {
      const slots = [...team.slots]
      slots[index] = slot
      return { slots }
    })
  }

  const handleClearSlot = (index) => {
    if (index == null) return
    updateTeam((team) => {
      const slots = [...team.slots]
      slots[index] = null
      return { slots }
    })
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Pokémon Champions</h1>
          <p className="muted">Team Lab · Regulation M-B</p>
        </div>
        <nav className="tabs">
          <button
            type="button"
            className={tab === 'box' ? 'is-active' : ''}
            onClick={() => setTab('box')}
          >
            Caja PC
          </button>
          <button
            type="button"
            className={tab === 'team' ? 'is-active' : ''}
            onClick={() => setTab('team')}
          >
            Equipos
          </button>
          <button
            type="button"
            className={tab === 'wishlist' ? 'is-active' : ''}
            onClick={() => setTab('wishlist')}
          >
            Buscamos
          </button>
        </nav>
      </header>

      <main className="app-main">
        {tab === 'box' && (
          <PcBox
            pokemonList={pokemonList}
            pokemonById={pokemonById}
            ownedIds={ownedIds}
            onToggleOwned={handleToggleOwned}
          />
        )}
        {tab === 'team' && (
          <TeamBuilder
            teams={teamState.teams}
            activeTeamId={teamState.activeTeamId}
            onSelectTeam={setActiveTeamId}
            onAddTeam={handleAddTeam}
            onDeleteTeam={handleDeleteTeam}
            onResetCatalog={handleResetCatalog}
            onSyncDescriptions={handleSyncDescriptions}
            onUpdateTeamMeta={handleUpdateTeamMeta}
            team={activeTeam}
            ownedPokemonIds={ownedIds}
            pokemonList={pokemonList}
            pokemonById={pokemonById}
            items={items}
            natures={natures}
            selectedSlotIndex={selectedSlotIndex}
            onSelectSlot={setSelectedSlotIndex}
            onUpdateSlot={handleUpdateSlot}
            onClearSlot={handleClearSlot}
            onAddPokemon={handleAddToSlot}
          />
        )}
        {tab === 'wishlist' && (
          <Wishlist
            pokemonList={pokemonList}
            pokemonById={pokemonById}
            items={wishlistState.items}
            onAdd={(entry) => setWishlistState((s) => addWishlistItem(s, entry))}
            onUpdate={(id, patch) => setWishlistState((s) => updateWishlistItem(s, id, patch))}
            onRemove={(id) => setWishlistState((s) => removeWishlistItem(s, id))}
          />
        )}
      </main>
    </div>
  )
}
