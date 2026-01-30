import dinoData from '@/dino.json'

export type DinoCard = {
  id: number
  name: string
  size: number
  armour: number
  power: number
  attack: number
  speed: number
  age: number
  points: number
}

export type StatName = 'size' | 'armour' | 'power' | 'attack' | 'speed' | 'age'

export type GameState = {
  gameId: string
  userDeck: DinoCard[]
  systemDeck: DinoCard[]
  userWonCards: DinoCard[]
  systemWonCards: DinoCard[]
  currentTurn: 'user' | 'system'
  roundNumber: number
  status: 'playing' | 'finished'
  winner: 'user' | 'system' | null
  lastRound?: {
    userCard: DinoCard
    systemCard: DinoCard
    selectedStat: StatName
    winner: 'user' | 'system' | 'tie'
  }
}

export const STATS: StatName[] = ['size', 'armour', 'power', 'attack', 'speed', 'age']

export const ALL_CARDS: DinoCard[] = dinoData as DinoCard[]
