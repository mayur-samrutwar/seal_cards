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
        faceUp ? 'opacity-100' : 'opacity-0',
        className,
      ].join(' ')}
      style={{ backgroundColor: borderColor }}
    >
      {/* Inner white card surface (inset) */}
      <div className="absolute inset-[7px] rounded-[16px] bg-white border-2 border-black/10" />

      {/* Card back (when face down) */}
      {!faceUp && (
        <div className="absolute inset-0 rounded-[22px] bg-gradient-to-br from-blue-800 to-blue-900 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/30" />
        </div>
      )}

      {/* Card front (when face up) */}
      {faceUp && (
        <>
          {/* Dinosaur Image */}
          <div className="absolute inset-0 px-3 pt-4 flex items-start justify-center">
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
          <div className="absolute top-[48%] left-0 right-0 px-2">
            <div
              className="text-center font-bold text-xs leading-tight"
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

          {/* Points badge */}
          <div className="absolute top-[56%] left-0 right-0 flex justify-center">
            <div className="w-7 h-7 rounded-full bg-[#ffd93d] border-2 border-black flex items-center justify-center shadow-sm">
              <span className="text-[10px] font-bold text-black" style={{ fontFamily: 'monospace' }}>
                {card.points}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="absolute bottom-1 left-0 right-0 px-2 pb-2 space-y-1">
            <div className="grid grid-cols-2 gap-1">
              <StatBox label="SIZE" value={card.size} />
              <StatBox label="ARMOUR" value={card.armour} />
              <StatBox label="POWER" value={card.power} />
              <StatBox label="ATTACK" value={card.attack} />
              <StatBox label="SPEED" value={card.speed} />
              <StatBox label="AGE" value={card.age} suffix="M" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function StatBox({ label, value, suffix = '' }: { label: string; value: number; suffix?: string }) {
  return (
    <div
      className="bg-[#ffd93d] border-2 border-black px-1 py-0.5 rounded text-center"
      style={{
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3)',
        fontFamily: 'monospace',
      }}
    >
      <div className="text-[8px] font-bold text-black leading-tight" style={{ fontFamily: 'monospace' }}>{label}:</div>
      <div className="text-[9px] font-bold text-black leading-tight" style={{ fontFamily: 'monospace' }}>
        {value}{suffix}
      </div>
    </div>
  )
}
