import Matter from 'matter-js';
import { GRAB_SLOP, GROUND_Y, MAX_RELEASE_SPEED, SCREEN_W, STEP, WORLD_H, palette } from './config';
import * as audio from './audio';
import { Splashes } from './fx';
import { Item, drawFruit, type FruitKind } from './objects/fruit';
import { Puddle } from './objects/puddle';
import { Tree } from './objects/tree';
import type { SceneDef } from './scenes/scene';

interface Hold {
  item: Item;
  /** Where the finger is, in world units. */
  x: number;
  y: number;
  /** Offset from the finger to the item centre, so it never jumps when grabbed. */
  dx: number;
  dy: number;
}

interface Sinking {
  kind: FruitKind;
  x: number;
  y: number;
  angle: number;
  age: number;
}

const SINK_SECONDS = 0.3;

export class Game {
  private engine = Matter.Engine.create({ enableSleeping: true });
  private items: Item[] = [];
  private itemsByBody = new Map<number, Item>();
  private trees: Tree[] = [];
  private puddles: Puddle[] = [];
  private puddlesBySensor = new Map<number, Puddle>();
  private holds = new Map<number, Hold>();
  private toSink = new Map<Item, Puddle>();
  private sinking: Sinking[] = [];
  private splashes = new Splashes();
  private walls: Matter.Body[];
  private time = 0;

  // View: world units are scaled to fit the screen, ground anchored at the bottom.
  private scale = 1;
  private camX = 0;
  private camY = 0;
  private viewW = SCREEN_W;
  private viewH = WORLD_H;

  constructor(scene: SceneDef) {
    this.engine.gravity.y = 0.8;

    const ground = Matter.Bodies.rectangle(scene.width / 2, GROUND_Y + 200, scene.width * 4, 400, {
      isStatic: true,
      friction: 1,
    });
    this.walls = [-1, 1].map((side) =>
      Matter.Bodies.rectangle(scene.width / 2 + side * (scene.width / 2 + 50), 0, 100, WORLD_H * 4, { isStatic: true }),
    );
    Matter.Composite.add(this.engine.world, [ground, ...this.walls]);

    for (const def of scene.objects) {
      switch (def.type) {
        case 'tree':
          this.trees.push(new Tree(def.x, def.fruit));
          break;
        case 'puddle': {
          const puddle = new Puddle(def.x, def.width);
          this.puddles.push(puddle);
          this.puddlesBySensor.set(puddle.sensor.id, puddle);
          Matter.Composite.add(this.engine.world, puddle.sensor);
          break;
        }
      }
    }

    Matter.Events.on(this.engine, 'collisionStart', (e) => this.onCollisions(e.pairs, true));
    Matter.Events.on(this.engine, 'collisionActive', (e) => this.onCollisions(e.pairs, false));
  }

  resize(cssW: number, cssH: number): void {
    this.scale = Math.min(cssW / SCREEN_W, cssH / WORLD_H);
    this.viewW = cssW / this.scale;
    this.viewH = cssH / this.scale;
    this.camX = (SCREEN_W - this.viewW) / 2;
    this.camY = WORLD_H - this.viewH;
    // Keep things on the visible part of the ground.
    Matter.Body.setPosition(this.walls[0], { x: this.camX - 50, y: 0 });
    Matter.Body.setPosition(this.walls[1], { x: this.camX + this.viewW + 50, y: 0 });
  }

  private toWorld(cssX: number, cssY: number): { x: number; y: number } {
    return { x: cssX / this.scale + this.camX, y: cssY / this.scale + this.camY };
  }

  // --- Input -------------------------------------------------------------

  pointerDown(id: number, cssX: number, cssY: number): void {
    const p = this.toWorld(cssX, cssY);

    let bestItem: Item | null = null;
    let bestDist = Infinity;
    for (const item of this.items) {
      if (item.held) continue;
      const d = Math.hypot(p.x - item.body.position.x, p.y - item.body.position.y);
      if (d <= item.radius + GRAB_SLOP && d < bestDist) {
        bestItem = item;
        bestDist = d;
      }
    }

    let bestSlot: { tree: Tree; slot: Tree['slots'][number] } | null = null;
    for (const tree of this.trees) {
      const hit = tree.slotAt(p.x, p.y, GRAB_SLOP);
      if (hit && hit.dist < bestDist) {
        bestSlot = { tree, slot: hit.slot };
        bestDist = hit.dist;
        bestItem = null;
      }
    }

    if (bestSlot) {
      const { tree, slot } = bestSlot;
      const item = new Item(tree.fruit, slot.x, slot.y);
      this.addItem(item);
      tree.pick(slot);
      audio.pop();
      this.grab(id, item, p);
    } else if (bestItem) {
      this.grab(id, bestItem, p);
    } else {
      this.trees.find((t) => t.hitsCanopy(p.x, p.y))?.touch();
    }
  }

  pointerMove(id: number, cssX: number, cssY: number): void {
    const hold = this.holds.get(id);
    if (!hold) return;
    const p = this.toWorld(cssX, cssY);
    hold.x = p.x;
    hold.y = p.y;
  }

  pointerUp(id: number): void {
    const hold = this.holds.get(id);
    if (!hold) return;
    this.holds.delete(id);
    const { item } = hold;
    item.held = false;
    const v = item.body.velocity;
    const speed = Math.hypot(v.x, v.y);
    if (speed > MAX_RELEASE_SPEED) {
      Matter.Body.setVelocity(item.body, { x: (v.x / speed) * MAX_RELEASE_SPEED, y: (v.y / speed) * MAX_RELEASE_SPEED });
    }
  }

