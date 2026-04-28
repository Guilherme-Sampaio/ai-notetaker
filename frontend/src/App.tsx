import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'sonner'
import { router } from './routes'

export default function App() {
  return (
    <>
      <Toaster richColors position="top-right" duration={8000} />
      <RouterProvider router={router} />
    </>
  )
}
