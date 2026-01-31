'use client'

import Image from 'next/image'
import type { DinoCard } from '@/app/api/game/types'

type Props = {
  card: DinoCard
  faceUp?: boolean
  className?: string
}

export default function GameCard({ card, faceUp = false, className = '' }: Props) {
  const borderColors = [
    '#ffd93d', // pastel yellow
    '#a8e6cf', // pastel mint green
    '#ffaaa5', // pastel coral
    '#c9b1ff', // pastel lavender
  ]
  const borderColor = borderColors[(card.id - 1) % 4]

  return (
    <div
      className={[
        'relative aspect-[3/4] rounded-[22px] bg-white transition-all duration-300',
        'transform-gpu',
        className,
      ].join(' ')}
      style={{
        backgroundColor: borderColor,
        transformStyle: 'preserve-3d',
        transform: faceUp ? 'rotateY(0deg)' : 'rotateY(180deg)',
        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Inner white card surface (inset) */}
      <div className="absolute inset-[7px] rounded-[16px] bg-white border-2 border-black/10" />

      {/* Card back (when face down) */}
      <div
        className="absolute inset-0 rounded-[22px] bg-white flex items-center justify-center border-2 border-gray-300 shadow-lg"
        style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
        }}
      >
        <div className="relative w-32 h-32">
          <Image
            src="/seal.png"
            alt="Seal"
            fill
            className="object-contain opacity-80"
            unoptimized
          />
        </div>
      </div>

      {/* Card front (when face up) */}
      <div
        className="absolute inset-0 rounded-[22px]"
        style={{
          backfaceVisibility: 'hidden',
          transform: 'rotateY(0deg)',
        }}
      >
        {/* Dinosaur Image */}
        <div className="absolute inset-0 px-4 pt-5 flex items-start justify-center">
          <div className="relative w-full h-[42%] -translate-y-1">
            <Image
              src={`/dino/${card.id}.jpg`}
              alt={card.name}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
        </div>

        {/* Name */}
        <div className="absolute top-[48%] left-0 right-0 px-3">
          <div
            className="text-center font-bold text-sm leading-tight"
            style={{
              color: '#ffd93d',
              textShadow: '2px 2px 0px #000, -1px -1px 0px #000, 1px -1px 0px #000, -1px 1px 0px #000, 1px 1px 0px #000',
              fontFamily: 'monospace',
              letterSpacing: '0.5px',
            }}
          >
            {card.name.toUpperCase()}
          </div>
        </div>

        {/* Stats */}
        <div className="absolute bottom-2 left-0 right-0 px-3 pb-3 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <StatBox label="SIZE" value={card.size} />
            <StatBox label="ARMOUR" value={card.armour} />
            <StatBox label="POWER" value={card.power} />
            <StatBox label="ATTACK" value={card.attack} />
            <StatBox label="SPEED" value={card.speed} />
            <StatBox label="AGE" value={card.age} suffix="M" />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div
      className="bg-[#ffd93d] border-2 border-black px-1.5 py-1 rounded text-center"
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
        fontFamily: 'monospace',
      }}
    >
      <div className="text-[9px] font-bold text-black leading-tight" style={{ fontFamily: 'monospace' }}>{label}:</div>
      <div className="text-[10px] font-bold text-black leading-tight" style={{ fontFamily: 'monospace' }}>
        {value}{suffix}
      </div>
    </div>
  )
}
