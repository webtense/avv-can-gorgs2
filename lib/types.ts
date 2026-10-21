export type ArchiveItemType = 'event' | 'photo' | 'document' | 'video';

export interface ArchiveItem {
  id: string;
  type: ArchiveItemType;
  title: string;
  description?: string;
  date?: string;
  thumbnailUrl?: string;
  tags: string[];
}

export interface ArchiveItemDetail extends ArchiveItem {
  content: string;
  location?: string;
  relatedItems: ArchiveItem[];
}

export interface ArchiveListResult {
  items: ArchiveItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ArchiveFiltersState {
  types: ArchiveItemType[];
  tags: string[];
  dateFrom?: string;
  dateTo?: string;
  query?: string;
}

export const ARCHIVE_TYPE_LABELS: Record<ArchiveItemType, string> = {
  event: 'Esdeveniment',
  photo: 'Fotografia',
  document: 'Document',
  video: 'Vídeo',
};
