export class ArchiveError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
  }
}

export function handleError(error: unknown) {
  if (error instanceof ArchiveError) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: error.statusCode,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  return new Response(JSON.stringify({ error: 'Internal server error' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  })
}
