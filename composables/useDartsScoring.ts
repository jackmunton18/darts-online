import { ref, computed } from 'vue'
import type { DartThrow } from '~/stores/game'

export const useDartsScoring = () => {
  const currentThrows = ref<DartThrow[]>([])
  const totalScore = ref(0)

  // Scoring options for individual throws
  const scoringOptions = computed(() => {
    const options = []
    
    // Singles (1-20, 25)
    for (let i = 1; i <= 20; i++) {
      options.push({ value: i, multiplier: 'single', score: i, label: `Single ${i}` })
    }
    options.push({ value: 25, multiplier: 'single', score: 25, label: 'Single Bull' })
    
    // Doubles (2-20)
    for (let i = 1; i <= 20; i++) {
      options.push({ value: i, multiplier: 'double', score: i * 2, label: `Double ${i}` })
    }
    options.push({ value: 25, multiplier: 'double', score: 50, label: 'Double Bull' })
    
    // Triples (1-20)
    for (let i = 1; i <= 20; i++) {
      options.push({ value: i, multiplier: 'triple', score: i * 3, label: `Triple ${i}` })
    }
    
    // Miss
    options.push({ value: 0, multiplier: 'single', score: 0, label: 'Miss' })
    
    return options
  })

  const addThrow = (value: number, multiplier: 'single' | 'double' | 'triple') => {
    const score = multiplier === 'single' ? value : multiplier === 'double' ? value * 2 : value * 3
    
    const dartThrow: DartThrow = {
      value,
      multiplier,
      score,
      timestamp: new Date().toISOString()
    }
    
    currentThrows.value.push(dartThrow)
    totalScore.value += score
  }

  const removeLastThrow = () => {
    if (currentThrows.value.length > 0) {
      const lastThrow = currentThrows.value.pop()!
      totalScore.value -= lastThrow.score
    }
  }

  const clearThrows = () => {
    currentThrows.value = []
    totalScore.value = 0
  }

  const getScoringOptions = (remainingScore: number) => {
    return scoringOptions.value.filter(option => {
      const potentialScore = totalScore.value + option.score
      return potentialScore <= remainingScore
    })
  }

  const calculateTotalScore = (throws: DartThrow[]) => {
    return throws.reduce((total, dartThrow) => total + dartThrow.score, 0)
  }

  const isValidScore = (score: number, remainingScore: number) => {
    return score >= 0 && score <= remainingScore && score !== 1
  }

  const getBestScoringOptions = (remainingScore: number) => {
    const options = scoringOptions.value
      .filter(option => {
        const potentialScore = totalScore.value + option.score
        return potentialScore <= remainingScore && potentialScore !== 1
      })
      .sort((a, b) => b.score - a.score)
    
    return options.slice(0, 5) // Return top 5 options
  }

  // Checkout suggestions
  const getCheckoutSuggestions = (remainingScore: number): string[][] => {
    if (remainingScore > 170) return []
    
    const commonCheckouts: { [key: number]: string[] } = {
      170: ['T20', 'T20', 'Bull'],
      167: ['T20', 'T19', 'Bull'],
      164: ['T20', 'T18', 'Bull'],
      161: ['T20', 'T17', 'Bull'],
      160: ['T20', 'T20', 'D20'],
      158: ['T20', 'T20', 'D19'],
      157: ['T20', 'T19', 'D20'],
      156: ['T20', 'T20', 'D18'],
      155: ['T20', 'T19', 'D19'],
      154: ['T20', 'T18', 'D20'],
      153: ['T20', 'T19', 'D18'],
      152: ['T20', 'T20', 'D16'],
      151: ['T20', 'T17', 'D20'],
      150: ['T20', 'T18', 'D18'],
      149: ['T20', 'T19', 'D16'],
      148: ['T20', 'T16', 'D20'],
      147: ['T20', 'T17', 'D18'],
      146: ['T20', 'T18', 'D16'],
      145: ['T20', 'T15', 'D20'],
      144: ['T20', 'T20', 'D12'],
      143: ['T20', 'T17', 'D16'],
      142: ['T20', 'T14', 'D20'],
      141: ['T20', 'T19', 'D12'],
      140: ['T20', 'T20', 'D10'],
      139: ['T20', 'T13', 'D20'],
      138: ['T20', 'T18', 'D12'],
      137: ['T20', 'T19', 'D10'],
      136: ['T20', 'T20', 'D8'],
      135: ['T20', 'T17', 'D12'],
      134: ['T20', 'T14', 'D16'],
      133: ['T20', 'T19', 'D8'],
      132: ['T20', 'T16', 'D12'],
      131: ['T20', 'T13', 'D16'],
      130: ['T20', 'T20', 'D5'],
      129: ['T19', 'T16', 'D12'],
      128: ['T18', 'T14', 'D16'],
      127: ['T20', 'T17', 'D8'],
      126: ['T19', 'T19', 'D6'],
      125: ['T20', 'T19', 'D4'],
      124: ['T20', 'T16', 'D8'],
      123: ['T19', 'T16', 'D9'],
      122: ['T18', 'T18', 'D7'],
      121: ['T20', 'T11', 'D14'],
      120: ['T20', 'T20', 'D0'],
      119: ['T19', 'T12', 'D13'],
      118: ['T20', 'T18', 'D2'],
      117: ['T20', 'T17', 'D3'],
      116: ['T20', 'T16', 'D4'],
      115: ['T20', 'T15', 'D5'],
      114: ['T20', 'T14', 'D6'],
      113: ['T19', 'T16', 'D8'],
      112: ['T20', 'T12', 'D8'],
      111: ['T20', 'T19', 'D0'],
      110: ['T20', 'T10', 'D10'],
      109: ['T20', 'T9', 'D11'],
      108: ['T20', 'T16', 'D0'],
      107: ['T19', 'T18', 'D0'],
      106: ['T20', 'T14', 'D0'],
      105: ['T20', 'T13', 'D0'],
      104: ['T20', 'T12', 'D0'],
      103: ['T19', 'T16', 'D0'],
      102: ['T20', 'T10', 'D0'],
      101: ['T17', 'T18', 'D0'],
      100: ['T20', 'D20'],
      99: ['T19', 'T10', 'D6'],
      98: ['T20', 'D19'],
      97: ['T19', 'D20'],
      96: ['T20', 'D18'],
      95: ['T19', 'D19'],
      94: ['T18', 'D20'],
      93: ['T19', 'D18'],
      92: ['T20', 'D16'],
      91: ['T17', 'D20'],
      90: ['T20', 'D15'],
      89: ['T19', 'D16'],
      88: ['T16', 'D20'],
      87: ['T17', 'D18'],
      86: ['T18', 'D16'],
      85: ['T15', 'D20'],
      84: ['T20', 'D12'],
      83: ['T17', 'D16'],
      82: ['T14', 'D20'],
      81: ['T19', 'D12'],
      80: ['T20', 'D10'],
      79: ['T19', 'D11'],
      78: ['T18', 'D12'],
      77: ['T19', 'D10'],
      76: ['T20', 'D8'],
      75: ['T17', 'D12'],
      74: ['T14', 'D16'],
      73: ['T19', 'D8'],
      72: ['T16', 'D12'],
      71: ['T13', 'D16'],
      70: ['T20', 'D5'],
      69: ['T19', 'D6'],
      68: ['T16', 'D10'],
      67: ['T17', 'D8'],
      66: ['T18', 'D6'],
      65: ['T15', 'D10'],
      64: ['T16', 'D8'],
      63: ['T17', 'D6'],
      62: ['T10', 'D16'],
      61: ['T15', 'D8'],
      60: ['T20', 'D0'],
      59: ['T19', 'D1'],
      58: ['T18', 'D2'],
      57: ['T19', 'D0'],
      56: ['T16', 'D4'],
      55: ['T15', 'D5'],
      54: ['T18', 'D0'],
      53: ['T13', 'D7'],
      52: ['T12', 'D8'],
      51: ['T17', 'D0'],
      50: ['T18', 'D0'],
      49: ['T17', 'D0'],
      48: ['T16', 'D0'],
      47: ['T15', 'D0'],
      46: ['T14', 'D0'],
      45: ['T15', 'D0'],
      44: ['T12', 'D0'],
      43: ['T11', 'D0'],
      42: ['T10', 'D0'],
      41: ['T9', 'D0'],
      40: ['D20'],
      39: ['T13', 'D0'],
      38: ['D19'],
      37: ['T11', 'D0'],
      36: ['D18'],
      35: ['T9', 'D0'],
      34: ['D17'],
      33: ['T11', 'D0'],
      32: ['D16'],
      31: ['T9', 'D0'],
      30: ['D15'],
      29: ['T7', 'D0'],
      28: ['D14'],
      27: ['T9', 'D0'],
      26: ['D13'],
      25: ['T7', 'D0'],
      24: ['D12'],
      23: ['T5', 'D0'],
      22: ['D11'],
      21: ['T7', 'D0'],
      20: ['D10'],
      19: ['T5', 'D0'],
      18: ['D9'],
      17: ['T3', 'D0'],
      16: ['D8'],
      15: ['T5', 'D0'],
      14: ['D7'],
      13: ['T3', 'D0'],
      12: ['D6'],
      11: ['T3', 'D0'],
      10: ['D5'],
      9: ['T3', 'D0'],
      8: ['D4'],
      7: ['T1', 'D0'],
      6: ['D3'],
      5: ['T1', 'D0'],
      4: ['D2'],
      3: ['T1', 'D0'],
      2: ['D1']
    }

    const suggestions = commonCheckouts[remainingScore] || []
    if (suggestions.length > 0) {
      return [suggestions]
    }

    // Generate dynamic checkout suggestions
    return generateCheckoutSuggestions(remainingScore)
  }

  const generateCheckoutSuggestions = (remainingScore: number): string[][] => {
    const suggestions: string[][] = []
    
    // Try different combinations
    for (let first = 20; first >= 1; first--) {
      for (let second = 20; second >= 1; second--) {
        for (let third = 20; third >= 1; third--) {
          const total = first * 3 + second * 3 + third * 2
          if (total === remainingScore) {
            suggestions.push([`T${first}`, `T${second}`, `D${third}`])
            if (suggestions.length >= 3) return suggestions
          }
        }
      }
    }

    // Try double-double combinations
    for (let first = 20; first >= 1; first--) {
      for (let second = 20; second >= 1; second--) {
        const total = first * 2 + second * 2
        if (total === remainingScore) {
          suggestions.push([`D${first}`, `D${second}`])
          if (suggestions.length >= 3) return suggestions
        }
      }
    }

    return suggestions
  }

  return {
    currentThrows,
    totalScore,
    scoringOptions,
    addThrow,
    removeLastThrow,
    clearThrows,
    getScoringOptions,
    calculateTotalScore,
    isValidScore,
    getBestScoringOptions,
    getCheckoutSuggestions
  }
} 