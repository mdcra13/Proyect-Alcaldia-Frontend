import { useNavigate } from 'react-router-dom'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()

  return (
    <div>
      Página de "Olvidé mi contraseña"
      <div>
        <button type="button" onClick={() => navigate('/login')}
          className="mt-4 px-4 py-2 rounded-full bg-gray-500 text-white hover:bg-gray-600 cursor-pointer transition"
          >
          Volver al login </button>
      </div>
    </div>
  )
}