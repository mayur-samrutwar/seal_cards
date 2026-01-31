import { NextRequest, NextResponse } from 'next/server'
import { ALL_CARDS, type DinoCard, type GameState } from '../types'
import { games } from '../storage'

function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function selectRandomCards(count: number, excludeIds: number[] = []): DinoCard[] {
  const available = ALL_CARDS.filter(card => !excludeIds.includes(card.id))
  const selected: DinoCard[] = []
  const selectedIds: number[] = []

  while (selected.length < count && available.length > 0) {
    const randomIndex = Math.floor(Math.random() * available.length)
    const card = available[randomIndex]
    
    if (!selectedIds.includes(card.id)) {
      selected.push(card)
      selectedIds.push(card.id)
      available.splice(randomIndex, 1)
    }
  }

  return selected
}

export async function POST(request: NextRequest) {
  try {
    // For pack selection, system picks 10 random cards for user
    const userCards = selectRandomCards(10)

    // System selects 10 random cards (excluding user's cards)
    const userCardIds = userCards.map(card => card.id)
    const systemCards = selectRandomCards(10, userCardIds)

    // Shuffle both decks
    const shuffledUserDeck = shuffle(userCards)
    const shuffledSystemDeck = shuffle(systemCards)

    // Create game state
    const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const gameState: GameState = {
      gameId,
      userDeck: shuffledUserDeck,
      systemDeck: shuffledSystemDeck,
      userWonCards: [],
      systemWonCards: [],
      currentTurn: Math.random() > 0.5 ? 'user' : 'system', // Random first turn
      roundNumber: 1,
      status: 'playing',
      winner: null,
    }

    // Store game
    games.set(gameId, gameState)
    console.log(`[start-pack] Game stored: ${gameId}, Total games: ${games.size}`)
    console.log(`[start-pack] Game IDs: ${Array.from(games.keys()).join(', ')}`)

    return NextResponse.json({
      gameId,
      gameState,
    })
  } catch (error) {
    console.error('Error starting game with pack:', error)
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    )
  }
}
