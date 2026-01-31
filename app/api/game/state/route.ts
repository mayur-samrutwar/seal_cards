import { NextRequest, NextResponse } from 'next/server'
import { games } from '../storage'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const gameId = searchParams.get('gameId')

    console.log(`[state] Requested gameId: ${gameId}`)
    console.log(`[state] Total games in storage: ${games.size}`)
    console.log(`[state] Game IDs: ${Array.from(games.keys()).join(', ')}`)

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      )
    }

    const gameState = games.get(gameId)

    if (!gameState) {
      console.log(`[state] Game not found: ${gameId}`)
      return NextResponse.json(
        { error: 'Game not found', availableGames: Array.from(games.keys()) },
        { status: 404 }
      )
    }

    console.log(`[state] Game found: ${gameId}`)
    return NextResponse.json({ gameState })
  } catch (error) {
    console.error('Error getting game state:', error)
    return NextResponse.json(
      { error: 'Failed to get game state' },
      { status: 500 }
    )
  }
}
