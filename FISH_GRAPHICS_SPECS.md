# Ocean King 3 - Fish Graphics Specifications

## General Requirements
- **Format**: PNG with alpha transparency (32-bit RGBA)
- **Style**: Vibrant, arcade-style ocean creatures
- **Orientation**: Facing right by default (code handles `flipX` for left movement)
- **Animation**: 8-frame swim cycle spritesheets at 10fps

---

## Implemented Fish Types (8 Total)

The game currently implements 8 fish types with both spritesheet animations and static fallback images.

### File Locations
- **Spritesheets**: `public/assets/spritesheets/fish/fish-{typeId}.png`
- **Static Fallbacks**: `public/assets/fish/{name}.png`

---

## SMALL FISH (Types 0-2)

### Type 0: Clownfish
- **FileName**: `fish-0.png` (spritesheet), `clownfish.png` (static)
- **Spritesheet Dimensions**: 576×32px (8 frames of 72×32px each)
- **Hitbox Radius**: 18px
- **Description**: Orange and white striped reef fish (like Nemo)
- **Speed**: 75 px/s
- **Payout Multiplier**: 7x
- **Capture Probability**: 60%
- **Spawn Weight**: 25%
- **Scale**: 1.5x
- **Formation**: Spawns in lines of 3-6 fish with 120px longitudinal offset

**Visual Features:**
- Horizontal mirroring (`flipX`) for directional facing
- ±75° vertical tilt (no full rotation)
- 8-frame swim cycle at 10fps

---

### Type 1: Neon Tetra
- **FileName**: `fish-1.png` (spritesheet), `neon_tetra.png` (static)
- **Spritesheet Dimensions**: 576×32px (8 frames of 72×32px each)
- **Hitbox Radius**: 16px
- **Description**: Small, bright blue and red striped fish
- **Speed**: 87.5 px/s
- **Payout Multiplier**: 6x
- **Capture Probability**: 32%
- **Spawn Weight**: 34%
- **Scale**: 1.4x
- **Formation**: Spawns in groups of 2-4 fish with time-staggered delay (15-20 ticks)

**Visual Features:**
- Horizontal mirroring (`flipX`) for directional facing
- ±75° vertical tilt (no full rotation)
- 8-frame swim cycle at 10fps

---

### Type 2: Butterflyfish
- **FileName**: `fish-2.png` (spritesheet), `butterflyfish.png` (static)
- **Spritesheet Dimensions**: 640×40px (8 frames of 80×40px each)
- **Hitbox Radius**: 17px
- **Description**: Yellow and white striped tropical fish with rounded body
- **Speed**: 81.25 px/s
- **Payout Multiplier**: 5x
- **Capture Probability**: 22%
- **Spawn Weight**: 34%
- **Scale**: 1.8x
- **Formation**: Spawns in diamond formations of 4-8 fish with lateral offsets

**Visual Features:**
- Horizontal mirroring (`flipX`) for directional facing
- ±75° vertical tilt (no full rotation)
- 8-frame swim cycle at 10fps

---

## MEDIUM FISH (Types 6, 9)

### Type 6: Lionfish
- **FileName**: `fish-6.png` (spritesheet), `lionfish.png` (static)
- **Spritesheet Dimensions**: 1024×56px (8 frames of 128×56px each)
- **Hitbox Radius**: 26px
- **Description**: Exotic fish with flowing, fan-like fins and red/white stripes
- **Speed**: 62.5 px/s
- **Payout Multiplier**: 18x
- **Capture Probability**: 12%
- **Spawn Weight**: 17%
- **Scale**: 1.8x
- **Formation**: Spawns individually

**Visual Features:**
- Horizontal mirroring (`flipX`) for directional facing
- ±75° vertical tilt (no full rotation)
- 8-frame swim cycle at 10fps
- Larger size for better visibility

---

### Type 9: Triggerfish
- **FileName**: `fish-9.png` (spritesheet), `triggerfish.png` (static)
- **Spritesheet Dimensions**: 960×48px (8 frames of 120×48px each)
- **Hitbox Radius**: 27px
- **Description**: Oval-shaped fish with bold patterns and colors
- **Speed**: 60 px/s
- **Payout Multiplier**: 16x
- **Capture Probability**: 10%
- **Spawn Weight**: 16%
- **Scale**: 1.7x
- **Formation**: Spawns individually

**Visual Features:**
- Horizontal mirroring (`flipX`) for directional facing
- ±75° vertical tilt (no full rotation)
- 8-frame swim cycle at 10fps

---

## LARGE FISH (Types 12, 14)

### Type 12: Hammerhead Shark
- **FileName**: `fish-12.png` (spritesheet), `hammerhead_shark.png` (static)
- **Spritesheet Dimensions**: 1280×40px (8 frames of 160×40px each)
- **Hitbox Radius**: 45px
- **Description**: Powerful predator with distinctive hammer-shaped head
- **Speed**: 100 px/s
- **Payout Multiplier**: 43x
- **Capture Probability**: 4%
- **Spawn Weight**: 9%
- **Scale**: 2.2x
- **Formation**: Spawns individually

**Visual Features:**
- Horizontal mirroring (`flipX`) for directional facing
- ±75° vertical tilt (no full rotation)
- 8-frame swim cycle at 10fps
- Significantly larger sprite for impressive presence

---

