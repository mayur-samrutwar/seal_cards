import { GameState } from './types'

// In-memory game storage (replace with database later)
export const games = new Map<string, GameState>()
