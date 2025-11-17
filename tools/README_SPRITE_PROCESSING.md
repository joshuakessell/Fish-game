# Fish Spritesheet Processing Instructions

## Quick Start

```bash
# Install dependencies
pip install Pillow

# Process all fish
python tools/process_fish_sprites.py

# Process single fish
python tools/process_fish_sprites.py hammerhead
```

## What This Script Does

1. **Removes black backgrounds** → transparent PNG
2. **Crops water splash effects** → clean silhouette
3. **Extracts 8 frames from 25** → every 3rd frame for snappy animation
4. **Resizes to target dimensions** → optimized for each fish type
5. **Exports horizontal sprite strips** → ready for Phaser

## Fish Processing Specs

| Fish | Type ID | Input File | Output | Frame Size |
|------|---------|------------|--------|------------|
| Clownfish | 0 | IMG_0473 | fish-0.png | 72×32 |
| Tetra | 1 | IMG_0470 | fish-1.png | 72×32 |
| Butterflyfish | 2 | IMG_0471 | fish-2.png | 80×40 |
| Lionfish | 6 | IMG_0472 | fish-6.png | 128×56 |
| Triggerfish | 9 | IMG_0474 | fish-9.png | 120×48 |
| Hammerhead | 12 | IMG_0469 | fish-12.png | 160×40 |
| Manta Ray | 14 | IMG_0468 | fish-14.png | 224×96 |
| Rainbow Fish | 21 | IMG_0467 | fish-21.png | 112×48 |

## Output Structure

```
public/assets/spritesheets/fish/
├── fish-0.png    (576×32  = 8 frames @ 72×32)
├── fish-1.png    (576×32  = 8 frames @ 72×32)
├── fish-2.png    (640×40  = 8 frames @ 80×40)
├── fish-6.png    (1024×56 = 8 frames @ 128×56)
├── fish-9.png    (960×48  = 8 frames @ 120×48)
├── fish-12.png   (1280×40 = 8 frames @ 160×40)
├── fish-14.png   (1792×96 = 8 frames @ 224×96)
└── fish-21.png   (896×48  = 8 frames @ 112×48)
```

## Frame Extraction Logic

From 25-frame 5×5 grid, we extract frames:
- **Indices:** 0, 3, 6, 9, 12, 15, 18, 21
- **Frames:** 8 total (perfectly loops)
- **Timing:** 0.8s loop @ 10fps = arcade-style energy

## Troubleshooting

**Black edges remain?**
- Adjust `threshold` parameter in `remove_black_background()` (default: 30)

**Water splashes not cropped?**
- Increase `padding` in `crop_to_content()` (default: 5)

**Fish too small/large?**
- Check frame_size in FISH_CONFIGS and adjust

**Animation choppy?**
- Try different frame indices or increase frame count

## Next Steps After Processing

1. Verify output files in `public/assets/spritesheets/fish/`
2. Update BootScene.ts to load spritesheets
3. Create animations in BootScene
4. Update FishSprite to play animations + rotation
5. Test in-game!
