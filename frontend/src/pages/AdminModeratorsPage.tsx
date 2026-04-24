import { useAuth } from "../context/AuthContext";

export function AdminModeratorsPage() {
  const { listAccounts } = useAuth();
  const moderators = listAccounts().filter((a) => a.role === "moderator");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Moderator list</h1>
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
        <p className="text-sm text-slate-500">Total moderators: {moderators.length}</p>

        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200">
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="bg-slate-100 text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Phone</th>
              </tr>
            </thead>
            <tbody>
              {moderators.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{m.name}</td>
                  <td className="px-3 py-2 text-slate-700">{m.email}</td>
                  <td className="px-3 py-2 text-slate-600">{m.phone || "—"}</td>
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