### Type 14: Giant Manta Ray
- **FileName**: `fish-14.png` (spritesheet), `giant_manta_ray.png` (static)
- **Spritesheet Dimensions**: 1792×96px (8 frames of 224×96px each)
- **Hitbox Radius**: 55px
- **Description**: Wide, flat-bodied graceful creature with wing-like fins
- **Speed**: 81.25 px/s
- **Payout Multiplier**: 56x
- **Capture Probability**: 3%
- **Spawn Weight**: 5%
- **Scale**: 2.0x
- **Formation**: Spawns individually

**Visual Features:**
- **SPECIAL HANDLING**: Sprite faces left by default, so uses inverted `flipX` logic
- ±75° vertical tilt (no full rotation) to prevent unnatural sideways/upside-down orientation
- 8-frame swim cycle at 10fps
- Largest fish sprite in the game

---

## SPECIAL BONUS FISH (Type 21)

### Type 21: Wave Rider
- **FileName**: `fish-21.png` (spritesheet), `wave_rider.png` (static)
- **Spritesheet Dimensions**: 896×48px (8 frames of 112×48px each)
- **Hitbox Radius**: 35px
- **Description**: Magical bonus fish with ethereal appearance
- **Speed**: 37.5 px/s (slow)
- **Payout Multiplier**: 35x
- **Capture Probability**: 15%
- **Spawn Weight**: Always 1 active (special spawn logic)
- **Scale**: 1.9x
- **Formation**: Spawns individually with sine wave path

**Visual Features:**
- Horizontal mirroring (`flipX`) for directional facing
- Uses **velocity threshold (1.0)** to prevent direction flipping during sine wave oscillations
- ±75° vertical tilt (no full rotation)
- 8-frame swim cycle at 10fps
- Glowing/ethereal visual effects

---

## Animation System

### Spritesheet Structure
- **Frame Count**: 8 frames per fish type
- **Layout**: Horizontal strip (all frames in a single row)
- **Frame Rate**: 10fps for snappy arcade feel
- **Loop**: Infinite repeat (`repeat: -1`)

### Animation Creation (BootScene.ts)
```typescript
this.anims.create({
  key: 'fish-0-swim',
  frames: this.anims.generateFrameNumbers('fish-0', { 
    start: 0, 
    end: 7 
  }),
  frameRate: 10,
  repeat: -1
});
```

### Death Animations
Death effects use **tweens instead of sprite frames**:
1. **White Flash** - 100ms tint to 0xFFFFFF with yoyo
2. **Scale Pop** - 200ms scale to 1.2x with yoyo
3. **Spiral Rotation** - 1000ms rotation to 1080° (3 full spins)
4. **Fade Out** - 400ms alpha to 0

This eliminates the need for additional death animation frames.

---

## Orientation System

### Standard Fish (Types 0, 1, 2, 6, 9, 12, 21)
- Use `flipX` to mirror sprite when moving left
- Apply ±75° vertical tilt based on velocity angle
- Prevents upside-down or sideways swimming

### Special Case: Manta Ray (Type 14)
- Sprite faces **left by default** (opposite of other fish)
- Uses **inverted `flipX` logic**: `flipX = velocity.x > 0`
- Same ±75° vertical tilt constraint

### Special Case: Wave Rider (Type 21)
- Uses **velocity threshold (1.0)** to prevent rapid flipping during sine wave oscillations
- Only updates facing direction when velocity magnitude > 1.0 px/s

---

## Collision System

Hitbox radii are intentionally **larger than visual sprites** for better gameplay feel:

| Category | Hitbox Multiplier | Example |
|----------|-------------------|---------|
| Small Fish | 70-85% | Type 0: 18px for 64px sprite |
| Medium Fish | 70-85% | Type 6: 26px for 96px sprite |
| Large Fish | 60-85% | Type 12: 45px for 128px sprite |
| Bonus Fish | 71% | Type 21: 35px for 100px sprite |

This improves player feedback and prevents frustration from "near-miss" shots.

---

## Asset Production Notes

### Current Assets
All 8 fish types have:
- ✅ Animated 8-frame spritesheets in `public/assets/spritesheets/fish/`
- ✅ Static fallback images in `public/assets/fish/`

### Future Fish Types (Not Implemented)
The following fish types from the original design (Types 3-5, 7-8, 10-11, 13, 15-20, 22-28) are **not currently implemented** and require:
- Spritesheet generation (8 frames each)
- Backend `FishCatalog.cs` entries
- Frontend texture loading in `BootScene.ts`
- Animation setup

---

## File Naming Convention

**Spritesheets:**
```
public/assets/spritesheets/fish/fish-{typeId}.png
Example: public/assets/spritesheets/fish/fish-0.png
```

**Static Fallbacks:**
```
public/assets/fish/{name}.png
Example: public/assets/fish/clownfish.png
```

**Loading in BootScene.ts:**
```typescript
// Spritesheet with frame dimensions
this.load.spritesheet('fish-0', 'assets/spritesheets/fish/fish-0.png', {
  frameWidth: 72,
  frameHeight: 32,
});

// Static fallback
this.load.image('fish-0-static', 'assets/fish/clownfish.png');
```

---

## Summary

**Implemented:** 8 fish types with full spritesheet animations and static fallbacks
- Small: Clownfish (0), Neon Tetra (1), Butterflyfish (2)
- Medium: Lionfish (6), Triggerfish (9)
- Large: Hammerhead Shark (12), Giant Manta Ray (14)
- Special: Wave Rider (21)

**Not Implemented:** 21 additional fish types from original design (requires asset creation and backend integration)
