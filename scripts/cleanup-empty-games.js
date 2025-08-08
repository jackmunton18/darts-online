#!/usr/bin/env node

/**
 * Cleanup script to identify and optionally remove games that were marked as 'finished'
 * but never actually started (have only one player and no game data).
 * 
 * This fixes the issue where games created but never joined by a second player
 * were being marked as finished when the host left, cluttering analytics.
 */

const { initializeApp } = require('firebase/app')
const { getFirestore, collection, query, where, getDocs, deleteDoc, doc, writeBatch } = require('firebase/firestore')

// Firebase config - you'll need to set these environment variables
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
}

async function findEmptyFinishedGames() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)
    
    console.log('🔍 Searching for empty finished games...')
    
    // Query for all finished games
    const gamesRef = collection(db, 'games')
    const q = query(gamesRef, where('status', '==', 'finished'))
    
    const querySnapshot = await getDocs(q)
    const emptyGames = []
    let totalFinished = 0
    
    querySnapshot.forEach(gameDoc => {
      totalFinished++
      const gameData = gameDoc.data()
      
      // Identify games that were finished but never really started:
      // 1. Only one player
      // 2. No turns or minimal game activity
      // 3. Very short duration (finished quickly after creation)
      const isEmptyGame = (
        gameData.players && 
        gameData.players.length === 1 && 
        (!gameData.totalTurns || gameData.totalTurns === 0) &&
        (!gameData.totalThrows || gameData.totalThrows === 0)
      )
      
      if (isEmptyGame) {
        const createdAt = gameData.createdAt?.toDate?.() || new Date(gameData.createdAt)
        const finishedAt = gameData.finishedAt?.toDate?.() || new Date(gameData.finishedAt)
        const durationMinutes = (finishedAt - createdAt) / (1000 * 60)
        
        emptyGames.push({
          id: gameDoc.id,
          gameCode: gameData.gameCode,
          createdAt,
          finishedAt,
          durationMinutes: Math.round(durationMinutes),
          hostId: gameData.hostId,
          playerName: gameData.players[0]?.name || 'Unknown'
        })
      }
    })
    
    console.log(`📊 Found ${totalFinished} total finished games`)
    console.log(`🗑️  Found ${emptyGames.length} empty games that should be cleaned up`)
    
    if (emptyGames.length > 0) {
      console.log('\n📋 Empty games details:')
      emptyGames.forEach((game, index) => {
        console.log(`${index + 1}. Game ${game.gameCode} (${game.id})`)
        console.log(`   Created: ${game.createdAt.toISOString()}`)
        console.log(`   Finished: ${game.finishedAt.toISOString()}`)
        console.log(`   Duration: ${game.durationMinutes} minutes`)
        console.log(`   Player: ${game.playerName}`)
        console.log('')
      })
    }
    
    return emptyGames
  } catch (error) {
    console.error('❌ Error finding empty games:', error)
    throw error
  }
}

async function deleteEmptyGames(emptyGames) {
  if (emptyGames.length === 0) {
    console.log('✅ No empty games to delete')
    return
  }
  
  try {
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)
    
    console.log(`🗑️  Deleting ${emptyGames.length} empty games...`)
    
    // Use batched writes for better performance
    const batchSize = 500 // Firestore batch limit
    const batches = []
    
    for (let i = 0; i < emptyGames.length; i += batchSize) {
      const batch = writeBatch(db)
      const batchGames = emptyGames.slice(i, i + batchSize)
      
      batchGames.forEach(game => {
        const gameRef = doc(db, 'games', game.id)
        batch.delete(gameRef)
      })
      
      batches.push(batch)
    }
    
    // Execute all batches
    for (let i = 0; i < batches.length; i++) {
      await batches[i].commit()
      console.log(`✅ Deleted batch ${i + 1}/${batches.length}`)
    }
    
    console.log(`✅ Successfully deleted ${emptyGames.length} empty games`)
  } catch (error) {
    console.error('❌ Error deleting empty games:', error)
    throw error
  }
}

async function main() {
  const args = process.argv.slice(2)
  const shouldDelete = args.includes('--delete') || args.includes('-d')
  const confirm = args.includes('--confirm') || args.includes('-c')
  
  if (!process.env.FIREBASE_PROJECT_ID) {
    console.error('❌ Missing Firebase environment variables. Please set:')
    console.error('   FIREBASE_PROJECT_ID')
    console.error('   FIREBASE_API_KEY') 
    console.error('   FIREBASE_AUTH_DOMAIN')
    console.error('   FIREBASE_STORAGE_BUCKET')
    console.error('   FIREBASE_MESSAGING_SENDER_ID')
    console.error('   FIREBASE_APP_ID')
    process.exit(1)
  }
  
  try {
    const emptyGames = await findEmptyFinishedGames()
    
    if (shouldDelete) {
      if (!confirm) {
        console.log('\n⚠️  Use --confirm flag to actually delete the games')
        console.log('   Example: node cleanup-empty-games.js --delete --confirm')
        return
      }
      
      await deleteEmptyGames(emptyGames)
    } else {
      console.log('\n💡 To delete these empty games, run:')
      console.log('   node cleanup-empty-games.js --delete --confirm')
    }
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

module.exports = { findEmptyFinishedGames, deleteEmptyGames }
