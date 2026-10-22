# Kite Robotics

A Scratch-like block coding platform for kids, built with React, Blockly, and Tailwind CSS. Users drag visual code blocks to program sprites on a stage.

## Features

- **Block coding workspace** — 12 categories: Motion, Looks, Sound, Events, Control, Sensing, Operators, Variables, Functions, Drawing, Game, and Advanced; drag blocks into the workspace and use the delete control to remove selected blocks
- **Live stage** — sprites move, talk, draw, and interact based on blocks; drag sprites on the stage to position them
- **Independent sprite scripts** — the starter code is included only for the initial sprite; newly added sprites open with a blank workspace
- **42 built-in sprites** — humans, animals, fantasy creatures, and fun objects
- **14 backdrops** — Sky, Space, Forest, City, Beach, Underwater, Garden, Desert, Night, Snow, Castle, Rainbow, Stage, and Blank; selecting or uploading one replaces the active backdrop
- **Sensing blocks** — edge/sprite/mouse collision detection, keyboard input, timer
- **Game blocks** — score, health, lives, gravity, jump, levels
- **Lessons panel** — guided tutorials for beginners
- **AI assistant panel** — coding help
- **Gallery** — showcase projects
- **Teacher dashboard** — classroom management
- **Settings, Help, and fullscreen** modes
- **Save / Load / Import / Export** projects

## Getting Started

```bash
npm install
npm run dev
```

Open the provided local URL in your browser.

## Build

```bash
npm run build
```

Output is generated in the `dist/` directory.

## Deploy to GitHub Pages

The repository includes a GitHub Actions workflow that builds and deploys the app to GitHub Pages when changes are pushed to `main`. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

After the first successful deployment, the site will be available at:

https://roboticskite.github.io/kms_ai_Live/

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Blockly (Google's visual programming library)
- Zustand (state management)
- Lucide React (icons)
