'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import confetti from 'canvas-confetti'
import WalletCorner from '@/components/WalletCorner'
import GameCard from '@/components/GameCard'
import DeckStack from '@/components/DeckStack'
import type { GameState, StatName } from '@/app/api/game/types'
import { STATS } from '@/app/api/game/types'

type TurnPhase = 'waiting_selection' | 'processing' | 'showing_result' | 'system_turn' | 'system_choosing'

export default function PlayPage() {
  const searchParams = useSearchParams()
  const gameId = searchParams.get('gameId')
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [turnPhase, setTurnPhase] = useState<TurnPhase>('waiting_selection')
  const [timeLeft, setTimeLeft] = useState(10)
  const [selectedStat, setSelectedStat] = useState<StatName | null>(null)
  const [systemSelectedStat, setSystemSelectedStat] = useState<StatName | null>(null)
  const [revealedCards, setRevealedCards] = useState<{ user: boolean; system: boolean }>({
    user: false,
    system: false,
  })
  const [isFlipping, setIsFlipping] = useState(false)
  const [cardAnimation, setCardAnimation] = useState<'none' | 'deal-both' | 'collect-to-user' | 'collect-to-system'>('none')
  const [currentRoundResult, setCurrentRoundResult] = useState<{
    userCard: any
    systemCard: any
    selectedStat: StatName
    winner: 'user' | 'system' | 'tie'
  } | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const timeoutProcessingRef = useRef(false)

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

  // Show confetti on game end - only when user wins
  useEffect(() => {
    if (!gameState || gameState.status !== 'finished' || gameState.winner !== 'user') return

    // Fire confetti from both sides
    const duration = 3000
    const end = Date.now() + duration

    const frame = () => {
      // Left side
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#ffd93d', '#a8e6cf', '#ffaaa5', '#c9b1ff', '#7808d0'],
      })
      // Right side
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#ffd93d', '#a8e6cf', '#ffaaa5', '#c9b1ff', '#7808d0'],
      })

      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    }

    // Start confetti after a short delay
    const timer = setTimeout(() => {
      frame()
      // Also fire a burst from center
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors: ['#ffd93d', '#a8e6cf', '#ffaaa5', '#c9b1ff', '#7808d0'],
      })
    }, 100)

    return () => clearTimeout(timer)
  }, [gameState?.status, gameState?.winner])

  // Handle system turn automatically
  useEffect(() => {
    if (!gameId || !gameState || gameState.status === 'finished') return

      // Auto-process system turn
      if (gameState.currentTurn === 'system' && turnPhase === 'system_turn' && !selectedStat && !systemSelectedStat) {
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

            // Store current round result for display
            setCurrentRoundResult({
              userCard: data.userCard,
              systemCard: data.systemCard,
              selectedStat: data.selectedStat,
              winner: data.winner,
            })

            // Show selected stat
            setSystemSelectedStat(data.selectedStat)
            setTurnPhase('system_choosing')

            // After 2 seconds of showing system's choice, flip both cards
            setTimeout(() => {
              setIsFlipping(true)
              setTimeout(() => {
                // Reveal both cards at once (system turn - both were face down)
                setRevealedCards({ user: true, system: true })
                setIsFlipping(false)
                setTurnPhase('showing_result')
                
                // Show result for 2 seconds, then collect cards
                setTimeout(() => {
                  // Both cards collect to winner's deck
                  if (data.winner === 'user') {
                    setCardAnimation('collect-to-user')
                  } else if (data.winner === 'system') {
                    setCardAnimation('collect-to-system')
                  }
                  
                  // After collect animation completes (800ms), clear table
                  setTimeout(() => {
                    setCardAnimation('none')
                    // Hide cards temporarily (table is empty)
                    setRevealedCards({ user: false, system: false })
                    // Clear round result display
                    setCurrentRoundResult(null)
                    
                    // Wait 500ms with empty table, then update state and deal new cards
                    setTimeout(() => {
                      setGameState(data.gameState)
                      
                      // Deal new cards from both sides
                      if (data.gameState.status === 'playing') {
                        setCardAnimation('deal-both')
                        
                        // Set up next turn after deal animation
                        setTimeout(() => {
                          setCardAnimation('none')
                          setSelectedStat(null)
                          setSystemSelectedStat(null)
                          
                          if (data.gameState.currentTurn === 'user') {
                            setTurnPhase('waiting_selection')
                            setTimeLeft(10)
                            setRevealedCards({ user: true, system: false })
                          } else {
                            setTurnPhase('system_turn')
                            setRevealedCards({ user: false, system: false })
                          }
                        }, 600)
                      }
                    }, 500)
                  }, 800)
                }, 2000)
              }, 300)
            }, 2000)
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
  // Initial deal animation when game first loads
  const [hasDealtInitial, setHasDealtInitial] = useState(false)
  
  useEffect(() => {
    if (!gameState || hasDealtInitial || gameState.status === 'finished') return
    
    // Trigger initial deal animation
    setCardAnimation('deal-both')
    setTimeout(() => {
      setCardAnimation('none')
      setHasDealtInitial(true)
      
      // Set initial card visibility based on whose turn it is
      if (gameState.currentTurn === 'user') {
        setRevealedCards({ user: true, system: false })
        setTurnPhase('waiting_selection')
      } else {
        setRevealedCards({ user: false, system: false })
        setTurnPhase('system_turn')
      }
    }, 600)
  }, [gameState, hasDealtInitial])

  useEffect(() => {
    if (!gameState || gameState.status === 'finished' || !hasDealtInitial) return

    // Reset phase when turn changes (only after initial deal)
    if (gameState.currentTurn === 'user' && turnPhase !== 'waiting_selection' && turnPhase !== 'showing_result') {
      setTurnPhase('waiting_selection')
      setTimeLeft(10)
      setSelectedStat(null)
      setRevealedCards({ user: true, system: false })
      timeoutProcessingRef.current = false // Reset timeout flag for new turn
    } else if (gameState.currentTurn === 'system' && turnPhase !== 'system_turn' && turnPhase !== 'showing_result') {
      setTurnPhase('system_turn')
      setSelectedStat(null)
      setRevealedCards({ user: false, system: false })
    }
  }, [gameState, turnPhase, hasDealtInitial])

  // Separate timer effect - only depends on turn phase
  useEffect(() => {
    if (!gameState || gameState.status === 'finished') return
    if (gameState.currentTurn !== 'user' || turnPhase !== 'waiting_selection') {
      // Clear timer if not user's turn
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Start timer for user turn
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - clear interval and trigger timeout
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          // Trigger timeout penalty asynchronously
          setTimeout(() => {
            handleTimeoutPenalty()
          }, 0)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [gameState?.currentTurn, gameState?.status, turnPhase])

  // Handle timeout penalty - system wins
  const handleTimeoutPenalty = async () => {
    // Guard: only process if it's actually user's turn and we haven't already selected
    if (!gameId || !gameState || selectedStat || gameState.currentTurn !== 'user' || turnPhase !== 'waiting_selection') {
      return
    }
    
    // Prevent multiple timeout calls
    if (timeoutProcessingRef.current) return
    timeoutProcessingRef.current = true

    setSelectedStat(STATS[0]) // Mark as selected to prevent double calls
    setTurnPhase('processing')
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    try {
      // Call user-turn with timeout flag - system wins automatically
      const response = await fetch('/api/game/user-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, selectedStat: STATS[0], timeout: true }),
      })

      if (!response.ok) {
        throw new Error('Failed to process timeout penalty')
      }

      const data = await response.json()
      
      // Store current round result for display
      setCurrentRoundResult({
        userCard: data.userCard,
        systemCard: data.systemCard,
        selectedStat: STATS[0],
        winner: data.winner,
      })
      
      // Reveal both cards (timeout penalty)
      setRevealedCards({ user: true, system: true })
      setTurnPhase('showing_result')

      // Show result for 2 seconds, then collect cards to system (always system wins on timeout)
      setTimeout(() => {
        setCardAnimation('collect-to-system')
        
        // After collect animation completes (800ms), clear table
        setTimeout(() => {
          setCardAnimation('none')
          // Hide cards temporarily (table is empty)
          setRevealedCards({ user: false, system: false })
          // Clear round result display
          setCurrentRoundResult(null)
          
          // Wait 500ms with empty table, then update state and deal new cards
          setTimeout(() => {
            setGameState(data.gameState)
            
            // Deal new cards from both sides
            if (data.gameState.status === 'playing') {
              setCardAnimation('deal-both')
              
              // Set up next turn after deal animation
              setTimeout(() => {
                setCardAnimation('none')
                setSelectedStat(null)
                setTurnPhase('system_turn')
                setRevealedCards({ user: false, system: false })
              }, 600)
            }
          }, 500)
        }, 800)
      }, 2000)
    } catch (err) {
      // Silently ignore timeout errors - game state may have already changed
      console.log('Timeout penalty skipped (turn may have changed):', err)
      // Reset selected stat so user can try again if still their turn
      setSelectedStat(null)
    } finally {
      timeoutProcessingRef.current = false
    }
  }

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
      
      // Store current round result for display
      setCurrentRoundResult({
        userCard: data.userCard,
        systemCard: data.systemCard,
        selectedStat: stat,
        winner: data.winner,
      })
      
      // Flip system card to reveal
      setIsFlipping(true)
      setTimeout(() => {
        setRevealedCards({ user: true, system: true })
        setIsFlipping(false)
        setTurnPhase('showing_result')
        
        // Show result for 2 seconds, then collect cards
        setTimeout(() => {
          // Both cards collect to winner's deck
          if (data.winner === 'user') {
            setCardAnimation('collect-to-user')
          } else if (data.winner === 'system') {
            setCardAnimation('collect-to-system')
          }
          
          // After collect animation completes (800ms), clear table
          setTimeout(() => {
            setCardAnimation('none')
            // Hide cards temporarily (table is empty)
            setRevealedCards({ user: false, system: false })
            // Clear round result display
            setCurrentRoundResult(null)
            
            // Wait 500ms with empty table, then update state and deal new cards
            setTimeout(() => {
              setGameState(data.gameState)
              
              // Deal new cards from both sides
              if (data.gameState.status === 'playing') {
                setCardAnimation('deal-both')
                
                // Set up next turn after deal animation
                setTimeout(() => {
                  setCardAnimation('none')
                  setSelectedStat(null)
                  
                  if (data.gameState.currentTurn === 'system') {
                    setTurnPhase('system_turn')
                    setRevealedCards({ user: false, system: false })
                  } else {
                    setTurnPhase('waiting_selection')
                    setTimeLeft(10)
                    setRevealedCards({ user: true, system: false })
                  }
                }, 600)
              }
            }, 500)
          }, 800)
        }, 2000)
      }, 300)
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

  // During result phase, show cards from currentRoundResult. Otherwise show current top cards
  const userCard = turnPhase === 'showing_result' && currentRoundResult ? currentRoundResult.userCard : gameState.userDeck[0]
  const systemCard = turnPhase === 'showing_result' && currentRoundResult ? currentRoundResult.systemCard : gameState.systemDeck[0]

  // Determine winner display for result phase
  const getWinnerDisplay = () => {
    if (!currentRoundResult) return null
    if (currentRoundResult.winner === 'user') return { text: 'You Win!', color: 'text-purple-600' }
    if (currentRoundResult.winner === 'system') return { text: 'System Wins!', color: 'text-blue-600' }
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
          <DeckStack count={userCardCount} />
        </div>

        {/* Battle Area (Center) */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8">
          {/* Cards */}
          <div className="flex items-center justify-center gap-12">
            <div className="flex flex-col items-center gap-4">
              <div className="text-base font-semibold text-gray-600">Your Card</div>
              <div 
                className={[
                  'w-72 h-96',
                  cardAnimation === 'deal-both' ? 'animate-deal-from-left' : '',
                  cardAnimation === 'collect-to-user' ? 'animate-collect-to-left' : '',
                  cardAnimation === 'collect-to-system' ? 'animate-collect-to-right' : '',
                ].filter(Boolean).join(' ')}
              >
                {userCard ? (
                  <GameCard 
                    card={userCard} 
                    faceUp={revealedCards.user}
                    className={isFlipping ? 'scale-105' : ''}
                  />
                ) : (
                  <div className="w-full h-full rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No cards</span>
                  </div>
                )}
              </div>
            </div>

            <div className="text-4xl font-bold text-gray-400">VS</div>

            <div className="flex flex-col items-center gap-4">
              <div className="text-base font-semibold text-gray-600">System Card</div>
              <div 
                className={[
                  'w-72 h-96',
                  cardAnimation === 'deal-both' ? 'animate-deal-from-right' : '',
                  cardAnimation === 'collect-to-user' ? 'animate-collect-to-left' : '',
                  cardAnimation === 'collect-to-system' ? 'animate-collect-to-right' : '',
                ].filter(Boolean).join(' ')}
              >
                {systemCard ? (
                  <GameCard 
                    card={systemCard} 
                    faceUp={revealedCards.system}
                    className={isFlipping ? 'scale-105' : ''}
                  />
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
          {turnPhase === 'showing_result' && currentRoundResult && winnerDisplay && (
            <div className="mt-4 text-center">
              <div className={['text-2xl font-bold mb-2', winnerDisplay.color].join(' ')}>
                {winnerDisplay.text}
              </div>
              <div className="text-sm text-gray-600">
                {currentRoundResult.selectedStat.toUpperCase()}: You {currentRoundResult.userCard[currentRoundResult.selectedStat]} vs System{' '}
                {currentRoundResult.systemCard[currentRoundResult.selectedStat]}
              </div>
            </div>
          )}

          {/* System Turn Message */}
          {turnPhase === 'system_turn' && (
            <div className="mt-4 text-center">
              <div className="text-gray-600 animate-pulse">System is choosing...</div>
            </div>
          )}

          {/* System Selected Stat */}
          {turnPhase === 'system_choosing' && systemSelectedStat && (
            <div className="mt-4 text-center">
              <div className="text-lg font-bold text-blue-600">
                System chose: <span className="uppercase">{systemSelectedStat}</span>
              </div>
              <div className="text-sm text-gray-500 mt-1">Revealing cards...</div>
            </div>
          )}
        </div>

        {/* System Deck (Right) */}
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">System Deck</div>
            <div className="text-2xl font-bold text-gray-900">{systemCardCount}</div>
          </div>
          <DeckStack count={systemCardCount} />
        </div>
      </div>

    </div>
  )
}
