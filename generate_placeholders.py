import os
from PIL import Image, ImageDraw

def create_image(filename, width, height, color, pattern_color):
    # Ensure directory exists
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    # Create a new image
    img = Image.new('RGB', (width, height), color)
    draw = ImageDraw.Draw(img)
    
    # Add a simple pattern
    for i in range(0, width + height, 40):
        draw.line([(0, i), (i, 0)], fill=pattern_color, width=2)
    
    img.save(filename)
    print(f"Created {filename}")

try:
    # Pale blue with slightly darker pattern
    create_image('assets/images/hero-1200.jpg', 1200, 900, '#EFF6FF', '#DBEAFE')
    create_image('assets/images/hero-1200.webp', 1200, 900, '#EFF6FF', '#DBEAFE')
    create_image('assets/images/hero-800.webp', 800, 600, '#EFF6FF', '#DBEAFE')
    create_image('assets/images/hero-480.webp', 480, 360, '#EFF6FF', '#DBEAFE')

    # Navy/Dark blue pattern
    create_image('assets/images/handover-1200.jpg', 1200, 900, '#163B8C', '#1D4ED8')
    create_image('assets/images/handover-1200.webp', 1200, 900, '#163B8C', '#1D4ED8')
    create_image('assets/images/handover-800.webp', 800, 600, '#163B8C', '#1D4ED8')
    create_image('assets/images/handover-480.webp', 480, 360, '#163B8C', '#1D4ED8')
except ImportError:
    print("Pillow not installed. Trying to create valid blank WebP files using base64 instead.")
