import type { State, Tube } from './state'

export function canMove(state: State, from: number, to: number, tubeHeight: number): boolean {
  if (from === to) return false
  const A = state[from]
  const B = state[to]
  if (!A || !B) return false
  if (A.length === 0) return false
  if (B.length >= tubeHeight) return false
  const ball = A[A.length - 1]
  if (B.length === 0) return true
  return B[B.length - 1] === ball
}

export function applyMove(state: State, from: number, to: number): void {
  const A = state[from]
  const B = state[to]
  const ball = A.pop()
  if (ball === undefined) return
  B.push(ball)
}

export function isSolved(state: State, tubeHeight: number): boolean {
  for (const tube of state) {
    if (tube.length === 0) continue
    if (tube.length !== tubeHeight) return false
    const c = tube[0]
    for (let i = 1; i < tube.length; i++) if (tube[i] !== c) return false
  }
  return true
}

export function deepClone(state: State): State {
  return state.map(t => t.slice())
}