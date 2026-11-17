# Stackle

A calm, offline toy for a young child on an iPad. Pick fruit and vegetables, stack them
with animals and hats, and place them on a puddle or in a bin. A farm that loops round, from
a cornfield to a sunflower field, with a barn and stable, a picnic with a grill that bakes
pies, a farmhouse, a hen house, a pond with a duck, a swing, a windmill, a hat machine, a
tractor and rain clouds. The app opens on a row of seasons: swipe to choose one, tap to
go in. Summer is the farm and winter is a snowy town with a sleigh of gifts, stalls, ice columns
to colour with candles, a snow plough and a snow cannon for snowmen, sled hills and an ice rink.
Spring is a park at the edge of a little town, with flower gardens, a frog pond, a playground,
a fountain, an ice-cream cart, a beehive, butterflies, a nest where eggs hatch, a greenhouse, a
bridge over a stream, a kite and a rainbow after rain; autumn is deep in the woods, with an oak and
a squirrel, leaf piles, a tent and a campfire for marshmallows, a log cabin, pumpkins to carve, a
cider press and toadstools that play notes. There are no
scores, timers, text or fail states.

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
it works offline. A season is kept as it was while it is being played, even if the iPad reloads
the app; going back to the row of seasons starts it fresh next time. Each launch while online picks up
the newest version.

## Parent controls

Hold a finger still in the top-left corner for three seconds. In a season, that goes back to
the row of seasons. There, under the parents icon, it opens the controls. Icons: sound on or off,
reduce motion, start every season again (hold), close.
