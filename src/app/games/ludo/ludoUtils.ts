export type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

export interface Token {
  id: string; // e.g., "green-0"
  color: PlayerColor;
  position: number; // -1 = Home, 0-50 = Main Path, 51-55 = Home Stretch, 56 = Finished
}

export const MAIN_PATH = [
  {"r":5,"c":6},{"r":4,"c":6},{"r":3,"c":6},{"r":2,"c":6},{"r":1,"c":6},{"r":0,"c":6},
  {"r":0,"c":7},{"r":0,"c":8},{"r":1,"c":8},{"r":2,"c":8},{"r":3,"c":8},{"r":4,"c":8},{"r":5,"c":8},
  {"r":6,"c":9},{"r":6,"c":10},{"r":6,"c":11},{"r":6,"c":12},{"r":6,"c":13},{"r":6,"c":14},
  {"r":7,"c":14},{"r":8,"c":14},{"r":8,"c":13},{"r":8,"c":12},{"r":8,"c":11},{"r":8,"c":10},{"r":8,"c":9},
  {"r":9,"c":8},{"r":10,"c":8},{"r":11,"c":8},{"r":12,"c":8},{"r":13,"c":8},{"r":14,"c":8},
  {"r":14,"c":7},{"r":14,"c":6},{"r":13,"c":6},{"r":12,"c":6},{"r":11,"c":6},{"r":10,"c":6},{"r":9,"c":6},
  {"r":8,"c":5},{"r":8,"c":4},{"r":8,"c":3},{"r":8,"c":2},{"r":8,"c":1},{"r":8,"c":0},
  {"r":7,"c":0},{"r":6,"c":0},{"r":6,"c":1},{"r":6,"c":2},{"r":6,"c":3},{"r":6,"c":4},{"r":6,"c":5}
];

export const START_INDICES: Record<PlayerColor, number> = {
  green: 47,
  yellow: 8,
  blue: 21,
  red: 34,
};

export const SAFE_CELLS = [3, 8, 16, 21, 29, 34, 42, 47];

export const HOME_STRETCHES: Record<PlayerColor, {r: number, c: number}[]> = {
  green: [{"r":7,"c":1},{"r":7,"c":2},{"r":7,"c":3},{"r":7,"c":4},{"r":7,"c":5}],
  yellow: [{"r":1,"c":7},{"r":2,"c":7},{"r":3,"c":7},{"r":4,"c":7},{"r":5,"c":7}],
  blue: [{"r":7,"c":13},{"r":7,"c":12},{"r":7,"c":11},{"r":7,"c":10},{"r":7,"c":9}],
  red: [{"r":13,"c":7},{"r":12,"c":7},{"r":11,"c":7},{"r":10,"c":7},{"r":9,"c":7}],
};

export const getAbsolutePosition = (color: PlayerColor, relativePos: number): {r: number, c: number} | null => {
  if (relativePos < 0) return null; // Home
  if (relativePos > 56) return null; // Finished
  
  if (relativePos <= 50) {
    const startIndex = START_INDICES[color];
    const absoluteIndex = (startIndex + relativePos) % 52;
    return MAIN_PATH[absoluteIndex];
  } else if (relativePos >= 51 && relativePos <= 55) {
    return HOME_STRETCHES[color][relativePos - 51];
  } else if (relativePos === 56) {
    // Finished area
    return { r: 7, c: 7 }; // center
  }
  return null;
};
