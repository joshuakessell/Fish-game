# Ocean King 3 - Fish Graphics Specifications

## General Requirements
- **Format**: PNG with alpha transparency
- **Color Depth**: 32-bit RGBA
- **Style**: Vibrant, arcade-style, colorful ocean creatures
- **Orientation**: Facing right by default (will be flipped in code for left movement)

## Recommended Dimensions by Category

| Category | Hitbox Range | Recommended Size | Notes |
|----------|--------------|------------------|-------|
| Small Fish | 16-20px | 64x64px | Common, schooling fish |
| Medium Fish | 24-29px | 96x96px | Moderate size, colorful |
| Large Fish | 38-70px | 128x128px to 200x200px | Impressive predators |
| Special Items | 35-40px | 100x100px | Glowing, special effects |
| Boss Fish | 75-90px | 256x256px | Massive, epic creatures |

---

## SMALL FISH (Types 0-5)
**Common fish, high spawn rate, easy to catch**

### Type 0: Clownfish
- **FileName**: `clownfish.png`
- **Recommended Size**: 64x64px
- **Hitbox Radius**: 18px
- **Description**: Orange and white striped reef fish (like Nemo)
- **Speed**: Medium (75 px/s)
- **Value**: Low (7x multiplier)
- **Spawn Rate**: 25%

### Type 1: Neon Tetra
- **FileName**: `neon_tetra.png`
- **Recommended Size**: 64x64px
- **Hitbox Radius**: 16px
- **Description**: Small, bright blue and red striped fish
- **Speed**: Fast (87.5 px/s)
- **Value**: Low (6x multiplier)
- **Spawn Rate**: 34%

### Type 2: Butterflyfish
- **FileName**: `butterflyfish.png`
- **Recommended Size**: 64x64px
- **Hitbox Radius**: 17px
- **Description**: Yellow and white striped tropical fish with rounded body
- **Speed**: Medium-Fast (81.25 px/s)
- **Value**: Low (5x multiplier)
- **Spawn Rate**: 34%

### Type 3: Angelfish
- **FileName**: `angelfish.png`
- **Recommended Size**: 64x64px
- **Hitbox Radius**: 19px
- **Description**: Elegant, disc-shaped fish with flowing fins
- **Speed**: Medium-Fast (81.25 px/s)
- **Value**: Low (4x multiplier)
- **Spawn Rate**: 34%

### Type 4: Pufferfish
- **FileName**: `pufferfish.png`
- **Recommended Size**: 64x64px
- **Hitbox Radius**: 20px
- **Description**: Round, spiky fish with cute expression
- **Speed**: Medium-Slow (68.75 px/s)
- **Value**: Medium-Low (9x multiplier)
- **Spawn Rate**: 22%

### Type 5: Wrasse
- **FileName**: `wrasse.png`
- **Recommended Size**: 64x64px
- **Hitbox Radius**: 17px
- **Description**: Sleek, colorful elongated reef fish
- **Speed**: Fast (93.75 px/s)
- **Value**: Low (4x multiplier)
- **Spawn Rate**: 25%

---

## MEDIUM FISH (Types 6-11)
**Moderate difficulty, good rewards**

### Type 6: Lionfish
- **FileName**: `lionfish.png`
- **Recommended Size**: 96x96px
- **Hitbox Radius**: 26px
- **Description**: Exotic fish with flowing, fan-like fins and red/white stripes
- **Speed**: Medium-Slow (62.5 px/s)
- **Value**: Medium (18x multiplier)
- **Spawn Rate**: 17%

### Type 7: Parrotfish
- **FileName**: `parrotfish.png`
- **Recommended Size**: 96x96px
- **Hitbox Radius**: 28px
- **Description**: Large-mouthed, colorful fish with beak-like mouth
- **Speed**: Slow (56.25 px/s)
- **Value**: Medium (12x multiplier)
- **Spawn Rate**: 14%

### Type 8: Seahorse
- **FileName**: `seahorse.png`
- **Recommended Size**: 96x96px
- **Hitbox Radius**: 24px
- **Description**: Upright swimming, horse-shaped creature with curled tail
- **Speed**: Very Slow (50 px/s)
- **Value**: Medium (12x multiplier)
- **Spawn Rate**: 10%

