import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { NotesListScreen } from './src/components/NotesListScreen'
import { PipelineScreen } from './src/components/PipelineScreen'
import { Sidebar } from './src/components/Sidebar'

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
              <Routes>
                <Route path="/" element={<Navigate to="/record" replace />} />
                <Route path="/record" element={<PipelineScreen />} />
                <Route path="/notes" element={<NotesListScreen />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}
