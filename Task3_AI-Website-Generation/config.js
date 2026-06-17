// =====================================================================
//  config.js  —  Runtime environment bridge
// =====================================================================
/*  HOW IT WORKS:
  • For LOCAL development: manually paste your key below (never commit!).
 • For VERCEL / Netlify: set GROQ_API_KEY in their dashboard and use 
       a server function or build-time injection instead of this file. 
  • This file is listed in .gitignore so it won't be pushed to GitHub. */

window.ENV = {
  GROQ_API_KEY: ''   // ← paste your Groq key here for local dev only
                     //   (this file is in .gitignore — safe locally)
};
