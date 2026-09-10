import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X } from 'lucide-react'
import clsx from 'clsx'

/* Formatos de planta: Code128 (LPN/cubeta), DataMatrix y EAN (producto), QR */
const FORMATOS_LIB = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
]
const FORMATOS_NATIVOS = ['qr_code', 'data_matrix', 'code_128', 'code_39', 'ean_13', 'ean_8', 'itf', 'upc_a', 'upc_e']

export default function Escaner({ onDetect, onClose }: {
  onDetect: (texto: string) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const cbRef = useRef(onDetect); cbRef.current = onDetect
  const closeRef = useRef(onClose); closeRef.current = onClose
  const detectado = useRef(false)
  const [modo, setModo] = useState<'nativo' | 'lib'>('nativo')

  useEffect(() => {
    let cancelado = false
    let stream: MediaStream | null = null
    let raf = 0
    let sc: Html5Qrcode | null = null

    const emitir = (txt: string) => {
      if (detectado.current || !txt) return
      detectado.current = true
      cbRef.current(txt)
    }

    /* Motor A: BarcodeDetector nativo (Chrome Android) — lee códigos rotados */
    const arrancarNativo = async () => {
      const BD = (window as unknown as { BarcodeDetector?: any }).BarcodeDetector
      if (!BD) throw new Error('sin detector nativo')
      const soportados: string[] = await BD.getSupportedFormats().catch(() => [])
      const formatos = FORMATOS_NATIVOS.filter(f => soportados.includes(f))
      if (!formatos.length) throw new Error('sin formatos nativos')
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (cancelado) { stream.getTracks().forEach(t => t.stop()); return }
      const v = videoRef.current
      if (!v) throw new Error('sin video')
      v.srcObject = stream
      await v.play()
      const det = new BD({ formats: formatos })
      const loop = async () => {
        if (cancelado || detectado.current) return
        try {
          const codes = await det.detect(v)
          if (codes.length) { emitir(codes[0].rawValue); return }
        } catch { /* frame no legible */ }
        raf = requestAnimationFrame(loop)
      }
      void loop()
    }

    /* Motor B: html5-qrcode con todos los formatos de planta */
    const arrancarLib = async () => {
      if (cancelado) return
      setModo('lib')
      await new Promise(r => setTimeout(r, 80)) // deja que React monte el contenedor
      if (cancelado) return
      sc = new Html5Qrcode('lector-cod', { formatsToSupport: FORMATOS_LIB, verbose: false })
      await sc.start(
        { facingMode: 'environment' },
        { fps: 12, aspectRatio: 1.7, disableFlip: false },
        txt => emitir(txt),
        () => {},
      )
    }

    arrancarNativo()
      .catch(() => arrancarLib())
      .catch(() => { if (!cancelado) closeRef.current() })

    /* Limpieza segura: nunca deja la cámara colgada ni pantalla negra */
    return () => {
      cancelado = true
      cancelAnimationFrame(raf)
      if (stream) stream.getTracks().forEach(t => t.stop())
      if (sc) {
        const s = sc
        setTimeout(() => { s.stop().then(() => s.clear()).catch(() => {}) }, 0)
      }
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <p className="text-sm font-bold text-white">
          Escanea el código {modo === 'lib' && <span className="ml-1 text-[10px] font-semibold text-white/50">(modo compatibilidad)</span>}
        </p>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-white/30 text-white">
          <X size={18} />
        </button>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {/* Motor nativo */}
        <video
          ref={videoRef}
          muted
          playsInline
          className={clsx('h-full w-full object-cover', modo !== 'nativo' && 'hidden')}
        />
        {/* Motor librería */}
        {modo === 'lib' && <div id="lector-cod" className="h-full w-full" />}
      </div>

      <p className="p-4 text-center text-[11px] leading-relaxed text-white/60">
        Apunta a Code128 (LPN/cubeta), DataMatrix o EAN del producto.<br />
        Si el código está girado, acomoda la etiqueta en horizontal.
      </p>
    </div>
  )
}