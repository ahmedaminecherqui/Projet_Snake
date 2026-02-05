#!/usr/bin/env python3
"""Generate placeholder PNG images for the Snake game."""

try:
    from PIL import Image, ImageDraw
except ImportError:
    print("Pillow not installed. Installing...")
    import subprocess
    subprocess.check_call([
        "python", "-m", "pip", "install", "pillow", "-q"
    ])
    from PIL import Image, ImageDraw

def create_mascot(path):
    """Create a 60x60 mascot placeholder (green snake head)."""
    img = Image.new('RGBA', (60, 60), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Draw a simple snake head
    draw.ellipse([5, 10, 55, 55], fill=(74, 222, 128), outline=(22, 101, 52), width=2)
    # Eyes
    draw.ellipse([20, 25, 30, 35], fill=(255, 255, 255))
    draw.ellipse([35, 25, 45, 35], fill=(255, 255, 255))
    draw.ellipse([23, 28, 27, 32], fill=(0, 0, 0))
    draw.ellipse([38, 28, 42, 32], fill=(0, 0, 0))
    img.save(path)
    print(f"Created {path}")

def create_background(path):
    """Create a 1920x1080 background placeholder (dark gradient)."""
    img = Image.new('RGBA', (1920, 1080), (15, 23, 42, 255))
    draw = ImageDraw.Draw(img)
    # Add some simple pattern
    for x in range(0, 1920, 100):
        for y in range(0, 1080, 100):
            draw.rectangle([x, y, x+50, y+50], fill=(30, 50, 80, 100))
    img.save(path)
    print(f"Created {path}")

def create_food(path):
    """Create a 256x64 food spritesheet placeholder (simple colored circles)."""
    img = Image.new('RGBA', (256, 64), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # Food icon 1 (yellow/gold circle)
    draw.ellipse([10, 10, 54, 54], fill=(251, 191, 36), outline=(200, 150, 0), width=2)
    # Food icon 2 (red circle)
    draw.ellipse([74, 10, 118, 54], fill=(239, 68, 68), outline=(180, 30, 30), width=2)
    # Food icon 3 (blue circle)
    draw.ellipse([138, 10, 182, 54], fill=(59, 130, 246), outline=(30, 80, 200), width=2)
    # Food icon 4 (purple circle)
    draw.ellipse([202, 10, 246, 54], fill=(168, 85, 247), outline=(120, 40, 180), width=2)
    img.save(path)
    print(f"Created {path}")

if __name__ == '__main__':
    base = r'c:\Users\radia\Downloads\BUFFA_Prjt (2)\BUFFA_Prjt\my_snake_project\assets'
    create_mascot(f'{base}\\mascot.png')
    create_background(f'{base}\\background.png')
    create_food(f'{base}\\food.png')
    print("All placeholder images created!")
