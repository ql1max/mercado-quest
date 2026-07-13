# Mercado Quest

A tiny 3D vocabulary game for Spanish speakers learning English. Players read Spanish missions, select matching market objects, reveal the English word, and build a score and streak across quick randomized rounds.

## Stack

- Three.js
- React + TypeScript + Vite
- Cloudflare Workers Static Assets

## Development

```bash
npm install
npm run dev
```

## Music

The in-game playlist starts only after the player begins a mission and follows the existing sound toggle.

- [“Suave Standpipe”](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1500078) by Kevin MacLeod
- [“Bossa Antigua”](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700069) by Kevin MacLeod
- [“Lobby Time”](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600054) by Kevin MacLeod

Licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). The deployed copies are transcoded to 128 kbps MP3 for web delivery; the music is otherwise unchanged.

## Checks and deployment

```bash
npm run lint
npm run build
npm run deploy
```
