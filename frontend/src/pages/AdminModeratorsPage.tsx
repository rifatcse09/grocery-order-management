import { useAuth } from "../context/AuthContext";

export function AdminModeratorsPage() {
  const { listAccounts } = useAuth();
  const moderators = listAccounts().filter((a) => a.role === "moderator");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Moderator list</h1>
      <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-4 shadow-card">
        <p className="text-sm font-medium text-slate-600">Total moderators: {moderators.length}</p>

        <div className="mt-3 overflow-hidden rounded-2xl border border-violet-200">
          <table className="hidden w-full text-left text-base md:table">
            <thead className="bg-violet-100/80 text-sm uppercase tracking-wide text-violet-900">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
              </tr>
            </thead>
            <tbody>
              {moderators.map((m) => (
                <tr key={m.id} className="border-t border-violet-100 bg-white/95">
                  <td className="px-4 py-3.5 text-base font-semibold text-slate-800">{m.name}</td>
                  <td className="px-4 py-3.5 text-base text-slate-700">{m.email}</td>
                  <td className="px-4 py-3.5 text-base text-slate-600">{m.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divide-y divide-slate-100 md:hidden">
            {moderators.map((m) => (
              <div key={m.id} className="space-y-1 px-3 py-2">
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-slate-600">{m.email}</p>
                <p className="text-xs text-slate-500">{m.phone || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
