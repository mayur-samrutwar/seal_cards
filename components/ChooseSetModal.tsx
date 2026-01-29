'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import dinoData from '@/dino.json'

type DinoCard = {
  id: number
  name: string
  size: number
  armour: number
  power: number
  attack: number
  speed: number
  age: number
  points: number
}

// Pastel colors for borders - cycling through 4 colors
const borderColors = [
  '#ffd93d', // pastel yellow
  '#a8e6cf', // pastel mint green
  '#ffaaa5', // pastel coral
  '#c9b1ff', // pastel lavender
]

type Props = {
  open: boolean
  onClose: () => void
  onSelectionChange?: (count: number) => void
}

export default function ChooseSetModal({ open, onClose, onSelectionChange }: Props) {
  const cards = useMemo(() => dinoData as DinoCard[], [])
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  if (!open) return null

  const totalScore = selectedIds.reduce(
    (sum, id) => sum + (cards.find((c) => c.id === id)?.points ?? 0),
    0
  )

  const toggleCard = (card: DinoCard) => {
    if (selectedIds.includes(card.id)) {
      const newIds = selectedIds.filter((id) => id !== card.id)
      setSelectedIds(newIds)
      onSelectionChange?.(newIds.length)
      return
    }

    if (totalScore + card.points > 100) {
      return
    }

    const newIds = [...selectedIds, card.id]
    setSelectedIds(newIds)
    onSelectionChange?.(newIds.length)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-full h-full bg-white flex flex-col p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <div className="text-lg font-semibold text-gray-900">
              Cards selected:{' '}
              <span className="text-gray-700">
                {selectedIds.length}
              </span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              Total score:{' '}
              <span className={totalScore > 100 ? 'text-red-600' : 'text-gray-700'}>
                {totalScore} / 100
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Done
          </button>
        </div>

        <div className="flex-1 overflow-auto pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-5 max-w-7xl mx-auto">
            {cards.map((card) => {
              const selected = selectedIds.includes(card.id)
              const wouldExceed = !selected && totalScore + card.points > 100
              const borderColor = borderColors[(card.id - 1) % 4]
              
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => toggleCard(card)}
                  disabled={wouldExceed}
                  className={[
                    // Card shape: colored outer frame + inner white inset
                    'relative aspect-[3/4] rounded-[22px] bg-white',
                    'transition-transform duration-200',
                    selected ? 'scale-[1.02]' : 'hover:scale-[1.01]',
                    wouldExceed ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                  style={{ backgroundColor: borderColor }}
                >
                  {/* Inner white card surface (inset) */}
                  <div
                    className={[
                      'absolute inset-[7px] rounded-[16px] bg-white border-2',
                      selected ? 'border-black/30' : 'border-black/10',
                    ].join(' ')}
                  />

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

                  {/* Points badge - below name */}
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

                  {/* Selection indicator - checkmark in top-right */}
                  {selected && (
                    <div className="absolute -top-2 -right-2">
                      <div className="w-9 h-9 rounded-full bg-[#7808d0] border-2 border-black flex items-center justify-center shadow-sm">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          className="text-white"
                        >
                          <path
                            d="M4 9L7 12L14 5"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
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
      <div className="text-[9px] font-bold text-black leading-tight" style={{ fontFamily: "monospace" }}>
        {value}{suffix}
      </div>
    </div>
  )
}
