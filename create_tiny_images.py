import base64
import os

# 1x1 transparent WebP
webp_b64 = "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="
webp_bytes = base64.b64decode(webp_b64)

# 1x1 transparent GIF (we can use this for jpg to avoid complex JPEG encoding, browsers usually don't care about extension if it's a valid image)
# Actually, let's just use a tiny valid JPEG:
jpeg_b64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
jpeg_bytes = base64.b64decode(jpeg_b64)

files = [
    ('assets/images/hero-1200.jpg', jpeg_bytes),
    ('assets/images/hero-1200.webp', webp_bytes),
    ('assets/images/hero-800.webp', webp_bytes),
    ('assets/images/hero-480.webp', webp_bytes),
    ('assets/images/handover-1200.jpg', jpeg_bytes),
    ('assets/images/handover-1200.webp', webp_bytes),
    ('assets/images/handover-800.webp', webp_bytes),
    ('assets/images/handover-480.webp', webp_bytes)
]

for filepath, data in files:
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, 'wb') as f:
        f.write(data)
    print(f"Created {filepath}")

