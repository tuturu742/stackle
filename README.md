# Stackle

A calm, offline toy for a young child on an iPad. Pick fruit and vegetables, stack them
with animals and hats, and place them on a puddle or in a bin. A farm that loops round, from
a cornfield to a sunflower field, with a barn and stable, a picnic with a grill that bakes
pies, a farmhouse, a hen house, a pond with a duck, a swing, a windmill, a hat machine, a
tractor and rain clouds. There are no scores, timers, text or fail states.

Play: https://tuturu742.github.io/stackle/

## Develop

```sh
npm install
npm run dev      # also served on your LAN, so you can open it on the iPad
npm run build    # typecheck and build to dist/
```

Pushing to `main` deploys to GitHub Pages.

## Install on the iPad

Open the address in Safari, tap Share, then Add to Home Screen. After the first launch
it works offline, and the farm is kept as it was left. Each launch while online picks up
the newest version.

## Parent controls

Hold a finger still in the top-left corner for three seconds. Icons: sound on or off,
reduce motion, start the farm again (hold), close.
