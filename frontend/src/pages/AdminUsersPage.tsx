import { useAuth } from "../context/AuthContext";

export function AdminUsersPage() {
  const { listAccounts } = useAuth();
  const users = listAccounts().filter((a) => a.role === "user");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">User list</h1>
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-card">
        <p className="text-sm text-slate-500">Total users: {users.length}</p>

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
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{u.name}</td>
                  <td className="px-3 py-2 text-slate-700">{u.email}</td>
                  <td className="px-3 py-2 text-slate-600">{u.phone || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="divide-y divide-slate-100 md:hidden">
            {users.map((u) => (
              <div key={u.id} className="space-y-1 px-3 py-2">
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-slate-600">{u.email}</p>
                <p className="text-xs text-slate-500">{u.phone || "—"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
