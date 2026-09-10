import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

interface BIPEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: string }>
}

/* Botón "Instalar app": aparece solo si el navegador ofrece instalación */
export default function InstalarApp() {
  const [evt, setEvt] = useState<BIPEvent | null>(null)
  const [instalada, setInstalada] = useState(false)

  useEffect(() => {
    const onBip = (e: Event) => { e.preventDefault(); setEvt(e as BIPEvent) }
    const onInstalled = () => { setEvt(null); setInstalada(true) }
    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalada(true)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (instalada || !evt) return null
  return (
    <button
      onClick={() => { void evt.prompt(); setEvt(null) }}
      className="flex h-9 items-center gap-2 rounded-lg border border-adecco/40 bg-adecco/10 px-2.5 text-xs font-bold text-adecco transition-colors hover:bg-adecco/20"
    >
      <Download size={15} /> Instalar app
    </button>
  )
}