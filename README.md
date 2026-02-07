# FrameForge

FrameForge is a turn-based storytelling game where you co-write a short story with Gemini, then turn it into comic panels and a generated video.

## Quick Start

```bash
npm install
cat > .env.local <<'EOF'
GEMINI_API_KEY=your_api_key_here
NEXT_PUBLIC_APP_NAME=FrameForge
EOF
npm run dev
```

Open `http://localhost:3000`.

## Core Capabilities

- Collaborative 4-turn story flow (you pick options, AI adds turns)
- Genre-aware topic and sentence generation
- Comic panel generation from the final story
- Video generation from generated panels with configurable style, duration, aspect ratio, and resolution
- Progress-aware UI for story, image, and video states

## Configuration

Required:

- `GEMINI_API_KEY`: API key used by all server routes (`/api/topics`, `/api/story`, `/api/image`, `/api/video`)

Optional:

- `NEXT_PUBLIC_APP_NAME`: overrides the app label shown in the UI

## Usage

1. Start the app and choose a genre.
2. Pick one of the generated story topics.
3. Play through the sentence selection turns.
4. Wait for comic panels to generate.
5. Choose video settings and generate a short video.
6. Download the final video when generation finishes.

## Contributing and Testing

```bash
npm run lint
npm run build
npm start
```

If you open a PR, include reproducible steps and screenshots or recordings for UI changes.

## Tech Stack

- Next.js App Router + React + TypeScript
- Tailwind CSS + Framer Motion
- Gemini APIs for text, image, and video generation

## License

MIT
