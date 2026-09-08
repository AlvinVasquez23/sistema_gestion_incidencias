import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { DataProvider } from './context/DataContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import AppShell from './components/layout/AppShell'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ModuloPage from './pages/ModuloPage'

function Privado({ children }: { children: ReactElement }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Privado><AppShell /></Privado>}>
                <Route index element={<Dashboard />} />
                <Route path="pool" element={<ModuloPage vista="pool" />} />
                <Route path="amr" element={<ModuloPage vista="amr" />} />
                <Route path="aud" element={<ModuloPage vista="aud" />} />
                <Route path="api" element={<ModuloPage vista="api" />} />
                <Route path="afr" element={<ModuloPage vista="afr" />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}