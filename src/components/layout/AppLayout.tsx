import { useState } from 'react'
import type { ReactNode } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import MobileNav from '@/components/layout/MobileNav'
import useIsMobile from '@/lib/hooks/useIsMobile'

interface AppLayoutProps {
  children: ReactNode
  title?: string
}

export default function AppLayout({ children, title }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  return (
    <div className="app-shell">
      <Sidebar
        isOpen={isMobile && sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="app-content lg:pl-64">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />

        <main className="app-main layout-main-with-mobile-nav lg:p-6">
          {children}
        </main>
      </div>

      <MobileNav />
    </div>
  )
}
