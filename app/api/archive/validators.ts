export function validateListQuery(query: { page?: string; limit?: string; search?: string }) {
  const parsedPage = parseInt(query.page || '1', 10)
  const parsedLimit = parseInt(query.limit || '10', 10)

  const page = Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage)
  const limit = Math.min(100, Math.max(1, Number.isNaN(parsedLimit) ? 10 : parsedLimit))
  const search = query.search || ''

  return { page, limit, search }
}

export function validateId(id: string): boolean {
  return /^[a-z0-9-]{36}$/.test(id) // UUID format
}
