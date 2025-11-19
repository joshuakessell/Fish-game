#!/usr/bin/env python3
"""
Fish Spritesheet Processor for Ocean King 3
Removes backgrounds, crops water splashes, extracts ALL 25 frames, and resizes.
"""

from PIL import Image
import os
import sys

# Fish type configurations
FISH_CONFIGS = {
    'clownfish': {
        'input': 'attached_assets/IMG_0473_1763373451326.png',
        'output': 'public/assets/spritesheets/fish/fish-0.png',
        'type_id': 0,
        'frame_size': (72, 32),
        'grid': (5, 5),
        'description': 'Clownfish - Small fish'
    },
    'tetra': {
        'input': 'attached_assets/IMG_0470_1763373451326.png',
        'output': 'public/assets/spritesheets/fish/fish-1.png',
        'type_id': 1,
        'frame_size': (72, 32),
        'grid': (5, 5),
        'description': 'Neon Tetra - Small fish'
    },
    'butterflyfish': {
        'input': 'attached_assets/IMG_0471_1763373451326.png',
        'output': 'public/assets/spritesheets/fish/fish-2.png',
        'type_id': 2,
        'frame_size': (80, 40),
        'grid': (5, 5),
        'description': 'Butterflyfish - Small fish'
    },
    'lionfish': {
        'input': 'attached_assets/IMG_0472_1763373451326.png',
        'output': 'public/assets/spritesheets/fish/fish-6.png',
        'type_id': 6,
        'frame_size': (128, 56),
        'grid': (5, 5),
        'description': 'Lionfish - Medium fish'
    },
    'triggerfish': {
        'input': 'attached_assets/IMG_0474_1763373577665.png',
        'output': 'public/assets/spritesheets/fish/fish-9.png',
        'type_id': 9,
        'frame_size': (120, 48),
        'grid': (5, 5),
        'description': 'Triggerfish - Medium fish'
    },
    'hammerhead': {
        'input': 'attached_assets/IMG_0469_1763372445135.png',
        'output': 'public/assets/spritesheets/fish/fish-12.png',
        'type_id': 12,
        'frame_size': (160, 40),
        'grid': (5, 5),
        'description': 'Hammerhead Shark - Large boss'
    },
    'manta_ray': {
        'input': 'attached_assets/IMG_0468_1763373281234.png',
        'output': 'public/assets/spritesheets/fish/fish-14.png',
        'type_id': 14,
        'frame_size': (224, 96),
        'grid': (5, 5),
        'description': 'Manta Ray - Large boss'
    },
    'rainbow_fish': {
        'input': 'attached_assets/IMG_0467_1763373281234.png',
        'output': 'public/assets/spritesheets/fish/fish-21.png',
        'type_id': 21,
        'frame_size': (112, 48),
        'grid': (5, 5),
        'description': 'Rainbow Wave Rider - Bonus fish'
    }
}


def remove_black_background(image, threshold=30):
    """Convert black pixels to transparent."""
    image = image.convert("RGBA")
    pixels = image.load()
    
    for y in range(image.height):
        for x in range(image.width):
            r, g, b, a = pixels[x, y]
            # If pixel is near black, make it transparent
            if r < threshold and g < threshold and b < threshold:
                pixels[x, y] = (r, g, b, 0)
    
    return image


def crop_to_content(image, padding=5):
    """Crop image to non-transparent content with padding."""
    bbox = image.getbbox()
    if bbox:
        # Add padding
        bbox = (
            max(0, bbox[0] - padding),
            max(0, bbox[1] - padding),
            min(image.width, bbox[2] + padding),
            min(image.height, bbox[3] + padding)
        )
        return image.crop(bbox)
    return image


def extract_frames(image, grid=(5, 5), frame_indices=None):
    """Extract specific frames from a grid layout."""
    cols, rows = grid
    frame_width = image.width // cols
    frame_height = image.height // rows
    
    if frame_indices is None:
        # Extract ALL 25 frames for smooth animation
        frame_indices = list(range(cols * rows))
    
    frames = []
    for idx in frame_indices:
        if idx >= cols * rows:
            break
        
        row = idx // cols
        col = idx % cols
        
        left = col * frame_width
        top = row * frame_height
        right = left + frame_width
        bottom = top + frame_height
        
        frame = image.crop((left, top, right, bottom))
        frames.append(frame)
    
    return frames


