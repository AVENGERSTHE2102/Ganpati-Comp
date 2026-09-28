const fs = require('fs');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');
require('dotenv').config();

const CSV_FILE = path.join(__dirname, '..', 'Student Kala Katta  (Responses) - Form Responses 1.csv');
const UPLOADS_DIR = path.join(__dirname, '..', 'public', 'uploads');
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Row mapping to original file names
const row_file_map = {
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
};

// Row category mapping based on user specifications:
// 1. Home Decor
// 2. Reels n videography
// 3. Poetry n literature
// 4. Artistic (other write-ins)
const row_category_map = {
  1: 'home-decor',
  2: 'literature',
  3: 'home-decor',
  4: 'home-decor',
  5: 'reels',
  6: 'home-decor',
  7: 'literature',
  8: 'home-decor',
  9: 'literature',
  10: 'home-decor',
  11: 'home-decor',
  12: 'home-decor',
  13: 'reels',
  14: 'home-decor',
  15: 'reels',
  16: 'home-decor',
  17: 'home-decor',
  18: 'home-decor',
  19: 'literature',
  20: 'home-decor',
  21: 'home-decor',
  22: 'home-decor',
  23: 'literature',
  24: 'literature',
  25: 'home-decor',
  26: 'reels',
  27: 'home-decor',
  28: 'home-decor',
  29: 'artistic',
  30: 'reels',
  31: 'artistic',
  32: 'reels',
  33: 'home-decor',
  34: 'literature'
};

function sanitizeFilename(name) {
  const clean = name.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  return clean.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

function resolveProcessedFiles(origName) {
  const ext = path.extname(origName).toLowerCase().replace('.', '');
  const base = path.basename(origName, path.extname(origName));
  const cleanBase = sanitizeFilename(base).slice(0, 50);

  if (ext === 'pdf') {
    // Check if multi-page rendered webp exists (_1, _2, etc)
    const page1 = `${cleanBase}_1.webp`;
    if (fs.existsSync(path.join(UPLOADS_DIR, page1))) {
      const results = [];
      let pageNum = 1;
      while (fs.existsSync(path.join(UPLOADS_DIR, `${cleanBase}_${pageNum}.webp`))) {
        const pName = `${cleanBase}_${pageNum}.webp`;
        const pPath = path.join(UPLOADS_DIR, pName);
        results.push({
          url: `/uploads/${pName}`,
          originalName: `${origName} (Page ${pageNum})`,
          mime: 'image/webp',
          size: fs.statSync(pPath).size
        });
        pageNum++;
      }
      return results;
    }
    // Single page webp
    const singleWebp = `${cleanBase}.webp`;
    if (fs.existsSync(path.join(UPLOADS_DIR, singleWebp))) {
      const pPath = path.join(UPLOADS_DIR, singleWebp);
      return [{
        url: `/uploads/${singleWebp}`,
        originalName: origName,
        mime: 'image/webp',
        size: fs.statSync(pPath).size
      }];
    }
  }

  let targetExt = ext;
  let mime = 'application/octet-stream';
  let posterUrl = null;

  if (['jpg', 'jpeg', 'png', 'heic', 'webp'].includes(ext)) {
    targetExt = 'webp';
    mime = 'image/webp';
  } else if (ext === 'pdf') {
    targetExt = 'pdf';
    mime = 'application/pdf';
  } else if (['mp4', 'mov', 'webm'].includes(ext)) {
    targetExt = 'mp4';
    mime = 'video/mp4';
    const posterFilename = `${cleanBase}_poster.webp`;
    if (fs.existsSync(path.join(UPLOADS_DIR, posterFilename))) {
      posterUrl = `/uploads/${posterFilename}`;
    }
  }

  const targetFilename = `${cleanBase}.${targetExt}`;
  const targetPath = path.join(UPLOADS_DIR, targetFilename);
  const size = fs.existsSync(targetPath) ? fs.statSync(targetPath).size : 0;

  return [{
    url: `/uploads/${targetFilename}`,
    originalName: origName,
    mime,
    size,
    posterUrl
  }];
}

// Simple CSV parser supporting quotes & newlines
function parseCSV(content) {
  const lines = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      row.push(cell);
      if (row.length > 1 || row[0] !== '') lines.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    lines.push(row);
  }
  return lines;
}

async function main() {
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const rows = parseCSV(csvContent);
  const dataRows = rows.slice(1);

  console.log(`Found ${dataRows.length} rows in CSV.`);

  const submissions = [];

  for (let i = 0; i < dataRows.length; i++) {
    const rowNum = i + 1;
    const r = dataRows[i];

    const timestamp = (r[0] || '').trim();
    const email = (r[1] || '').trim();
    const name = (r[2] || '').trim();
    const year = (r[3] || '').trim();
    const department = (r[4] || '').trim();
    const mobile = (r[5] || '').trim();
    const rawTalent = (r[6] || '').trim();
    const title = (r[7] || '').trim() || 'Ganpati Celebration';
    if (title.includes('निसर्गाच्या कुशीत विघ्नहर्ता')) continue;
    const description = (r[8] || '').trim();
    const specialNote = (r[12] || '').trim();

    const categoryKey = row_category_map[rowNum] || 'home-decor';
    const origFiles = row_file_map[rowNum] || [];
    let files = origFiles.flatMap(resolveProcessedFiles);

    // Handle Saumil Tharwal (Row 33 / 34)
    if (rowNum === 33 && files.length === 0) {
      files = [{
        url: '/uploads/Saumil_Tharwal_Decor.webp',
        originalName: 'Saumil_Tharwal_Decor.webp',
        mime: 'image/webp',
        size: fs.existsSync(path.join(UPLOADS_DIR, 'Saumil_Tharwal_Decor.webp')) ? fs.statSync(path.join(UPLOADS_DIR, 'Saumil_Tharwal_Decor.webp')).size : 83422
      }];
    }

    // Deterministic ObjectId and Code
    const hash = crypto.createHash('md5').update(`entry_${rowNum}_${name}_${title}`).digest('hex');
    const id = hash.slice(0, 24);
    const submissionCode = `GA26-${hash.slice(24, 30).toUpperCase()}`;

    const submission = {
      _id: id,
      id,
      submissionCode,
      name,
      year,
      department,
      email,
      mobile,
      title,
      description,
      specialNote,
      category: categoryKey,
      files,
      status: 'approved',
      createdAt: new Date('2026-09-27T10:00:00.000Z'),
      updatedAt: new Date('2026-09-27T10:00:00.000Z')
    };

    submissions.push(submission);
  }

  // Save to data/submissions.json
  const jsonPath = path.join(DATA_DIR, 'submissions.json');
  fs.writeFileSync(jsonPath, JSON.stringify(submissions, null, 2), 'utf-8');
  console.log(`Saved ${submissions.length} submissions to ${jsonPath}`);

  // Seed MongoDB
  if (process.env.MONGODB_URI) {
    try {
      const client = new MongoClient(process.env.MONGODB_URI);
      await client.connect();
      const db = client.db(process.env.MONGODB_DB_NAME || 'marathi_club');
      const collection = db.collection('submissions');

      // Upsert each submission with exact ObjectId
      for (const s of submissions) {
        const { _id, ...doc } = s;
        await collection.updateOne(
          { submissionCode: s.submissionCode },
          { $set: { ...doc, _id: new ObjectId(s.id), updatedAt: new Date() } },
          { upsert: true }
        );
      }
      console.log(`Successfully seeded ${submissions.length} submissions in MongoDB!`);
      await client.close();
    } catch (e) {
      console.error('Error seeding MongoDB:', e.message);
    }
  }
}

main().catch(console.error);
