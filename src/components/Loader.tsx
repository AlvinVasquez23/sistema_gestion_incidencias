/* src/components/Loader.tsx — Loader llamativo a pantalla completa */
export function Loader({ mensaje = 'Actualizando…' }: { mensaje?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-surface/85 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-7">

        {/* Anillos concéntricos contragirando + núcleo pulsante */}
        <div className="relative h-28 w-28">
          <div className="absolute inset-0 rounded-full border-4 border-adecco/15" />
          <div
            className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-adecco border-r-adecco"
            style={{ animationDuration: '0.9s' }}
          />
          <div
            className="absolute inset-3 animate-spin rounded-full border-4 border-transparent border-b-adecco/60 border-l-adecco/60"
            style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}
          />
          <div className="absolute inset-0 grid place-items-center">
            <div className="h-3.5 w-3.5 animate-ping rounded-full bg-adecco" />
          </div>
        </div>

        {/* Mensaje + puntos que rebotan */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-xl font-extrabold tracking-wide text-ink">{mensaje}</p>
          <div className="flex gap-2">
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-adecco [animation-delay:0ms]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-adecco [animation-delay:150ms]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-adecco [animation-delay:300ms]" />
          </div>
        </div>

        {/* Barra de progreso indeterminada */}
        <div className="h-1.5 w-64 overflow-hidden rounded-full bg-line">
          <div className="loader-bar h-full w-1/3 rounded-full bg-adecco" />
        </div>
      </div>
    </div>
  )
}