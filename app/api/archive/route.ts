import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { validateListQuery } from './validators'
import { handleError, ArchiveError } from './errors'
import { attachTags, mapDocument, mapEvent, mapPhoto, mapVideo } from './mappers'
import type { ArchiveItemResponse, ArchiveListResponse } from './types'

const VALID_TYPES = ['event', 'photo', 'document', 'video'] as const
type ItemType = (typeof VALID_TYPES)[number]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const { page, limit, search } = validateListQuery({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      search: searchParams.get('search') ?? undefined
    })

    if (
      (searchParams.has('page') && Number.isNaN(parseInt(searchParams.get('page')!, 10))) ||
      (searchParams.has('limit') && Number.isNaN(parseInt(searchParams.get('limit')!, 10)))
    ) {
      throw new ArchiveError(400, 'page y limit deben ser números válidos')
    }

    const typeParam = searchParams.get('type') ?? undefined
    if (typeParam && !VALID_TYPES.includes(typeParam as ItemType)) {
      throw new ArchiveError(400, `type inválido. Esperado uno de: ${VALID_TYPES.join(', ')}`)
    }
    const type = typeParam as ItemType | undefined

    const tag = searchParams.get('tag') ?? undefined

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

    const searchFilter = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } }
          ]
        }
      : {}

    const buildWhere = (itemType: ItemType) => {
      const where: Record<string, unknown> = { ...searchFilter }
      if (allowedIdsByType) {
        where.id = { in: Array.from(allowedIdsByType[itemType] ?? []) }
      }
      return where
    }

    let items: ArchiveItemResponse[] = []

    const fetchEvents = !type || type === 'event'
    const fetchPhotos = !type || type === 'photo'
    const fetchDocuments = !type || type === 'document'
    const fetchVideos = !type || type === 'video'

    const [events, photos, documents, videos] = await Promise.all([
      fetchEvents
        ? prisma.events.findMany({ where: buildWhere('event') })
        : Promise.resolve([]),
      fetchPhotos
        ? prisma.photos.findMany({ where: buildWhere('photo') })
        : Promise.resolve([]),
      fetchDocuments
        ? prisma.documents.findMany({ where: buildWhere('document') })
        : Promise.resolve([]),
      fetchVideos
        ? prisma.videos.findMany({ where: buildWhere('video') })
        : Promise.resolve([])
    ])

    items = [
      ...events.map((e) => mapEvent(e)),
      ...photos.map((p) => mapPhoto(p)),
      ...documents.map((d) => mapDocument(d)),
      ...videos.map((v) => mapVideo(v))
    ]

    // Orden estable por fecha descendente (los que no tienen fecha van al final)
    items.sort((a, b) => {
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      return b.date.localeCompare(a.date)
    })

    const total = items.length
    const start = (page - 1) * limit
    const pageItems = items.slice(start, start + limit)
    const withTags = await attachTags(pageItems)

    const response: ArchiveListResponse = {
      items: withTags,
      total,
      page,
      limit,
      hasMore: start + limit < total
    }

    return Response.json(response)
  } catch (error) {
    return handleError(error)
  }
}
