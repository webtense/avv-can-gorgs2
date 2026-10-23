import { prisma } from '@/lib/db'
import { withBasePath } from '@/lib/basePath'
import type { ArchiveItemResponse } from './types'

type EventWithRelations = {
  id: string
  title: string
  description: string | null
  event_date: Date | null
}

type PhotoWithRelations = {
  id: string
  title: string
  description: string | null
  thumbnail_path: string | null
  taken_year: number | null
}

type DocumentWithRelations = {
  id: string
  title: string
  description: string | null
  document_year: number | null
}

type VideoWithRelations = {
  id: string
  title: string
  description: string | null
  recorded_year: number | null
}

/** Devuelve un mapa item_id -> array de nombres de tags para un tipo de item y una lista de ids. */
export async function getTagsForItems(
  itemType: 'event' | 'photo' | 'document' | 'video',
  itemIds: string[]
): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>()
  if (itemIds.length === 0) return map

  const itemTags = await prisma.item_tags.findMany({
    where: { item_type: itemType, item_id: { in: itemIds } },
    include: { tags: true }
  })

  for (const it of itemTags) {
    const list = map.get(it.item_id) ?? []
    list.push(it.tags.name)
    map.set(it.item_id, list)
  }

  return map
}

export function mapEvent(
  event: EventWithRelations,
  tags: string[] = []
): ArchiveItemResponse {
  return {
    id: event.id,
    type: 'event',
    title: event.title,
    description: event.description ?? undefined,
    date: event.event_date ? event.event_date.toISOString() : undefined,
    tags
  }
}

export function mapPhoto(
  photo: PhotoWithRelations,
  tags: string[] = []
): ArchiveItemResponse {
  return {
    id: photo.id,
    type: 'photo',
    title: photo.title,
    description: photo.description ?? undefined,
    date: photo.taken_year ? String(photo.taken_year) : undefined,
    thumbnailUrl: photo.thumbnail_path ? withBasePath(photo.thumbnail_path) : undefined,
    tags
  }
}

export function mapDocument(
  doc: DocumentWithRelations,
  tags: string[] = []
): ArchiveItemResponse {
  return {
    id: doc.id,
    type: 'document',
    title: doc.title,
    description: doc.description ?? undefined,
    date: doc.document_year ? String(doc.document_year) : undefined,
    tags
  }
}

export function mapVideo(
  video: VideoWithRelations,
  tags: string[] = []
): ArchiveItemResponse {
  return {
    id: video.id,
    type: 'video',
    title: video.title,
    description: video.description ?? undefined,
    date: video.recorded_year ? String(video.recorded_year) : undefined,
    tags
  }
}

/** Añade los tags a una lista de ArchiveItemResponse ya mapeados, agrupando por tipo. */
export async function attachTags(items: ArchiveItemResponse[]): Promise<ArchiveItemResponse[]> {
  const byType: Record<string, string[]> = { event: [], photo: [], document: [], video: [] }
  for (const item of items) {
    byType[item.type].push(item.id)
  }

  const tagMaps = await Promise.all(
    (['event', 'photo', 'document', 'video'] as const).map((t) =>
      getTagsForItems(t, byType[t])
    )
  )

  const combined = new Map<string, string[]>()
  for (const m of tagMaps) {
    for (const [k, v] of m) combined.set(k, v)
  }

  return items.map((item) => ({ ...item, tags: combined.get(item.id) ?? [] }))
}
