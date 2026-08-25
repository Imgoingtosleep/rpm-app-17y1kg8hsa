const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage destination pointing to storage/sites/
const storageDir = path.join(__dirname, '../../storage/sites');

// Ensure directory exists
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const site_code = req.query.site_code || req.body.site_code || 'UNKNOWN';
    // Use rpm_cycle for [rpm_id] directory name parameter as requested
    const cycleDir = req.query.rpm_cycle || req.body.rpm_cycle || req.query.rpm_id || req.params.rpm_id || req.body.rpm_id || 'UNKNOWN';

    // Helper sanitization for folder names to match rectifier spec
    const getCleanRectNo = () => {
      const rNo = req.body.rect_no || req.query.rect_no || 'rect_1';
      if (rNo.includes('ตู้ที่')) {
        return 'rect_' + rNo.replace(/[^0-9]/g, '');
      }
      return rNo.replace(/\s+/g, '_').toLowerCase();
    };

    const getCleanBankName = () => {
      const bName = req.body.bank_name || req.query.bank_name || 'bank_1';
      return bName.replace(/\s+/g, '_').toLowerCase();
    };

    const getCellNo = () => {
      if (file.fieldname.startsWith('battery_img_')) {
        return file.fieldname.replace('battery_img_', '');
      }
      return req.body.cell_no || req.query.cell_no || '1';
    };

    let targetSubpath = path.join('system_and_facilities', 'misc');
    if (file.fieldname.startsWith('meter_ac') || file.fieldname.startsWith('cable') || 
        file.fieldname.startsWith('change_over') || file.fieldname.startsWith('surge') || 
        file.fieldname.startsWith('mdb_temp') || file.fieldname.startsWith('ground')) {
      targetSubpath = 'power_ac_main';
    } else if (file.fieldname.startsWith('breaker') || file.fieldname.startsWith('pdb_temp') || file.fieldname.startsWith('surge_rect')) {
      // power_rectifier/rect_[no]/
      targetSubpath = path.join('power_rectifier', getCleanRectNo());
    } else if (file.fieldname.startsWith('lithium_bank_img_')) {
      const bankIdx = file.fieldname.replace('lithium_bank_img_', '');
      targetSubpath = path.join('power_rectifier', getCleanRectNo(), `bank_${bankIdx}`);
    } else if (file.fieldname.startsWith('battery')) {
      // power_rectifier/rect_[no]/bank_[bank_no]/batt_[cell_no]/
      targetSubpath = path.join('power_rectifier', getCleanRectNo(), getCleanBankName(), `batt_${getCellNo()}`);
    } else if (file.fieldname.startsWith('alarm')) {
      targetSubpath = path.join('system_and_facilities', 'alarm');
    } else if (file.fieldname.startsWith('vent')) {
      targetSubpath = path.join('system_and_facilities', 'vent');
    } else if (file.fieldname.startsWith('fac')) {
      targetSubpath = path.join('system_and_facilities', 'fac');
    } else if (file.fieldname.startsWith('air') || file.fieldname.startsWith('control')) {
      targetSubpath = path.join('system_and_facilities', 'air');
    }

    // Resolves to: /app/storage/db_img/[site_code]/[rpm_cycle]/[targetSubpath]
    const targetDir = path.join(__dirname, '../../storage/db_img', site_code, String(cycleDir), targetSubpath);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: function (req, file, cb) {
    const site_code = req.query.site_code || req.body.site_code || 'UNKNOWN';
    const cycleDir = req.query.rpm_cycle || req.body.rpm_cycle || req.query.rpm_id || req.params.rpm_id || req.body.rpm_id || 'UNKNOWN';

    const getCleanRectNo = () => {
      const rNo = req.body.rect_no || req.query.rect_no || 'rectifier_1';
      if (rNo.includes('ตู้ที่')) {
        return 'rectifier_' + rNo.replace(/[^0-9]/g, '');
      }
      return rNo.replace(/\s+/g, '_').toLowerCase();
    };

    const getCleanBankName = () => {
      const bName = req.body.bank_name || req.query.bank_name || 'bank_1';
      return bName.replace(/\s+/g, '_').toLowerCase();
    };

    const getCellNo = () => {
      return req.body.cell_no || req.query.cell_no || '1';
    };

    let targetSubpath = path.join('system_and_facilities', 'misc');
    if (file.fieldname.startsWith('meter_ac') || file.fieldname.startsWith('cable') || 
        file.fieldname.startsWith('change_over') || file.fieldname.startsWith('surge') || 
        file.fieldname.startsWith('mdb_temp') || file.fieldname.startsWith('ground')) {
      targetSubpath = 'power_ac_main';
    } else if (file.fieldname.startsWith('breaker') || file.fieldname.startsWith('pdb_temp') || file.fieldname.startsWith('surge_rect')) {
      targetSubpath = path.join('power_rectifier', getCleanRectNo());
    } else if (file.fieldname.startsWith('lithium_bank_img_')) {
      const bankIdx = file.fieldname.replace('lithium_bank_img_', '');
      targetSubpath = path.join('power_rectifier', getCleanRectNo(), `bank_${bankIdx}`);
    } else if (file.fieldname.startsWith('battery')) {
      targetSubpath = path.join('power_rectifier', getCleanRectNo(), getCleanBankName(), `batt_${getCellNo()}`);
    } else if (file.fieldname.startsWith('alarm')) {
      targetSubpath = path.join('system_and_facilities', 'alarm');
    } else if (file.fieldname.startsWith('vent')) {
      targetSubpath = path.join('system_and_facilities', 'vent');
    } else if (file.fieldname.startsWith('fac')) {
      targetSubpath = path.join('system_and_facilities', 'fac');
    } else if (file.fieldname.startsWith('air') || file.fieldname.startsWith('control')) {
      targetSubpath = path.join('system_and_facilities', 'air');
    }

    const targetDir = path.join(__dirname, '../../storage/db_img', site_code, String(cycleDir), targetSubpath);

    // Map exact filenames according to storage files layout
    let filePrefix = file.fieldname;
    
    // Remove _img suffix if present to check clean names
    if (filePrefix.endsWith('_img')) {
      filePrefix = filePrefix.substring(0, filePrefix.length - 4);
    }
    
    if (filePrefix === 'battery') {
      const cellNo = getCellNo();
      filePrefix = `battery${cellNo}_img`;
    } else if (filePrefix === 'meter_ac') {
      filePrefix = 'master_ac_img';
    } else if (filePrefix === 'vent_air_cond') {
      filePrefix = 'vent_air_cloud'; // typo match from storage: "vent_air_cloud_1.jpg"
    } else if (filePrefix === 'vent_filters') {
      filePrefix = 'vent_filters';
    } else if (filePrefix === 'vent_filter_door') {
      filePrefix = 'vent_filters_door';
    } else if (filePrefix === 'vent_filter_window') {
      filePrefix = 'vent_filters_window';
    } else if (filePrefix === 'vent_filter_equip') {
      filePrefix = 'vent_filters_equip';
    } else if (filePrefix === 'fac_grass_cut') {
      filePrefix = 'fac_glass_cut';
    } else {
      const isPowerOrBattery = file.fieldname.startsWith('meter_ac') || 
                               file.fieldname.startsWith('cable') || 
                               file.fieldname.startsWith('change_over') || 
                               file.fieldname.startsWith('surge') || 
                               file.fieldname.startsWith('mdb_temp') || 
                               file.fieldname.startsWith('ground') ||
                               file.fieldname.startsWith('breaker') ||
                               file.fieldname.startsWith('pdb_temp') ||
                               file.fieldname.startsWith('surge_rect') ||
                               file.fieldname.startsWith('battery');
                               
      if (isPowerOrBattery) {
        if (!filePrefix.endsWith('_img')) {
          filePrefix = `${filePrefix}_img`;
        }
      }
    }

    // Determine highest index (1-10) with request-scoped caching to prevent race conditions during bulk uploads
    if (!req.nextIndices) {
      req.nextIndices = {};
    }

    if (req.nextIndices[filePrefix] !== undefined) {
      req.nextIndices[filePrefix] += 1;
    } else {
      let maxIdx = 0;
      if (fs.existsSync(targetDir)) {
        const files = fs.readdirSync(targetDir);
        const matched = files.filter(f => f.startsWith(filePrefix + '_'));
        matched.forEach(name => {
          const base = path.basename(name, path.extname(name));
          const parts = base.split('_');
          if (parts.length >= 2) {
            const idxVal = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(idxVal) && idxVal > maxIdx) {
              maxIdx = idxVal;
            }
          }
        });
      }
      req.nextIndices[filePrefix] = maxIdx + 1;
    }

    let nextIndex = req.nextIndices[filePrefix];
    if (nextIndex > 10) {
      nextIndex = ((nextIndex - 1) % 10) + 1;
    }

    // Format matches: [filePrefix]_[index].jpg
    cb(null, `${filePrefix}_${nextIndex}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = upload;
