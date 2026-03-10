import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import EmployeeDirectory from '@/pages/EmployeeDirectory'
import EmployeeDetail from '@/pages/EmployeeDetail'
import AddEmployee from '@/pages/AddEmployee'
import EditEmployee from '@/pages/EditEmployee'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeeDirectory />} />
          <Route path="/employees/new" element={<AddEmployee />} />
          <Route path="/employees/:id" element={<EmployeeDetail />} />
          <Route path="/employees/:id/edit" element={<EditEmployee />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
