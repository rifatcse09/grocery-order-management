import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { UserOrderDashboard } from "./pages/UserOrderDashboard";
import { OrderFormPage } from "./pages/OrderFormPage";
import { ReviewOrderPage } from "./pages/ReviewOrderPage";
import { UserInvoicesPage } from "./pages/UserInvoicesPage";
import { UserInvoiceDetailPage } from "./pages/UserInvoiceDetailPage";
import { UserChallanDetailPage } from "./pages/UserChallanDetailPage";
import { ModeratorOrdersPage } from "./pages/ModeratorOrdersPage";
import { ModeratorOrderDetailPage } from "./pages/ModeratorOrderDetailPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminModeratorsPage } from "./pages/AdminModeratorsPage";
import { AdminCreateAccountPage } from "./pages/AdminCreateAccountPage";
import { AdminOutstandingBillsPage } from "./pages/AdminOutstandingBillsPage";
import { AdminBillingStatementsPage } from "./pages/AdminBillingStatementsPage";
import { AdminFinancialLedgerPage } from "./pages/AdminFinancialLedgerPage";
import { AdminOrdersPage } from "./pages/AdminOrdersPage";
import { AdminOrderDetailPage } from "./pages/AdminOrderDetailPage";

function RequireAuth() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/user/orders" replace />} />
          <Route path="/user/orders" element={<UserOrderDashboard />} />
          <Route path="/user/orders/new" element={<OrderFormPage />} />
          <Route path="/user/orders/:id/edit" element={<OrderFormPage />} />
          <Route path="/user/orders/:id/review" element={<ReviewOrderPage />} />
          <Route path="/user/invoices" element={<UserInvoicesPage />} />
          <Route path="/user/challans/:id" element={<UserChallanDetailPage />} />
          <Route path="/user/invoices/:id" element={<UserInvoiceDetailPage />} />
          <Route path="/moderator/orders" element={<ModeratorOrdersPage />} />
          <Route path="/moderator/orders/:id" element={<ModeratorOrderDetailPage />} />
          <Route path="/moderator/dashboard" element={<AdminDashboardPage />} />
          <Route path="/moderator/ledger" element={<AdminFinancialLedgerPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="/admin/statements" element={<AdminBillingStatementsPage />} />
          <Route path="/admin/outstanding" element={<AdminOutstandingBillsPage />} />
          <Route path="/admin/ledger" element={<AdminFinancialLedgerPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/moderators" element={<AdminModeratorsPage />} />
          <Route path="/admin/create" element={<AdminCreateAccountPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
