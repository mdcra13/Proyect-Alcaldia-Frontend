import { useEffect, useState } from 'react'

const LG_BREAKPOINT = 1024

export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false

    return window.innerWidth < LG_BREAKPOINT
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${LG_BREAKPOINT - 1}px)`)

    const handleChange = () => {
      setIsMobile(mediaQuery.matches)
    }

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isMobile
}
