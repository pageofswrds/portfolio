import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import './index.css'
import App from './App.tsx'

const ArboretumPage = lazy(() => import('./pages/Arboretum/Arboretum.tsx'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="system">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route
            path="/demos/arboretum"
            element={
              <Suspense fallback={null}>
                <ArboretumPage />
              </Suspense>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