### Type 9: Triggerfish
- **FileName**: `triggerfish.png`
- **Recommended Size**: 96x96px
- **Hitbox Radius**: 27px
- **Description**: Oval-shaped fish with bold patterns and colors
- **Speed**: Medium (60 px/s)
- **Value**: Medium (16x multiplier)
- **Spawn Rate**: 16%

### Type 10: Grouper
- **FileName**: `grouper.png`
- **Recommended Size**: 96x96px
- **Hitbox Radius**: 29px
- **Description**: Large, stocky fish with wide mouth and spotted pattern
- **Speed**: Medium-Slow (57.5 px/s)
- **Value**: Medium (17x multiplier)
- **Spawn Rate**: 13%

### Type 11: Boxfish
- **FileName**: `boxfish.png`
- **Recommended Size**: 96x96px
- **Hitbox Radius**: 26px
- **Description**: Cube-shaped fish with spotted pattern and cute appearance
- **Speed**: Medium-Slow (58.75 px/s)
- **Value**: Medium-High (19x multiplier)
- **Spawn Rate**: 15%

---

## LARGE FISH (Types 12-16)
**Difficult to catch, high rewards**

### Type 12: Swordfish
- **FileName**: `swordfish.png`
- **Recommended Size**: 160x128px
- **Hitbox Radius**: 45px
- **Description**: Long, streamlined predator with distinctive sword-like bill
- **Speed**: Very Fast (100 px/s)
- **Value**: High (43x multiplier)
- **Spawn Rate**: 9%

### Type 13: Shark
- **FileName**: `shark.png`
- **Recommended Size**: 180x128px
- **Hitbox Radius**: 60px
- **Description**: Menacing predator with sharp teeth and grey/white coloring
- **Speed**: Fast (87.5 px/s)
- **Value**: Very High (68x multiplier)
- **Spawn Rate**: 5%

### Type 14: Manta Ray
- **FileName**: `manta_ray.png`
- **Recommended Size**: 160x128px
- **Hitbox Radius**: 55px
- **Description**: Wide, flat-bodied graceful creature with wing-like fins
- **Speed**: Fast (81.25 px/s)
- **Value**: High (56x multiplier)
- **Spawn Rate**: 5%

### Type 15: Barracuda
- **FileName**: `barracuda.png`
- **Recommended Size**: 160x96px
- **Hitbox Radius**: 50px
- **Description**: Long, sleek predator with sharp teeth and silver body
- **Speed**: Very Fast (106.25 px/s)
- **Value**: High (39x multiplier)
- **Spawn Rate**: 9%

### Type 16: Moray Eel
- **FileName**: `moray_eel.png`
- **Recommended Size**: 160x96px
- **Hitbox Radius**: 52px
- **Description**: Serpentine creature with open mouth showing sharp teeth
- **Speed**: Medium-Slow (68.75 px/s)
- **Value**: Very High (63x multiplier)
- **Spawn Rate**: 5%

---

## HIGH-VALUE FISH (Types 17-20)
**Very rare, massive rewards**

### Type 17: Golden Carp
- **FileName**: `golden_carp.png`
- **Recommended Size**: 128x128px
- **Hitbox Radius**: 38px
- **Description**: Shimmering golden fish with elegant fins, glowing effect
- **Speed**: Very Fast (112.5 px/s)
- **Value**: Extremely High (133x multiplier)
- **Spawn Rate**: 1%

### Type 18: Fire Kirin
- **FileName**: `fire_kirin.png`
- **Recommended Size**: 140x140px
- **Hitbox Radius**: 42px
- **Description**: Mythical creature with dragon/horse features, flames
- **Speed**: Fast (93.75 px/s)
- **Value**: Extremely High (120x multiplier)
- **Spawn Rate**: 2%

### Type 19: Electric Eel
- **FileName**: `electric_eel.png`
- **Recommended Size**: 160x96px
- **Hitbox Radius**: 48px
- **Description**: Long serpentine fish with electric/lightning effects
- **Speed**: Very Fast (118.75 px/s)
- **Value**: Extremely High (121x multiplier)
- **Spawn Rate**: 2%

### Type 20: Crimson Whale
- **FileName**: `crimson_whale.png`
- **Recommended Size**: 200x160px
- **Hitbox Radius**: 70px
- **Description**: Massive red whale with mystical appearance
- **Speed**: Medium-Fast (75 px/s)
- **Value**: Extremely High (119x multiplier)
- **Spawn Rate**: 2%

---

## SPECIAL ITEMS (Types 21-24)
**Always 1 active, drop power-ups**