  private grab(id: number, item: Item, p: { x: number; y: number }): void {
    item.held = true;
    Matter.Sleeping.set(item.body, false);
    this.holds.set(id, { item, x: p.x, y: p.y, dx: item.body.position.x - p.x, dy: item.body.position.y - p.y });
  }

  private addItem(item: Item): void {
    this.items.push(item);
    this.itemsByBody.set(item.body.id, item);
    Matter.Composite.add(this.engine.world, item.body);
  }

  private removeItem(item: Item): void {
    this.items = this.items.filter((i) => i !== item);
    this.itemsByBody.delete(item.body.id);
    Matter.Composite.remove(this.engine.world, item.body);
    for (const [id, hold] of this.holds) if (hold.item === item) this.holds.delete(id);
  }

  // --- Simulation --------------------------------------------------------

  private onCollisions(pairs: Matter.Pair[], started: boolean): void {
    for (const pair of pairs) {
      const { bodyA, bodyB } = pair;
      const puddle = this.puddlesBySensor.get(bodyA.id) ?? this.puddlesBySensor.get(bodyB.id);
      const itemA = this.itemsByBody.get(bodyA.id);
      const itemB = this.itemsByBody.get(bodyB.id);

      if (puddle) {
        const item = itemA ?? itemB;
        // Only once let go: holding something over the water does nothing yet.
        if (item && item.disposable && !item.held) this.toSink.set(item, puddle);
        continue;
      }

      if (!started) continue;
      const speed = Math.hypot(bodyA.velocity.x - bodyB.velocity.x, bodyA.velocity.y - bodyB.velocity.y);
      if (speed < 2) continue;
      for (const item of [itemA, itemB]) {
        if (!item || item.held || this.time - item.lastPlop < 0.15) continue;
        item.lastPlop = this.time;
        item.squash = Math.min(0.3, speed * 0.035);
        audio.plop(speed / 10);
      }
    }
  }

  step(): void {
    this.time += STEP;

    for (const hold of this.holds.values()) {
      const { body } = hold.item;
      // Steer the held body toward the finger with velocity, so it still
      // collides with things and keeps its speed for a flick on release.
      Matter.Body.setVelocity(body, {
        x: hold.x + hold.dx - body.position.x,
        y: hold.y + hold.dy - body.position.y,
      });
      Matter.Body.setAngularVelocity(body, -body.angle * 0.2);
    }

    Matter.Engine.update(this.engine, STEP * 1000);

    for (const [item, puddle] of this.toSink) this.sink(item, puddle);
    this.toSink.clear();

    for (const item of this.items) item.update(STEP);
    for (const tree of this.trees) tree.update(STEP);
    for (const puddle of this.puddles) puddle.update(STEP);
    for (const s of this.sinking) s.age += STEP;
    this.sinking = this.sinking.filter((s) => s.age < SINK_SECONDS);
    this.splashes.update(STEP);
  }

  private sink(item: Item, puddle: Puddle): void {
    const { x, y } = item.body.position;
    this.removeItem(item);
    this.sinking.push({ kind: item.kind, x, y, angle: item.body.angle, age: 0 });
    const size = 1;
    this.splashes.splash(x, puddle.surfaceY, size);
    puddle.ripple(x, size);
    audio.plock(size);
  }

  // --- Drawing -----------------------------------------------------------

  draw(ctx: CanvasRenderingContext2D, dpr: number): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, palette.skyTop);
    sky.addColorStop(1, palette.skyBottom);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    const k = this.scale * dpr;
    ctx.setTransform(k, 0, 0, k, -this.camX * k, -this.camY * k);

    const left = this.camX;
    const right = this.camX + this.viewW;

    ctx.fillStyle = palette.sun;
    ctx.beginPath();
    ctx.arc(860, 130, 60, 0, Math.PI * 2);
    ctx.fill();

    this.drawHills(ctx, left, right, 520, 90, 0.004, palette.hillFar);
    this.drawHills(ctx, left, right, 580, 60, 0.007, palette.hillNear);

    ctx.fillStyle = palette.ground;
    ctx.fillRect(left, GROUND_Y, right - left, WORLD_H - GROUND_Y + 10);
    ctx.fillStyle = palette.groundDark;
    ctx.fillRect(left, GROUND_Y + 50, right - left, WORLD_H - GROUND_Y);

    for (const puddle of this.puddles) puddle.draw(ctx, this.time);
    for (const tree of this.trees) tree.draw(ctx, this.time);

    for (const s of this.sinking) {
      const t = s.age / SINK_SECONDS;
      drawFruit(ctx, s.kind, s.x, s.y + t * 30, s.angle, 1 + t * 0.2, 1 - t * 0.7, 1 - t);
    }
    // Held items draw on top, so the one under the finger is always visible.
    for (const item of this.items) if (!item.held) item.draw(ctx);
    for (const item of this.items) if (item.held) item.draw(ctx);

    this.splashes.draw(ctx);
  }

  private drawHills(
    ctx: CanvasRenderingContext2D,
    left: number,
    right: number,
    base: number,
    height: number,
    freq: number,
    color: string,
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(left, GROUND_Y + 1);
    for (let x = left; x <= right + 20; x += 20) {
      ctx.lineTo(x, base - height * (0.5 + 0.5 * Math.sin(x * freq) * Math.cos(x * freq * 0.37)));
    }
    ctx.lineTo(right, GROUND_Y + 1);
    ctx.fill();
  }
}
