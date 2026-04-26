import { Toaster } from 'sonner'
import { PipelineScreen } from './src/components/PipelineScreen'

export default function App() {
  return (
    <main className="min-h-screen bg-background">
      <Toaster richColors position="top-right" />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-semibold text-foreground">AI Notetaker</h1>
        <p className="mt-1 text-muted-foreground">Academic advisor meeting assistant</p>
        <div className="mt-12 rounded-2xl border border-border bg-card shadow-sm">
          <PipelineScreen />
        </div>
      </div>
    </main>
  )
}
