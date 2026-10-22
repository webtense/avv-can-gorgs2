import { Prisma, PrismaClient } from '@prisma/client';

/** Registra una entrada d'auditoria del mòdul de comptabilitat. Sense dades sensibles al detall. */
export async function logAccountingAudit(
  tx: Prisma.TransactionClient | PrismaClient,
  params: {
    actorMemberId: string;
    action: string;
    entity: string;
    entityId?: string | null;
    detail?: string | null;
  }
): Promise<void> {
  await tx.accounting_audit.create({
    data: {
      actor_member_id: params.actorMemberId,
      action: params.action,
      entity: params.entity,
      entity_id: params.entityId ?? null,
      detail: params.detail ?? null,
    },
  });
}
