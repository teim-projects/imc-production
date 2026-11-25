import os
import django
from PIL import Image, ImageDraw, ImageFont

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "imc_backend.settings")
django.setup()

from django.conf import settings
from api.models import Singer, SingingClass

media_root = settings.MEDIA_ROOT
singer_photo_dir = os.path.join(media_root, "singer", "photos")
student_photo_dir = os.path.join(media_root, "student", "photos")
os.makedirs(singer_photo_dir, exist_ok=True)
os.makedirs(student_photo_dir, exist_ok=True)

def create_celebrant_avatar(filepath, name, role, start_rgb, end_rgb, initial):
    width, height = 500, 500
    img = Image.new("RGB", (width, height), start_rgb)
    draw = ImageDraw.Draw(img)

    # Vertical gradient
    for y in range(height):
        r = int(start_rgb[0] + (end_rgb[0] - start_rgb[0]) * (y / height))
        g = int(start_rgb[1] + (end_rgb[1] - start_rgb[1]) * (y / height))
        b = int(start_rgb[2] + (end_rgb[2] - start_rgb[2]) * (y / height))
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    # Circular portrait frame
    cx, cy, r_outer = 250, 200, 130
    draw.ellipse([cx - r_outer - 8, cy - r_outer - 8, cx + r_outer + 8, cy + r_outer + 8], outline=(255, 255, 255, 120), width=3)
    draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], fill=(255, 255, 255, 30), outline=(255, 255, 255), width=6)

    try:
        font_init = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 96)
        font_name = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
        font_role = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except Exception:
        font_init = ImageFont.load_default()
        font_name = ImageFont.load_default()
        font_role = ImageFont.load_default()

    draw.text((cx, cy), initial, fill=(255, 255, 255), font=font_init, anchor="mm")

    # Name plate at bottom
    draw.rectangle([0, 390, width, 500], fill=(15, 23, 42))
    draw.line([(0, 390), (width, 390)], fill=(245, 158, 11), width=4)
    draw.text((cx, 428), name.upper(), fill=(255, 255, 255), font=font_name, anchor="mm")
    draw.text((cx, 465), f"IMC {role.upper()}", fill=(251, 191, 36), font=font_role, anchor="mm")

    img.save(filepath, "JPEG", quality=95)
    print(f"Created avatar: {filepath}")

# 1. Aarav Mehta (Singer) - Warm Indigo/Purple
p1 = os.path.join(singer_photo_dir, "aarav_mehta.jpg")
create_celebrant_avatar(p1, "Aarav Mehta", "Singer", (79, 70, 229), (147, 51, 234), "AM")
s1 = Singer.objects.filter(email="aarav.mehta@imcpune.in").first()
if s1:
    s1.photo = "singer/photos/aarav_mehta.jpg"
    s1.save()
    print(f"Attached photo to {s1.name}")

# 2. Sneha Deshmukh (Singer) - Rose/Coral
p2 = os.path.join(singer_photo_dir, "sneha_deshmukh.jpg")
create_celebrant_avatar(p2, "Sneha Deshmukh", "Singer", (225, 29, 72), (244, 63, 94), "SD")
s2 = Singer.objects.filter(email="sneha.deshmukh@imcpune.in").first()
if s2:
    s2.photo = "singer/photos/sneha_deshmukh.jpg"
    s2.save()
    print(f"Attached photo to {s2.name}")

# 3. Pooja Patil (Singer) - Amber/Orange
p3 = os.path.join(singer_photo_dir, "pooja_patil.jpg")
create_celebrant_avatar(p3, "Pooja Patil", "Singer", (217, 119, 6), (245, 158, 11), "PP")
s3 = Singer.objects.filter(email="pooja.patil@imcpune.in").first()
if s3:
    s3.photo = "singer/photos/pooja_patil.jpg"
    s3.save()
    print(f"Attached photo to {s3.name}")

# 4. Rohan Kulkarni (Student) - Emerald/Teal
p4 = os.path.join(student_photo_dir, "rohan_kulkarni.jpg")
create_celebrant_avatar(p4, "Rohan Kulkarni", "Student", (5, 150, 105), (16, 185, 129), "RK")
st1 = SingingClass.objects.filter(email="rohan.k@imcpune.in").first()
if st1:
    st1.photo = "student/photos/rohan_kulkarni.jpg"
    st1.save()
    print(f"Attached photo to {st1.first_name} {st1.last_name}")

# 5. Ananya Verma (Student) - Sky/Cyan
p5 = os.path.join(student_photo_dir, "ananya_verma.jpg")
create_celebrant_avatar(p5, "Ananya Verma", "Student", (2, 132, 199), (14, 165, 233), "AV")
st2 = SingingClass.objects.filter(email="ananya.verma@imcpune.in").first()
if st2:
    st2.photo = "student/photos/ananya_verma.jpg"
    st2.save()
    print(f"Attached photo to {st2.first_name} {st2.last_name}")

print("\nAll celebrants have been successfully assigned profile photos!")
