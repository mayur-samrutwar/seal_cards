'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import WalletCorner from '@/components/WalletCorner'
import GameCard from '@/components/GameCard'
import type { GameState, StatName } from '@/app/api/game/types'
import { STATS } from '@/app/api/game/types'

type TurnPhase = 'waiting_selection' | 'processing' | 'showing_result' | 'system_turn'

export default function PlayPage() {
  const searchParams = useSearchParams()
  const gameId = searchParams.get('gameId')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('waiting_selection')
  const [timeLeft, setTimeLeft] = useState(10)
  const [selectedStat, setSelectedStat] = useState<StatName | null>(null)
  const [revealedCards, setRevealedCards] = useState<{ user: boolean; system: boolean }>({
    user: false,
    system: false,
  })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Fetch game state with retry logic
  const fetchGameState = async (retries = 3) => {
    if (!gameId) return
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`/api/game/state?gameId=${gameId}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.log(`[fetchGameState] Attempt ${i + 1} failed:`, response.status, errorData)
          
          if (i < retries - 1) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)))
            continue
          }
          
          throw new Error(errorData.error || 'Failed to load game')
        }
        const data = await response.json()
        console.log(`[fetchGameState] Success on attempt ${i + 1}`)
        setGameState(data.gameState)
        return
      } catch (err) {
        console.error(`[fetchGameState] Error on attempt ${i + 1}:`, err)
        if (i === retries - 1) {
          setError(err instanceof Error ? err.message : 'Failed to load game')
        }
      }
    }
  }

  useEffect(() => {
    if (!gameId) {
      setError('No game ID provided')
      setLoading(false)
      return
    }

    // Small delay to ensure game is stored (race condition fix)
    const timer = setTimeout(() => {
      fetchGameState().finally(() => setLoading(false))
    }, 150)

    return () => clearTimeout(timer)
  }, [gameId])

  // Handle system turn automatically
  useEffect(() => {
    if (!gameId || !gameState || gameState.status === 'finished') return

    // Auto-process system turn
    if (gameState.currentTurn === 'system' && turnPhase === 'system_turn' && !selectedStat) {
      const processSystemTurn = async () => {
        try {
          console.log('[system-turn] Processing system turn...')
          const response = await fetch('/api/game/system-turn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId }),
          })

          if (!response.ok) {
            throw new Error('Failed to process system turn')
          }

          const data = await response.json()
          console.log('[system-turn] System selected:', data.selectedStat, 'Winner:', data.winner)

          // Reveal both cards
          setRevealedCards({ user: true, system: true })
          setTurnPhase('showing_result')

          // Update game state
          setGameState(data.gameState)

          // Auto-advance after 3 seconds if game continues
          if (data.gameState.status === 'playing') {
            setTimeout(() => {
              if (data.gameState.currentTurn === 'user') {
                // User's turn next
                setTurnPhase('waiting_selection')
                setTimeLeft(10)
                setSelectedStat(null)
                setRevealedCards({ user: true, system: false })
              } else {
                // System's turn again (tie scenario)
                setTurnPhase('system_turn')
                setSelectedStat(null)
                setRevealedCards({ user: false, system: false })
              }
            }, 3000)
          }
        } catch (err) {
          console.error('[system-turn] Error:', err)
          setError(err instanceof Error ? err.message : 'Failed to process system turn')
        }
      }

      // Add a small delay to show "System is choosing..." message
      const timer = setTimeout(() => {
        processSystemTurn()
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [gameId, gameState?.currentTurn, turnPhase, selectedStat])

  // Handle turn phase and timer
  useEffect(() => {
    if (!gameState || gameState.status === 'finished') return

    // Reset phase when turn changes
    if (gameState.currentTurn === 'user' && turnPhase !== 'waiting_selection' && turnPhase !== 'showing_result') {
      setTurnPhase('waiting_selection')
      setTimeLeft(10)
      setSelectedStat(null)
      setRevealedCards({ user: true, system: false })
    } else if (gameState.currentTurn === 'system' && turnPhase !== 'system_turn' && turnPhase !== 'showing_result') {
      setTurnPhase('system_turn')
      setSelectedStat(null)
      setRevealedCards({ user: false, system: false })
    }

    // Timer for user turn
    if (gameState.currentTurn === 'user' && turnPhase === 'waiting_selection' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up - auto-select first stat
            if (!selectedStat && gameState.userDeck.length > 0) {
              handleStatSelection(STATS[0])
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [gameState, turnPhase, timeLeft, selectedStat])

  // Handle stat selection
  const handleStatSelection = async (stat: StatName) => {
    if (!gameId || !gameState || turnPhase !== 'waiting_selection' || selectedStat) return

    setSelectedStat(stat)
    setTurnPhase('processing')
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    try {
      const response = await fetch('/api/game/user-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, selectedStat: stat }),
      })

      if (!response.ok) {
        throw new Error('Failed to process turn')
      }

      const data = await response.json()
      
      // Reveal system card
      setRevealedCards({ user: true, system: true })
      setTurnPhase('showing_result')

      // Update game state
      setGameState(data.gameState)

      // Auto-advance after 3 seconds if game continues
      if (data.gameState.status === 'playing') {
        setTimeout(() => {
          if (data.gameState.currentTurn === 'system') {
            // System turn will be handled in Phase 5
            setTurnPhase('system_turn')
          } else {
            // User's turn again (tie scenario)
            setTurnPhase('waiting_selection')
            setTimeLeft(10)
            setSelectedStat(null)
            setRevealedCards({ user: true, system: false })
          }
        }, 3000)
      }
    } catch (err) {
      console.error('Error processing turn:', err)
      setError(err instanceof Error ? err.message : 'Failed to process turn')
      setTurnPhase('waiting_selection')
      setSelectedStat(null)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-screen bg-white flex items-center justify-center">
        <div className="text-gray-600">Loading game...</div>
      </div>
    )
  }

  if (error || !gameState) {
    return (
      <div className="w-full h-screen bg-white flex items-center justify-center">
        <div className="text-red-600">{error || 'Game not found'}</div>
      </div>
    )
  }

  const userCardCount = gameState.userDeck.length
  const systemCardCount = gameState.systemDeck.length

  const lastRound = gameState.lastRound
  
  // During result phase, show cards from lastRound. Otherwise show current top cards
  const userCard = turnPhase === 'showing_result' && lastRound ? lastRound.userCard : gameState.userDeck[0]
  const systemCard = turnPhase === 'showing_result' && lastRound ? lastRound.systemCard : gameState.systemDeck[0]

  // Determine winner display for result phase
  const getWinnerDisplay = () => {
    if (!lastRound) return null
    if (lastRound.winner === 'user') return { text: 'You Win!', color: 'text-purple-600' }
    if (lastRound.winner === 'system') return { text: 'System Wins!', color: 'text-blue-600' }
    return { text: 'Tie!', color: 'text-gray-600' }
  }

  const winnerDisplay = getWinnerDisplay()

  return (
    <div
      className="relative w-full h-screen bg-white overflow-hidden"
      style={{
        backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      <WalletCorner />

      {/* Header - Turn Indicator & Round Info */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-white/90 backdrop-blur rounded-full px-6 py-3 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Round</div>
              <div className="text-lg font-bold text-gray-900">{gameState.roundNumber}</div>
            </div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Turn</div>
              <div
                className={[
                  'text-lg font-bold',
                  gameState.currentTurn === 'user' ? 'text-purple-600' : 'text-blue-600',
                ].join(' ')}
              >
                {gameState.currentTurn === 'user' ? 'Your Turn' : "System's Turn"}
              </div>
            </div>
            {/* Timer for user turn */}
            {gameState.currentTurn === 'user' && turnPhase === 'waiting_selection' && (
              <>
                <div className="w-px h-8 bg-gray-200" />
                <div className="text-center">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Time</div>
                  <div
                    className={[
                      'text-lg font-bold',
                      timeLeft <= 3 ? 'text-red-600' : 'text-gray-900',
                    ].join(' ')}
                  >
                    {timeLeft}s
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Game Board */}
      <div className="w-full h-full flex items-center justify-between px-12 py-24">
        {/* User Deck (Left) */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">Your Deck</div>
            <div className="text-2xl font-bold text-gray-900">{userCardCount}</div>
          </div>
          <div className="relative w-32 h-44">
            {/* Deck pile visual */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-900 shadow-lg" />
            {userCardCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white font-bold text-xl">{userCardCount}</div>
              </div>
            )}
          </div>
        </div>

        {/* Battle Area (Center) */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          {/* Cards */}
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center gap-4">
              <div className="text-sm font-semibold text-gray-600">Your Card</div>
              <div className="w-40 h-56 transition-all duration-500">
                {userCard ? (
                  <GameCard card={userCard} faceUp={revealedCards.user} />
                ) : (
                  <div className="w-full h-full rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No cards</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-3xl font-bold text-gray-400">VS</div>

            <div className="flex flex-col items-center gap-4">
              <div className="text-sm font-semibold text-gray-600">System Card</div>
              <div className="w-40 h-56 transition-all duration-500">
                {systemCard ? (
                  <GameCard card={systemCard} faceUp={revealedCards.system} />
                ) : (
                  <div className="w-full h-full rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No cards</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stat Selection Buttons (User Turn) */}
          {gameState.currentTurn === 'user' &&
            turnPhase === 'waiting_selection' &&
            userCard &&
            !selectedStat && (
              <div className="mt-4">
                <div className="text-center text-sm text-gray-600 mb-3">Choose a stat to compare:</div>
                <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                  {STATS.map((stat) => {
                    const statValue = userCard[stat]
                    const statLabel = stat.toUpperCase()
                    return (
                      <button
                        key={stat}
                        type="button"
                        onClick={() => handleStatSelection(stat)}
                        disabled={!!selectedStat || turnPhase !== 'waiting_selection'}
                        className={[
                          'px-6 py-3 rounded-lg border-2 font-bold text-sm transition-all duration-200',
                          'hover:scale-105 active:scale-95',
                          selectedStat === stat
                            ? 'bg-purple-600 text-white border-purple-700'
                            : 'bg-white text-gray-900 border-gray-300 hover:border-purple-400 hover:bg-purple-50',
                          selectedStat && selectedStat !== stat ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                        ].join(' ')}
                      >
                        <div className="text-xs text-gray-500 mb-1">{statLabel}</div>
                        <div className="text-lg">{statValue}</div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

          {/* Processing State */}
          {turnPhase === 'processing' && (
            <div className="mt-4 text-center">
              <div className="text-gray-600">Processing...</div>
            </div>
          )}

          {/* Result Display */}
          {turnPhase === 'showing_result' && lastRound && winnerDisplay && (
            <div className="mt-4 text-center">
              <div className={['text-2xl font-bold mb-2', winnerDisplay.color].join(' ')}>
                {winnerDisplay.text}
              </div>
              <div className="text-sm text-gray-600">
                {lastRound.selectedStat.toUpperCase()}: You {lastRound.userCard[lastRound.selectedStat]} vs System{' '}
                {lastRound.systemCard[lastRound.selectedStat]}
              </div>
            </div>
          )}

          {/* System Turn Message */}
          {turnPhase === 'system_turn' && (
            <div className="mt-4 text-center">
              <div className="text-gray-600 animate-pulse">System is choosing...</div>
            </div>
          )}
        </div>

        {/* System Deck (Right) */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">System Deck</div>
            <div className="text-2xl font-bold text-gray-900">{systemCardCount}</div>
          </div>
          <div className="relative w-32 h-44">
            {/* Deck pile visual */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-900 shadow-lg" />
            {systemCardCount > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white font-bold text-xl">{systemCardCount}</div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  )
}
