import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { NotesListPage } from './pages/notes/NotesListPage'
import { PipelinePage } from './pages/pipeline/PipelinePage'

function Layout() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">AI Notetaker</h1>
            <p className="mt-1 text-muted-foreground">Academic advisor meeting assistant</p>
          </header>
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Navigate to="/record" replace /> },
      { path: '/record', element: <PipelinePage /> },
      { path: '/notes', element: <NotesListPage /> },
      { path: '*', element: <Navigate to="/record" replace /> },
    ],
  },
])
