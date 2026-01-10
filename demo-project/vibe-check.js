#!/usr/bin/env node

/**
 * 🌊 VIBE CHECK - Interactive Project Idea Generator
 *
 * This was vibe-coded in real-time to demonstrate the process!
 *
 * The journey:
 * 1. Idea: "Something interactive that suggests what to build"
 * 2. Started with simple prompts
 * 3. Added project suggestions based on mood
 * 4. Made it fun with emojis and personality
 * 5. Shipped it (you're reading it now!)
 *
 * Time: ~20 minutes
 * Refactors: 0
 * Regrets: 0
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Project suggestions by vibe
const projectsByVibe = {
  energized: [
    { name: "Real-time Chat App", reason: "You've got energy - build something interactive!" },
    { name: "Arcade Game Clone", reason: "Channel that energy into a fast-paced project" },
    { name: "Live Data Dashboard", reason: "Build something that moves and updates" }
  ],
  creative: [
    { name: "ASCII Art Generator", reason: "Perfect for creative exploration" },
    { name: "Generative Art Tool", reason: "Make something visually interesting" },
    { name: "Random Story Generator", reason: "Combine creativity with code" }
  ],
  chill: [
    { name: "Pomodoro Timer", reason: "Simple, useful, satisfying to build" },
    { name: "Markdown Blog", reason: "Relaxed pace, clear goal" },
    { name: "Personal Wiki", reason: "Build as you go, no pressure" }
  ],
  curious: [
    { name: "API Explorer", reason: "Learn by connecting to new APIs" },
    { name: "Data Visualizer", reason: "Explore datasets in cool ways" },
    { name: "Web Scraper", reason: "Discover what data you can extract" }
  ],
  chaotic: [
    { name: "Discord Bot with Random Features", reason: "Embrace the chaos!" },
    { name: "Website That Does Random Things", reason: "No plan, just vibes" },
    { name: "Meme Generator", reason: "Chaotic energy = perfect for memes" }
  ],
  focused: [
    { name: "CLI Tool for Your Workflow", reason: "Solve a real problem" },
    { name: "Task Automation Script", reason: "Build something productive" },
    { name: "Code Snippet Manager", reason: "Practical and achievable" }
  ]
};

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
}

function getRandomProject(vibe) {
  const projects = projectsByVibe[vibe];
  return projects[Math.floor(Math.random() * projects.length)];
}

async function vibeCheck() {
  console.log('\n🌊 VIBE CHECK 🌊\n');
  console.log('Let\'s find the perfect project for your current energy.\n');

  const mood = await ask('How are you feeling right now?\n(energized/creative/chill/curious/chaotic/focused): ');

  if (!projectsByVibe[mood]) {
    console.log('\n🤔 Hmm, I don\'t know that vibe.');
    console.log('Let\'s just build whatever feels right!\n');
    rl.close();
    return;
  }

  const project = getRandomProject(mood);

  console.log('\n✨ Perfect! Here\'s your vibe-matched project:\n');
  console.log(`📦 ${project.name}`);
  console.log(`💭 ${project.reason}\n`);

  const ready = await ask('Ready to start? (yes/no/gimme another): ');

  if (ready.startsWith('y')) {
    console.log('\n🚀 LET\'S GOOOO!\n');
    console.log('Steps to vibe code this:');
    console.log('1. mkdir my-project && cd my-project');
    console.log('2. touch index.js (or .py, .html, whatever)');
    console.log('3. Start coding - don\'t overthink it');
    console.log('4. Make it work');
    console.log('5. Ship it\n');
    console.log('Good luck! 🌊\n');
  } else if (ready.includes('another') || ready.includes('gimme')) {
    console.log('\nAlright, different vibe:\n');
    const newProject = getRandomProject(mood);
    console.log(`📦 ${newProject.name}`);
    console.log(`💭 ${newProject.reason}\n`);
    console.log('Now go build one of these! Both if you\'re feeling extra.\n');
  } else {
    console.log('\n👍 That\'s cool! Come back when the vibe is right.\n');
  }

  rl.close();
}

// Handle Ctrl+C gracefully
rl.on('close', () => {
  console.log('\n✌️ Keep vibing!\n');
  process.exit(0);
});

// Run it!
vibeCheck();

/*
VIBE CODING RETROSPECTIVE:

What worked:
✅ Started with a simple idea
✅ Built it incrementally (prompts → suggestions → personality)
✅ Didn't overthink the data structure (object of arrays = fine)
✅ Made it interactive (more fun than just random output)

What I didn't do:
❌ Plan the exact UX flow beforehand
❌ Use a fancy framework
❌ Store data in a database
❌ Add configuration files
❌ Write tests (maybe if this becomes real)

Time saved by vibe coding: ~2 hours of planning/setup
Time to working product: ~20 minutes

That's the power of vibe coding. 🌊
*/
