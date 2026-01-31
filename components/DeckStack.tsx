'use client'

import Image from 'next/image'

type Props = {
  count: number
}

export default function DeckStack({ count }: Props) {
  // Show actual number of cards stacked (up to 10 visible for visual effect)
  const visibleStacks = Math.min(count, 10)
  const stackOffset = 2 // pixels offset per card

  return (
    <div className="relative w-32 h-44">
      {count > 0 ? (
        <>
          {/* Stacked cards effect - white with seal logo */}
          {Array.from({ length: visibleStacks }).map((_, index) => {
            const zIndex = visibleStacks - index
            const offset = index * stackOffset
            return (
              <div
                key={index}
                className="absolute inset-0 rounded-lg bg-white border-2 border-gray-300 shadow-md flex items-center justify-center"
                style={{
                  transform: `translate(${offset}px, ${-offset}px)`,
                  zIndex,
                  opacity: index === 0 ? 1 : 0.85 - index * 0.05,
                }}
              >
                {index === 0 && (
                  <div className="relative w-16 h-16">
                    <Image
                      src="/seal.png"
                      alt="Seal"
                      fill
                      className="object-contain opacity-60"
                      unoptimized
                    />
                  </div>
                )}
              </div>
            )
          })}
        </>
      ) : (
        <div className="absolute inset-0 rounded-lg bg-white border-2 border-gray-300 opacity-30 flex items-center justify-center">
          <div className="relative w-16 h-16">
            <Image
              src="/seal.png"
              alt="Seal"
              fill
              className="object-contain opacity-30"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  )
}
