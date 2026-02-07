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

## Capabilities
- Collaborative 4-turn story flow (you pick options, AI adds turns)
- Genre-aware topic and sentence generation
- Comic panel generation from the final story
- Video generation from generated panels with configurable style, duration, aspect ratio, and resolution

## Configuration
- `GEMINI_API_KEY`: Required for related integrations/features.
- `NEXT_PUBLIC_APP_NAME`: Required for related integrations/features.

## Usage
```bash
npm run lint
npm run build
npm start
```

## Contributing and Testing
- Contributions are welcome through pull requests with clear, scoped changes.
- Run the following checks before submitting changes:
```bash
npm run lint
npm run build
```

## License
Licensed under the `MIT` license. See [LICENSE](./LICENSE) for full text.
