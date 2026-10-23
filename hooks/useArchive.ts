'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ArchiveDetailResponse,
  ArchiveItemResponse,
  ArchiveListResponse,
  SearchResultResponse,
} from '@/app/api/archive/types';
import { withBasePath } from '@/lib/basePath';

interface UseArchiveListParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  tag?: string;
}

interface UseArchiveListResult {
  items: ArchiveItemResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Lista paginada de items del archivo, con filtros opcionales por tipo y
 * etiqueta, contra GET /api/archive.
 */
export function useArchiveList(params: UseArchiveListParams): UseArchiveListResult {
  const { page = 1, limit = 12, search, type, tag } = params;

  const [items, setItems] = useState<ArchiveItemResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [resultPage, setResultPage] = useState(page);
  const [resultLimit, setResultLimit] = useState(limit);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const qs = buildQuery({ page, limit, search, type, tag });

    fetch(withBasePath(`/api/archive${qs}`))
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Error ${res.status} al cargar el archivo`);
        }
        return (await res.json()) as ArchiveListResponse;
      })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotal(data.total);
        setResultPage(data.page);
        setResultLimit(data.limit);
        setHasMore(data.hasMore);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || 'No se ha podido cargar el archivo');
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, limit, search, type, tag]);

  return { items, total, page: resultPage, limit: resultLimit, hasMore, loading, error };
}

interface UseArchiveDetailResult {
  item: ArchiveDetailResponse | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
}

/**
 * Detalle de un item del archivo por id, contra GET /api/archive/[id].
 */
export function useArchiveDetail(id: string | undefined): UseArchiveDetailResult {
  const [item, setItem] = useState<ArchiveDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setNotFound(false);

    fetch(withBasePath(`/api/archive/${id}`))
      .then(async (res) => {
        if (res.status === 404) {
          if (!cancelled) setNotFound(true);
          return null;
        }
        if (!res.ok) {
          throw new Error(`Error ${res.status} al cargar el elemento`);
        }
        return (await res.json()) as ArchiveDetailResponse;
      })
      .then((data) => {
        if (cancelled) return;
        if (data) setItem(data);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || 'No se ha podido cargar el elemento');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { item, loading, error, notFound };
}

interface UseArchiveSearchResult {
  items: ArchiveItemResponse[];
  total: number;
  query: string;
  facets: SearchResultResponse['facets'];
  loading: boolean;
  error: string | null;
  search: (q: string, options?: { type?: string; tag?: string; limit?: number }) => void;
}

/**
 * Búsqueda por texto libre contra GET /api/search. Se invoca manualmente
 * mediante la función `search` devuelta.
 */
export function useArchiveSearch(): UseArchiveSearchResult {
  const [items, setItems] = useState<ArchiveItemResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');
  const [facets, setFacets] = useState<SearchResultResponse['facets']>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const search = useCallback(
    (q: string, options?: { type?: string; tag?: string; limit?: number }) => {
      if (!q.trim()) {
        setItems([]);
        setTotal(0);
        setQuery('');
        setFacets(undefined);
        setError(null);
        return;
      }

      const currentRequest = ++requestId.current;
      setLoading(true);
      setError(null);

      const qs = buildQuery({
        q,
        type: options?.type,
        tag: options?.tag,
        limit: options?.limit,
      });

      fetch(withBasePath(`/api/search${qs}`))
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Error ${res.status} al buscar`);
          }
          return (await res.json()) as SearchResultResponse;
        })
        .then((data) => {
          if (requestId.current !== currentRequest) return;
          setItems(data.items);
          setTotal(data.total);
          setQuery(data.query);
          setFacets(data.facets);
        })
        .catch((err: Error) => {
          if (requestId.current !== currentRequest) return;
          setError(err.message || 'No se ha podido completar la búsqueda');
          setItems([]);
        })
        .finally(() => {
          if (requestId.current === currentRequest) setLoading(false);
        });
    },
    []
  );

  return { items, total, query, facets, loading, error, search };
}
