import type { ReactElement } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { SettingsProvider } from './context/SettingsContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ModuloPage from './pages/ModuloPage'
import AppShell from './components/layout/AppShell'
import CaptureShell, {
  CapturaHome, MisCapturas, ConsultaIncidencias, CapturaForm,
} from './components/layout/CaptureShell'
import AutoLogout from './components/seguridad/AutoLogout'

/* Solo supervisores ven la app completa; un auxiliar que intente entrar va a /captura */
function SoloSupervisor({ children }: { children: ReactElement }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!user.esSupervisor) return <Navigate to="/captura" replace />
  return children
}

/* Solo auxiliares ven el shell de captura; un supervisor que intente entrar va a / */
function RutaCaptura({ children }: { children: ReactElement }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.esSupervisor) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SettingsProvider>
          <DataProvider>
            <BrowserRouter>
               <AutoLogout />
                <Routes>
                  <Route path="/login" element={<Login />} />

                  {/* ===== Zona supervisores (layout AppShell completo) ===== */}
                  <Route element={<SoloSupervisor><AppShell /></SoloSupervisor>}>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/pool" element={<ModuloPage key="pool" vista="pool" />} />
                    <Route path="/amr" element={<ModuloPage key="amr" vista="amr" />} />
                    <Route path="/aud" element={<ModuloPage key="aud" vista="aud" />} />
                    <Route path="/api" element={<ModuloPage key="api" vista="api" />} />
                    <Route path="/afr" element={<ModuloPage key="afr" vista="afr" />} />
                    <Route path="/auxp" element={<ModuloPage key="auxp" vista="auxp" />} />           
                  </Route>

                  {/* ===== Zona auxiliares (shell de captura) ===== */}
                  <Route path="/captura" element={<RutaCaptura><CaptureShell /></RutaCaptura>}>
                    <Route index element={<CapturaHome />} />
                    <Route path="mis" element={<MisCapturas />} />
                    <Route path="consulta" element={<ConsultaIncidencias />} />
                    <Route path="amr" element={<CapturaForm modulo="AMR" />} />
                    <Route path="aud" element={<CapturaForm modulo="AUD" />} />
                    <Route path="api" element={<CapturaForm modulo="API" />} />
                    <Route path="afr" element={<CapturaForm modulo="AFR" />} />
                    <Route path="aux" element={<CapturaForm modulo="AUX" />} />                    
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
          </DataProvider>
        </SettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}