
import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md mx-auto bg-card p-8 rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold text-center mb-8">Repl Express + React</h1>
          
          <div className="text-center space-y-4">
            <p className="text-lg">Contador: {count}</p>
            <button 
              onClick={() => setCount((count) => count + 1)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              Incrementar
            </button>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Edite <code>client/src/App.tsx</code> para começar</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default App
