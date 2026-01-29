'use client'

import { useMemo, useState } from 'react'

type CardConfig = {
  id: number
  score: number
}

function generateCards(): CardConfig[] {
  const cards: CardConfig[] = []
  for (let i = 0; i < 30; i++) {
    const score = (i * 7 + 3) % 20 + 1 // deterministic 1–20
    cards.push({ id: i, score })
  }
  return cards
}

type Props = {
  open: boolean
  onClose: () => void
}

export default function ChooseSetModal({ open, onClose }: Props) {
  const cards = useMemo(() => generateCards(), [])
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  if (!open) return null

  const totalScore = selectedIds.reduce(
    (sum, id) => sum + (cards.find((c) => c.id === id)?.score ?? 0),
    0
  )

  const toggleCard = (card: CardConfig) => {
    if (selectedIds.includes(card.id)) {
      setSelectedIds((prev) => prev.filter((id) => id !== card.id))
      return
    }

    if (totalScore + card.score > 100) {
      return
    }

    setSelectedIds((prev) => [...prev, card.id])
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="relative w-full h-full max-w-5xl max-h-[90vh] rounded-3xl bg-white shadow-xl border border-gray-200 flex flex-col px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-gray-700">
            Total score:{' '}
            <span className="font-semibold text-gray-900">
              {totalScore} / 100
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            Done
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
            {cards.map((card) => {
              const selected = selectedIds.includes(card.id)
              const wouldExceed = !selected && totalScore + card.score > 100
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => toggleCard(card)}
                  disabled={wouldExceed}
                  className={[
                    'relative aspect-[3/4] rounded-xl border flex flex-col items-center justify-center',
                    'transition-all duration-150',
                    selected
                      ? 'border-[#7808d0] bg-[#f5f0ff]'
                      : 'border-gray-200 bg-white hover:border-gray-300',
                    wouldExceed ? 'opacity-40 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  <span className="text-xs font-medium text-gray-500 mb-1">
                    Card {card.id + 1}
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {card.score}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1">
                    score
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

