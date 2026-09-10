import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { X } from 'lucide-react'

/* ===== Escáner de cámara (LPN, cubeta, EAN) ===== */
export default function Escaner({ onDetect, onClose }: {
  onDetect: (texto: string) => void
  onClose: () => void
}) {
  const cb = useRef(onDetect)
  cb.current = onDetect

  useEffect(() => {
    const sc = new Html5Qrcode('lector-cod')
    sc.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 140 } },
      txt => { cb.current(txt); sc.stop().catch(() => {}); },
      () => {},
    ).catch(() => onClose())
    return () => { sc.stop().catch(() => {}); sc.clear() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <p className="text-sm font-bold text-white">Escanea el código</p>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-white/30 text-white">
          <X size={18} />
        </button>
      </div>
      <div id="lector-cod" className="flex-1 overflow-hidden" />
      <p className="p-4 text-center text-[11px] text-white/60">Apunta al código de barras / QR del LPN, cubeta o SKU</p>
    </div>
  )
}