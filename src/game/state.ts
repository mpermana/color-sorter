export type ColorId = number
export type Tube = ColorId[] // top at end
export type State = Tube[]

export interface LevelConfig {
  tubeCount: number
  tubeHeight: number
  colorCount: number
  emptyTubes: number
}