### Type 21: Drill Crab
- **FileName**: `drill_crab.png`
- **Recommended Size**: 100x100px
- **Hitbox Radius**: 35px
- **Description**: Crab with drill claws, mechanical appearance
- **Speed**: Very Slow (37.5 px/s)
- **Value**: Medium (35x multiplier)
- **Special**: Launches bouncing drill on death
- **Kill Animation**: Glow, pulse, screen shake

### Type 22: Laser Crab
- **FileName**: `laser_crab.png`
- **Recommended Size**: 100x100px
- **Hitbox Radius**: 35px
- **Description**: Crab with laser cannons, futuristic look
- **Speed**: Very Slow (37.5 px/s)
- **Value**: Medium (34x multiplier)
- **Special**: Fires sweeping laser beam on death
- **Kill Animation**: Glow, pulse, screen shake

### Type 23: Roulette Crab
- **FileName**: `roulette_crab.png`
- **Recommended Size**: 100x100px
- **Hitbox Radius**: 36px
- **Description**: Crab with roulette wheel design, casino theme
- **Speed**: Very Slow (35 px/s)
- **Value**: Medium (39x multiplier)
- **Special**: Triggers roulette wheel event on death
- **Kill Animation**: Glow, pulse, screen shake

### Type 24: Vortex Jelly
- **FileName**: `vortex_jelly.png`
- **Recommended Size**: 110x110px
- **Hitbox Radius**: 40px
- **Description**: Jellyfish with swirling vortex pattern, ethereal glow
- **Speed**: Very Slow (31.25 px/s)
- **Value**: Medium (29x multiplier)
- **Special**: Creates vortex that pulls nearby fish on death
- **Kill Animation**: Glow, pulse, screen shake

---

## BOSS FISH (Types 25-28)
**Always 1 active, epic battles**

### Type 25: Dragon King
- **FileName**: `dragon_king.png`
- **Recommended Size**: 256x256px
- **Hitbox Radius**: 80px
- **Description**: Majestic Eastern dragon with golden scales, horns, whiskers
- **Speed**: Slow (50 px/s)
- **Value**: Legendary (464x multiplier)
- **Special**: Multi-phase death with flames and gold coins for 8 seconds
- **Kill Animation**: Advanced glow, pulse, screen shake

### Type 26: Emperor Turtle
- **FileName**: `emperor_turtle.png`
- **Recommended Size**: 240x240px
- **Hitbox Radius**: 75px
- **Description**: Ancient turtle with ornate shell, regal appearance
- **Speed**: Very Slow (43.75 px/s)
- **Value**: Legendary (180x multiplier)
- **Special**: Retreats into shell and releases energy waves for 6 seconds
- **Kill Animation**: Advanced glow, pulse, screen shake

### Type 27: Poseidon
- **FileName**: `poseidon.png`
- **Recommended Size**: 256x256px
- **Hitbox Radius**: 85px
- **Description**: God of the sea with trident, muscular humanoid figure
- **Speed**: Slow (47.5 px/s)
- **Value**: Legendary (219x multiplier)
- **Special**: Summons lightning and waves for 7 seconds, blue screen tint
- **Kill Animation**: Advanced glow, pulse, screen shake

### Type 28: Phantom Kraken
- **FileName**: `phantom_kraken.png`
- **Recommended Size**: 280x280px
- **Hitbox Radius**: 90px
- **Description**: Massive octopus with glowing tentacles, ghostly appearance
- **Speed**: Very Slow (40 px/s)
- **Value**: Legendary (478x multiplier)
- **Special**: Spawns sweeping tentacles for 9 seconds
- **Kill Animation**: Advanced glow, pulse, screen shake

---

## File Naming Convention
Place all files in: `public/assets/fish/`

Example filenames:
- `public/assets/fish/clownfish.png`
- `public/assets/fish/dragon_king.png`
- `public/assets/fish/laser_crab.png`

## Sprite Sheet Support (Future)
Currently, the game uses static sprites. If you want to create animated sprite sheets:
- **Format**: Horizontal sprite sheet
- **Frame Size**: Same as recommended dimensions above
- **Animation**: 4-8 frames for swimming animation
- **Naming**: Add `_spritesheet` suffix (e.g., `clownfish_spritesheet.png`)

The code will need to be updated to use `this.load.spritesheet()` instead of `this.load.image()`.
