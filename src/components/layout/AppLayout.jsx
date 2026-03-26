import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import Sidebar from './Sidebar'

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)

  const toggleSidebar = () => setCollapsed(!collapsed)

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--color-bg)' }}>
      <TopBar onToggleSidebar={toggleSidebar} isCollapsed={collapsed} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar collapsed={collapsed} />
        <main id="main-content" style={{ flex: 1, minWidth: 0, overflowY: 'auto', position: 'relative' }}>
          <div style={{ padding: 0 }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
