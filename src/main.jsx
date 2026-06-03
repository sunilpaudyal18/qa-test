import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import LoadingScreen from './components/ui/LoadingScreen'
import './index.css'

const App = lazy(() => import('./App'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <ThemeProvider>
        <ToastProvider>
          <Suspense fallback={<LoadingScreen />}>
            <App />
          </Suspense>
        </ToastProvider>
      </ThemeProvider>
    </HashRouter>
  </StrictMode>,
)
