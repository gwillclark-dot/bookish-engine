#!/usr/bin/env node

/**
 * VIBE CODED IN 5 MINUTES
 * A motivational quote CLI that slaps
 *
 * Vibe Coding Lessons Here:
 * - Started with an array of quotes (hardcoded = fine!)
 * - Made it work first (console.log)
 * - Added colors later (npm chalk)
 * - Could add: API, save favorites, daily quote... later!
 */

const quotes = [
  { text: "Code anything.", author: "The Vibe" },
  { text: "Perfect is the enemy of shipped.", author: "Voltaire (paraphrased)" },
  { text: "Your first draft is supposed to suck.", author: "Everyone Eventually" },
  { text: "Start messy. Refactor never (jk, maybe later).", author: "Vibe Coders" },
  { text: "If it works, it works.", author: "Ancient Dev Proverb" },
  { text: "Build it now, name it later.", author: "README-less Projects" },
  { text: "You don't need permission to create.", author: "You" },
  { text: "Every expert was once a beginner who didn't quit.", author: "Anonymous" },
  { text: "The best time to start was yesterday. The second best time is now.", author: "Also Anonymous" },
  { text: "Make it work, make it right, make it fast. In that order.", author: "Kent Beck" }
];

function getRandomQuote() {
  const random = Math.floor(Math.random() * quotes.length);
  return quotes[random];
}

function displayQuote() {
  const { text, author } = getRandomQuote();

  console.log('\n');
  console.log('  💭  ' + text);
  console.log('      — ' + author);
  console.log('\n');
}

// Run it!
displayQuote();

// NEXT VIBE: Add chalk for colors, add --daily flag, add custom quote input
// But ship this first. It works. It's fine.
