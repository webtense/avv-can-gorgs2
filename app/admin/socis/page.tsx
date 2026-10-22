import { prisma } from '@/lib/db';
import MemberActions from '@/components/admin/MemberActions';
import { getLocale, getMessages } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  return { title: `${messages.admin.members.title} · ${messages.admin.home.title}` };
}

export default async function AdminSocisPage() {
  const locale = await getLocale();
  const messages = getMessages(locale);
  const t = messages.admin.members;

  const members = await prisma.members.findMany({
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      admin: true,
      tpv_operator: true,
      created_at: true,
    },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">{t.title}</h1>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-4">{t.colName}</th>
              <th className="py-2 pr-4">{t.colEmail}</th>
              <th className="py-2 pr-4">{t.colStatus}</th>
              <th className="py-2 pr-4">{t.colAdmin}</th>
              <th className="py-2 pr-4">TPV</th>
              <th className="py-2 pr-4">{t.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="py-2 pr-4">{m.name}</td>
                <td className="py-2 pr-4">{m.email}</td>
                <td className="py-2 pr-4">{m.status}</td>
                <td className="py-2 pr-4">{m.admin ? t.yes : t.no}</td>
                <td className="py-2 pr-4">{m.tpv_operator ? t.yes : t.no}</td>
                <td className="py-2 pr-4">
                  <MemberActions id={m.id} status={m.status} tpvOperator={m.tpv_operator} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
