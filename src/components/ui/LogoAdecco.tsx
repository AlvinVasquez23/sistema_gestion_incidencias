import clsx from 'clsx'

/* ===== Logo institucional Adecco =====
   Bloque rojo con wordmark blanco. El tamaño, radio y cuerpo de letra
   se controlan desde fuera con className, por eso los consumidores pasan
   cosas como "h-8 w-8 rounded-lg text-[7px]". */
export function LogoAdecco({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'grid shrink-0 select-none place-items-center bg-adecco font-extrabold lowercase tracking-tight text-white',
        className,
      )}
    >
      adecco
    </div>
  )
}

export default LogoAdecco