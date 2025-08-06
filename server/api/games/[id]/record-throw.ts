import { defineEventHandler, createError, readBody } from 'h3'
import { admin, initializeAdmin } from '~/server/plugins/firebase-admin.server'
import type { DartThrow } from '~/stores/game'

export default defineEventHandler(async (event) => {
  try {
    // Use the existing Firebase Admin instance or initialize if needed
    if (!admin) {
      await initializeAdmin()
    }
    
    if (!admin || admin.apps.length === 0) {
      throw createError({
        statusCode: 500,
        message: 'Firebase Admin is not initialized',
      })
    }

    // Get the current user ID from the request
    const authHeader = event.req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized',
      })
    }

    const token = authHeader.split('Bearer ')[1]
    const decodedToken = await admin.auth().verifyIdToken(token)
    const userId = decodedToken.uid

    // Get game ID from route params
    const gameId = event.context.params?.id
    if (!gameId) {
      throw createError({
        statusCode: 400,
        message: 'Game ID is required',
      })
    }

    // Get request body
    const body = await readBody(event)
    const { dartThrows } = body

    if (!dartThrows || !Array.isArray(dartThrows) || dartThrows.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'Valid dart throws are required',
      })
    }

    const db = admin.firestore()
    const gameRef = db.collection('dartsGames').doc(gameId)
    
    // Get current game state
    const gameDoc = await gameRef.get()
    if (!gameDoc.exists) {
      throw createError({
        statusCode: 404,
        message: 'Game not found',
      })
    }

    const gameData = gameDoc.data()!
    
    // Verify user is current player or host
    const currentPlayer = gameData.players[gameData.currentPlayerIndex]
    const isHost = gameData.hostId === userId
    const isCurrentPlayer = currentPlayer && currentPlayer.id === userId
    
    if (!isHost && !isCurrentPlayer) {
      throw createError({
        statusCode: 403,
        message: 'Not your turn',
      })
    }

    // Calculate scores and updates
    const player = currentPlayer
    const totalScore = dartThrows.reduce((total: number, t: DartThrow) => total + t.score, 0)
    const newScore = player.currentScore - totalScore
    
    // Calculate total throws made in this turn (including current throws)
    const currentTurnThrowCount = (gameData.currentTurnThrows || 0) + dartThrows.length
    
    // Check for bust
    const busted = newScore < 0 || newScore === 1
    
    // Create turn record
    const turn = {
      playerId: player.id,
      score: totalScore,
      throws: dartThrows,
      remainingScore: busted ? player.currentScore : newScore,
      timestamp: new Date().toISOString(), // Use ISO string format for consistency
      leg: gameData.currentLeg,
      set: gameData.currentSet,
      turnNumber: gameData.totalTurns + 1
    }

    // Add turn to history
    const turnsCollection = gameRef.collection('turns')
    const turnDoc = await turnsCollection.add(turn)
    
    // Get or create current leg data
    let currentLegData = gameData.currentLegData || {
      legNumber: gameData.currentLeg,
      setNumber: gameData.currentSet,
      startPlayerId: gameData.players[gameData.currentPlayerIndex].id,
      startTimestamp: new Date().toISOString(),
      totalThrows: 0,
      throws: [],
      playerStats: {}
    }
    
    // Initialize player stats for this leg if not exists
    if (!currentLegData.playerStats[player.id]) {
      currentLegData.playerStats[player.id] = {
        dartsThrown: 0,
        totalScore: 0,
        turns: 0,
        averagePerTurn: 0,
        highestScore: 0,
        checkoutAttempts: 0,
        checkoutSuccess: false
      }
    }
    
    // Add detailed throw data to the leg
    currentLegData.throws = currentLegData.throws || []
    currentLegData.throws.push({
      playerId: player.id,
      dartsThrown: dartThrows,
      score: totalScore,
      remainingScore: busted ? player.currentScore : newScore,
      timestamp: new Date().toISOString(),
      turnNumber: gameData.totalTurns + 1
    })
    
    // Update leg stats
    currentLegData.totalThrows += dartThrows.length
    const playerLegStats = currentLegData.playerStats[player.id]
    playerLegStats.dartsThrown += dartThrows.length
    playerLegStats.totalScore += totalScore
    playerLegStats.turns += 1
    playerLegStats.averagePerTurn = playerLegStats.totalScore / playerLegStats.turns
    playerLegStats.highestScore = Math.max(playerLegStats.highestScore, totalScore)
    
    // Check for checkout attempt
    if (!busted && player.currentScore <= 170) {
      playerLegStats.checkoutAttempts += 1
    }
    
    // Check for successful checkout
    if (newScore === 0) {
      playerLegStats.checkoutSuccess = true
      playerLegStats.checkoutScore = totalScore
    }
    
    // Update player statistics
    const updatedPlayer = { ...player }
    
    if (!busted) {
      updatedPlayer.currentScore = newScore
      updatedPlayer.totalScore += totalScore
      
      // Update player stats
      dartThrows.forEach((t: DartThrow) => {
        if (t.multiplier === 'double') updatedPlayer.doublesHit++
        if (t.multiplier === 'triple') updatedPlayer.triplesHit++
        if (t.multiplier === 'single') {
          updatedPlayer.singlesHit++
          if (t.value === 25 || t.value === 50) updatedPlayer.bullsHit++
        }
      })
      
      updatedPlayer.totalThrows += dartThrows.length
      
      if (totalScore > 100) {
        updatedPlayer.throwsOver100++
      }
      
      if (totalScore > updatedPlayer.highestTurn) {
        updatedPlayer.highestTurn = totalScore
      }
      
      if (newScore === 0) {
        updatedPlayer.successfulCheckouts++
        if (totalScore > updatedPlayer.highestCheckout) {
          updatedPlayer.highestCheckout = totalScore
        }
      }
      
      if (player.currentScore <= 170) {
        updatedPlayer.checkoutAttempts++
      }
      
      updatedPlayer.totalTurns++
      
      if (updatedPlayer.totalTurns > 0) {
        updatedPlayer.averagePerTurn = updatedPlayer.totalScore / updatedPlayer.totalTurns
      }
      
      if (updatedPlayer.checkoutAttempts > 0) {
        updatedPlayer.checkoutPercentage = (updatedPlayer.successfulCheckouts / updatedPlayer.checkoutAttempts) * 100
      }
    }
    
    // Determine if leg/set is won
    let legWon = false
    let setWon = false
    let gameFinished = false
    
    if (newScore === 0) {
      legWon = true
      updatedPlayer.legs++
      
      if (updatedPlayer.legs >= gameData.legsToWin) {
        setWon = true
        updatedPlayer.sets++
        updatedPlayer.legs = 0
        
        if (updatedPlayer.sets >= gameData.setsToWin) {
          gameFinished = true
        }
      }
    }
    
    // Update game state
    const updatedPlayers = [...gameData.players]
    updatedPlayers[gameData.currentPlayerIndex] = updatedPlayer
    
    const gameUpdates: any = {
      players: updatedPlayers,
      totalThrows: gameData.totalThrows + dartThrows.length,
      currentTurnThrows: currentTurnThrowCount
    }
    
    // Determine if turn should advance to next player
    const shouldAdvanceTurn = 
      busted ||                           // Player busted
      newScore === 0 ||                   // Player achieved checkout
      currentTurnThrowCount >= 3          // Player completed 3 throws
    
    if (shouldAdvanceTurn) {
      gameUpdates.currentPlayerIndex = 
        (gameData.currentPlayerIndex + 1) % gameData.players.length
      gameUpdates.currentTurnThrows = 0  // Reset throw count for next player
      gameUpdates.totalTurns = gameData.totalTurns + 1
    }
    
    // Add current leg data to the game updates
    gameUpdates.currentLegData = currentLegData
    
    // Get or create current set data
    let currentSetData = gameData.currentSetData || {
      setNumber: gameData.currentSet,
      startTimestamp: new Date().toISOString(),
      legs: [],
      playerStats: {}
    }
    
    // Initialize player stats for this set if they don't exist
    gameData.players.forEach((p: any) => {
      if (!currentSetData.playerStats[p.id]) {
        currentSetData.playerStats[p.id] = {
          legsWon: 0,
          totalThrows: 0,
          totalScore: 0,
          averagePerTurn: 0
        }
      }
    })
    
    // Update current set data with leg information
    for (const playerId in currentLegData.playerStats) {
      const playerLegStats = currentLegData.playerStats[playerId]
      const playerSetStats = currentSetData.playerStats[playerId]
      
      playerSetStats.totalThrows += playerLegStats.dartsThrown
      playerSetStats.totalScore += playerLegStats.totalScore
      
      if (playerSetStats.totalThrows > 0) {
        playerSetStats.averagePerTurn = playerSetStats.totalScore / playerLegStats.turns
      }
    }
    
    // Add current set data to the game updates
    gameUpdates.currentSetData = currentSetData
    
    // Handle leg/set completion
    if (legWon) {
      // Complete the current leg data
      currentLegData.endTimestamp = new Date().toISOString()
      currentLegData.winningPlayerId = player.id
      
      // Add to leg history in Firestore
      const legId = `leg_${gameData.currentSet}_${gameData.currentLeg}`
      
      // Make sure legsData exists
      if (!gameData.legsData) {
        gameUpdates.legsData = {}
      } else {
        gameUpdates.legsData = { ...gameData.legsData }
      }
      
      // Store the completed leg
      gameUpdates.legsData[legId] = currentLegData
      
      // Update current set data
      currentSetData.legs.push(legId)
      currentSetData.playerStats[player.id].legsWon++
      
      if (setWon) {
        // Complete the current set data
        currentSetData.endTimestamp = new Date().toISOString()
        currentSetData.winningPlayerId = player.id
        
        // Add to set history in Firestore
        const setId = `set_${gameData.currentSet}`
        
        // Make sure setsData exists
        if (!gameData.setsData) {
          gameUpdates.setsData = {}
        } else {
          gameUpdates.setsData = { ...gameData.setsData }
        }
        
        // Store the completed set
        gameUpdates.setsData[setId] = currentSetData
        
        if (gameFinished) {
          gameUpdates.status = 'finished'
          gameUpdates.finishedAt = admin.firestore.FieldValue.serverTimestamp()
          // Store the winner ID when the game is finished
          gameUpdates.winner = player.id
        } else {
          // Start a new set
          gameUpdates.currentSet = gameData.currentSet + 1
          gameUpdates.currentLeg = 1
          
          // Alternate starting player for new set - use the player who didn't win the last set
          const newStartingPlayerIndex = gameData.players.findIndex((p: any) => p.id !== player.id) || 0
          gameUpdates.currentPlayerIndex = newStartingPlayerIndex
          gameUpdates.currentTurnThrows = 0   // Reset turn throws
          
          // Reset scores for new set
          gameUpdates.players = updatedPlayers.map((p: any) => ({
            ...p,
            currentScore: 501 // Reset to starting score
          }))
          
          // Create new set data
          gameUpdates.currentSetData = {
            setNumber: gameData.currentSet + 1,
            startTimestamp: new Date().toISOString(),
            legs: [],
            playerStats: {}
          }
          
          // Initialize player stats for new set
          gameData.players.forEach((p: any) => {
            gameUpdates.currentSetData.playerStats[p.id] = {
              legsWon: 0,
              totalThrows: 0,
              totalScore: 0,
              averagePerTurn: 0
            }
          })
          
          // Create new leg data
          gameUpdates.currentLegData = {
            legNumber: 1,
            setNumber: gameData.currentSet + 1,
            startPlayerId: updatedPlayers[newStartingPlayerIndex].id,
            startTimestamp: new Date().toISOString(),
            totalThrows: 0,
            throws: [],
            playerStats: {}
          }
          
          // Initialize player stats for new leg
          gameData.players.forEach((p: any) => {
            gameUpdates.currentLegData.playerStats[p.id] = {
              dartsThrown: 0,
              totalScore: 0,
              turns: 0,
              averagePerTurn: 0,
              highestScore: 0,
              checkoutAttempts: 0,
              checkoutSuccess: false
            }
          })
        }
      } else {
        // Start a new leg in the current set
        gameUpdates.currentLeg = gameData.currentLeg + 1
        
        // Alternate starting player for each new leg
        // Use currentLeg to determine who starts (even legs: player 0, odd legs: player 1)
        const newStartingPlayerIndex = (gameData.currentLeg % 2)
        gameUpdates.currentPlayerIndex = newStartingPlayerIndex 
        gameUpdates.currentTurnThrows = 0   // Reset turn throws
        
        // Reset scores for new leg
        gameUpdates.players = updatedPlayers.map((p: any) => ({
          ...p,
          currentScore: 501 // Reset to starting score
        }))
        
        // Create new leg data
        gameUpdates.currentLegData = {
          legNumber: gameData.currentLeg + 1,
          setNumber: gameData.currentSet,
          startPlayerId: updatedPlayers[newStartingPlayerIndex].id,
          startTimestamp: new Date().toISOString(),
          totalThrows: 0,
          throws: [],
          playerStats: {}
        }
        
        // Initialize player stats for new leg
        gameData.players.forEach((p: any) => {
          gameUpdates.currentLegData.playerStats[p.id] = {
            dartsThrown: 0,
            totalScore: 0,
            turns: 0,
            averagePerTurn: 0,
            highestScore: 0,
            checkoutAttempts: 0,
            checkoutSuccess: false
          }
        })
      }
    }
    
    await gameRef.update(gameUpdates)
    
    return { 
      success: true,
      busted,
      checkout: newScore === 0,
      turnAdvanced: shouldAdvanceTurn,
      gameFinished
    }
  } catch (error: any) {
    console.error('Error recording throw:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Failed to record throw',
    })
  }
})
