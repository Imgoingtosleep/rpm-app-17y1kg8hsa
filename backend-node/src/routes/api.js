const express = require('express');
const router = express.Router();
const db = require('../config/db');
const upload = require('../middlewares/upload');

// 1. Get all sites
router.get('/sites', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sites ORDER BY site_code;');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Load or Start Work Order
router.post('/workorder/start', async (req, res) => {
  const { site_code, job_number_sl6, sap_number, rpm_cycle, inspection_date_time } = req.body;
  try {
    // Check if master record exists
    const existing = await db.query(
      'SELECT * FROM rpm_records_master WHERE site_code = $1 ORDER BY created_at DESC LIMIT 1;',
      [site_code]
    );

    if (existing.rows.length > 0) {
      return res.json({ message: 'Loaded existing record', data: existing.rows[0], isNew: false });
    }

    // Create a new master record
    const newRecord = await db.query(
      'INSERT INTO rpm_records_master (site_code, job_number_sl6, sap_number, rpm_cycle, inspection_date_time) VALUES ($1, $2, $3, $4, $5) RETURNING *;',
      [site_code, job_number_sl6 || `SL6-${site_code}-${Date.now()}`, sap_number || `SAP-${site_code}-${Date.now()}`, rpm_cycle || null, inspection_date_time || null]
    );

    res.status(201).json({ message: 'Started new work order', data: newRecord.rows[0], isNew: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update Master Record Info
router.put('/workorder/:rpm_id/master', async (req, res) => {
  const { rpm_id } = req.params;
  const { job_number_sl6, sap_number, summary_issue, rpm_cycle, inspection_date_time } = req.body;
  try {
    const result = await db.query(
      'UPDATE rpm_records_master SET job_number_sl6 = $1, sap_number = $2, summary_issue = $3, rpm_cycle = $4, inspection_date_time = $5 WHERE rpm_id = $6 RETURNING *;',
      [job_number_sl6, sap_number, summary_issue, rpm_cycle, inspection_date_time || null, rpm_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get & Update AC Main details
router.get('/workorder/:rpm_id/ac', async (req, res) => {
  const { rpm_id } = req.params;
  try {
    const result = await db.query('SELECT * FROM power_main_ac WHERE rpm_id = $1;', [rpm_id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workorder/:rpm_id/ac', upload.fields([
  { name: 'meter_ac_img', maxCount: 1 },
  { name: 'cable_img', maxCount: 1 },
  { name: 'change_over_img', maxCount: 1 },
  { name: 'surge_img', maxCount: 1 },
  { name: 'mdb_temp_img', maxCount: 1 },
  { name: 'ground_img', maxCount: 1 }
]), async (req, res) => {
  const { rpm_id } = req.params;
  const {
    meter_ac_size, cable_status, change_over_switch, ac_phase_qty,
    surge_protection, mdb_temp, voltage_p1, voltage_p2, voltage_p3,
    current_p1, current_p2, current_p3, ground_resistance
  } = req.body;

  // Retrieve file paths from multer
  const getSiteCode = () => req.query.site_code || req.body.site_code || 'UNKNOWN';
  const getSubFolder = (fieldname) => {
    if (fieldname.startsWith('meter_ac') || fieldname.startsWith('cable') || 
        fieldname.startsWith('change_over') || fieldname.startsWith('surge') || 
        fieldname.startsWith('mdb_temp') || fieldname.startsWith('ground')) {
      return 'ac_main';
    }
    return 'misc';
  };
  const getPath = (fieldname) => req.files[fieldname] ? `/storage/sites/${getSiteCode()}/${rpm_id}/db_img/${getSubFolder(fieldname)}/${req.files[fieldname][0].filename}` : null;

  try {
    const existing = await db.query('SELECT * FROM power_main_ac WHERE rpm_id = $1;', [rpm_id]);
    
    // Helper to merge existing paths array and new path, limiting to 10
    const mergeImgs = (existingRow, fieldName) => {
      let arr = [];
      if (existingRow && Array.isArray(existingRow[`${fieldName}_img`])) {
        arr = [...existingRow[`${fieldName}_img`]];
      } else if (existingRow && existingRow[`${fieldName}_img`]) {
        arr = [existingRow[`${fieldName}_img`]];
      }
      
      const newFile = getPath(`${fieldName}_img`);
      if (newFile) {
        arr.push(newFile);
      } else if (req.body[`${fieldName}_img_path`]) {
        // If sent as path/array from client
        const pathVal = req.body[`${fieldName}_img_path`];
        if (Array.isArray(pathVal)) arr = pathVal;
        else if (typeof pathVal === 'string' && !arr.includes(pathVal)) arr.push(pathVal);
      }
      // Cap at 10
      if (arr.length > 10) arr = arr.slice(-10);
      return arr;
    };

    const existingRow = existing.rows[0] || null;
    const meter_ac_img = mergeImgs(existingRow, 'meter_ac');
    const cable_img = mergeImgs(existingRow, 'cable');
    const change_over_img = mergeImgs(existingRow, 'change_over');
    const surge_img = mergeImgs(existingRow, 'surge');
    const mdb_temp_img = mergeImgs(existingRow, 'mdb_temp');
    const ground_img = mergeImgs(existingRow, 'ground');

    let result;
    if (existing.rows.length > 0) {
      result = await db.query(
        `UPDATE power_main_ac SET 
          meter_ac_size = $1, meter_ac_img = $2, cable_status = $3, cable_img = $4,
          change_over_switch = $5, change_over_img = $6, ac_phase_qty = $7, surge_protection = $8,
          surge_img = $9, mdb_temp = $10, mdb_temp_img = $11, voltage_p1 = $12, voltage_p2 = $13,
          voltage_p3 = $14, current_p1 = $15, current_p2 = $16, current_p3 = $17, ground_resistance = $18, ground_img = $19
        WHERE rpm_id = $20 RETURNING *;`,
        [
          meter_ac_size, meter_ac_img, cable_status, cable_img,
          change_over_switch, change_over_img, ac_phase_qty, surge_protection,
          surge_img, mdb_temp || null, mdb_temp_img, voltage_p1 || null, voltage_p2 || null,
          voltage_p3 || null, current_p1 || null, current_p2 || null, current_p3 || null, ground_resistance || null, ground_img,
          rpm_id
        ]
      );
    } else {
      result = await db.query(
        `INSERT INTO power_main_ac (
          rpm_id, meter_ac_size, meter_ac_img, cable_status, cable_img,
          change_over_switch, change_over_img, ac_phase_qty, surge_protection,
          surge_img, mdb_temp, mdb_temp_img, voltage_p1, voltage_p2,
          voltage_p3, current_p1, current_p2, current_p3, ground_resistance, ground_img
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *;`,
        [
          rpm_id, meter_ac_size, meter_ac_img, cable_status, cable_img,
          change_over_switch, change_over_img, ac_phase_qty, surge_protection,
          surge_img, mdb_temp || null, mdb_temp_img, voltage_p1 || null, voltage_p2 || null,
          voltage_p3 || null, current_p1 || null, current_p2 || null, current_p3 || null, ground_resistance || null, ground_img
        ]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Rectifiers
router.get('/workorder/:rpm_id/rectifiers', async (req, res) => {
  const { rpm_id } = req.params;
  try {
    const result = await db.query('SELECT * FROM power_rectifier WHERE rpm_id = $1 ORDER BY rect_no;', [rpm_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workorder/:rpm_id/rectifier', upload.fields([
  { name: 'breaker_img', maxCount: 1 },
  { name: 'pdb_temp_img', maxCount: 1 },
  { name: 'surge_rect_img', maxCount: 1 }
]), async (req, res) => {
  const { rpm_id } = req.params;
  const {
    rect_no, model, ac_cable_size, breaker_size, modules_all, modules_fail,
    input_current_ac, output_current_dc, surge_status
  } = req.body;

  const getSiteCode = () => req.query.site_code || req.body.site_code || 'UNKNOWN';
  const getPath = (fieldname) => req.files[fieldname] ? `/storage/sites/${getSiteCode()}/${rpm_id}/db_img/power_rectifier/${req.files[fieldname][0].filename}` : null;

  try {
    const existing = await db.query('SELECT * FROM power_rectifier WHERE rpm_id = $1 AND rect_no = $2;', [rpm_id, rect_no]);
    
    const mergeImgs = (existingRow, fieldName) => {
      let arr = [];
      if (existingRow && Array.isArray(existingRow[`${fieldName}_img`])) {
        arr = [...existingRow[`${fieldName}_img`]];
      } else if (existingRow && existingRow[`${fieldName}_img`]) {
        arr = [existingRow[`${fieldName}_img`]];
      }
      
      const newFile = getPath(`${fieldName}_img`);
      if (newFile) {
        arr.push(newFile);
      } else if (req.body[`${fieldName}_img_path`]) {
        const pathVal = req.body[`${fieldName}_img_path`];
        if (Array.isArray(pathVal)) arr = pathVal;
        else if (typeof pathVal === 'string' && !arr.includes(pathVal)) arr.push(pathVal);
      }
      if (arr.length > 10) arr = arr.slice(-10);
      return arr;
    };

    const existingRow = existing.rows[0] || null;
    const breaker_img = mergeImgs(existingRow, 'breaker');
    const pdb_temp_img = mergeImgs(existingRow, 'pdb_temp');
    const surge_rect_img = mergeImgs(existingRow, 'surge_rect');

    let result;
    if (existing.rows.length > 0) {
      result = await db.query(
        `UPDATE power_rectifier SET 
          model = $1, ac_cable_size = $2, breaker_size = $3, breaker_img = $4,
          modules_all = $5, modules_fail = $6, input_current_ac = $7, output_current_dc = $8,
          pdb_temp_img = $9, surge_status = $10, surge_rect_img = $11
        WHERE rect_id = $12 RETURNING *;`,
        [model, ac_cable_size, breaker_size, breaker_img, modules_all, modules_fail, input_current_ac, output_current_dc, pdb_temp_img, surge_status, surge_rect_img, existing.rows[0].rect_id]
      );
    } else {
      result = await db.query(
        `INSERT INTO power_rectifier (
          rpm_id, rect_no, model, ac_cable_size, breaker_size, breaker_img,
          modules_all, modules_fail, input_current_ac, output_current_dc, pdb_temp_img, surge_status, surge_rect_img
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *;`,
        [rpm_id, rect_no, model, ac_cable_size, breaker_size, breaker_img, modules_all, modules_fail, input_current_ac, output_current_dc, pdb_temp_img, surge_status, surge_rect_img]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Battery tests
router.get('/rectifier/:rect_id/batteries', async (req, res) => {
  const { rect_id } = req.params;
  try {
    const result = await db.query(
      `SELECT bt.*, rb.bank_name 
       FROM battery_tests bt 
       JOIN rectifier_banks rb ON bt.bank_id = rb.bank_id 
       WHERE rb.rect_id = $1 
       ORDER BY rb.bank_name, bt.cell_no;`,
      [rect_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rectifier/:rect_id/battery', upload.single('battery_img'), async (req, res) => {
  const { rect_id } = req.params;
  const { bank_name, cell_no, voltage, internal_resistance, status } = req.body;
  let rpm_id = req.query.rpm_id || 'UNKNOWN';
  let site_code = req.query.site_code || req.body.site_code || 'UNKNOWN';

  // If rpm_id or site_code is not passed, let's query them from rectifier
  if (rpm_id === 'UNKNOWN' || site_code === 'UNKNOWN') {
    const rectQuery = await db.query(
      'SELECT r.rpm_id, m.site_code FROM power_rectifier r JOIN rpm_records_master m ON r.rpm_id = m.rpm_id WHERE r.rect_id = $1;',
      [rect_id]
    );
    if (rectQuery.rows.length > 0) {
      rpm_id = rectQuery.rows[0].rpm_id;
      site_code = rectQuery.rows[0].site_code;
    }
  }

  const battery_img = req.file ? `/storage/sites/${site_code}/${rpm_id}/db_img/power_rectifier/${req.file.filename}` : req.body.battery_img_path || null;

  try {
    // 1. Get or Create the Bank record
    let bankResult = await db.query(
      'SELECT bank_id FROM rectifier_banks WHERE rect_id = $1 AND bank_name = $2;',
      [rect_id, bank_name || 'Bank 1']
    );
    
    let bank_id;
    if (bankResult.rows.length > 0) {
      bank_id = bankResult.rows[0].bank_id;
    } else {
      const newBank = await db.query(
        'INSERT INTO rectifier_banks (rect_id, bank_name) VALUES ($1, $2) RETURNING bank_id;',
        [rect_id, bank_name || 'Bank 1']
      );
      bank_id = newBank.rows[0].bank_id;
    }

    // 2. Check if battery test already exists for this bank and cell_no
    const existing = await db.query(
      'SELECT * FROM battery_tests WHERE bank_id = $1 AND cell_no = $2;',
      [bank_id, cell_no]
    );

    // Merge existing battery images array
    let batteryImgArr = [];
    const existingRow = existing.rows[0] || null;
    if (existingRow && Array.isArray(existingRow.battery_img)) {
      batteryImgArr = [...existingRow.battery_img];
    } else if (existingRow && existingRow.battery_img) {
      batteryImgArr = [existingRow.battery_img];
    }

    if (req.file) {
      batteryImgArr.push(battery_img);
    } else if (req.body.battery_img_path) {
      const pathVal = req.body.battery_img_path;
      if (Array.isArray(pathVal)) batteryImgArr = pathVal;
      else if (typeof pathVal === 'string' && !batteryImgArr.includes(pathVal)) batteryImgArr.push(pathVal);
    }
    if (batteryImgArr.length > 10) batteryImgArr = batteryImgArr.slice(-10);
    
    let result;
    if (existing.rows.length > 0) {
      result = await db.query(
        `UPDATE battery_tests SET voltage = $1, internal_resistance = $2, status = $3, battery_img = $4
        WHERE bat_id = $5 RETURNING *;`,
        [voltage, internal_resistance, status, batteryImgArr, existing.rows[0].bat_id]
      );
    } else {
      result = await db.query(
        `INSERT INTO battery_tests (bank_id, cell_no, voltage, internal_resistance, status, battery_img)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
        [bank_id, cell_no, voltage, internal_resistance, status, batteryImgArr]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Systems & Facilities
router.get('/workorder/:rpm_id/facilities', async (req, res) => {
  const { rpm_id } = req.params;
  try {
    const result = await db.query('SELECT * FROM systems_and_facilities WHERE rpm_id = $1;', [rpm_id]);
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/workorder/:rpm_id/facilities', upload.any(), async (req, res) => {
  const { rpm_id } = req.params;
  const data = req.body;

  const getSiteCode = () => req.query.site_code || req.body.site_code || 'UNKNOWN';
  // Retrieve files map
  const filesMap = {};
  if (req.files) {
    if (req.files.length > 10) {
      return res.status(400).json({ error: 'ไม่สามารถอัปโหลดรูปภาพได้เกิน 10 รูปต่อการบันทึก 1 ครั้ง' });
    }
    req.files.forEach(f => {
      filesMap[f.fieldname] = `/storage/sites/${getSiteCode()}/${rpm_id}/db_img/systems_and_facilities/${f.filename}`;
    });
  }

  const fields = [
    'alarm_door', 'alarm_ac_fail', 'alarm_low_bat', 'alarm_high_temp', 'alarm_smoke', 'alarm_air_fail',
    'vent_ac_fan', 'vent_ac_fan_hood', 'vent_dc_fan', 'vent_dc_fan_hood', 'vent_air_cond', 'vent_filters',
    'fac_site_sign', 'fac_outdoor_clean', 'fac_indoor_clean', 'fac_lighting', 'fac_grass_cut'
  ];

  try {
    const existing = await db.query('SELECT * FROM systems_and_facilities WHERE rpm_id = $1;', [rpm_id]);
    const existingRow = existing.rows[0] || null;

    const updateParts = [];
    const updateValues = [];
    const insertFields = ['rpm_id'];
    const insertValues = [rpm_id];
    const placeholders = ['$1'];

    fields.forEach((field, i) => {
      const val = data[field] || 'ปกติ';
      
      // Merge image arrays
      let arr = [];
      if (existingRow && Array.isArray(existingRow[`${field}_img`])) {
        arr = [...existingRow[`${field}_img`]];
      } else if (existingRow && existingRow[`${field}_img`]) {
        arr = [existingRow[`${field}_img`]];
      }

      const newFile = filesMap[`${field}_img`];
      if (newFile) {
        arr.push(newFile);
      } else if (data[`${field}_img_path`]) {
        const pathVal = data[`${field}_img_path`];
        if (Array.isArray(pathVal)) arr = pathVal;
        else if (typeof pathVal === 'string' && !arr.includes(pathVal)) arr.push(pathVal);
      }
      if (arr.length > 10) arr = arr.slice(-10);

      updateParts.push(`${field} = $${i*2 + 1}`);
      updateParts.push(`${field}_img = $${i*2 + 2}`);
      updateValues.push(val, arr);

      insertFields.push(field, `${field}_img`);
      insertValues.push(val, arr);
      placeholders.push(`$${i*2 + 2}`, `$${i*2 + 3}`);
    });

    let result;
    if (existing.rows.length > 0) {
      updateValues.push(rpm_id);
      result = await db.query(
        `UPDATE systems_and_facilities SET ${updateParts.join(', ')} WHERE rpm_id = $${updateValues.length} RETURNING *;`,
        updateValues
      );
    } else {
      result = await db.query(
        `INSERT INTO systems_and_facilities (${insertFields.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *;`,
        insertValues
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. Google OAuth Authentication Verification
router.post('/auth/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Credential token is required' });
  }

  try {
    // Verify the token with Google Token Info API
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!response.ok) {
      return res.status(401).json({ error: 'ยืนยันตัวตนกับ Google ไม่สำเร็จ (Invalid Token)' });
    }

    const payload = await response.json();
    const email = payload.email;
    const googleName = payload.name || 'Google User';

    // Query database users table
    let dbUserResult = await db.query('SELECT * FROM users WHERE email = $1;', [email]);
    let dbUser;

    if (dbUserResult.rows.length > 0) {
      dbUser = dbUserResult.rows[0];
    } else {
      // Auto-register user with Viewer role
      const insertResult = await db.query(
        'INSERT INTO users (email, name, role) VALUES ($1, $2, $3) RETURNING *;',
        [email, googleName, 'Viewer']
      );
      dbUser = insertResult.rows[0];
    }
    
    // Construct user object with DB role
    const user = {
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role, // 'Admin', 'Inspector', or 'Viewer'
      avatar: payload.picture || dbUser.name.charAt(0)
    };

    res.json({ message: 'ลงชื่อเข้าใช้สำเร็จ', user });
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาดจากทางเซิร์ฟเวอร์: ' + err.message });
  }
});

// 9. Get Field Configs
router.get('/field-configs', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM field_configs ORDER BY tab_name, field_id;');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. Update Field Config
router.post('/field-configs/update', async (req, res) => {
  const { tab_name, field_name, is_required, is_enabled } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO field_configs (tab_name, field_name, is_required, is_enabled)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (tab_name, field_name)
       DO UPDATE SET is_required = EXCLUDED.is_required, is_enabled = EXCLUDED.is_enabled
       RETURNING *;`,
      [tab_name, field_name, is_required, is_enabled]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
