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
  const { site_code, job_number_sl6, sap_number } = req.body;
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
      'INSERT INTO rpm_records_master (site_code, job_number_sl6, sap_number) VALUES ($1, $2, $3) RETURNING *;',
      [site_code, job_number_sl6 || `SL6-${site_code}-${Date.now()}`, sap_number || `SAP-${site_code}-${Date.now()}`]
    );

    res.status(201).json({ message: 'Started new work order', data: newRecord.rows[0], isNew: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update Master Record Info
router.put('/workorder/:rpm_id/master', async (req, res) => {
  const { rpm_id } = req.params;
  const { job_number_sl6, sap_number, summary_issue } = req.body;
  try {
    const result = await db.query(
      'UPDATE rpm_records_master SET job_number_sl6 = $1, sap_number = $2, summary_issue = $3 WHERE rpm_id = $4 RETURNING *;',
      [job_number_sl6, sap_number, summary_issue, rpm_id]
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
  const getPath = (fieldname) => req.files[fieldname] ? `/storage/sites/${req.files[fieldname][0].filename}` : req.body[`${fieldname}_path`] || null;

  const meter_ac_img = getPath('meter_ac_img');
  const cable_img = getPath('cable_img');
  const change_over_img = getPath('change_over_img');
  const surge_img = getPath('surge_img');
  const mdb_temp_img = getPath('mdb_temp_img');
  const ground_img = getPath('ground_img');

  try {
    const existing = await db.query('SELECT main_ac_id FROM power_main_ac WHERE rpm_id = $1;', [rpm_id]);
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

  const getPath = (fieldname) => req.files[fieldname] ? `/storage/sites/${req.files[fieldname][0].filename}` : req.body[`${fieldname}_path`] || null;

  const breaker_img = getPath('breaker_img');
  const pdb_temp_img = getPath('pdb_temp_img');
  const surge_rect_img = getPath('surge_rect_img');

  try {
    const existing = await db.query('SELECT rect_id FROM power_rectifier WHERE rpm_id = $1 AND rect_no = $2;', [rpm_id, rect_no]);
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
  const battery_img = req.file ? `/storage/sites/${req.file.filename}` : req.body.battery_img_path || null;

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
      'SELECT bat_id FROM battery_tests WHERE bank_id = $1 AND cell_no = $2;',
      [bank_id, cell_no]
    );
    
    let result;
    if (existing.rows.length > 0) {
      result = await db.query(
        `UPDATE battery_tests SET voltage = $1, internal_resistance = $2, status = $3, battery_img = $4
        WHERE bat_id = $5 RETURNING *;`,
        [voltage, internal_resistance, status, battery_img, existing.rows[0].bat_id]
      );
    } else {
      result = await db.query(
        `INSERT INTO battery_tests (bank_id, cell_no, voltage, internal_resistance, status, battery_img)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
        [bank_id, cell_no, voltage, internal_resistance, status, battery_img]
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

  // Retrieve files map
  const filesMap = {};
  if (req.files) {
    req.files.forEach(f => {
      filesMap[f.fieldname] = `/storage/sites/${f.filename}`;
    });
  }

  const fields = [
    'alarm_door', 'alarm_ac_fail', 'alarm_low_bat', 'alarm_high_temp', 'alarm_smoke', 'alarm_air_fail',
    'vent_ac_fan', 'vent_ac_fan_hood', 'vent_dc_fan', 'vent_dc_fan_hood', 'vent_air_cond', 'vent_filters',
    'fac_site_sign', 'fac_outdoor_clean', 'fac_indoor_clean', 'fac_lighting', 'fac_grass_cut'
  ];

  const updateParts = [];
  const updateValues = [];
  const insertFields = ['rpm_id'];
  const insertValues = [rpm_id];
  const placeholders = ['$1'];

  fields.forEach((field, i) => {
    const val = data[field] || 'ปกติ';
    const imgVal = filesMap[`${field}_img`] || data[`${field}_img_path`] || null;

    updateParts.push(`${field} = $${i*2 + 1}`);
    updateParts.push(`${field}_img = $${i*2 + 2}`);
    updateValues.push(val, imgVal);

    insertFields.push(field, `${field}_img`);
    insertValues.push(val, imgVal);
    placeholders.push(`$${i*2 + 2}`, `$${i*2 + 3}`);
  });

  try {
    const existing = await db.query('SELECT facility_id FROM systems_and_facilities WHERE rpm_id = $1;', [rpm_id]);
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
