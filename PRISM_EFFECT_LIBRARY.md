# Prism V6.7 Final Frozen Effect Library

Core files are locked:

- index.html
- engines/prism.legacy.engine.js
- styles/prism.css

Future cards must be plugin-only.

## Approved effect types

```text
spotlight          → Numbers / coordinate focus cards
aquarium           → Months
storyTimeline      → Salah Names
timedTileFocus     → Angels
pillarFocus        → Five Pillars
particleField      → generic soft sparkles / bubbles / stars
softPulse          → gentle focus pulse
orbit              → reserved for Allah Names / grouped concepts later
carousel           → reserved for future multi-card sets
```

## Plugin rule

Choose an effect in the plugin JSON:

```json
"effect": {
  "type": "timedTileFocus"
}
```

or:

```json
"effect": {
  "type": "pillarFocus"
}
```

or:

```json
"effect": {
  "type": "spotlight"
}
```

## Controls rule

```json
"controls": "floating"
```

or:

```json
"controls": "fixed"
```

## Development safety

Hide unfinished cards:

```json
"enabled": false
```

Show only when stable:

```json
"enabled": true
```

Optional:

```json
"showOnLanding": false
```

## Do not edit core for normal new cards

For Angels/Pillars/new modules, add:

```text
folder/
  image
  audio optional

plugins/card.plugin.json
```

Then let menu.json regenerate.
