import { Navigate, Route, Routes } from 'react-router-dom'
import { NotesListPage } from './pages/notes/NotesListPage'
import { PipelinePage } from './pages/pipeline/PipelinePage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/record" replace />} />
      <Route path="/record" element={<PipelinePage />} />
      <Route path="/notes" element={<NotesListPage />} />
    </Routes>
  )
}
