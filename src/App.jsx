import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import AppLayout from '@/components/layout/AppLayout'

// Features: Auth
import ProtectedRoute from '@/features/auth/components/ProtectedRoute'
import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext'
import LoginPage from '@/features/auth/pages/LoginPage'
import ForgotPasswordPage from '@/features/auth/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/features/auth/pages/ResetPasswordPage'

// Features: Employees
import EmployeeDirectory from '@/features/employees/pages/EmployeeDirectory'
import EmployeeDetail from '@/features/employees/pages/EmployeeDetail'
import AddEmployee from '@/features/employees/pages/AddEmployee'
import EditEmployee from '@/features/employees/pages/EditEmployee'
import SelfServicePage from '@/features/employees/pages/SelfServicePage'

// Features: Leave Management
import LeaveManagementPage from '@/features/leave-management/pages/LeaveManagementPage'

// Features: Attendance & Payroll
import MyAttendancePage from '@/features/attendance/pages/MyAttendancePage'
import MyPayslipsPage from '@/features/payroll/pages/MyPayslipsPage'

// Features: Recruitment (ATS)
import PublicJobApplicationPage from '@/features/recruitment/pages/PublicJobApplicationPage'
import RecruitmentManagementPage from '@/features/recruitment/pages/RecruitmentManagementPage'

// Pages (Common)
import DashboardPage from '@/pages/DashboardPage'
import DepartmentManagementPage from '@/pages/DepartmentManagementPage'
import ApprovalCenterPage from '@/pages/ApprovalCenterPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import ConnectivityTestPage from '@/pages/ConnectivityTestPage'
import SettingsPage from '@/pages/SettingsPage'
import PayrollPage from '@/pages/PayrollPage'

// Constants
import { ROLES } from '@/constants/roles'

// Motion Wrap for Page Transitions
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
    style={{ height: '100%' }}
  >
    {children}
  </motion.div>
)

function RoleBasedRedirect() {
  const { role } = useAuth()

  switch (role) {
    case ROLES.ADMIN:
    case ROLES.HR:
      return <Navigate to="/dashboard" replace />
    case ROLES.MANAGER:
      return <Navigate to="/employees" replace />
    case ROLES.EMPLOYEE:
      return <Navigate to="/my-profile" replace />
    default:
      return <Navigate to="/login" replace />
  }
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/apply" element={<PublicJobApplicationPage />} />
        <Route path="/test-connection" element={<ConnectivityTestPage />} />

        {/* Protected routes (trong AppLayout co Sidebar + TopBar) */}
        <Route element={
          <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE]}>
            <AppLayout />
          </ProtectedRoute>
        }>
          {/* Trang chu: redirect theo role */}
          <Route index element={<RoleBasedRedirect />} />

          {/* Dashboard: Admin + HR */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <PageWrapper><DashboardPage /></PageWrapper>
            </ProtectedRoute>
          } />

          {/* Quan ly nhan vien: Admin + HR + Manager */}
          <Route path="/employees" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]}>
              <PageWrapper><EmployeeDirectory /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/employees/new" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <PageWrapper><AddEmployee /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/employees/:id" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER]}>
              <PageWrapper><EmployeeDetail /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/employees/:id/edit" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <PageWrapper><EditEmployee /></PageWrapper>
            </ProtectedRoute>
          } />

          {/* Quan ly phong ban: Admin + HR */}
          <Route path="/departments" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <PageWrapper><DepartmentManagementPage /></PageWrapper>
            </ProtectedRoute>
          } />

          {/* Trang nhan vien tu phuc vu */}
          <Route path="/my-profile" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE]}>
              <PageWrapper><SelfServicePage /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/my-leaves" element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE, ROLES.MANAGER]}>
              <PageWrapper><SelfServicePage /></PageWrapper>
            </ProtectedRoute>
          } />

          {/* Trang Chấm công & Bảng lương cá nhân */}
          <Route path="/my-attendance" element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR, ROLES.ADMIN]}>
              <PageWrapper><MyAttendancePage /></PageWrapper>
            </ProtectedRoute>
          } />
          <Route path="/my-payslips" element={
            <ProtectedRoute allowedRoles={[ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR, ROLES.ADMIN]}>
              <PageWrapper><MyPayslipsPage /></PageWrapper>
            </ProtectedRoute>
          } />

          {/* Recruitment ATS: Admin + HR */}
          <Route path="/recruitment" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <PageWrapper><RecruitmentManagementPage /></PageWrapper>
            </ProtectedRoute>
          } />

          {/* Approval Center: Admin + HR */}
          <Route path="/approval-center" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <PageWrapper><ApprovalCenterPage /></PageWrapper>
            </ProtectedRoute>
          } />

          {/* Bảng lương: Admin + HR */}
          <Route path="/payroll" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR]}>
              <PageWrapper><PayrollPage /></PageWrapper>
            </ProtectedRoute>
          } />

          {/* Settings: tất cả role đều truy cập được */}
          <Route path="/settings" element={
            <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.HR, ROLES.MANAGER, ROLES.EMPLOYEE]}>
              <PageWrapper><SettingsPage /></PageWrapper>
            </ProtectedRoute>
          } />

          {/* Unauthorized */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnimatedRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
