import type { State, LevelConfig } from './state'
import { canMove, applyMove } from './logic'

function findValidStateReverseMove(states: State) {
  const validFromIndices: integer[] = [];
  const validToIndices: integer[] = [];

  states.forEach((arr, index) => {
    if (arr.length === 1) {
      validFromIndices.push(index);
    } else if (arr.length >= 2 && arr[arr.length - 1] === arr[arr.length - 2]) {
      validFromIndices.push(index);
    }
    if (arr.length < 4) {
      validToIndices.push(index)
    }
  });
  var fromIndex = -1
  if (validFromIndices.length) {
    const randomIdx = Math.floor(Math.random() * validFromIndices.length);
    fromIndex = validFromIndices[randomIdx];
  }
  var toIndex = -1
  if (validToIndices.length) {
    const randomIdx = Math.floor(Math.random() * validToIndices.length);
    toIndex = validToIndices[randomIdx];
  }
  return [fromIndex, toIndex]
}


// Start solved and back-shuffle with valid moves to guarantee solvable
export function generateLevel(cfg: LevelConfig, shuffleMoves = 250): State {
  const { tubeCount, tubeHeight, colorCount, emptyTubes } = cfg

  // Build solved state: one tube per color filled, plus empty tubes
  const state: State = []
  for (let c = 0; c < colorCount; c++) {
    state.push(Array.from({ length: tubeHeight }, () => c))
  }
  for (let i = 0; i < emptyTubes; i++) state.push([])

  // If more tubes requested than colors + empties, add empties
  while (state.length < tubeCount) state.push([])

  function shuffle() {
    const [fromIndex, toIndex] = findValidStateReverseMove(state)
    if (fromIndex >= 0 && toIndex >= 0) applyMove(state, fromIndex, toIndex)
  }

  // Shuffle by valid moves
  let steps = 0
  while (steps < shuffleMoves) {
    shuffle()
    steps += 1
  }
  console.log('steps', steps)
  return state
}