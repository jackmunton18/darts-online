import { ref, computed } from 'vue'
import { 
    collection, 
    doc, 
    addDoc, 
    updateDoc, 
    getDoc, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    Timestamp,
    serverTimestamp,
    getFirestore
} from 'firebase/firestore'
import { deepSanitize } from '~/utils/firestoreSanitizer'
import type { 
    Tournament, 
    TournamentPlayer, 
    TournamentSettings, 
    BracketMatch, 
    GroupStanding,
    RoundPairing,
    TournamentGameResult
} from '~/types/tournament'
import { useAuthStore } from '~/stores/auth'
import { useUserStore } from '~/stores/user'
import { useNotificationStore } from '~/stores/notification'

// Global tournament state
const currentTournament = ref<Tournament | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)
const tournamentGames = ref<string[]>([])
const showSpinWheel = ref(false)
const spinWheelProps = ref<{
    players: TournamentPlayer[]
    spinType: 'pairing' | 'home-side'
    roundNumber?: number
    existingPairing?: { player1: TournamentPlayer; player2: TournamentPlayer }
} | null>(null)

export const useTournament = () => {
    const { $firestore } = useNuxtApp()
    const authStore = useAuthStore()
    const userStore = useUserStore()
    const toast = useNotificationStore()

    if (!$firestore) {
        throw new Error('Firestore not initialized')
    }

    const db = $firestore

    // Computed properties
    const isHost = computed(() => {
        if (!currentTournament.value || !authStore.currentUser) return false
        return currentTournament.value.createdBy === authStore.currentUser.id
    })

    const currentPlayer = computed(() => {
        if (!currentTournament.value || !authStore.currentUser) return null
        return currentTournament.value.players.find(p => p.id === authStore.currentUser?.id)
    })

    const canStartTournament = computed(() => {
        if (!currentTournament.value || !isHost.value) return false
        const tournament = currentTournament.value
        return (
            tournament.status === 'waiting' &&
            tournament.players.length >= 2 && // Minimum 2 players
            tournament.players.length <= tournament.maxPlayers &&
            tournament.allPlayersReady
        )
    })

    // Generate a unique 6-character tournament code
    const generateTournamentCode = (): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let result = ''
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return result
    }

    // Create a new tournament
    const createTournament = async (settings: TournamentSettings): Promise<Tournament> => {
        if (!authStore.currentUser) {
            throw new Error('User must be authenticated to create tournament')
        }

        try {
            isLoading.value = true
            error.value = null

            const tournamentCode = generateTournamentCode()
            const now = Timestamp.now()

            const tournamentData: Omit<Tournament, 'id'> = {
                code: tournamentCode,
                createdBy: authStore.currentUser.id,
                createdAt: now,
                updatedAt: now,
                status: 'waiting',
                
                // Game settings
                gameType: settings.gameType,
                legsToWin: settings.legsToWin,
                setsToWin: settings.setsToWin,
                
                // Tournament settings
                mode: settings.mode,
                maxPlayers: settings.maxPlayers,
                currentPlayerCount: 1,
                bonusPoints: settings.bonusPoints,
                enableThirdPlace: settings.enableThirdPlace,
                
                // Initial state
                players: [{
                    id: authStore.currentUser.id,
                    name: userStore.user?.username || authStore.currentUser.email || 'Unknown',
                    isReady: false,
                    isHost: true,
                    points: 0,
                    gamesWon: 0,
                    gamesLost: 0,
                    legsWon: 0,
                    legsLost: 0,
                    bonusPoints: 0
                }],
                currentRound: 0,
                games: [],
                completedGames: [],
                roundInProgress: false,
                allPlayersReady: false
            }

            const docRef = await addDoc(collection(db, 'tournaments'), tournamentData)
            const tournament: Tournament = {
                id: docRef.id,
                ...tournamentData
            }

            currentTournament.value = tournament
            
            toast.addMessage({ 
                type: 'success', 
                message: `Tournament created! Code: ${tournamentCode}` 
            })

            return tournament
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create tournament'
            error.value = errorMessage
            toast.addMessage({ type: 'error', message: errorMessage })
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Join an existing tournament
    const joinTournament = async (code: string): Promise<Tournament> => {
        if (!authStore.currentUser) {
            throw new Error('User must be authenticated to join tournament')
        }

        try {
            isLoading.value = true
            error.value = null

            // Find tournament by code
            const tournamentsRef = collection(db, 'tournaments')
            const q = query(tournamentsRef, where('code', '==', code.toUpperCase()))
            const querySnapshot = await getDocs(q)

            if (querySnapshot.empty) {
                throw new Error('Tournament not found. Please check the code.')
            }

            const tournamentDoc = querySnapshot.docs[0]
            const tournament = {
                id: tournamentDoc.id,
                ...tournamentDoc.data()
            } as Tournament

            // Check if tournament is joinable
            if (tournament.status !== 'waiting') {
                throw new Error('Tournament has already started or finished')
            }

            if (tournament.players.length >= tournament.maxPlayers) {
                throw new Error('Tournament is full')
            }

            // Check if player is already in tournament
            const existingPlayer = tournament.players.find(p => p.id === authStore.currentUser?.id)
            if (existingPlayer) {
                // Player is already in tournament, just subscribe
                currentTournament.value = tournament
                return tournament
            }

            // Add player to tournament
            const newPlayer: TournamentPlayer = {
                id: authStore.currentUser.id,
                name: userStore.user?.username || authStore.currentUser.email || 'Unknown',
                isReady: false,
                isHost: false,
                points: 0,
                gamesWon: 0,
                gamesLost: 0,
                legsWon: 0,
                legsLost: 0,
                bonusPoints: 0
            }

            console.log('👤 Adding new player to tournament:', newPlayer)
            const updatedPlayers = [...tournament.players, newPlayer]
            console.log('👥 Updated players list:', updatedPlayers)
            
            await updateDoc(doc(db, 'tournaments', tournament.id), {
                players: updatedPlayers,
                currentPlayerCount: updatedPlayers.length,
                updatedAt: Timestamp.now()
            })

            console.log('✅ Player added to tournament successfully')

            const updatedTournament: Tournament = {
                ...tournament,
                players: updatedPlayers,
                currentPlayerCount: updatedPlayers.length
            }

            currentTournament.value = updatedTournament
            
            toast.addMessage({ 
                type: 'success', 
                message: 'Successfully joined tournament!' 
            })

            return updatedTournament
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to join tournament'
            error.value = errorMessage
            toast.addMessage({ type: 'error', message: errorMessage })
            throw err
        } finally {
            isLoading.value = false
        }
    }

    // Subscribe to tournament updates
    const subscribeToTournament = (tournamentId: string) => {
        console.log('📡 Setting up tournament subscription for ID:', tournamentId)
        const tournamentRef = doc(db, 'tournaments', tournamentId)
        
        return onSnapshot(tournamentRef, (doc) => {
            if (doc.exists()) {
                const tournamentData = {
                    id: doc.id,
                    ...doc.data()
                } as Tournament
                
                console.log('🔄 Tournament updated via subscription:', tournamentData)
                currentTournament.value = tournamentData
            } else {
                console.log('❌ Tournament document does not exist')
            }
        }, (err) => {
            console.error('💥 Error subscribing to tournament:', err)
            error.value = 'Failed to subscribe to tournament updates'
        })
    }

    // Set player ready status
    const setPlayerReady = async (tournamentId: string, ready: boolean) => {
        if (!authStore.currentUser || !currentTournament.value) return

        try {
            const updatedPlayers = currentTournament.value.players.map(player => 
                player.id === authStore.currentUser?.id 
                    ? { ...player, isReady: ready }
                    : player
            )

            const allReady = updatedPlayers.every(p => p.isReady)

            await updateDoc(doc(db, 'tournaments', tournamentId), {
                players: updatedPlayers,
                allPlayersReady: allReady,
                updatedAt: Timestamp.now()
            })

            if (allReady) {
                toast.addMessage({ 
                    type: 'success', 
                    message: 'All players ready! Tournament can now start.' 
                })
            }
        } catch (err) {
            console.error('Error setting ready status:', err)
            toast.addMessage({ type: 'error', message: 'Failed to update ready status' })
        }
    }

    // Start the tournament (host only)
    const startTournament = async (tournamentId: string) => {
        if (!currentTournament.value || !isHost.value || !canStartTournament.value) {
            throw new Error('Cannot start tournament')
        }

        try {
            isLoading.value = true

            // Generate initial bracket or group structure
            let brackets: BracketMatch[] = []
            let groupStandings: GroupStanding[] = []

            if (currentTournament.value.mode === 'bracket') {
                brackets = generateBracketStructure(currentTournament.value)
            } else {
                groupStandings = generateGroupStandings(currentTournament.value)
            }

            await updateDoc(doc(db, 'tournaments', tournamentId), {
                status: 'active',
                currentRound: 1,
                brackets,
                groupStandings,
                updatedAt: Timestamp.now()
            })

            toast.addMessage({ 
                type: 'success', 
                message: 'Tournament started! Generating first round...' 
            })

            // Start first round
            await generateNextRound(tournamentId)
        } catch (err) {
            console.error('Error starting tournament:', err)
            toast.addMessage({ type: 'error', message: 'Failed to start tournament' })
        } finally {
            isLoading.value = false
        }
    }

    // Generate bracket structure for knockout tournaments
    const generateBracketStructure = (tournament: Tournament): BracketMatch[] => {
        const players = [...tournament.players]
        const matches: BracketMatch[] = []

        // Shuffle players for random seeding
        for (let i = players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [players[i], players[j]] = [players[j], players[i]]
        }

        // Generate first round matches based on player count
        const matchCount = Math.floor(players.length / 2)
        
        for (let i = 0; i < matchCount; i++) {
            const player1 = players[i * 2]
            const player2 = players[i * 2 + 1]
            
            // Randomly decide home side
            const homePlayerId = Math.random() < 0.5 ? player1.id : player2.id

            matches.push({
                id: `round1-match${i + 1}`,
                round: 1,
                position: `match${i + 1}`,
                player1Id: player1.id,
                player2Id: player2.id,
                homePlayerId,
                completed: false
            })
        }

        return matches
    }

    // Generate group standings for round-robin tournaments
    const generateGroupStandings = (tournament: Tournament): GroupStanding[] => {
        return tournament.players.map(player => ({
            playerId: player.id,
            playerName: player.name,
            points: 0,
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            legsWon: 0,
            legsLost: 0,
            legDifference: 0,
            bonusPoints: 0,
            total180s: 0,
            total170s: 0,
            totalBullCheckouts: 0
        }))
    }

    // Generate round pairings for group mode
    const generateRoundPairings = (tournament: Tournament, round: number): RoundPairing[] => {
        const players = tournament.players
        const pairings: RoundPairing[] = []

        // Round-robin algorithm
        if (players.length % 2 === 1) {
            // Add a "bye" player for odd numbers
            players.push({ id: 'bye', name: 'Bye' } as TournamentPlayer)
        }

        const rounds = players.length - 1
        const half = players.length / 2

        for (let roundIndex = 0; roundIndex < rounds; roundIndex++) {
            if (roundIndex + 1 === round) {
                for (let i = 0; i < half; i++) {
                    const player1Index = i
                    const player2Index = players.length - 1 - i

                    const player1 = players[player1Index]
                    const player2 = players[player2Index]

                    if (player1.id !== 'bye' && player2.id !== 'bye') {
                        // Randomly decide home side
                        const homePlayerId = Math.random() < 0.5 ? player1.id : player2.id

                        pairings.push({
                            player1Id: player1.id,
                            player2Id: player2.id,
                            player1Name: player1.name,
                            player2Name: player2.name,
                            homePlayerId,
                            roundNumber: round
                        })
                    }
                }
                break
            }

            // Rotate players for next round (keep first player fixed)
            const temp = players[1]
            for (let i = 1; i < players.length - 1; i++) {
                players[i] = players[i + 1]
            }
            players[players.length - 1] = temp
        }

        return pairings
    }

    // Generate next round of games
    const generateNextRound = async (tournamentId: string) => {
        if (!currentTournament.value) return

        try {
            const tournament = currentTournament.value
            let pairings: RoundPairing[] = []

            if (tournament.mode === 'group') {
                pairings = generateRoundPairings(tournament, tournament.currentRound)
            } else {
                // Bracket mode - advance winners from previous round
                // TODO: Implement bracket advancement logic
            }

            // Create games for each pairing
            const gamePromises = pairings.map(pairing => 
                createTournamentGame(tournamentId, pairing)
            )

            await Promise.all(gamePromises)

            await updateDoc(doc(db, 'tournaments', tournamentId), {
                roundInProgress: true,
                updatedAt: Timestamp.now()
            })

            toast.addMessage({ 
                type: 'success', 
                message: `Round ${tournament.currentRound} started!` 
            })
        } catch (err) {
            console.error('Error generating next round:', err)
            toast.addMessage({ type: 'error', message: 'Failed to generate next round' })
        }
    }

    // Create a tournament game
    const createTournamentGame = async (tournamentId: string, pairing: RoundPairing) => {
        try {
            console.log('🏆 Creating tournament game for pairing:', pairing);
            
            if (!currentTournament.value) {
                throw new Error('Tournament not found');
            }
            
            const tournament = currentTournament.value;
            const player1 = tournament.players.find(p => p.id === pairing.player1Id);
            const player2 = tournament.players.find(p => p.id === pairing.player2Id);
            
            if (!player1 || !player2) {
                throw new Error('Players not found in tournament');
            }
            
            // Import the useFirebaseDartsGame composable
            const { createGame } = useFirebaseDartsGame();
            
            // Create a game with tournament settings
            const result = await createGame({
                gameType: tournament.gameType || 'x01',
                legsToWin: tournament.legsToWin || 3,
                setsToWin: tournament.setsToWin || 1,
                startingScore: 501,
                tournamentId: tournamentId,
                skipGameCode: true // Skip game code for tournament games
            });
            
            // Handle different return types from createGame
            const gameId = typeof result === 'string' ? 
                result : 
                (result && 'gameId' in result && result.gameId) || null;
            
            if (!gameId) {
                const errorMsg = typeof result !== 'string' && 'error' in result ? result.error : 'Unknown error';
                throw new Error('Failed to create game: ' + errorMsg);
            }
            
            console.log('🏆 Created tournament game with ID:', gameId);
            
            // Add tournament context to game
            await linkTournamentToGame(gameId, tournamentId, {
                mode: tournament.mode,
                round: tournament.currentRound,
                player1Id: pairing.player1Id,
                player2Id: pairing.player2Id,
                homePlayerId: pairing.homePlayerId,
                matchId: pairing.roundNumber ? `round${pairing.roundNumber}-match${Math.random().toString(36).substring(2, 7)}` : undefined
            });
            
            // Add the game ID to tournament's active games list
            const updatedGames = [...(tournament.games || []), gameId];
            
            await updateDoc(doc(db, 'tournaments', tournamentId), {
                games: updatedGames,
                updatedAt: serverTimestamp()
            });
            
            console.log('🏆 Added game to tournament:', gameId);
            
            return gameId;
        } catch (err) {
            console.error('❌ Failed to create tournament game:', err);
            toast.addMessage({
                type: 'error',
                message: 'Failed to create tournament game'
            });
            throw err;
        }
    }

    // Handle tournament game completion
    const completeTournamentGame = async (gameResult: TournamentGameResult) => {
        // TODO: Update tournament standings and check for round completion
        console.log('Tournament game completed:', gameResult)
    }

    // Clear tournament state
    const clearTournament = () => {
        currentTournament.value = null
        error.value = null
        tournamentGames.value = []
    }

    // Show spin wheel for player pairing
    const showPlayerPairingSpin = (players: TournamentPlayer[], roundNumber: number) => {
        spinWheelProps.value = {
            players,
            spinType: 'pairing',
            roundNumber
        }
        showSpinWheel.value = true
    }

    // Show spin wheel for home side determination
    const showHomeSideSpin = (player1: TournamentPlayer, player2: TournamentPlayer) => {
        spinWheelProps.value = {
            players: [player1, player2],
            spinType: 'home-side',
            existingPairing: { player1, player2 }
        }
        showSpinWheel.value = true
    }

    // Handle spin wheel result
    const handleSpinResult = (result: RoundPairing[] | TournamentPlayer) => {
        showSpinWheel.value = false
        
        if (Array.isArray(result)) {
            // Round pairings result
            handleRoundPairings(result)
        } else {
            // Home side result
            console.log('Home side selected:', result)
            // TODO: Handle home side selection
        }
        
        spinWheelProps.value = null
    }

    // Handle round pairings from spin wheel
    const handleRoundPairings = async (pairings: RoundPairing[]) => {
        if (!currentTournament.value) return

        try {
            // Create games for each pairing
            const gamePromises = pairings.map(pairing => 
                createTournamentGame(currentTournament.value!.id, pairing)
            )

            await Promise.all(gamePromises)

            await updateDoc(doc(db, 'tournaments', currentTournament.value.id), {
                roundInProgress: true,
                updatedAt: Timestamp.now()
            })

            toast.addMessage({ 
                type: 'success', 
                message: `Round ${currentTournament.value.currentRound} games created!` 
            })
        } catch (err) {
            console.error('Error creating round games:', err)
            toast.addMessage({ type: 'error', message: 'Failed to create round games' })
        }
    }

    // Update spinner state in tournament document
    const updateSpinnerState = async (tournamentId: string, spinnerState: { isSpinning: boolean, spinType: 'pairing' | 'home-side' | 'idle', roundNumber?: number }): Promise<void> => {
        try {
            await updateDoc(doc(db, 'tournaments', tournamentId), {
                spinnerState,
                updatedAt: Timestamp.now()
            })
        } catch (err) {
            console.error('Error updating spinner state:', err)
        }
    }

    // Start spinner for all players
    const startSpinnerForAll = async (tournamentId: string, spinType: 'pairing' | 'home-side', roundNumber?: number): Promise<void> => {
        await updateSpinnerState(tournamentId, {
            isSpinning: true,
            spinType,
            roundNumber
        })
    }

    // Stop spinner for all players
    const stopSpinnerForAll = async (tournamentId: string): Promise<void> => {
        await updateSpinnerState(tournamentId, {
            isSpinning: false,
            spinType: 'idle'
        })
    }

    // Get tournament by ID
    const getTournament = async (tournamentId: string): Promise<Tournament | null> => {
        try {
            isLoading.value = true
            error.value = null
            
            const docRef = doc(db, 'tournaments', tournamentId)
            const docSnap = await getDoc(docRef)
            
            if (docSnap.exists()) {
                const tournament = {
                    id: docSnap.id,
                    ...docSnap.data()
                } as Tournament
                
                // Update the composable state
                currentTournament.value = tournament
                
                return tournament
            } else {
                error.value = 'Tournament not found'
                return null
            }
        } catch (err) {
            console.error('Error getting tournament:', err)
            error.value = err instanceof Error ? err.message : 'Failed to load tournament'
            return null
        } finally {
            isLoading.value = false
        }
    }

    // Add tournament game result when a game finishes
    const updateTournamentGameResult = async (gameId: string, gameResult: {
        winnerId: string
        loserId: string
        winnerLegs: number
        loserLegs: number
        winnerSets: number
        loserSets: number
        winner180s: number
        loser180s: number
        winner170s: number
        loser170s: number
        winnerBullCheckouts: number
        loserBullCheckouts: number
    }) => {
        console.log('🏆 updateTournamentGameResult called with game ID:', gameId)
        console.log('🏆 Game result data:', JSON.stringify(gameResult))
        
        if (!currentTournament.value) {
            console.error('❌ No current tournament found in updateTournamentGameResult')
            return
        }
        
        console.log('🏆 Current tournament ID:', currentTournament.value.id)

        try {
            const tournament = currentTournament.value
            const db = getFirestore()
            
            if (!tournament) {
                console.error('❌ Tournament not found in state')
                throw new Error('Tournament not found in state')
            }
            
            if (!tournament.bonusPoints) {
                console.error('❌ Tournament bonus points configuration is missing')
                // Use default values if missing
                tournament.bonusPoints = {
                    enable180s: true,
                    enable170s: true,
                    enableBullCheckout: true,
                    points180: 2,
                    points170: 2,
                    pointsBullCheckout: 1
                }
            }
            
            // Calculate bonus points with proper null/undefined checks
            const winnerBonusPoints = 
                ((gameResult.winner180s || 0) * (tournament.bonusPoints.points180 || 0)) +
                ((gameResult.winner170s || 0) * (tournament.bonusPoints.points170 || 0)) +
                ((gameResult.winnerBullCheckouts || 0) * (tournament.bonusPoints.pointsBullCheckout || 0))
            
            const loserBonusPoints = 
                ((gameResult.loser180s || 0) * (tournament.bonusPoints.points180 || 0)) +
                ((gameResult.loser170s || 0) * (tournament.bonusPoints.points170 || 0)) +
                ((gameResult.loserBullCheckouts || 0) * (tournament.bonusPoints.pointsBullCheckout || 0))

            // Calculate main points (3 for win, 1 for losing with at least one leg won, 0 otherwise)
            const winnerMainPoints = 3
            const loserMainPoints = gameResult.loserLegs > 0 ? 1 : 0
            
            const totalWinnerPoints = winnerMainPoints + winnerBonusPoints
            const totalLoserPoints = loserMainPoints + loserBonusPoints

            // Ensure tournament.players exists and is an array
            if (!tournament.players || !Array.isArray(tournament.players)) {
                console.error('❌ Tournament players array is invalid:', tournament.players)
                throw new Error('Invalid tournament player data')
            }
            
            // Update players' tournament stats with proper null/undefined checks
            const updatedPlayers = tournament.players.map(player => {
                if (player.id === gameResult.winnerId) {
                    return {
                        ...player,
                        points: (player.points || 0) + totalWinnerPoints,
                        gamesWon: (player.gamesWon || 0) + 1,
                        legsWon: (player.legsWon || 0) + (gameResult.winnerLegs || 0),
                        legsLost: (player.legsLost || 0) + (gameResult.loserLegs || 0),
                        bonusPoints: (player.bonusPoints || 0) + winnerBonusPoints
                    }
                } else if (player.id === gameResult.loserId) {
                    return {
                        ...player,
                        points: (player.points || 0) + totalLoserPoints,
                        gamesLost: (player.gamesLost || 0) + 1,
                        legsWon: (player.legsWon || 0) + (gameResult.loserLegs || 0),
                        legsLost: (player.legsLost || 0) + (gameResult.winnerLegs || 0),
                        bonusPoints: (player.bonusPoints || 0) + loserBonusPoints
                    }
                }
                return player
            })

            // Move game from active to completed, ensuring arrays exist
            const games = Array.isArray(tournament.games) ? tournament.games : []
            const completedGames = Array.isArray(tournament.completedGames) ? tournament.completedGames : []
            
            const updatedGames = games.filter(id => id !== gameId)
            const updatedCompletedGames = [...completedGames, gameId]
            
            console.log('🏆 Moving game from active to completed')
            console.log('🏆 Active games before:', games.length, 'After:', updatedGames.length)
            console.log('🏆 Completed games before:', completedGames.length, 'After:', updatedCompletedGames.length)

            // Check if round is complete (all games finished)
            const roundComplete = updatedGames.length === 0 && tournament.roundInProgress

            // Create tournament game result record
            const tournamentGameResult: TournamentGameResult = {
                gameId,
                tournamentId: tournament.id,
                winnerId: gameResult.winnerId,
                loserId: gameResult.loserId,
                winnerLegs: gameResult.winnerLegs,
                loserLegs: gameResult.loserLegs,
                winnerSets: gameResult.winnerSets,
                loserSets: gameResult.loserSets,
                winner180s: gameResult.winner180s || 0,
                loser180s: gameResult.loser180s || 0,
                winner170s: gameResult.winner170s || 0,
                loser170s: gameResult.loser170s || 0,
                winnerBullCheckouts: gameResult.winnerBullCheckouts || 0,
                loserBullCheckouts: gameResult.loserBullCheckouts || 0,
                winnerPoints: totalWinnerPoints,
                loserPoints: totalLoserPoints,
                timestamp: serverTimestamp() // Add a timestamp for sorting
            }

            // Update tournament document
            const updateData: any = {
                players: updatedPlayers,
                games: updatedGames,
                completedGames: updatedCompletedGames,
                updatedAt: serverTimestamp() // Use serverTimestamp instead of client-side Timestamp
            }

            // If round is complete, update round status and check for tournament completion
            if (roundComplete) {
                updateData.roundInProgress = false
                updateData.allPlayersReady = false // Reset ready status for next round

                // Check if tournament is complete or needs to advance
                if (tournament.mode === 'group') {
                    // In group mode, check if we've completed all rounds
                    const totalPlayers = tournament.players.length
                    const totalRounds = totalPlayers - 1 // Each player plays every other player once
                    
                    if (tournament.currentRound >= totalRounds) {
                        updateData.status = 'completed'
                        toast.addMessage({ 
                            type: 'success', 
                            message: 'Tournament completed!' 
                        })
                    } else {
                        // Schedule advancement to next round after a short delay
                        setTimeout(() => {
                            advanceToNextRound(tournament.id)
                        }, 3000) // 3 second delay
                    }
                } else if (tournament.mode === 'bracket') {
                    // In bracket mode, check if we've reached the final
                    const activePlayers = tournament.players.filter(p => !p.eliminated)
                    if (activePlayers.length <= 1) {
                        updateData.status = 'completed'
                        toast.addMessage({ 
                            type: 'success', 
                            message: 'Tournament completed!' 
                        })
                    } else {
                        // Schedule advancement to next round after a short delay
                        setTimeout(() => {
                            advanceToNextRound(tournament.id)
                        }, 3000) // 3 second delay
                    }
                }
            }

            console.log('🏆 Updating tournament document:', tournament.id)
            console.log('🏆 Update data:', JSON.stringify(updateData))
            
            // Ensure the data doesn't contain any invalid values that Firestore can't handle
            // Convert any non-serializable objects to proper format and explicitly set any fields that might be undefined
            const sanitizedUpdateData = JSON.parse(JSON.stringify(updateData))
            
            // Make sure games arrays are valid
            if (!Array.isArray(sanitizedUpdateData.games)) {
                sanitizedUpdateData.games = [];
            }
            
            if (!Array.isArray(sanitizedUpdateData.completedGames)) {
                sanitizedUpdateData.completedGames = [];
            }
            
            // Ensure players array has valid data
            if (!Array.isArray(sanitizedUpdateData.players)) {
                console.error('❌ Players array is invalid', sanitizedUpdateData.players);
                sanitizedUpdateData.players = tournament.players || [];
            }
            
            // Fix any players with undefined values
            sanitizedUpdateData.players = sanitizedUpdateData.players.map((player: any) => ({
                id: player.id,
                name: player.name || 'Unknown Player',
                isReady: Boolean(player.isReady),
                isHost: Boolean(player.isHost),
                points: Number(player.points || 0),
                gamesWon: Number(player.gamesWon || 0),
                gamesLost: Number(player.gamesLost || 0),
                legsWon: Number(player.legsWon || 0),
                legsLost: Number(player.legsLost || 0),
                bonusPoints: Number(player.bonusPoints || 0)
            }));
            
            try {
                // Update the tournament document
                console.log('🏆 Sending sanitized update data to Firestore');
                console.log('🏆 Tournament ID:', tournament.id);
                console.log('🏆 Update data structure:', Object.keys(sanitizedUpdateData).join(', '));
                console.log('🏆 Players count:', sanitizedUpdateData.players?.length || 0);
                console.log('🏆 Games array:', sanitizedUpdateData.games);
                console.log('🏆 Completed games array:', sanitizedUpdateData.completedGames);
                
                // Check for any potentially problematic values in the update
                for (const key in sanitizedUpdateData) {
                    const value = sanitizedUpdateData[key];
                    if (value === undefined) {
                        console.warn('⚠️ Found undefined value for key:', key);
                        sanitizedUpdateData[key] = null; // Replace with null for Firestore compatibility
                    }
                    if (value === null) {
                        console.warn('⚠️ Found null value for key:', key);
                    }
                }
                
                // Ensure that arrays are properly defined
                sanitizedUpdateData.games = Array.isArray(sanitizedUpdateData.games) ? 
                    sanitizedUpdateData.games : [];
                sanitizedUpdateData.completedGames = Array.isArray(sanitizedUpdateData.completedGames) ? 
                    sanitizedUpdateData.completedGames : [];
                
                const fullySanitizedData = deepSanitize(sanitizedUpdateData);
                console.log('🏆 Final sanitized data ready for Firestore:', 
                    JSON.stringify(fullySanitizedData, null, 2).substring(0, 500) + '...');
                
                await updateDoc(doc(db, 'tournaments', tournament.id), fullySanitizedData);
                console.log('✅ Tournament document updated successfully');
            } catch (err) {
                console.error('❌ Failed to update tournament document:', err);
                console.error('❌ Error details:', err instanceof Error ? err.message : 'Unknown error');
                console.error('❌ Error name:', err instanceof Error ? err.name : 'Unknown error type');
                console.error('❌ Update data that caused error:', JSON.stringify(sanitizedUpdateData, null, 2));
                throw err;
            }
            
            // Sanitize the tournament game result data and ensure all fields have proper values
            const basicSanitizedGameResult = {
                ...JSON.parse(JSON.stringify(tournamentGameResult)),
                timestamp: serverTimestamp(),
                winner180s: Number(tournamentGameResult.winner180s || 0),
                loser180s: Number(tournamentGameResult.loser180s || 0),
                winner170s: Number(tournamentGameResult.winner170s || 0),
                loser170s: Number(tournamentGameResult.loser170s || 0),
                winnerBullCheckouts: Number(tournamentGameResult.winnerBullCheckouts || 0),
                loserBullCheckouts: Number(tournamentGameResult.loserBullCheckouts || 0),
                winnerPoints: Number(tournamentGameResult.winnerPoints || 0),
                loserPoints: Number(tournamentGameResult.loserPoints || 0)
            };
            
            // Apply deep sanitization to ensure Firestore compatibility
            const sanitizedGameResult = deepSanitize(basicSanitizedGameResult);
            
            // Create a minimal version of the game result to avoid nested data issues
            const minimalGameResult: Record<string, any> = {
                gameId: sanitizedGameResult.gameId,
                tournamentId: sanitizedGameResult.tournamentId,
                winnerId: sanitizedGameResult.winnerId,
                loserId: sanitizedGameResult.loserId,
                winnerLegs: sanitizedGameResult.winnerLegs,
                loserLegs: sanitizedGameResult.loserLegs,
                winnerSets: sanitizedGameResult.winnerSets,
                loserSets: sanitizedGameResult.loserSets,
                winner180s: Number(sanitizedGameResult.winner180s || 0),
                loser180s: Number(sanitizedGameResult.loser180s || 0),
                winner170s: Number(sanitizedGameResult.winner170s || 0),
                loser170s: Number(sanitizedGameResult.loser170s || 0),
                winnerBullCheckouts: Number(sanitizedGameResult.winnerBullCheckouts || 0),
                loserBullCheckouts: Number(sanitizedGameResult.loserBullCheckouts || 0),
                winnerPoints: Number(sanitizedGameResult.winnerPoints || 0),
                loserPoints: Number(sanitizedGameResult.loserPoints || 0),
                timestamp: serverTimestamp()
            };
            
            try {
                console.log('🏆 Adding tournament result document');
                console.log('🏆 Tournament result data structure:', Object.keys(minimalGameResult).join(', '));
                
                // Validate the minimalGameResult object
                if (!minimalGameResult.gameId) {
                    console.error('❌ Missing gameId in tournament result data');
                }
                if (!minimalGameResult.tournamentId) {
                    console.error('❌ Missing tournamentId in tournament result data');
                }
                if (!minimalGameResult.winnerId) {
                    console.error('❌ Missing winnerId in tournament result data');
                }
                
                // Check for any potentially problematic values
                for (const key in minimalGameResult) {
                    const value = minimalGameResult[key];
                    if (value === undefined) {
                        console.warn('⚠️ Found undefined value for key in result document:', key);
                        minimalGameResult[key] = null; // Replace with null for Firestore compatibility
                    }
                }
                
                // Store the detailed game result with minimal structure
                const resultRef = await addDoc(collection(db, 'tournament_results'), minimalGameResult);
                console.log('✅ Tournament result document added with ID:', resultRef.id);
                console.log('✅ Successfully stored tournament result document for gameId:', minimalGameResult.gameId);
            } catch (err) {
                console.error('❌ Failed to add tournament result document:', err);
                console.error('❌ Error details:', err instanceof Error ? err.message : 'Unknown error');
                console.error('❌ Error name:', err instanceof Error ? err.name : 'Unknown error type');
                console.error('❌ Result data that caused error:', JSON.stringify(minimalGameResult, null, 2));
                
                // Log the key details that might cause issues
                console.error('❌ Critical fields check:');
                console.error('❌ gameId type:', typeof minimalGameResult.gameId, 'value:', minimalGameResult.gameId);
                console.error('❌ tournamentId type:', typeof minimalGameResult.tournamentId, 'value:', minimalGameResult.tournamentId);
                console.error('❌ winnerId type:', typeof minimalGameResult.winnerId, 'value:', minimalGameResult.winnerId);
                throw err;
            }

            // Get winner name for toast message
            const winnerName = updatedPlayers.find(p => p.id === gameResult.winnerId)?.name || 'Unknown player'
            console.log('🏆 Game result recorded for tournament. Winner:', winnerName)

            toast.addMessage({ 
                type: 'success', 
                message: `Game result recorded! ${winnerName} wins!` 
            })

        } catch (err) {
            console.error('Error updating tournament game result:', err)
            toast.addMessage({ 
                type: 'error', 
                message: 'Failed to update tournament result' 
            })
        }
    }

    // Link tournament context to games
    const linkTournamentToGame = async (gameId: string, tournamentId: string, context: {
        mode: 'bracket' | 'group'
        round?: number
        matchId?: string
        player1Id: string
        player2Id: string
        homePlayerId: string
    }): Promise<void> => {
        try {
            console.log('🏆 Linking tournament context to game:', gameId);
            console.log('🏆 Setting homePlayerId for first throw:', context.homePlayerId);
            
            // Get the current players array from the game
            const gameDoc = await getDoc(doc(db, 'games', gameId));
            if (!gameDoc.exists()) {
                throw new Error('Game not found');
            }
            
            const gameData = gameDoc.data();
            
            // Find which player index corresponds to the homePlayerId
            let firstPlayerIndex = -1;
            if (gameData.players && Array.isArray(gameData.players)) {
                firstPlayerIndex = gameData.players.findIndex((p: any) => p.id === context.homePlayerId);
                console.log('🏆 First player index:', firstPlayerIndex);
            }
            
            // Add tournament context to the game document
            await updateDoc(doc(db, 'games', gameId), {
                tournamentId,
                tournamentContext: context,
                currentPlayerIndex: firstPlayerIndex >= 0 ? firstPlayerIndex : 0, // Set who throws first
                updatedAt: serverTimestamp()
            })
        } catch (err) {
            console.error('Error linking tournament to game:', err)
            throw err
        }
    }
    
    // Get tournament analytics data
    const getTournamentAnalytics = async (tournamentId: string) => {
        try {
            const tournament = await getTournament(tournamentId)
            if (!tournament) throw new Error('Tournament not found')

            // Calculate various statistics
            const totalGames = tournament.completedGames.length
            const averageGameTime = 0 // Would need to calculate from game data
            const totalThrows = 0 // Would need to aggregate from games
            const highestFinish = 0 // Would need to find from games
            
            const playerStats = tournament.players.map((player: TournamentPlayer) => ({
                ...player,
                winRate: player.gamesWon / (player.gamesWon + player.gamesLost) * 100 || 0,
                averageScore: 0, // Would calculate from games
                highestFinish: 0 // Would find from games
            }))

            return {
                tournament,
                totalGames,
                averageGameTime,
                totalThrows,
                highestFinish,
                playerStats
            }
        } catch (err) {
            console.error('Error getting tournament analytics:', err)
            throw err
        }
    }

    // Calculate spinner result (host only)
    const calculateSpinnerResult = (tournament: Tournament, spinType: 'pairing' | 'home-side'): any => {
        if (spinType === 'pairing') {
            // Generate random pairings
            const players = [...tournament.players]
            const pairings: RoundPairing[] = []
            
            // Shuffle players for random pairing
            for (let i = players.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [players[i], players[j]] = [players[j], players[i]]
            }
            
            // Create pairings
            for (let i = 0; i < players.length; i += 2) {
                if (i + 1 < players.length) {
                    const player1 = players[i]
                    const player2 = players[i + 1]
                    const homePlayerId = Math.random() < 0.5 ? player1.id : player2.id
                    
                    pairings.push({
                        player1Id: player1.id,
                        player2Id: player2.id,
                        player1Name: player1.name,
                        player2Name: player2.name,
                        homePlayerId,
                        roundNumber: tournament.currentRound || 1
                    })
                }
            }
            
            return pairings
        } else {
            // Select random player for home side
            const randomIndex = Math.floor(Math.random() * tournament.players.length)
            return tournament.players[randomIndex]
        }
    }

    // Start spinner with pre-calculated result (host only)
    const startSpinnerWithResult = async (tournamentId: string, spinType: 'pairing' | 'home-side', roundNumber?: number): Promise<any> => {
        const tournament = currentTournament.value
        if (!tournament) throw new Error('Tournament not found')
        
        // Calculate result on host side
        const result = calculateSpinnerResult(tournament, spinType)
        
        // Store result and start spinner for all players
        const tournamentRef = doc(db, 'tournaments', tournamentId)
        await updateDoc(tournamentRef, {
            spinnerState: {
                isSpinning: true,
                spinType,
                roundNumber,
                result
            },
            updatedAt: Timestamp.now()
        })
        
        return result
    }

    // Update spinner state with result
    const updateSpinnerStateWithResult = async (tournamentId: string, result: any): Promise<void> => {
        const tournamentRef = doc(db, 'tournaments', tournamentId)
        
        try {
            await updateDoc(tournamentRef, {
                'spinnerState.result': result,
                updatedAt: serverTimestamp()
            })
        } catch (err) {
            console.error('Error updating spinner result:', err)
        }
    }

    // Advance to next round after all games are complete
    const advanceToNextRound = async (tournamentId: string) => {
        if (!currentTournament.value) return

        try {
            const tournament = currentTournament.value
            const db = getFirestore()
            
            // For group tournaments, advance to next round if not at max rounds
            if (tournament.mode === 'group') {
                const totalPlayers = tournament.players.length
                const maxRounds = totalPlayers - 1 // Each player plays every other player once
                
                if (tournament.currentRound < maxRounds) {
                    const nextRound = tournament.currentRound + 1
                    
                    await updateDoc(doc(db, 'tournaments', tournamentId), {
                        currentRound: nextRound,
                        roundInProgress: false,
                        allPlayersReady: false,
                        updatedAt: serverTimestamp()
                    })
                    
                    toast.addMessage({ 
                        type: 'success', 
                        message: `Round ${nextRound} is ready to begin!` 
                    })
                } else {
                    // Tournament is complete
                    await updateDoc(doc(db, 'tournaments', tournamentId), {
                        status: 'completed',
                        updatedAt: Timestamp.now()
                    })
                    
                    toast.addMessage({ 
                        type: 'success', 
                        message: 'Tournament completed!' 
                    })
                }
            } else if (tournament.mode === 'bracket') {
                // For bracket tournaments, check if we need to advance or complete
                const activePlayers = tournament.players.filter(p => !p.eliminated)
                
                if (activePlayers.length > 1) {
                    // More rounds needed
                    const nextRound = tournament.currentRound + 1
                    
                    await updateDoc(doc(db, 'tournaments', tournamentId), {
                        currentRound: nextRound,
                        roundInProgress: false,
                        allPlayersReady: false,
                        updatedAt: serverTimestamp()
                    })
                    
                    toast.addMessage({ 
                        type: 'success', 
                        message: `Round ${nextRound} is ready to begin!` 
                    })
                } else {
                    // Tournament is complete
                    await updateDoc(doc(db, 'tournaments', tournamentId), {
                        status: 'completed',
                        updatedAt: Timestamp.now()
                    })
                    
                    toast.addMessage({ 
                        type: 'success', 
                        message: 'Tournament completed!' 
                    })
                }
            }
        } catch (err) {
            console.error('Error advancing to next round:', err)
            toast.addMessage({ 
                type: 'error', 
                message: 'Failed to advance to next round' 
            })
        }
    }

    return {
        // State
        currentTournament: readonly(currentTournament),
        isLoading: readonly(isLoading),
        error: readonly(error),
        tournamentGames: readonly(tournamentGames),
        showSpinWheel: readonly(showSpinWheel),
        spinWheelProps: readonly(spinWheelProps),

        // Computed
        isHost,
        currentPlayer,
        canStartTournament,

        // Methods
        createTournament,
        joinTournament,
        subscribeToTournament,
        setPlayerReady,
        startTournament,
        generateNextRound,
        completeTournamentGame,
        clearTournament,
        showPlayerPairingSpin,
        showHomeSideSpin,
        handleSpinResult,
        getTournament,
        updateTournamentGameResult,
        linkTournamentToGame,
        getTournamentAnalytics,
        updateSpinnerState,
        startSpinnerForAll,
        stopSpinnerForAll,
        startSpinnerWithResult,
        updateSpinnerStateWithResult,
        advanceToNextRound
    }
}
