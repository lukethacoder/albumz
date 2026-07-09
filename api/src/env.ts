// Initialize varlock before any other imports
// This MUST be imported at the top of main.ts before any modules
import 'varlock/auto-load'

// Re-export ENV for use throughout the application
export { ENV } from 'varlock/env'
