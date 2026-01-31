import { NextRequest, NextResponse } from 'next/server'
import { games } from '../storage'
import { STATS, type StatName } from '../types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gameId } = body

    if (!gameId) {
      return NextResponse.json(
        { error: 'gameId is required' },
        { status: 400 }
      )
    }

    const gameState = games.get(gameId)

    if (!gameState) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }

    if (gameState.status !== 'playing') {
      return NextResponse.json(
        { error: 'Game is not in playing state' },
        { status: 400 }
      )
    }

    if (gameState.currentTurn !== 'system') {
      return NextResponse.json(
        { error: "It's not the system's turn" },
        { status: 400 }
      )
    }

    // System picks a random stat
    const randomIndex = Math.floor(Math.random() * STATS.length)
    const selectedStat: StatName = STATS[randomIndex]

    // Get top cards from both decks
    const userCard = gameState.userDeck[0]
    const systemCard = gameState.systemDeck[0]

    if (!userCard || !systemCard) {
      return NextResponse.json(
        { error: 'Not enough cards in deck' },
        { status: 400 }
      )
    }

    // Compare stats
    const userValue = userCard[selectedStat]
    const systemValue = systemCard[selectedStat]

    let winner: 'user' | 'system' | 'tie'
    if (userValue > systemValue) {
      winner = 'user'
    } else if (systemValue > userValue) {
      winner = 'system'
    } else {
      winner = 'tie'
    }

    // Update game state based on winner
    if (winner === 'user') {
      // User wins: both cards go to bottom of user's deck
      gameState.userDeck.shift() // Remove user's card from top
      gameState.systemDeck.shift() // Remove system's card from top
      gameState.userDeck.push(userCard, systemCard) // Add both to bottom of user's deck
      gameState.currentTurn = 'user' // Winner goes next
    } else if (winner === 'system') {
      // System wins: both cards go to bottom of system's deck
      gameState.userDeck.shift() // Remove user's card from top
      gameState.systemDeck.shift() // Remove system's card from top
      gameState.systemDeck.push(userCard, systemCard) // Add both to bottom of system's deck
      gameState.currentTurn = 'system' // Winner goes next
    } else {
      // Tie: cards go back to bottom of respective decks
      const userCardRemoved = gameState.userDeck.shift()!
      const systemCardRemoved = gameState.systemDeck.shift()!
      
      // Put cards back to bottom of respective decks
      gameState.userDeck.push(userCardRemoved)
      gameState.systemDeck.push(systemCardRemoved)
      
      // Same player picks again
      gameState.currentTurn = 'system'
    }

    // Store last round info
    gameState.lastRound = {
      userCard,
      systemCard,
      selectedStat,
      winner,
    }

    // Check win condition: game ends when one player has all cards (20 total) or has 0 cards
    if (gameState.userDeck.length === 0) {
      gameState.status = 'finished'
      gameState.winner = 'system'
    } else if (gameState.systemDeck.length === 0) {
      gameState.status = 'finished'
      gameState.winner = 'user'
    } else {
      gameState.roundNumber++
    }

    // Update stored game
    games.set(gameId, gameState)

    return NextResponse.json({
      selectedStat,
      userCard,
      systemCard,
      winner,
      gameState,
    })
  } catch (error) {
    console.error('Error processing system turn:', error)
    return NextResponse.json(
      { error: 'Failed to process system turn' },
      { status: 500 }
    )
  }
}
