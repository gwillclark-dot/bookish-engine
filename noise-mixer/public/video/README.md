# Video Files Directory

Place your looping background video files here. Provide both WebM and MP4 formats for maximum browser compatibility.

## Expected Files (from assets.json):
- `deep-focus.webm` - Background video in WebM format
- `deep-focus.mp4` - Background video in MP4 format
- `deep-focus.jpg` - Poster image (shows before video loads)

## Recommended Encoding:

### MP4 (H.264):
```bash
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 22 -vf scale=1920:1080 \
  -c:a aac -b:a 128k -movflags +faststart -t 60 deep-focus.mp4
```

### WebM (VP9):
```bash
ffmpeg -i input.mov -c:v libvpx-vp9 -crf 30 -b:v 0 -vf scale=1920:1080 \
  -c:a libopus -b:a 128k -t 60 deep-focus.webm
```

### Poster Image:
```bash
ffmpeg -i deep-focus.mp4 -ss 00:00:05 -frames:v 1 deep-focus.jpg
```

## Tips:
- Keep videos under 1080p to minimize file size
- 30-60 seconds is ideal for looping
- Use slow, subtle motion for best ambient effect
- Compress well to reduce load times
- Test that the loop point is seamless

## Where to Find Ambient Videos:
- pexels.com/videos (free stock videos)
- pixabay.com/videos (free stock videos)
- Shoot your own with a smartphone

## Note:
If video files are missing, the app will display an animated gradient background as a fallback.
