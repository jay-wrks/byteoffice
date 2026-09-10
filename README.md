# Byte Office — Structured Direct-Run Source

Byte Office is split into editable HTML-component, CSS, data, engine, UI, robot, audio, feedback, and persistence files while remaining directly runnable from the filesystem.

## Run

Just open `index.html` in Chrome/Chromium/Firefox. No `run.sh`, localhost server, npm, bundler, or build step is required.

On Linux you can simply double-click `index.html`, or run:

```bash
xdg-open index.html
```

## Why the components are `.js`

Browsers block `fetch()` of sibling files when a page is opened with `file://`. To preserve both **direct opening** and **separate components**, each component is a tiny classic JavaScript file that contains only its HTML template. Classic `<script src>` files are allowed from `file://`.

Edit the markup inside these files exactly as you would edit HTML.

## Structure

```text
ByteOffice/
├── index.html
├── components/
│   ├── home.js
│   ├── roadmap.js
│   ├── page-curtain.js
│   ├── game-shell.js
│   ├── mission-panel.js
│   ├── factory-panel.js
│   ├── robot.js
│   ├── program-panel.js
│   └── modal.js
├── css/
│   ├── core.css
│   ├── editor.css
│   ├── screens.css
│   ├── factory.css
│   ├── feedback.css
│   ├── workspaces.css
│   ├── command-tray.css
│   └── robot/
│       ├── physical-boxes.css
│       ├── actions.css
│       ├── body.css
│       ├── locomotion.css
│       ├── carry-system.css
│       ├── materials.css
│       └── expressions.css
├── js/
│   ├── render-components.js
│   ├── core/engine.js
│   ├── data/levels.js
│   └── app/
│       ├── state.js
│       ├── editor.js
│       ├── scene.js
│       ├── robot-actions.js
│       ├── runner-feedback.js
│       ├── settings-audio-navigation.js
│       ├── progression-ui.js
│       └── bindings.js
└── assets/
```

## Editing Byte

- `components/robot.js` — robot HTML structure
- `css/robot/body.css` — robot body
- `css/robot/materials.css` — materials
- `css/robot/expressions.css` — face states
- `css/robot/actions.css` — action poses
- `css/robot/locomotion.css` — walking
- `css/robot/carry-system.css` — hand/box coupling
- `js/app/robot-actions.js` — robot action sequencing

## Important

The stylesheet and script order in `index.html` is deliberate. The game uses classic scripts so the split files continue to share the same global lexical environment as the original monolithic build.
