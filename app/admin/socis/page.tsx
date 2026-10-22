import { prisma } from '@/lib/db';
import MemberActions from '@/components/admin/MemberActions';

export const metadata = { title: 'Socis · Administració' };

export default async function AdminSocisPage() {
  const members = await prisma.members.findMany({
    orderBy: { created_at: 'desc' },
    select: { id: true, name: true, email: true, phone: true, status: true, admin: true, created_at: true },
  });

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-slate-900">Socis</h1>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="py-2 pr-4">Nom</th>
              <th className="py-2 pr-4">Correu</th>
              <th className="py-2 pr-4">Estat</th>
              <th className="py-2 pr-4">Admin</th>
              <th className="py-2 pr-4">Accions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="py-2 pr-4">{m.name}</td>
                <td className="py-2 pr-4">{m.email}</td>
                <td className="py-2 pr-4">{m.status}</td>
                <td className="py-2 pr-4">{m.admin ? 'Sí' : 'No'}</td>
                <td className="py-2 pr-4">
                  <MemberActions id={m.id} status={m.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
