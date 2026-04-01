// Expose the Express app exported from the server entrypoint for Vercel
// In this monorepo, the server is defined in server.ts and compiled to server.js
// at build time. Importing from the TS source (../server) lets the bundler resolve correctly
// across dev and prod environments.
export { default } from '../server';
