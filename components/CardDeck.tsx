'use client'

import Image from 'next/image'
import AnimatedButton from './AnimatedButton'

export default function CardDeck() {
  return (
    <div
      className="w-full h-screen bg-white flex items-center justify-center"
      style={{
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div className="flex flex-col items-center gap-8">
        <Image
          src="/seal.png"
          alt="SEAL"
          width={400}
          height={400}
          className="object-contain"
        />

        <AnimatedButton />
      </div>
    </div>
  )
}
