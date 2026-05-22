import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '@/components/layout/Header'
import Sidebar from '@/components/layout/Sidebar'
import '../../styles/globals.css'

type AppLayoutProps = {
  title: string
}

export default function AppLayout({ title }: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="app-shell">
      {isSidebarOpen && (
        <div
          aria-hidden
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
        />
      )}

      <aside
        className={`
          sidebar-container
          lg:translate-x-0
          lg:sticky
          lg:z-0
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-[-105%]'}
        `}
      >
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </aside>

      <div className="content-wrapper lg:ml-70">
        <Header
          title={title}
          onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}