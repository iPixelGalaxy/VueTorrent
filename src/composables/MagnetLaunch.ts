import AddTorrentDialog from '@/components/Dialogs/AddTorrentDialog.vue'
import { useAddTorrentStore, useDialogStore } from '@/stores'

const PENDING_MAGNETS_KEY = 'vuetorrent_pending_magnets'

function tryDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function extractMagnetLink(value?: string | null) {
  if (!value) return undefined

  const decoded = tryDecode(value)
  if (decoded.startsWith('magnet:')) return decoded

  const magnetIndex = decoded.indexOf('magnet:')
  if (magnetIndex >= 0) return decoded.slice(magnetIndex)

  return undefined
}

export function extractMagnetFromLaunchUrl(targetURL?: string | null) {
  if (!targetURL) return undefined

  const decoded = tryDecode(targetURL)
  const hashIndex = decoded.indexOf('#')
  const hashPath = hashIndex >= 0 ? decoded.slice(hashIndex + 1) : decoded
  const magnetRouteMatch = hashPath.match(/(?:^|\/)(?:magnet|download=)\/?(.+)$/)

  return extractMagnetLink(magnetRouteMatch?.[1] ?? decoded)
}

function getPendingMagnets() {
  try {
    return JSON.parse(sessionStorage.getItem(PENDING_MAGNETS_KEY) ?? '[]') as string[]
  } catch {
    return []
  }
}

export function savePendingMagnet(magnetLink: string) {
  const pending = getPendingMagnets()
  if (!pending.includes(magnetLink)) {
    pending.push(magnetLink)
  }
  sessionStorage.setItem(PENDING_MAGNETS_KEY, JSON.stringify(pending))
}

export async function openMagnetDialog(magnetLink: string) {
  const addTorrentStore = useAddTorrentStore()
  const dialogStore = useDialogStore()

  await addTorrentStore.pushTorrentToQueue(magnetLink)
  if (!dialogStore.hasActiveDialog) {
    dialogStore.createDialog(AddTorrentDialog)
  }
}

export async function openPendingMagnetDialogs() {
  const pending = getPendingMagnets()
  if (!pending.length) return

  sessionStorage.removeItem(PENDING_MAGNETS_KEY)
  for (const magnetLink of pending) {
    await openMagnetDialog(magnetLink)
  }
}
