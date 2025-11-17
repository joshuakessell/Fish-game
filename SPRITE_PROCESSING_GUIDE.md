# Manual Sprite Processing Guide

Since Python isn't available in the Replit environment, process the spritesheets manually or use an external tool.

## Option 1: Use Online Tools

### Tools Needed:
1. **Remove.bg** or **Photopea** - Remove black backgrounds
2. **EZGif Sprite Sheet Maker** - Extract and arrange frames
3. **ImageMagick Online** - Resize if needed

### Process Each Fish:

1. **Upload spritesheet** to background remover
2. **Download** transparent PNG
3. **Open in image editor** (Photopea, GIMP, Photoshop)
4. **Extract frames manually:**
   - From 5×5 grid, take frames: 0, 3, 6, 9, 12, 15, 18, 21 (every 3rd)
   - This gives 8 frames for smooth loop
5. **Crop** individual frames to remove water splash
6. **Resize** to target dimensions (see table below)
7. **Arrange horizontally** in single row
8. **Export** as PNG to `public/assets/spritesheets/fish/`

## Option 2: Quick Manual Extraction

If you have Photoshop/GIMP:

1. Open the 5×5 grid spritesheet
2. Use **Magic Wand** to select and delete black background
3. Use **Crop** tool to remove water splash from bottom
4. Create **8 separate layers** for frames 0, 3, 6, 9, 12, 15, 18, 21
5. Resize each layer to target size
6. Export as horizontal strip

## Target Dimensions

| Fish | File | Frames | Frame Size | Total Size |
|------|------|--------|------------|------------|
| Clownfish | fish-0.png | 8 | 72×32 | 576×32 |
| Tetra | fish-1.png | 8 | 72×32 | 576×32 |
| Butterflyfish | fish-2.png | 8 | 80×40 | 640×40 |
| Lionfish | fish-6.png | 8 | 128×56 | 1024×56 |
| Triggerfish | fish-9.png | 8 | 120×48 | 960×48 |
| Hammerhead | fish-12.png | 8 | 160×40 | 1280×40 |
| Manta Ray | fish-14.png | 8 | 224×96 | 1792×96 |
| Rainbow Fish | fish-21.png | 8 | 112×48 | 896×48 |

## Simplified Approach (For Testing)

**Just want to see it working?**

1. Pick ONE fish (e.g., clownfish)
2. Remove background → transparent
3. Crop to just the fish (no water)
4. Resize to 576×32 (8 identical frames is fine for testing)
5. Save as `public/assets/spritesheets/fish/fish-0.png`
6. Game will automatically load and animate it!

## File Structure

```
public/
└── assets/
    └── spritesheets/
        └── fish/
            ├── fish-0.png
            ├── fish-1.png
            ├── fish-2.png
            ├── fish-6.png
            ├── fish-9.png
            ├── fish-12.png
            ├── fish-14.png
            └── fish-21.png
```

## The Code is Ready!

The game code is already implemented and waiting for spritesheets:
- ✅ BootScene loads spritesheets automatically
- ✅ Animations create themselves when spritesheets exist
- ✅ Fish rotate to face movement direction
- ✅ Death animations spiral and fade
- ✅ Gracefully falls back to static images if spritesheets missing

**Just add the processed PNG files and everything will work!**
