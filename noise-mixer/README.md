# 🎧 Noise Mixer

A production-quality ambient noise mixing web app built with Vite, React, and TypeScript. Features a full-screen looping video background, multiple looping audio stems with individual volume controls, and a premium glassmorphism UI.

## ✨ Features

- **Fullscreen Video Background** – Looping ambient video with WebM/MP4 fallback support
- **Multi-Track Audio Engine** – Web Audio API-based mixing with seamless looping
- **Smooth Volume Controls** – Anti-zipper gain ramping for buttery-smooth adjustments
- **Glassmorphism UI** – Modern backdrop-blur aesthetic with minimal controls
- **Keyboard Shortcuts** – Space (play/pause), M (mute), R (randomize)
- **localStorage Persistence** – Volumes and scene selection saved automatically
- **iOS-Friendly** – Handles autoplay restrictions with unlock overlay
- **Asset Hot-Swap** – Change all media via `/public/assets.json` without touching code
- **Resilient** – Graceful fallbacks if video/audio files are missing

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

The app will run on `http://localhost:5173` (or the next available port).

## 📁 Project Structure

```
noise-mixer/
├── public/
│   ├── assets.json          # ⭐ MEDIA CONFIG (edit this to change assets)
│   ├── audio/               # Place your audio loops here
│   │   └── README.md        # Audio encoding guidelines
│   └── video/               # Place your video loops here
│       └── README.md        # Video encoding guidelines
├── src/
│   ├── audio/
│   │   └── AudioEngine.ts   # Web Audio API logic
│   ├── components/
│   │   ├── ControlPanel.tsx
│   │   ├── UnlockOverlay.tsx
│   │   ├── VideoBackground.tsx
│   │   └── VolumeSlider.tsx
│   ├── config/
│   │   └── loadAssets.ts    # Assets loader & validator
│   ├── hooks/
│   │   └── useLocalStorage.ts
│   ├── types/
│   │   └── assets.ts        # TypeScript type definitions
│   ├── App.tsx              # Main app logic
│   ├── App.css              # All styles (glassmorphism, responsive)
│   └── main.tsx
└── package.json
```

## 🎵 Adding/Replacing Audio

### Step 1: Prepare Your Audio Files

Use looping ambient sounds (MP3, WAV, or OGG format):

- **Duration:** 30 seconds to 5 minutes
- **Bitrate:** 128-192 kbps (MP3)
- **Sample Rate:** 44.1 kHz or 48 kHz
- **Channels:** Stereo or Mono
- **Looping:** Ensure smooth loop points (fade out matches fade in)

**Where to Find Sounds:**
- [freesound.org](https://freesound.org) (free, Creative Commons)
- [mynoise.net](https://mynoise.net) (generate custom soundscapes)
- Create your own with [Audacity](https://www.audacityteam.org/) (free)

### Step 2: Add Files to `/public/audio/`

Example:
```
public/audio/
├── brown.mp3
├── rain.mp3
├── fan.mp3
└── vinyl.mp3
```

### Step 3: Update `/public/assets.json`

```json
{
  "scenes": [
    {
      "id": "default",
      "name": "Deep Focus",
      "background": { ... },
      "tracks": [
        { "id": "brown", "name": "Brown Noise", "src": "/audio/brown.mp3", "defaultVolume": 0.35 },
        { "id": "rain", "name": "Rain", "src": "/audio/rain.mp3", "defaultVolume": 0.20 }
      ]
    }
  ]
}
```

**That's it!** No code changes required. Refresh the browser to load new assets.

## 🎬 Adding/Replacing Video

### Step 1: Prepare Video Files

Provide both WebM and MP4 for maximum browser compatibility.

**Recommended Encoding (using ffmpeg):**

```bash
# MP4 (H.264) - best compatibility
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 22 -vf scale=1920:1080 \
  -c:a aac -b:a 128k -movflags +faststart -t 60 deep-focus.mp4

# WebM (VP9) - smaller file size
ffmpeg -i input.mov -c:v libvpx-vp9 -crf 30 -b:v 0 -vf scale=1920:1080 \
  -c:a libopus -b:a 128k -t 60 deep-focus.webm

# Poster image (shown before video loads)
ffmpeg -i deep-focus.mp4 -ss 00:00:05 -frames:v 1 deep-focus.jpg
```

**Tips:**
- Keep videos under 1080p to minimize file size
- 30-60 seconds is ideal for looping
- Use slow, subtle motion for ambient feel
- Test that loop points are seamless

**Where to Find Videos:**
- [pexels.com/videos](https://www.pexels.com/videos/) (free stock)
- [pixabay.com/videos](https://pixabay.com/videos/) (free stock)
- Shoot your own with a smartphone

### Step 2: Add Files to `/public/video/`

```
public/video/
├── deep-focus.mp4
├── deep-focus.webm
└── deep-focus.jpg
```

### Step 3: Update `/public/assets.json`

```json
{
  "scenes": [
    {
      "id": "default",
      "name": "Deep Focus",
      "background": {
        "poster": "/video/deep-focus.jpg",
        "sources": [
          { "src": "/video/deep-focus.webm", "type": "video/webm" },
          { "src": "/video/deep-focus.mp4", "type": "video/mp4" }
        ]
      },
      "tracks": [ ... ]
    }
  ]
}
```

## 🎨 Multiple Scenes (Optional)

You can define multiple scenes in `assets.json`:

```json
{
  "scenes": [
    {
      "id": "focus",
      "name": "Deep Focus",
      "background": { ... },
      "tracks": [ ... ]
    },
    {
      "id": "sleep",
      "name": "Sleep Mode",
      "background": { ... },
      "tracks": [ ... ]
    }
  ]
}
```

A dropdown will automatically appear in the UI when multiple scenes are defined.

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `M` | Mute/Unmute |
| `R` | Randomize all track volumes |

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm install -g vercel
vercel
```

### Netlify

```bash
npm run build
# Upload the `dist/` folder to Netlify
```

### Static Hosting (any provider)

```bash
npm run build
# Upload the `dist/` folder to your host
```

## 🛠️ Technical Details

### Web Audio API Architecture

- **AudioContext** – Created on first user gesture (iOS requirement)
- **GainNodes** – One per track + master gain for volume control
- **Smooth Ramping** – 100ms linear ramps prevent zipper noise
- **Fade In/Out** – 80ms fades on play/pause for smooth transitions
- **Seamless Looping** – `AudioBufferSourceNode` with `loop: true`

### Performance Optimizations

- Lazy-load audio buffers only after user unlock
- Progressive loading indicators for each track
- Minimal JS bundle (no heavy audio libraries)
- CSS animations with GPU acceleration
- Responsive design with mobile-first approach

### Browser Compatibility

- **Modern browsers:** Full support (Chrome, Firefox, Safari, Edge)
- **iOS Safari:** Requires user gesture to unlock audio (handled automatically)
- **Older browsers:** Graceful degradation with fallback gradient background

## 📝 License

MIT (or whatever license you prefer)

## 🤝 Contributing

Contributions welcome! Feel free to open issues or PRs.

---

**Built with ❤️ using Vite + React + TypeScript + Web Audio API**
