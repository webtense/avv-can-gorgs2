export interface ArchiveItemResponse {
  id: string
  type: "event" | "photo" | "document" | "video"
  title: string
  description?: string
  date?: string
  thumbnailUrl?: string
  tags: string[]
}

export interface ArchiveDetailResponse extends ArchiveItemResponse {
  content: string
  location?: string
  relatedItems: ArchiveItemResponse[]
}

export interface ArchiveListResponse {
  items: ArchiveItemResponse[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface SearchResultResponse {
  items: ArchiveItemResponse[]
  total: number
  query: string
  facets?: {
    types: { type: string; count: number }[]
    tags: { tag: string; count: number }[]
  }
}
