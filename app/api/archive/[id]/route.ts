import { getArchiveDetail } from '@/lib/archive-detail'
import { validateId } from '../validators'
import { handleError, ArchiveError } from '../errors'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    if (!validateId(id)) {
      throw new ArchiveError(400, 'id inválido, se espera un UUID')
    }

    const detail = await getArchiveDetail(id)
    if (!detail) {
      throw new ArchiveError(404, 'Not found')
    }
    return Response.json(detail)
  } catch (error) {
    return handleError(error)
  }
}
