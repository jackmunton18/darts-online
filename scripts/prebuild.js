const fs = require('fs')
const path = require('path')

console.log('🔍 Pre-build checks...')

// Check if service account exists (for local builds)
const serviceAccountPath = path.join(process.cwd(), 'server/config/firebase-service-account.json')
if (fs.existsSync(serviceAccountPath)) {
  console.log('✅ Firebase service account found')
} else {
  console.log('⚠️ Firebase service account not found (using env vars)')
}

// Check environment variables
const requiredEnvVars = [
  'NUXT_PUBLIC_FIREBASE_API_KEY',
  'NUXT_PUBLIC_FIREBASE_PROJECT_ID',
  'FIREBASE_PROJECT_ID'
]

let missingVars = []
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    missingVars.push(varName)
  }
})

if (missingVars.length > 0) {
  console.log('❌ Missing environment variables:', missingVars)
  console.log('⚠️ Build may fail without these variables')
} else {
  console.log('✅ Required environment variables found')
}

console.log('✅ Pre-build checks completed')
