import os
from PIL import Image, ImageDraw

def create_placeholder(filename, width, height, bg_color, line_color):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    img = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(img)
    
    # Draw a grid pattern
    step = 40
    for x in range(0, width, step):
        draw.line([(x, 0), (x, height)], fill=line_color, width=1)
    for y in range(0, height, step):
        draw.line([(0, y), (width, y)], fill=line_color, width=1)
        
    img.save(filename, quality=90)
    print(f"Generated {filename}")

# Hero images - Pale Blue
create_placeholder('assets/images/hero-1200.jpg', 1200, 900, '#EFF6FF', '#DBEAFE')
create_placeholder('assets/images/hero-1200.webp', 1200, 900, '#EFF6FF', '#DBEAFE')
create_placeholder('assets/images/hero-800.webp', 800, 600, '#EFF6FF', '#DBEAFE')
create_placeholder('assets/images/hero-480.webp', 480, 360, '#EFF6FF', '#DBEAFE')

# Handover images - Dark Blue
create_placeholder('assets/images/handover-1200.jpg', 1200, 900, '#1E3A8A', '#1E40AF')
create_placeholder('assets/images/handover-1200.webp', 1200, 900, '#1E3A8A', '#1E40AF')
create_placeholder('assets/images/handover-800.webp', 800, 600, '#1E3A8A', '#1E40AF')
create_placeholder('assets/images/handover-480.webp', 480, 360, '#1E3A8A', '#1E40AF')
