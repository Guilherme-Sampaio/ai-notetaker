import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AppRoutes } from './routes'
import { Sidebar } from './components/Sidebar'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-background">
        <Toaster richColors position="top-right" />
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8 max-w-2xl">
            <header className="mb-8">
              <h1 className="text-2xl font-semibold text-foreground">AI Notetaker</h1>
              <p className="mt-1 text-muted-foreground">Academic advisor meeting assistant</p>
            </header>
            <div className="rounded-2xl border border-border bg-card shadow-sm">
              <AppRoutes />
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}
