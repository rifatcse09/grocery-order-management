import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { AdminAccountsDataTable } from "../components/admin/AdminAccountsDataTable";

export function AdminUsersPage() {
  const { listAccounts } = useAuth();
  const users = useMemo(() => listAccounts().filter((a) => a.role === "user"), [listAccounts]);

  return <AdminAccountsDataTable kind="users" accounts={users} />;
}
