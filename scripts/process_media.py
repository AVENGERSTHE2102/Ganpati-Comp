#!/usr/bin/env python3
import os
import csv
import subprocess
import shutil
import json
import re
from PIL import Image, ImageOps

SOURCE_FOLDER = '/Users/aditya/Developer/marathi1/ganpati-agman-competition/Upload your Artwork - Performance _( Upload a photo , video , PDF , or any other relevant file.) (File responses)'
CSV_FILE = '/Users/aditya/Developer/marathi1/ganpati-agman-competition/Student Kala Katta  (Responses) - Form Responses 1.csv'
TARGET_DIR = '/Users/aditya/Developer/marathi1/ganpati-agman-competition/public/uploads'
TEMP_DIR = '/tmp/ganpati_media_tmp'

os.makedirs(TARGET_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

# Row mappings from our verified analysis
row_file_map = {
    1: ['PXL_20260914_072328080.MP - Vedant Wete.jpg'],
    2: ['BAPPA Poem (1) - Yash.pdf'],
    3: ['IMG-20260914-WA0048 - Kshyanika Behera.jpg'],
    4: ['20260907_133459 - Ninad K.jpg', '20260911_201420 - Ninad K.jpg', 'IMG-20260914-WA0008 - Ninad K.jpg', 'IMG-20260914-WA0010 - Ninad K.jpg'],
    5: ['Copy of Ganpati reel - shreya wagh.mp4', 'IMG_20260914_153959876 - shreya wagh.jpg'],
    6: ['VID-20260916-WA0055 - Ishant Bollu.mp4'],
    7: ['Creative Writing - Shraddha Desai.pdf'],
    8: ['IMG-20260918-WA0002 - Shraddha Desai.jpg', 'IMG_20260920_101602 - Shraddha Desai.jpg'],
    9: ['Isha_Samant_BE_COMPS_Poem - Isha.jpeg'],
    10: ['CBB06A93-0CB4-48E7-B4DE-BD99F07EB15E - Harshita Chavan.mp4', 'IMG_6852 - Harshita Chavan.jpeg', 'IMG_6885 - Harshita Chavan.jpeg', 'IMG_6899 - Harshita Chavan.jpeg'],
    11: ['IMG_20260914_111041567 - OM SANAP.jpg', 'IMG_20260914_223816102_HDR - OM SANAP.jpg', 'IMG_20260915_085522002_HDR - OM SANAP.jpg', 'IMG_20260917_105357407_HDR_PORTRAIT - OM SANAP.jpg', 'VID-20260915-WA0001 - OM SANAP.mp4'],
    12: ['copy_0CD5DA82-2EE0-43DD-9A8E-800C2D23E62A - Saarth Gandre.mov'],
    13: ['VID_20260920_061928_913-1 - Isha.mp4'],
    14: ['20260914_153318 - Isha.jpg', '20260914_180445 - Isha.jpg'],
    15: ['ganpati decore 2026 - Hemal.mp4'],
    16: ['Hibiscus haar - Hemal.jpeg', 'ganu lotus haar - Hemal.jpeg', 'ganu lotus haar 2 - Hemal.jpeg'],
    17: ['IMG-20260925-WA0008 - shreya wagh.jpg', 'IMG_20260916_184211892_HDR_PORTRAIT - shreya wagh.jpg', 'VID-20260918-WA0003 - shreya wagh.mp4'],
    18: ['Ganpati Decoration - 2026 - Chetan Chaudhari.png'],
    19: ['IMG_20260926_002042_339 - Pranav Shrungarpure.webp'],
    20: ['IMG_4057 - Disha.jpeg', 'IMG_4116 - Disha.jpeg'],
    21: ['20260926_200306 - Tanishka Dhone.jpg'],
    22: ['PAARTH_TE_EXTC_IMG1 - Paarth Powar.HEIC', 'PAARTH_TE_EXTC_IMG2 - Paarth Powar.HEIC', 'PAARTH_TE_EXTC_IMG3 - Paarth Powar.HEIC', 'PAARTH_TE_EXTC_IMG4 - Paarth Powar.HEIC', 'PAARTH_TE_EXTC_IMG5 - Paarth Powar.HEIC', 'PAARTH_TE_EXTC_REEL-VIDEO - Paarth Powar.mp4'],
    23: ['Sneha creative writing  - Sneha Kamble.pdf'],
    24: ['VanessaDsouza_CompsA_TY - Vanessa Dsouza.pdf'],
    25: ['VID-20250828-WA0003 - Parth Thakur.mp4'],
    26: ['VID-20260927-WA0004 - Tanishka Dhone.mp4'],
    27: ['IMG_20260915_134138647 - Tejashree Kulkarni.jpg'],
    28: ['IMG_20260914_183443 - Yash Shinde.pdf'],
    29: ['IMG_4402 - Pavan Botla.HEIC', 'IMG_4406 - Pavan Botla.HEIC', 'IMG_4416 - Pavan Botla.MOV', 'IMG_4417 - Pavan Botla.MOV', 'Screenshot_2026-09-26-23-09-57-02_1c337646f29875672b5a61192b9010f9 - Pavan Botla.jpg', 'Untitled 77-4 - Pavan Botla.mp4'],
    30: ['IMG-20260924-WA0027(1) - Tanishka Dhone.jpg'],
    31: ['IMG_20250804_161346__01~3 - Vedant Wete.jpg'],
    32: ['copy_24C0A0D2-5E70-422D-BF12-5F424F563C80 - Saarth Gandre.mov'],
    33: [],
    34: []
}

def sanitize_filename(name):
    # keep only safe alphanumeric and hyphens
    clean = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', name)
    return re.sub(r'_+', '_', clean).strip('_')

processed_cache = {}

def process_file(filename):
    if filename in processed_cache:
        return processed_cache[filename]

    src_path = os.path.join(SOURCE_FOLDER, filename)
    if not os.path.exists(src_path):
        print(f"Error: {src_path} not found!")
        return None

    base, ext = os.path.splitext(filename)
    ext_lower = ext.lower().lstrip('.')
    clean_base = sanitize_filename(base)[:50]

    dest_filename = f"{clean_base}.{ext_lower}"
    poster_filename = None
    mime = "application/octet-stream"
    width = None
    height = None

    # Handle HEIC images -> convert to WebP with proper EXIF rotation
    if ext_lower == 'heic':
        tmp_jpg = os.path.join(TEMP_DIR, f"{clean_base}.jpg")
        dest_filename = f"{clean_base}.webp"
        dest_path = os.path.join(TARGET_DIR, dest_filename)
        # Convert HEIC to JPEG using sips
        subprocess.run(['sips', '-s', 'format', 'jpeg', src_path, '--out', tmp_jpg], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        # Open in PIL and apply exif_transpose
        im = Image.open(tmp_jpg)
        im = ImageOps.exif_transpose(im)
        if im.mode in ('RGBA', 'LA'):
            im = im.convert('RGBA')
        else:
            im = im.convert('RGB')
        im.save(dest_path, 'WEBP', quality=82)
        width, height = im.size
        mime = 'image/webp'
        print(f"Converted & Auto-oriented HEIC -> WebP: {dest_filename} ({width}x{height})")
        if os.path.exists(tmp_jpg):
            os.remove(tmp_jpg)

    # Handle standard images -> convert to WebP with proper EXIF rotation
    elif ext_lower in ['jpg', 'jpeg', 'png', 'webp']:
        dest_filename = f"{clean_base}.webp"
        dest_path = os.path.join(TARGET_DIR, dest_filename)
        im = Image.open(src_path)
        im = ImageOps.exif_transpose(im)
        if im.mode in ('RGBA', 'LA'):
            im = im.convert('RGBA')
        else:
            im = im.convert('RGB')
        im.save(dest_path, 'WEBP', quality=82)
        width, height = im.size
        mime = 'image/webp'
        print(f"Optimized & Auto-oriented Image -> WebP: {dest_filename} ({width}x{height})")

    # Handle PDF
    elif ext_lower == 'pdf':
        dest_filename = f"{clean_base}.pdf"
        dest_path = os.path.join(TARGET_DIR, dest_filename)
        shutil.copy2(src_path, dest_path)
        mime = 'application/pdf'
        print(f"Copied PDF: {dest_filename}")

    # Handle Videos (MP4, MOV)
    elif ext_lower in ['mp4', 'mov', 'webm']:
        dest_filename = f"{clean_base}.mp4"
        dest_path = os.path.join(TARGET_DIR, dest_filename)
        poster_filename = f"{clean_base}_poster.webp"
        poster_path = os.path.join(TARGET_DIR, poster_filename)

        # Web-optimize video with faststart so it streams instantly
        cmd = [
            'ffmpeg', '-y', '-i', src_path,
            '-c:v', 'libx264', '-preset', 'fast', '-crf', '24',
            '-c:a', 'aac', '-b:a', '128k',
            '-movflags', '+faststart',
            dest_path
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # Generate poster thumbnail using ffmpeg + cwebp
        tmp_frame = os.path.join(TEMP_DIR, f"{clean_base}_frame.jpg")
        subprocess.run(['ffmpeg', '-y', '-ss', '00:00:01', '-i', dest_path, '-vframes', '1', tmp_frame], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if os.path.exists(tmp_frame):
            im_frame = Image.open(tmp_frame)
            im_frame = ImageOps.exif_transpose(im_frame)
            im_frame.save(poster_path, 'WEBP', quality=80)
            os.remove(tmp_frame)

        # Probe video dimensions
        try:
            probe_cmd = ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_streams', dest_path]
            p_out = subprocess.check_output(probe_cmd)
            p_data = json.loads(p_out)
            for s in p_data.get('streams', []):
                if s.get('codec_type') == 'video':
                    width = s.get('width')
                    height = s.get('height')
                    break
        except Exception:
            pass

        mime = 'video/mp4'
        print(f"Optimized Video & Poster: {dest_filename} ({width}x{height})")

    file_size = os.path.getsize(os.path.join(TARGET_DIR, dest_filename))
    result = {
        'url': f"/uploads/{dest_filename}",
        'originalName': filename,
        'mime': mime,
        'size': file_size
    }
    if width and height:
        result['width'] = width
        result['height'] = height
        result['isLandscape'] = width > height
    if poster_filename and os.path.exists(os.path.join(TARGET_DIR, poster_filename)):
        result['posterUrl'] = f"/uploads/{poster_filename}"

    processed_cache[filename] = result
    return result

print("Starting media processing...")
all_files = set()
for f_list in row_file_map.values():
    all_files.update(f_list)

for f in sorted(all_files):
    process_file(f)

print(f"Finished processing {len(processed_cache)} unique files!")
