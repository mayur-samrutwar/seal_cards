'use client'

import Image from 'next/image'
import AnimatedButton from '@/components/AnimatedButton'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WalletCorner from '@/components/WalletCorner'
import ChooseSetModal from '@/components/ChooseSetModal'

export default function GamePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<'pack' | 'set' | null>(null)
  const [showSetModal, setShowSetModal] = useState(false)
  const [selectedCardCount, setSelectedCardCount] = useState(0)
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([])
  const [isStarting, setIsStarting] = useState(false)

  return (
    <div
      className="relative w-full h-screen bg-white flex items-center justify-center"
      style={{
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <WalletCorner />
      <div className="flex flex-col items-center gap-10 -translate-y-10">
        <div className="flex items-center gap-8">
          {/* Pack image with text */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelected('pack')
                setSelectedCardCount(0)
                setShowSetModal(false)
              }}
              className={[
                'relative w-[320px] h-[440px] flex items-center justify-center transition-all duration-200',
                selected && selected !== 'pack' ? 'opacity-55 grayscale-[20%]' : 'opacity-100',
              ].join(' ')}
              aria-pressed={selected === 'pack'}
            >
              <Image
                src="/pack.png"
                alt="Pack"
                width={280}
                height={385}
                className="object-contain"
              />
            </button>
            <p className="text-gray-600 text-lg font-medium">
              Get a 'Seal' pack with random cards
            </p>
          </div>

          {/* OR Sign */}
          <div className="text-3xl font-semibold text-gray-600">OR</div>

          {/* Set image with text */}
          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelected('set')
                setShowSetModal(true)
              }}
              className={[
                'relative w-[320px] h-[440px] flex items-center justify-center transition-all duration-200',
                selected && selected !== 'set' ? 'opacity-55 grayscale-[20%]' : 'opacity-100',
              ].join(' ')}
              aria-pressed={selected === 'set'}
            >
              <Image
                src="/set.png"
                alt="Set"
                width={320}
                height={440}
                className="object-contain"
              />
            </button>
            <p className="text-gray-600 text-lg font-medium">
              Choose your own set of cards
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={
            isStarting ||
            !selected ||
            (selected === 'set' && selectedCardCount !== 10)
          }
          onClick={async (e) => {
            e.preventDefault()
            e.stopPropagation()
            
            console.log('Play button clicked', { selected, selectedCardCount, selectedCardIds, isStarting })
            
            if (!selected) {
              console.log('No selection made')
              alert('Please select a game mode first (Pack or Set)')
              return
            }

            if (selected === 'set' && selectedCardCount !== 10) {
              console.log('Not enough cards selected')
              alert(`Please select exactly 10 cards. Currently selected: ${selectedCardCount}`)
              return
            }

            setIsStarting(true)
            try {
              let gameId: string

              if (selected === 'pack') {
                console.log('Starting game with pack...')
                // Start game with random pack
                const response = await fetch('/api/game/start-pack', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                })

                console.log('Pack response status:', response.status)

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}))
                  console.error('Pack API error:', errorData)
                  throw new Error(errorData.error || 'Failed to start game')
                }

                const data = await response.json()
                console.log('Pack game started:', data)
                gameId = data.gameId
              } else {
                console.log('Starting game with selected cards...', selectedCardIds)
                // Start game with selected cards
                const response = await fetch('/api/game/start', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userCardIds: selectedCardIds }),
                })

                console.log('Set response status:', response.status)

                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}))
                  console.error('Set API error:', errorData)
                  throw new Error(errorData.error || 'Failed to start game')
                }

                const data = await response.json()
                console.log('Set game started:', data)
                gameId = data.gameId
              }

              if (!gameId) {
                throw new Error('No gameId returned from API')
              }

              console.log('Navigating to game play page with gameId:', gameId)
              // Navigate to game play page with gameId
              // Pass gameState in URL state to avoid race condition
              router.push(`/game/play?gameId=${gameId}`)
            } catch (error) {
              console.error('Error starting game:', error)
              alert(`Failed to start game: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`)
              setIsStarting(false)
            }
          }}
          className={[
            'group relative inline-flex items-center justify-center gap-3',
            'h-12 px-6 rounded-full',
            'border border-gray-200 bg-white/80 backdrop-blur',
            'text-gray-800',
            'transition-transform duration-200',
            'hover:scale-[1.02] active:scale-[0.99]',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          ].join(' ')}
        >
          <span className="text-[15px] font-semibold tracking-tight">
            {isStarting
              ? 'Starting game...'
              : !selected
                ? 'Select a mode to play'
                : selected === 'set' && selectedCardCount !== 10
                  ? `Select ${10 - selectedCardCount} more cards`
                  : 'Play'}
          </span>
        </button>
      </div>

      <ChooseSetModal
        open={showSetModal}
        onClose={() => {
          setShowSetModal(false)
          // Reset count if user closes without selecting 10 cards
          if (selectedCardCount !== 10) {
            setSelectedCardCount(0)
            setSelectedCardIds([])
            setSelected(null)
          }
        }}
        onSelectionChange={(count, ids) => {
          setSelectedCardCount(count)
          setSelectedCardIds(ids)
        }}
      />
    </div>
  )
}

