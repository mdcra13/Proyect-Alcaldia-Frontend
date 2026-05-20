import { BrowserRouter } from 'react-router-dom'
import LoginPage from '@/components/auth/LoginPage'

export default function App() {
  return (
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>
  )
}