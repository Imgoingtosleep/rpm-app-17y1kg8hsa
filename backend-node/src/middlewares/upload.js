const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage destination pointing to storage/sites/
const storageDir = path.join(__dirname, '../../../storage/sites');

// Ensure directory exists
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // We will extract site_code and rpm_id.
    // In our upload scenario, rpm_id is usually in req.params.rpm_id.
    // If not found (e.g. battery upload where req.params has rect_id), we might need another way,
    // but we can query it or pass it. Or we can resolve site_code and rpm_id dynamically.
    // To make it robust, we can create directories dynamically in the destination function!
    // Since req.params may contain rpm_id directly. Let's write a helper to determine paths.
    
    let siteCode = req.body.site_code || 'UNKNOWN';
    let rpmId = req.params.rpm_id || req.body.rpm_id || 'UNKNOWN';

    // If it's a battery upload, req.params.rect_id is present. We will handle rect_id to find rpmId and siteCode.
    // Since destination is synchronous, and fetching DB is async, we can store uploads in a temp directory,
    // or we can design the routes to resolve this.
    // Wait, multer's destination is sync. However, we can pass site_code and rpm_id in headers or query params,
    // or as body fields if sent BEFORE the files in FormData.
    // Frontend sends FormData. In multi-part, fields MUST be appended BEFORE files for multer to see them in req.body.
    // Let's check headers or query parameters as a fallback! It's much cleaner if we pass them via query parameters (e.g. ?site_code=BKK-999&rpm_id=12) or headers!
    
    const site_code = req.query.site_code || req.body.site_code || 'UNKNOWN';
    const rpm_id = req.query.rpm_id || req.params.rpm_id || req.body.rpm_id || 'UNKNOWN';

    let subFolder = 'misc';
    if (file.fieldname.startsWith('meter_ac') || file.fieldname.startsWith('cable') || 
        file.fieldname.startsWith('change_over') || file.fieldname.startsWith('surge') || 
        file.fieldname.startsWith('mdb_temp') || file.fieldname.startsWith('ground')) {
      subFolder = 'ac_main';
    } else if (file.fieldname.startsWith('breaker') || file.fieldname.startsWith('pdb_temp') || 
               file.fieldname.startsWith('surge_rect') || file.fieldname.startsWith('battery')) {
      // We will handle rect_no and bank_name inside power_rectifier if possible, or just keep them in power_rectifier directory.
      subFolder = 'power_rectifier';
    } else if (file.fieldname.startsWith('alarm') || file.fieldname.startsWith('vent') || file.fieldname.startsWith('fac')) {
      subFolder = 'systems_and_facilities';
    }

    // Resolve target directory: storage/sites/[site_code]/[rpm_id]/db_img/[subFolder]
    const targetDir = path.join(__dirname, '../../../storage/sites', site_code, String(rpm_id), 'db_img', subFolder);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    // We will look into req.destDir (or we can compute it here since we have req, file)
    const site_code = req.query.site_code || req.body.site_code || 'UNKNOWN';
    const rpm_id = req.query.rpm_id || req.params.rpm_id || req.body.rpm_id || 'UNKNOWN';

    let subFolder = 'misc';
    if (file.fieldname.startsWith('meter_ac') || file.fieldname.startsWith('cable') || 
        file.fieldname.startsWith('change_over') || file.fieldname.startsWith('surge') || 
        file.fieldname.startsWith('mdb_temp') || file.fieldname.startsWith('ground')) {
      subFolder = 'ac_main';
    } else if (file.fieldname.startsWith('breaker') || file.fieldname.startsWith('pdb_temp') || 
               file.fieldname.startsWith('surge_rect') || file.fieldname.startsWith('battery')) {
      subFolder = 'power_rectifier';
    } else if (file.fieldname.startsWith('alarm') || file.fieldname.startsWith('vent') || file.fieldname.startsWith('fac')) {
      subFolder = 'systems_and_facilities';
    }

    const targetDir = path.join(__dirname, '../../../storage/sites', site_code, String(rpm_id), 'db_img', subFolder);
    
    // Find files matching the fieldname prefix in the folder to compute next index
    let nextIndex = 1;
    if (fs.existsSync(targetDir)) {
      const files = fs.readdirSync(targetDir);
      const matched = files.filter(f => f.startsWith(file.fieldname + '-'));
      
      // Determine the highest index currently present
      let maxIdx = 0;
      matched.forEach(name => {
        // e.g. name = "meter_ac-1-1718291.jpg" or similar
        const parts = name.split('-');
        if (parts.length >= 2) {
          const idxVal = parseInt(parts[1], 10);
          if (!isNaN(idxVal) && idxVal > maxIdx) {
            maxIdx = idxVal;
          }
        }
      });
      nextIndex = maxIdx + 1;
      if (nextIndex > 10) {
        // Wrap around or keep it at 10. Let's make it wrap around to 1, or block at 10.
        // The user says limit to 10 images. So we will wrap around or limit.
        // Let's cap/wrap around to modulo 10 (1 to 10 range)
        nextIndex = ((nextIndex - 1) % 10) + 1;
      }
    }

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E4);
    cb(null, file.fieldname + '-' + nextIndex + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;
