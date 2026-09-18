import os
from PIL import Image, ImageDraw, ImageFont

# Set up directories
os.makedirs('assets/icons', exist_ok=True)

# 1. Process Logo & Favicons
try:
    logo = Image.open('logo.png').convert('RGBA')
    
    # Generate favicons
    sizes = [
        (16, 'assets/icons/favicon-16x16.png'),
        (32, 'assets/icons/favicon-32x32.png'),
        (180, 'assets/icons/apple-touch-icon.png'),
        (192, 'assets/icons/icon-192.png'),
        (512, 'assets/icons/icon-512.png')
    ]
    
    for size, path in sizes:
        # Resize using LANCZOS for high quality
        resized = logo.resize((size, size), Image.Resampling.LANCZOS)
        resized.save(path)
        print(f"Generated {path}")

    # Generate ICO format (can contain multiple sizes)
    logo.save('favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("Generated favicon.ico")

    # 2. Generate Open Graph Image (1200x630)
    # Create background #2563EB (ParkDrop blue)
    og_img = Image.new('RGB', (1200, 630), '#2563EB')
    draw = ImageDraw.Draw(og_img)
    
    # Try to load Manrope font, fallback to default if not found
    try:
        # Assuming fonts are present in the environment or we can use default
        font_large = ImageFont.truetype('assets/fonts/Manrope-latin.woff2', 64)
        font_small = ImageFont.truetype('assets/fonts/Manrope-latin.woff2', 32)
    except IOError:
        print("Could not load Manrope font, using default")
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # We need to paste the logo onto the OG image.
    # The logo is probably blue on white/transparent. Let's create a white rounded rectangle for it to sit on to ensure visibility.
    # First, resize logo for OG image (let's say 400px wide, keeping aspect ratio)
    w_percent = (400 / float(logo.size[0]))
    h_size = int((float(logo.size[1]) * float(w_percent)))
    og_logo = logo.resize((400, h_size), Image.Resampling.LANCZOS)
    
    # Paste logo in center vertically, towards the left
    paste_x = 100
    paste_y = (630 - h_size) // 2
    
    # Draw a white background pill for the logo for better contrast against the blue OG background
    padding = 40
    # draw.rounded_rectangle([paste_x - padding, paste_y - padding, paste_x + 400 + padding, paste_y + h_size + padding], radius=20, fill='white')
    
    # Since the logo itself might just be white text or blue, we'll just paste it for now.
    # Actually, the user's logo is blue/dark blue text with a blue icon. Let's make the background white instead, and text dark.
    og_img = Image.new('RGB', (1200, 630), '#F8FAFC')
    draw = ImageDraw.Draw(og_img)
    
    og_img.paste(og_logo, (100, 150), og_logo)

    # Add Text
    headline = "Receive packages.\nFind them in seconds."
    subline = "100% free parcel management for local park businesses."
    
    draw.text((100, 150 + h_size + 60), headline, fill='#111827', font=font_large)
    draw.text((100, 150 + h_size + 240), subline, fill='#475569', font=font_small)
    
    # Add decorative element (blue bar at the bottom)
    draw.rectangle([0, 610, 1200, 630], fill='#2563EB')

    og_img.save('assets/images/parkdrop-og.jpg', quality=95)
    print("Generated assets/images/parkdrop-og.jpg")

except Exception as e:
    print(f"Error processing images: {e}")
