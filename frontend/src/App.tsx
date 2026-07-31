import { Routes, Route, Outlet } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DataUploadPage from './pages/DataUploadPage'
import AnalysisProgressPage from './pages/AnalysisProgressPage'
import ReportPage from './pages/ReportPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HistoryPage from './pages/HistoryPage'
import QuickEntryPage from './pages/QuickEntryPage'
import PolicyPage from './pages/PolicyPage'
import SettingsPage from './pages/SettingsPage'
import SharePage from './pages/SharePage'
import PosterPage from './pages/PosterPage'
import NotFoundPage from './pages/NotFoundPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { AdminGuard } from './components/auth/AdminGuard'
import { AdminLayout } from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminCreditsPage from './pages/admin/AdminCreditsPage'
import AdminTasksPage from './pages/admin/AdminTasksPage'
import AdminPoliciesPage from './pages/admin/AdminPoliciesPage'

function AdminRoutes() {
  return (
    <AdminGuard>
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    </AdminGuard>
  )
}

export default function App() {
  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/upload" element={<DataUploadPage />} />
      <Route path="/quick/:scenarioCode" element={<QuickEntryPage />} />
      <Route path="/analysis/:taskId" element={<AnalysisProgressPage />} />
      <Route path="/reports/:reportId" element={<ReportPage />} />
      <Route path="/share/:token" element={<SharePage />} />
      <Route path="/poster/:shareCode" element={<PosterPage />} />

      {/* 需登录路由 */}
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/policies"
        element={
          <ProtectedRoute>
            <PolicyPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin 后台 */}
      <Route element={<AdminRoutes />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/credits" element={<AdminCreditsPage />} />
        <Route path="/admin/tasks" element={<AdminTasksPage />} />
        <Route path="/admin/policies" element={<AdminPoliciesPage />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
