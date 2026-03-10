import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'

export default function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <TopBar />
      <main style={{ paddingTop: 0 }}>
        <Outlet />
      </main>
    </div>
  )
}
