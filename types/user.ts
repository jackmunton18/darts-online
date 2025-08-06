export interface FirestoreUser {
  id: string;             // User ID from Firebase Auth
  firstName: string;      // First name
  lastName: string;       // Last name
  username: string;       // Username (firstName + random 6-digit hash, customizable later)
  email: string;          // Email address
  createdAt: Date;        // Timestamp when user was created
  updatedAt: Date;        // Timestamp when user was last updated
  friends?: string[];     // Array of friend user IDs (for future implementation)
  gameStats?: {           // Game statistics
    gamesPlayed: number;
    gamesWon: number;
    averageScore: number;
    highestScore: number;
    highestCheckout: number;
  };
}

// Helper function to generate a random 6-digit hash
export function generateRandomHash(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Helper function to create a username
export function generateUsername(firstName: string): string {
  const sanitizedFirstName = firstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${sanitizedFirstName}${generateRandomHash()}`;
}