def get_uniform_bbox(frames, padding=10):
    """Find the maximum bounding box across all frames to prevent animation jumping."""
    min_x = float('inf')
    min_y = float('inf')
    max_x = 0
    max_y = 0
    
    for frame in frames:
        bbox = frame.getbbox()
        if bbox:
            min_x = min(min_x, bbox[0])
            min_y = min(min_y, bbox[1])
            max_x = max(max_x, bbox[2])
            max_y = max(max_y, bbox[3])
    
    # Add padding
    min_x = max(0, min_x - padding)
    min_y = max(0, min_y - padding)
    max_x = min(frames[0].width, max_x + padding)
    max_y = min(frames[0].height, max_y + padding)
    
    return (min_x, min_y, max_x, max_y)


def process_fish_spritesheet(config):
    """Process a single fish spritesheet."""
    print(f"\n{'='*60}")
    print(f"Processing: {config['description']}")
    print(f"Input: {config['input']}")
    print(f"Output: {config['output']}")
    print(f"Target size: {config['frame_size']}")
    print(f"{'='*60}")
    
    try:
        # Load original image
        img = Image.open(config['input'])
        print(f"✓ Loaded image: {img.size}")
        
        # Remove black background
        img = remove_black_background(img)
        print(f"✓ Removed black background")
        
        # Extract ALL 25 frames from 25-frame grid
        frames = extract_frames(img, grid=config['grid'])
        print(f"✓ Extracted ALL {len(frames)} frames from {config['grid'][0]}x{config['grid'][1]} grid")
        
        # Find uniform bounding box across all frames to prevent animation jumping
        uniform_bbox = get_uniform_bbox(frames, padding=10)
        print(f"✓ Calculated uniform bounding box: {uniform_bbox}")
        
        # Process each frame using the uniform bounding box
        processed_frames = []
        for i, frame in enumerate(frames):
            # Crop using uniform bounding box (keeps fish in same position across all frames)
            frame = frame.crop(uniform_bbox)
            
            # Resize to target dimensions
            frame = frame.resize(config['frame_size'], Image.Resampling.LANCZOS)
            processed_frames.append(frame)
        
        print(f"✓ Processed {len(processed_frames)} frames to {config['frame_size']} with aligned positions")
        
        # Create output spritesheet (horizontal layout)
        output_width = config['frame_size'][0] * len(processed_frames)
        output_height = config['frame_size'][1]
        output = Image.new('RGBA', (output_width, output_height), (0, 0, 0, 0))
        
        # Paste frames horizontally
        for i, frame in enumerate(processed_frames):
            x_offset = i * config['frame_size'][0]
            output.paste(frame, (x_offset, 0))
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(config['output']), exist_ok=True)
        
        # Save output
        output.save(config['output'], 'PNG')
        print(f"✓ Saved spritesheet: {config['output']}")
        print(f"✓ Final dimensions: {output.size}")
        
        return True
        
    except Exception as e:
        print(f"✗ Error processing {config['description']}: {e}")
        return False


def main():
    """Process all fish spritesheets."""
    print("\n" + "="*60)
    print("OCEAN KING 3 - FISH SPRITESHEET PROCESSOR")
    print("="*60)
    print("\nThis script will:")
    print("  1. Remove black backgrounds → transparent")
    print("  2. Crop water splash effects")
    print("  3. Extract ALL 25 frames for smooth animation")
    print("  4. Resize to target dimensions")
    print("  5. Export as horizontal sprite strips")
    
    # Process specific fish if argument provided
    if len(sys.argv) > 1:
        fish_name = sys.argv[1]
        if fish_name in FISH_CONFIGS:
            process_fish_spritesheet(FISH_CONFIGS[fish_name])
        else:
            print(f"\nError: Unknown fish '{fish_name}'")
            print(f"Available fish: {', '.join(FISH_CONFIGS.keys())}")
        return
    
    # Process all fish
    results = {}
    for name, config in FISH_CONFIGS.items():
        success = process_fish_spritesheet(config)
        results[name] = success
    
    # Summary
    print("\n" + "="*60)
    print("PROCESSING SUMMARY")
    print("="*60)
    
    successful = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, success in results.items():
        status = "✓" if success else "✗"
        print(f"{status} {name:20s} - {FISH_CONFIGS[name]['description']}")
    
    print(f"\nCompleted: {successful}/{total} fish processed successfully")
    
    if successful == total:
        print("\n🎉 All fish spritesheets processed successfully!")
        print("\nNext steps:")
        print("  1. Check public/assets/spritesheets/fish/ for output files")
        print("  2. Run the game to test animations")
        print("  3. Adjust frame extraction if timing feels off")
    else:
        print("\n⚠️  Some fish failed to process. Check errors above.")


if __name__ == '__main__':
    main()
