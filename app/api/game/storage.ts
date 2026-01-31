import { GameState } from './types'

// Use global object to persist across hot reloads in Next.js
declare global {
  // eslint-disable-next-line no-var
  var __games_storage__: Map<string, GameState> | undefined
}

// In-memory game storage (replace with database later)
// Use global to persist across Next.js hot reloads
const getGamesStorage = (): Map<string, GameState> => {
  if (typeof global.__games_storage__ === 'undefined') {
    global.__games_storage__ = new Map<string, GameState>()
  }
  return global.__games_storage__
}

export const games = getGamesStorage()

// Debug helper
export function getGamesCount() {
  return games.size
}

export function getAllGameIds() {
  return Array.from(games.keys())
}
