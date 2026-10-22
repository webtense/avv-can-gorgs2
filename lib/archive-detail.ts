import { prisma } from '@/lib/db'
import { attachTags, mapDocument, mapEvent, mapPhoto, mapVideo } from '@/app/api/archive/mappers'
import type { ArchiveDetailResponse, ArchiveItemResponse } from '@/app/api/archive/types'

export async function getArchiveDetail(id: string): Promise<ArchiveDetailResponse | null> {
  const event = await prisma.events.findUnique({
    where: { id },
    include: { photos: true, documents: true, videos: true, places: true }
  })

  if (event) {
    const [item] = await attachTags([mapEvent(event)])

    const relatedRaw: ArchiveItemResponse[] = [
      ...event.photos.map((p) => mapPhoto(p)),
      ...event.documents.map((d) => mapDocument(d)),
      ...event.videos.map((v) => mapVideo(v))
    ]
    const relatedItems = await attachTags(relatedRaw)

    const response: ArchiveDetailResponse = {
      ...item,
      content: event.description ?? '',
      location: event.places?.name ?? undefined,
      relatedItems
    }
    return response
  }

  const photo = await prisma.photos.findUnique({
    where: { id },
    include: { events: true, places: true }
  })

  if (photo) {
    const [item] = await attachTags([mapPhoto(photo)])

    let relatedItems: ArchiveItemResponse[] = []
    if (photo.event_id) {
      const siblingPhotos = await prisma.photos.findMany({
        where: { event_id: photo.event_id, id: { not: photo.id } }
      })
      relatedItems = await attachTags(siblingPhotos.map((p) => mapPhoto(p)))
    }

    const response: ArchiveDetailResponse = {
      ...item,
      content: photo.description ?? '',
      location: photo.places?.name ?? undefined,
      relatedItems
    }
    return response
  }

  const doc = await prisma.documents.findUnique({
    where: { id },
    include: { events: true }
  })

  if (doc) {
    const [item] = await attachTags([mapDocument(doc)])

    let relatedItems: ArchiveItemResponse[] = []
    if (doc.event_id) {
      const siblingDocs = await prisma.documents.findMany({
        where: { event_id: doc.event_id, id: { not: doc.id } }
      })
      relatedItems = await attachTags(siblingDocs.map((d) => mapDocument(d)))
    }

    const response: ArchiveDetailResponse = {
      ...item,
      content: doc.description ?? '',
      relatedItems
    }
    return response
  }

  const video = await prisma.videos.findUnique({
    where: { id },
    include: { events: true }
  })

  if (video) {
    const [item] = await attachTags([mapVideo(video)])

    let relatedItems: ArchiveItemResponse[] = []
    if (video.event_id) {
      const siblingVideos = await prisma.videos.findMany({
        where: { event_id: video.event_id, id: { not: video.id } }
      })
      relatedItems = await attachTags(siblingVideos.map((v) => mapVideo(v)))
    }

    const response: ArchiveDetailResponse = {
      ...item,
      content: video.description ?? '',
      relatedItems
    }
    return response
  }

  return null
}
