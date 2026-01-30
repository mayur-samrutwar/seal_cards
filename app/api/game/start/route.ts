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

function selectRandomCards(count: number, excludeIds: number[]): DinoCard[] {
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
    const body = await request.json()
    const { userCardIds } = body

    if (!userCardIds || !Array.isArray(userCardIds) || userCardIds.length !== 10) {
      return NextResponse.json(
        { error: 'Must provide exactly 10 user card IDs' },
        { status: 400 }
      )
    }

    // Validate all card IDs exist
    const userCards = userCardIds
      .map((id: number) => ALL_CARDS.find(card => card.id === id))
      .filter((card): card is DinoCard => card !== undefined)

    if (userCards.length !== 10) {
      return NextResponse.json(
        { error: 'Invalid card IDs provided' },
        { status: 400 }
      )
    }

    // System selects 10 random cards (excluding user's cards)
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

    return NextResponse.json({
      gameId,
      gameState,
    })
  } catch (error) {
    console.error('Error starting game:', error)
    return NextResponse.json(
      { error: 'Failed to start game' },
      { status: 500 }
    )
  }
}
