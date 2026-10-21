import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { handleError, ArchiveError } from '../archive/errors'
import { attachTags, mapDocument, mapEvent, mapPhoto, mapVideo } from '../archive/mappers'
import type { ArchiveItemResponse, SearchResultResponse } from '../archive/types'

const VALID_TYPES = ['event', 'photo', 'document', 'video'] as const
type ItemType = (typeof VALID_TYPES)[number]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const q = searchParams.get('q')?.trim() ?? ''
    if (!q) {
      throw new ArchiveError(400, 'El parámetro q es obligatorio')
    }

    const typeParam = searchParams.get('type') ?? undefined
    if (typeParam && !VALID_TYPES.includes(typeParam as ItemType)) {
      throw new ArchiveError(400, `type inválido. Esperado uno de: ${VALID_TYPES.join(', ')}`)
    }
    const type = typeParam as ItemType | undefined

    const tag = searchParams.get('tag') ?? undefined

    const limitParam = parseInt(searchParams.get('limit') || '20', 10)
    const limit = Math.min(100, Math.max(1, Number.isNaN(limitParam) ? 20 : limitParam))

    let allowedIdsByType: Partial<Record<ItemType, Set<string>>> | undefined
    if (tag) {
      const tagRow = await prisma.tags.findUnique({ where: { name: tag } })
      allowedIdsByType = { event: new Set(), photo: new Set(), document: new Set(), video: new Set() }
      if (tagRow) {
        const itemTags = await prisma.item_tags.findMany({ where: { tag_id: tagRow.id } })
        for (const it of itemTags) {
          const t = it.item_type as ItemType
          if (allowedIdsByType[t]) {
            allowedIdsByType[t]!.add(it.item_id)
          }
        }
      }
    }

    const searchFilter = {
      OR: [
        { title: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } }
      ]
    }

    const buildWhere = (itemType: ItemType) => {
      const where: Record<string, unknown> = { ...searchFilter }
      if (allowedIdsByType) {
        where.id = { in: Array.from(allowedIdsByType[itemType] ?? []) }
      }
      return where
    }

    const fetchEvents = !type || type === 'event'
    const fetchPhotos = !type || type === 'photo'
    const fetchDocuments = !type || type === 'document'
    const fetchVideos = !type || type === 'video'

    const [events, photos, documents, videos] = await Promise.all([
      fetchEvents ? prisma.events.findMany({ where: buildWhere('event') }) : Promise.resolve([]),
      fetchPhotos ? prisma.photos.findMany({ where: buildWhere('photo') }) : Promise.resolve([]),
      fetchDocuments ? prisma.documents.findMany({ where: buildWhere('document') }) : Promise.resolve([]),
      fetchVideos ? prisma.videos.findMany({ where: buildWhere('video') }) : Promise.resolve([])
    ])

    const allItems: ArchiveItemResponse[] = [
      ...events.map((e) => mapEvent(e)),
      ...photos.map((p) => mapPhoto(p)),
      ...documents.map((d) => mapDocument(d)),
      ...videos.map((v) => mapVideo(v))
    ]

    const total = allItems.length
    const limitedItems = allItems.slice(0, limit)
    const items = await attachTags(limitedItems)

    const typeCounts = new Map<string, number>()
    const tagCounts = new Map<string, number>()
    for (const item of items) {
      typeCounts.set(item.type, (typeCounts.get(item.type) ?? 0) + 1)
      for (const t of item.tags) {
        tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
      }
    }

    const response: SearchResultResponse = {
      items,
      total,
      query: q,
      facets: {
        types: Array.from(typeCounts.entries()).map(([t, count]) => ({ type: t, count })),
        tags: Array.from(tagCounts.entries()).map(([t, count]) => ({ tag: t, count }))
      }
    }

    return Response.json(response)
  } catch (error) {
    return handleError(error)
  }
}
