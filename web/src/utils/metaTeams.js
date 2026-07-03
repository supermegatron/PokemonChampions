import bundledMeta from '@data/meta/pikalytics-mb.json'

const isDev = import.meta.env.DEV

export async function fetchMetaData() {
  if (isDev) {
    const res = await fetch('/api/meta')
    if (!res.ok) throw new Error(`Meta API ${res.status}`)
    return res.json()
  }
  return bundledMeta
}

export async function refreshMetaData() {
  if (!isDev) {
    throw new Error('Actualizar meta solo está disponible en npm run dev')
  }
  const res = await fetch('/api/meta/refresh', { method: 'POST' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Refresh failed (${res.status})`)
  return data
}

export function formatScrapedAt(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}
