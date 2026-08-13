const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const upload = require('../middlewares/upload');
const { authenticateToken } = require('../middlewares/auth');
const { generateToken } = require('../services/tokenService');

router.use(authenticateToken);


const deletePhysicalFiles = (filesList) => {
  if (!Array.isArray(filesList)) return;
  filesList.forEach(relPath => {
    if (!relPath) return;
    const cleanPath = relPath.replace(/^\/storage/, '');
    const fullPath = path.resolve(__dirname, '../../storage', cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath);
    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`Physically deleted old excess image: ${fullPath}`);
      }
    } catch (err) {
      console.error(`Failed to physically delete file ${fullPath}:`, err);
    }
  });
};

const toNumOrNull = (val) => {
  if (val === "" || val === undefined || val === null) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
};

// Middleware to automatically log all modifications (POST, PUT, DELETE)
router.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    // Intercept response finish
    const originalJson = res.json;
    res.json = function (data) {
      res.json = originalJson; // Restore
      
      // Execute logging after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const email = req.headers['x-user-email'] || 'System/Anonymous';
        const name = req.headers['x-user-name'] || 'Anonymous';
        const role = req.headers['x-user-role'] || 'Viewer';
        
        // Format Timestamp: YYYY-MM-DD HH:mm:ss (Bangkok Time)
        const timestamp = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Bangkok' }).replace(' ', ' ');

        const logDir = path.resolve(__dirname, '../../storage/db_text');
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
        
        // Extract site code from body, query, params, or response data
        let siteCode = req.body?.site_code || req.query?.site_code || req.body?.siteCode || req.params?.site_code || '';
        if (!siteCode && data?.data?.site_code) siteCode = data.data.site_code;
        if (!siteCode && data?.site_code) siteCode = data.site_code;

        let action = `${req.method} ${req.originalUrl}`;
        const url = req.originalUrl;

        // Structured Action Mapping
        if (url.includes('/workorder/start')) action = `เริ่มต้นเปิดใบงาน (Start Work Order)`;
        else if (url.includes('/master')) action = `บันทึก/แก้ไขข้อมูลใบงานหลัก (Master Site)`;
        else if (url.includes('/acmain')) action = `บันทึก/แก้ไขข้อมูลระบบไฟฟ้า AC (AC Main)`;
        else if (url.includes('/bank-save')) action = `บันทึก/แก้ไขข้อมูลแบตเตอรี่ (Battery Bank & Cell Tests)`;
        else if (url.includes('/rectifier')) action = `บันทึก/แก้ไขข้อมูลตู้ Rectifier`;
        else if (url.includes('/facilities')) action = `บันทึก/แก้ไขข้อมูลระบบความปลอดภัยและสภาพแวดล้อม (Facilities)`;
        else if (url.includes('/summary')) action = `แก้ไขข้อมูลสรุปปัญหาหน้างาน (Summary Issues)`;
        else if (url.includes('/submit')) action = `ส่งอนุมัติใบงาน (Submit Work Order)`;
        else if (url.includes('/tl-approve')) action = `อนุมัติใบงานขั้นต้น (TL Approved Work Order)`;
        else if (url.includes('/admin-approve')) action = `อนุมัติใบงานขั้นสุดท้าย (Admin Approved Work Order)`;
        else if (url.includes('/reject')) action = `ปฏิเสธ/ตีกลับใบงาน (Reason: ${req.body?.reason || 'ไม่ได้ระบุเหตุผล'})`;
        else if (url.includes('/unlock')) action = `ปลดล็อกใบงาน (Unlock Work Order)`;
        else if (url.includes('/users/update-role')) action = `แก้ไขสิทธิ์ผู้ใช้งาน (ID: ${req.body?.userId || '-'} -> สิทธิ์: ${req.body?.role || '-'})`;
        else if (url.includes('/users/update-scope')) action = `แก้ไขเขตพื้นที่ดูแลของผู้ใช้งาน (ID: ${req.body?.userId || '-'})`;
        else if (url.includes('/field-configs/update')) action = `แก้ไขการตั้งค่าบังคับกรอกฟิลด์ข้อมูล (Field Configs)`;
        else if (url.includes('/storage/delete')) action = `ลบรูปภาพในคลังจัดเก็บ (Delete Storage Image)`;
        else if (url.includes('/sites/bulk')) action = `นำเข้าข้อมูลสถานีแบบกลุ่ม (Bulk Import Sites)`;
        else if (url.includes('/sites/')) action = `แก้ไขข้อมูลสถานี (Update Site Details)`;
        else if (url.includes('/sites')) action = `สร้างสถานีใหม่ (Create New Site)`;
        else if (url.includes('/rpm-cycles')) action = `${req.method === 'DELETE' ? 'ลบ' : 'เพิ่ม'}รอบการตรวจเช็ค RPM Cycle`;

        const who = `${name} (Role: ${role})`;
        const site = siteCode ? siteCode : 'N/A';
        const logFile = path.join(logDir, 'audit_log.txt');
        
        // Formatted log line answering: ตอนไหน | ใคร | ทำอะไร (Action) | ที่ site ไหน | Path
        const logEntry = `[${timestamp}] | WHO: ${who} | ACTION: ${action} | SITE: ${site} | PATH: ${req.originalUrl}\n`;
        
        fs.appendFile(logFile, logEntry, 'utf8', (err) => {
          if (err) console.error('Failed to write audit log:', err);
        });
      }
      return originalJson.call(this, data);
    };
  }
  next();
});


// 1. Get & Create sites
router.get('/sites', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM sites ORDER BY site_code;');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sites', async (req, res) => {
  const { site_code, site_name, site_grade, site_type, area, subarea, job_number_sl6, sap_number } = req.body;
  if (!site_code || !site_name) {
    return res.status(400).json({ error: 'site_code และ site_name จำเป็นต้องระบุข้อมูล' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const codeUpper = site_code.toUpperCase().trim();

    // Check site duplicate
    const siteDupCheck = await client.query('SELECT site_code FROM sites WHERE UPPER(site_code) = $1', [codeUpper]);
    if (siteDupCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `รหัสสถานี ${codeUpper} มีอยู่แล้วในระบบ` });
    }

    // Insert site
    const siteResult = await client.query(
      `INSERT INTO sites (site_code, site_name, site_grade, site_type, area, subarea) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`,
      [codeUpper, site_name.trim(), site_grade || 'A', site_type || 'Indoor', area ? area.trim() : null, subarea ? subarea.trim() : null]
    );

    // If job SL6 or SAP provided, check duplicate and create work order
    if (job_number_sl6 && sap_number) {
      const sl6DupCheck = await client.query('SELECT job_number_sl6 FROM rpm_records_master WHERE job_number_sl6 = $1', [job_number_sl6.trim()]);
      if (sl6DupCheck.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `เลขที่ใบงาน SL6 "${job_number_sl6.trim()}" มีอยู่แล้วในระบบ` });
      }

      await client.query(
        `INSERT INTO rpm_records_master (site_code, job_number_sl6, sap_number, rpm_cycle, status) 
         VALUES ($1, $2, $3, NULL, 'Pending');`,
        [codeUpper, job_number_sl6.trim(), sap_number.trim()]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(siteResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      res.status(400).json({ error: `รหัสสถานี ${site_code} หรือ เลขที่ SL6 ซ้ำกันในระบบ` });
    } else {
      res.status(500).json({ error: err.message });
    }
  } finally {
    client.release();
  }
});

// Update a site (Admin only)
router.put('/sites/:site_id', async (req, res) => {
  const { site_id } = req.params;
  const { site_name, site_grade, site_type, area, subarea } = req.body;
  
  if (!site_name || !site_grade || !site_type) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const siteIdInt = parseInt(site_id, 10);
  if (isNaN(siteIdInt)) {
    return res.status(400).json({ error: 'รหัสสถานีไม่ถูกต้อง' });
  }

  try {
    const result = await db.query(
      `UPDATE sites 
       SET site_name = $1, site_grade = $2, site_type = $3, area = $4, subarea = $5 
       WHERE site_id = $6 RETURNING *;`,
      [site_name, site_grade, site_type, area ? area.trim() : null, subarea ? subarea.trim() : null, siteIdInt]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบสถานีที่ต้องการแก้ไข' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk import sites & jobs
router.post('/sites/bulk', async (req, res) => {
  const { sites } = req.body;
  if (!Array.isArray(sites) || sites.length === 0) {
    return res.status(400).json({ error: 'ไม่พบรายการข้อมูลสถานีสำหรับนำเข้า' });
  }

  const client = await db.pool.connect();
  try {
    // Fetch all existing site codes and SL6 numbers from DB
    const existingSiteRes = await client.query('SELECT site_code FROM sites');
    const existingSiteSet = new Set(existingSiteRes.rows.map(r => r.site_code.toUpperCase()));

    const existingSl6Res = await client.query('SELECT job_number_sl6 FROM rpm_records_master');
    const existingSl6Set = new Set(existingSl6Res.rows.map(r => r.job_number_sl6));

    const duplicateSiteCodes = new Set();
    const duplicateSl6Numbers = new Set();
    
    const batchSiteSeen = new Set();
    const batchSl6Seen = new Set();

    for (const site of sites) {
      if (!site.site_code || !site.site_name) continue;
      const codeUpper = site.site_code.toUpperCase().trim();
      const sl6 = site.job_number_sl6 ? site.job_number_sl6.trim() : null;

      // Check Site Code duplicate with DB
      if (existingSiteSet.has(codeUpper)) {
        duplicateSiteCodes.add(codeUpper);
      }
      // Check Site Code duplicate in CSV
      if (batchSiteSeen.has(codeUpper)) {
        duplicateSiteCodes.add(codeUpper);
      } else {
        batchSiteSeen.add(codeUpper);
      }

      // Check SL6 duplicate if provided
      if (sl6) {
        if (existingSl6Set.has(sl6)) {
          duplicateSl6Numbers.add(sl6);
        }
        if (batchSl6Seen.has(sl6)) {
          duplicateSl6Numbers.add(sl6);
        } else {
          batchSl6Seen.add(sl6);
        }
      }
    }

    const allSiteDups = Array.from(duplicateSiteCodes);
    const allSl6Dups = Array.from(duplicateSl6Numbers);

    if (allSiteDups.length > 0 || allSl6Dups.length > 0) {
      let errorMsg = 'พบข้อมูลซ้ำไม่อนุญาตให้นำเข้า!';
      if (allSiteDups.length > 0) {
        errorMsg += `\n- รหัสสถานี (Site Code) ซ้ำ ${allSiteDups.length} รายการ: ${allSiteDups.join(', ')}`;
      }
      if (allSl6Dups.length > 0) {
        errorMsg += `\n- เลขที่ใบงาน SL6 ซ้ำ ${allSl6Dups.length} รายการ: ${allSl6Dups.join(', ')}`;
      }

      return res.status(400).json({ 
        error: errorMsg,
        duplicateCodes: allSiteDups,
        duplicateSl6: allSl6Dups
      });
    }

    await client.query('BEGIN');
    for (const site of sites) {
      const { site_code, site_name, site_grade, site_type, area, subarea, job_number_sl6, sap_number } = site;
      if (!site_code || !site_name) continue;
      
      const codeUpper = site_code.toUpperCase().trim();
      await client.query(
        `INSERT INTO sites (site_code, site_name, site_grade, site_type, area, subarea, created_at) 
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP);`,
        [codeUpper, site_name.trim(), site_grade || 'A', site_type || 'Indoor', area ? area.trim() : null, subarea ? subarea.trim() : null]
      );

      if (job_number_sl6 && sap_number) {
        await client.query(
          `INSERT INTO rpm_records_master (site_code, job_number_sl6, sap_number, rpm_cycle, status, created_at) 
           VALUES ($1, $2, $3, NULL, 'Unopened', CURRENT_TIMESTAMP);`,
          [codeUpper, job_number_sl6.trim(), sap_number.trim()]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ 
      message: `นำเข้าข้อมูลสถานีและใบงานเรียบร้อยแล้ว จำนวน ${sites.length} รายการ`,
      total: sites.length
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') {
      res.status(400).json({ error: 'พบ Site Code หรือ SL6 No. ซ้ำในระบบ กรุณาตรวจสอบไฟล์ CSV อีกครั้ง' });
    } else {
      res.status(500).json({ error: err.message });
    }
  } finally {
    client.release();
  }
});

// 2. Load or Start Work Order
router.post('/workorder/start', async (req, res) => {
  const { site_code, job_number_sl6, sap_number, rpm_cycle, inspection_date, inspection_time, rectifier_qty_uih, inspector_name } = req.body;
  try {
    // 1. Check if master record exists for this specific site and cycle
    const existing = await db.query(
      'SELECT * FROM rpm_records_master WHERE site_code = $1 AND rpm_cycle = $2 ORDER BY created_at DESC LIMIT 1;',
      [site_code, rpm_cycle]
    );

    if (existing.rows.length > 0) {
      if (inspector_name && !existing.rows[0].inspector_name) {
        await db.query('UPDATE rpm_records_master SET inspector_name = $1 WHERE rpm_id = $2;', [inspector_name, existing.rows[0].rpm_id]);
        existing.rows[0].inspector_name = inspector_name;
      }
      return res.json({ message: 'Loaded existing record', data: existing.rows[0], isNew: false });
    }

    // 2. Check if an unassigned imported record exists for this site (where rpm_cycle IS NULL or '')
    const unassigned = await db.query(
      "SELECT * FROM rpm_records_master WHERE site_code = $1 AND (rpm_cycle IS NULL OR rpm_cycle = '') ORDER BY created_at ASC LIMIT 1;",
      [site_code]
    );

    if (unassigned.rows.length > 0) {
      const targetId = unassigned.rows[0].rpm_id;
      const updated = await db.query(
        `UPDATE rpm_records_master 
         SET rpm_cycle = $1, 
             status = 'Pending',
             job_number_sl6 = COALESCE($2, job_number_sl6), 
             sap_number = COALESCE($3, sap_number), 
             inspection_date = COALESCE($4, inspection_date), 
             inspection_time = COALESCE($5, inspection_time),
             inspector_name = COALESCE($6, inspector_name)
         WHERE rpm_id = $7 RETURNING *;`,
        [rpm_cycle || null, job_number_sl6 || null, sap_number || null, inspection_date || null, inspection_time || null, inspector_name || null, targetId]
      );
      return res.json({ message: 'Linked unassigned imported record', data: updated.rows[0], isNew: false });
    }

    // 3. Create a new master record if no existing or unassigned record exists
    const finalSl6 = job_number_sl6 || `SL6-${site_code}-${Date.now()}`;
    const finalSap = sap_number || `SAP-${site_code}-${Date.now()}`;
    const newRecord = await db.query(
      "INSERT INTO rpm_records_master (site_code, job_number_sl6, sap_number, rpm_cycle, status, inspection_date, inspection_time, rectifier_qty_uih, inspector_name) VALUES ($1, $2, $3, $4, 'Pending', $5, $6, $7, $8) RETURNING *;",
      [site_code, finalSl6, finalSap, rpm_cycle || null, inspection_date || null, inspection_time || null, rectifier_qty_uih || null, inspector_name || null]
    );

    res.status(201).json({ message: 'Started new work order', data: newRecord.rows[0], isNew: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update Master Record Info
router.get('/workorder/:rpm_id/master', async (req, res) => {
  const { rpm_id } = req.params;
  try {
    const result = await db.query('SELECT * FROM rpm_records_master WHERE rpm_id = $1;', [rpm_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลใบงานหลัก' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/workorder/:rpm_id/master', async (req, res) => {
  const { rpm_id } = req.params;
  const { job_number_sl6, sap_number, summary_issue, rpm_cycle, inspection_date, inspection_time, rectifier_qty_uih, inspector_name } = req.body;
  try {
    const result = await db.query(
      'UPDATE rpm_records_master SET job_number_sl6 = $1, sap_number = $2, summary_issue = $3, rpm_cycle = $4, inspection_date = $5, inspection_time = $6, rectifier_qty_uih = $7, inspector_name = COALESCE($8, inspector_name) WHERE rpm_id = $9 RETURNING *;',
      [job_number_sl6, sap_number, summary_issue, rpm_cycle, inspection_date || null, inspection_time || null, rectifier_qty_uih || null, inspector_name || null, rpm_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/workorder/:rpm_id/summary', async (req, res) => {
  const { rpm_id } = req.params;
  const { summary_issue } = req.body;
  try {
    const result = await db.query(
      'UPDATE rpm_records_master SET summary_issue = $1 WHERE rpm_id = $2 RETURNING *;',
      [summary_issue, rpm_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลใบงานหลัก' });
    }
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
  { name: 'meter_ac_img', maxCount: 10 },
  { name: 'cable_img', maxCount: 10 },
  { name: 'change_over_img', maxCount: 10 },
  { name: 'surge_img', maxCount: 10 },
  { name: 'mdb_temp_img', maxCount: 10 },
  { name: 'ground_img', maxCount: 10 }
]), async (req, res) => {
  const { rpm_id } = req.params;
  const {
    meter_ac_size, cable_status, change_over_switch, ac_phase_qty,
    surge_protection, mdb_temp, voltage_p1, voltage_p2, voltage_p3,
    current_p1, current_p2, current_p3, ground_resistance, site_temp
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
  const getCycleDir = () => req.query.rpm_cycle || req.body.rpm_cycle || rpm_id || 'UNKNOWN';
  
  const getPaths = (fieldname) => {
    if (req.files && req.files[fieldname]) {
      return req.files[fieldname].map(f => `/storage/db_img/${getSiteCode()}/${getCycleDir()}/power_ac_main/${f.filename}`);
    }
    return [];
  };

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
      
      const newFiles = getPaths(`${fieldName}_img`);
      newFiles.forEach(newFile => {
        arr.push(newFile);
      });
      
      if (req.body[`${fieldName}_img_path`]) {
        const pathVal = req.body[`${fieldName}_img_path`];
        if (Array.isArray(pathVal)) arr = pathVal;
        else if (typeof pathVal === 'string' && !arr.includes(pathVal)) arr.push(pathVal);
      }
      // Cap at 10 and delete physical files starting from index 1 (FIFO)
      if (arr.length > 10) {
        const discarded = arr.slice(0, arr.length - 10);
        deletePhysicalFiles(discarded);
        arr = arr.slice(-10);
      }
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
          voltage_p3 = $14, current_p1 = $15, current_p2 = $16, current_p3 = $17, ground_resistance = $18, ground_img = $19, site_temp = $21
        WHERE rpm_id = $20 RETURNING *;`,
        [
          meter_ac_size, meter_ac_img, cable_status, cable_img,
          change_over_switch, change_over_img, ac_phase_qty, surge_protection,
          surge_img, mdb_temp || null, mdb_temp_img,
          toNumOrNull(voltage_p1), toNumOrNull(voltage_p2), toNumOrNull(voltage_p3),
          toNumOrNull(current_p1), toNumOrNull(current_p2), toNumOrNull(current_p3),
          ground_resistance || null, ground_img,
          rpm_id, site_temp
        ]
      );
    } else {
      result = await db.query(
        `INSERT INTO power_main_ac (
          rpm_id, meter_ac_size, meter_ac_img, cable_status, cable_img,
          change_over_switch, change_over_img, ac_phase_qty, surge_protection,
          surge_img, mdb_temp, mdb_temp_img, voltage_p1, voltage_p2,
          voltage_p3, current_p1, current_p2, current_p3, ground_resistance, ground_img, site_temp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21) RETURNING *;`,
        [
          rpm_id, meter_ac_size, meter_ac_img, cable_status, cable_img,
          change_over_switch, change_over_img, ac_phase_qty, surge_protection,
          surge_img, mdb_temp || null, mdb_temp_img,
          toNumOrNull(voltage_p1), toNumOrNull(voltage_p2), toNumOrNull(voltage_p3),
          toNumOrNull(current_p1), toNumOrNull(current_p2), toNumOrNull(current_p3),
          ground_resistance || null, ground_img, site_temp
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

const handleRectifierUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.error("Multer Upload Error in Rectifier:", err);
      return res.status(400).json({ error: `เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: ${err.message}` });
    }
    // Group uploaded files by fieldname to mimic req.files format from upload.fields
    if (Array.isArray(req.files)) {
      const filesMap = {};
      req.files.forEach(file => {
        if (!filesMap[file.fieldname]) filesMap[file.fieldname] = [];
        filesMap[file.fieldname].push(file);
      });
      req.files = filesMap;
    }
    next();
  });
};

router.post('/workorder/:rpm_id/rectifier', handleRectifierUpload, async (req, res) => {
  const { rpm_id } = req.params;
  const {
    rect_no, model, ac_cable_size, breaker_size, modules_all, modules_fail,
    input_current_ac, output_current_dc, surge_status,
    breaker_phase1, breaker_phase2, breaker_phase3, battery_type,
    lithium_capacity, battery_run, battery_soh, battery_soc,
    battery_capacity_percent, battery_alarm, battery_qty_bank, vrla_qty_bank
  } = req.body;

  const getSiteCode = () => req.query.site_code || req.body.site_code || 'UNKNOWN';
  
  const getCleanRectNo = () => {
    const rNo = rect_no || 'rect_1';
    if (rNo.includes('ตู้ที่')) {
      return 'rect_' + rNo.replace(/[^0-9]/g, '');
    }
    return rNo.replace(/\s+/g, '_').toLowerCase();
  };

  const getCycleDir = () => req.query.rpm_cycle || req.body.rpm_cycle || rpm_id || 'UNKNOWN';
  
  const getPaths = (fieldname) => {
    if (req.files && req.files[fieldname]) {
      return req.files[fieldname].map(f => `/storage/db_img/${getSiteCode()}/${getCycleDir()}/power_rectifier/${getCleanRectNo()}/${f.filename}`);
    }
    return [];
  };

  try {
    const existing = await db.query('SELECT * FROM power_rectifier WHERE rpm_id = $1 AND rect_no = $2;', [rpm_id, rect_no]);
    
    // If it's a new rectifier entry, check if total count of rectifiers is already 6
    if (existing.rows.length === 0) {
      const countRes = await db.query('SELECT COUNT(*) FROM power_rectifier WHERE rpm_id = $1;', [rpm_id]);
      if (parseInt(countRes.rows[0].count, 10) >= 6) {
        return res.status(400).json({ error: 'ไม่สามารถเพิ่มตู้ Rectifier ได้เกิน 6 ตู้ต่อ 1 ใบงาน' });
      }
    }
    
    const mergeImgs = (existingRow, fieldName) => {
      let arr = [];
      if (existingRow && Array.isArray(existingRow[`${fieldName}_img`])) {
        arr = [...existingRow[`${fieldName}_img`]];
      } else if (existingRow && existingRow[`${fieldName}_img`]) {
        arr = [existingRow[`${fieldName}_img`]];
      }
      
      const newFiles = getPaths(`${fieldName}_img`);
      newFiles.forEach(newFile => {
        arr.push(newFile);
      });
      
      if (req.body[`${fieldName}_img_path`]) {
        const pathVal = req.body[`${fieldName}_img_path`];
        if (Array.isArray(pathVal)) arr = pathVal;
        else if (typeof pathVal === 'string' && !arr.includes(pathVal)) arr.push(pathVal);
      }
      if (arr.length > 10) {
        const discarded = arr.slice(0, arr.length - 10);
        deletePhysicalFiles(discarded);
        arr = arr.slice(-10);
      }
      return arr;
    };

    const existingRow = existing.rows[0] || null;
    const breaker_img = mergeImgs(existingRow, 'breaker');
    const pdb_temp_img = mergeImgs(existingRow, 'pdb_temp');
    const surge_rect_img = mergeImgs(existingRow, 'surge_rect');

    // Collect per-bank Lithium images if present
    const existingLithiumImgs = existingRow && existingRow.lithium_bank_imgs 
      ? (typeof existingRow.lithium_bank_imgs === 'string' ? JSON.parse(existingRow.lithium_bank_imgs) : existingRow.lithium_bank_imgs)
      : [];

    const lithiumBankImgs = [];
    const qtyNum = parseInt(battery_qty_bank, 10) || 1;
    for (let i = 1; i <= qtyNum; i++) {
      let bankPaths = [];
      const prevBankImgs = Array.isArray(existingLithiumImgs[i - 1]) ? existingLithiumImgs[i - 1] : [];
      
      if (req.files && req.files[`lithium_bank_img_${i}`]) {
        const newFiles = req.files[`lithium_bank_img_${i}`].map(f => `/storage/db_img/${getSiteCode()}/${getCycleDir()}/power_rectifier/${getCleanRectNo()}/bank_${i}/${f.filename}`);
        bankPaths = [...prevBankImgs, ...newFiles];
      } else {
        bankPaths = [...prevBankImgs];
      }

      if (req.body[`lithium_bank_img_path_${i}`]) {
        const bodyPaths = req.body[`lithium_bank_img_path_${i}`];
        if (Array.isArray(bodyPaths)) bankPaths = bodyPaths;
        else if (typeof bodyPaths === 'string') bankPaths = [bodyPaths];
      }
      lithiumBankImgs.push(bankPaths);
    }

    let result;
    if (existing.rows.length > 0) {
      result = await db.query(
        `UPDATE power_rectifier SET 
          model = $1, ac_cable_size = $2, breaker_size = $3, breaker_img = $4,
          modules_all = $5, modules_fail = $6, input_current_ac = $7, output_current_dc = $8,
          pdb_temp_img = $9, surge_status = $10, surge_rect_img = $11,
          breaker_phase1 = $12, breaker_phase2 = $13, breaker_phase3 = $14, battery_type = $15,
          lithium_capacity = $16, battery_run = $17, battery_soh = $18, battery_soc = $19,
          battery_capacity_percent = $20, battery_alarm = $21, battery_qty_bank = $22,
          lithium_bank_imgs = $23, vrla_qty_bank = $24, rect_type = $15
        WHERE rect_id = $25 RETURNING *;`,
        [
          model, ac_cable_size, breaker_size, breaker_img,
          toNumOrNull(modules_all), toNumOrNull(modules_fail), 
          toNumOrNull(input_current_ac), toNumOrNull(output_current_dc),
          pdb_temp_img, surge_status, surge_rect_img,
          breaker_phase1, breaker_phase2, breaker_phase3, battery_type,
          lithium_capacity, battery_run,
          battery_soh, battery_soc,
          battery_capacity_percent, battery_alarm,
          toNumOrNull(battery_qty_bank),
          JSON.stringify(lithiumBankImgs),
          toNumOrNull(vrla_qty_bank),
          existing.rows[0].rect_id
        ]
      );
    } else {
      result = await db.query(
        `INSERT INTO power_rectifier (
          rpm_id, rect_no, model, ac_cable_size, breaker_size, breaker_img,
          modules_all, modules_fail, input_current_ac, output_current_dc, pdb_temp_img, surge_status, surge_rect_img,
          breaker_phase1, breaker_phase2, breaker_phase3, battery_type,
          lithium_capacity, battery_run, battery_soh, battery_soc,
          battery_capacity_percent, battery_alarm, battery_qty_bank, lithium_bank_imgs, vrla_qty_bank, rect_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $15) RETURNING *;`,
        [
          rpm_id, rect_no, model, ac_cable_size, breaker_size, breaker_img, 
          toNumOrNull(modules_all), toNumOrNull(modules_fail),
          toNumOrNull(input_current_ac), toNumOrNull(output_current_dc),
          pdb_temp_img, surge_status, surge_rect_img,
          breaker_phase1, breaker_phase2, breaker_phase3, battery_type,
          lithium_capacity, battery_run,
          battery_soh, battery_soc,
          battery_capacity_percent, battery_alarm,
          toNumOrNull(battery_qty_bank),
          JSON.stringify(lithiumBankImgs),
          toNumOrNull(vrla_qty_bank)
        ]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error saving rectifier to DB:", err);
    res.status(500).json({ error: err.message });
  }
});

// 6. Battery tests
router.get('/workorder/:rpm_id/all-batteries', async (req, res) => {
  const { rpm_id } = req.params;
  try {
    const result = await db.query(
      `SELECT bt.*, rb.bank_name, rb.brand, rb.capacity, pr.rect_no, pr.battery_type
       FROM battery_tests bt 
       JOIN rectifier_banks rb ON bt.bank_id = rb.bank_id 
       JOIN power_rectifier pr ON rb.rect_id = pr.rect_id
       WHERE pr.rpm_id = $1 
       ORDER BY pr.rect_no, rb.bank_name, bt.cell_no;`,
      [rpm_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lookup full hierarchy (rectifier type, battery type, banks) by Site Code
router.get('/site/:site_code/rectifiers', async (req, res) => {
  const { site_code } = req.params;
  try {
    const result = await db.query(
      `SELECT 
         m.site_code,
         m.rpm_id,
         r.rect_id,
         r.rect_no,
         COALESCE(r.rect_type, r.battery_type) AS rect_type,
         r.battery_type,
         rb.bank_id,
         rb.bank_name,
         rb.brand AS bank_brand,
         rb.capacity AS bank_capacity,
         rb.installed_date AS bank_installed_date,
         rb.warrantee_date AS bank_warrantee_date
       FROM rpm_records_master m
       JOIN power_rectifier r ON m.rpm_id = r.rpm_id
       LEFT JOIN rectifier_banks rb ON r.rect_id = rb.rect_id
       WHERE LOWER(m.site_code) = LOWER($1)
       ORDER BY r.rect_no, rb.bank_name;`,
      [site_code]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/rectifier/:rect_id/batteries', async (req, res) => {
  const { rect_id } = req.params;
  try {
    const result = await db.query(
      `SELECT 
         rb.bank_id, 
         rb.bank_name, 
         COALESCE(rb.brand, '') AS brand, 
         COALESCE(rb.capacity, '100AH') AS capacity, 
         COALESCE(rb.installed_date::text, bt.installed_date::text) AS installed_date, 
         COALESCE(rb.warrantee_date::text, bt.warrantee_date::text) AS warrantee_date,
         bt.test_id,
         bt.cell_no,
         bt.voltage,
         bt.internal_resistance,
         bt.status,
         bt.battery_img
       FROM rectifier_banks rb 
       LEFT JOIN battery_tests bt ON rb.bank_id = bt.bank_id 
       WHERE rb.rect_id = $1 
       ORDER BY rb.bank_name, bt.cell_no;`,
      [rect_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rectifier/:rect_id/bank-meta', async (req, res) => {
  const { rect_id } = req.params;
  const { bank_name, brand, capacity, installed_date, warrantee_date } = req.body;
  const cleanDate = (d) => (d && d.trim() !== '') ? d.trim() : null;

  try {
    let bankResult = await db.query(
      'SELECT bank_id FROM rectifier_banks WHERE rect_id = $1 AND LOWER(bank_name) = LOWER($2);',
      [rect_id, bank_name || 'Bank 1']
    );

    let bank_id;
    if (bankResult.rows.length > 0) {
      bank_id = bankResult.rows[0].bank_id;
      await db.query(
        'UPDATE rectifier_banks SET brand = $1, capacity = $2, installed_date = $3, warrantee_date = $4 WHERE bank_id = $5;',
        [brand || null, capacity || null, cleanDate(installed_date), cleanDate(warrantee_date), bank_id]
      );
    } else {
      const newBank = await db.query(
        'INSERT INTO rectifier_banks (rect_id, bank_name, brand, capacity, installed_date, warrantee_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING bank_id;',
        [rect_id, bank_name || 'Bank 1', brand || null, capacity || null, cleanDate(installed_date), cleanDate(warrantee_date)]
      );
      bank_id = newBank.rows[0].bank_id;
    }

    res.json({ message: 'บันทึกข้อมูลกลุ่มแบตเตอรี่เรียบร้อยแล้ว', bank_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rectifier/:rect_id/battery', upload.array('battery_img', 10), async (req, res) => {
  const { rect_id } = req.params;
  const { bank_name, cell_no, voltage, internal_resistance, status, brand, capacity, installed_date, warrantee_date } = req.body;
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

  const getCleanRectNo = (rNo) => {
    const rawNo = rNo || 'rect_1';
    if (rawNo.includes('ตู้ที่')) {
      return 'rect_' + rawNo.replace(/[^0-9]/g, '');
    }
    return rawNo.replace(/\s+/g, '_').toLowerCase();
  };

  const getCleanBankName = (bName) => {
    const rawName = bName || 'bank_1';
    return rawName.replace(/\s+/g, '_').toLowerCase();
  };

  // Retrieve rect_no to format the exact path
  let rect_no = req.body.rect_no || 'rect_1';
  
  const getCycleDir = () => req.query.rpm_cycle || req.body.rpm_cycle || rpm_id || 'UNKNOWN';
  
  const getBatteryPaths = async () => {
    if (!req.files || req.files.length === 0) return [];
    const rectQuery = await db.query('SELECT rect_no FROM power_rectifier WHERE rect_id = $1;', [rect_id]);
    if (rectQuery.rows.length > 0) {
      rect_no = rectQuery.rows[0].rect_no;
    }
    return req.files.map(f => `/storage/db_img/${site_code}/${getCycleDir()}/power_rectifier/${getCleanRectNo(rect_no)}/${getCleanBankName(bank_name)}/batt_${cell_no}/${f.filename}`);
  };

  try {
    const cleanDate = (d) => (d && d.trim() !== '') ? d.trim() : null;
    console.log('[BATTERY SAVE] raw installed_date:', JSON.stringify(installed_date), '| raw warrantee_date:', JSON.stringify(warrantee_date));
    console.log('[BATTERY SAVE] cleaned installed_date:', cleanDate(installed_date), '| cleaned warrantee_date:', cleanDate(warrantee_date));
    const newBatteryImgs = await getBatteryPaths();

    let bankResult = await db.query(
      'SELECT bank_id FROM rectifier_banks WHERE rect_id = $1 AND LOWER(bank_name) = LOWER($2);',
      [rect_id, bank_name || 'Bank 1']
    );
    
    let bank_id;
    if (bankResult.rows.length > 0) {
      bank_id = bankResult.rows[0].bank_id;
      await db.query(
        'UPDATE rectifier_banks SET brand = $1, capacity = $2, installed_date = $3, warrantee_date = $4 WHERE bank_id = $5;',
        [brand || null, capacity || null, cleanDate(installed_date), cleanDate(warrantee_date), bank_id]
      );
    } else {
      const newBank = await db.query(
        'INSERT INTO rectifier_banks (rect_id, bank_name, brand, capacity, installed_date, warrantee_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING bank_id;',
        [rect_id, bank_name || 'Bank 1', brand || null, capacity || null, cleanDate(installed_date), cleanDate(warrantee_date)]
      );
      bank_id = newBank.rows[0].bank_id;
    }

    // 2. Check if battery test already exists for this bank and cell_no
    const existing = await db.query(
      'SELECT * FROM battery_tests WHERE bank_id = $1 AND cell_no = $2;',
      [bank_id, cell_no]
    );

    // Combine existing image paths sent from frontend and newly uploaded files
    let batteryImgArr = [];
    if (req.body.battery_img_path) {
      const pathVal = req.body.battery_img_path;
      if (Array.isArray(pathVal)) {
        batteryImgArr = [...pathVal];
      } else if (typeof pathVal === 'string' && pathVal.trim() !== '') {
        batteryImgArr = [pathVal];
      }
    }

    newBatteryImgs.forEach(img => {
      if (!batteryImgArr.includes(img)) {
        batteryImgArr.push(img);
      }
    });
    if (batteryImgArr.length > 10) {
      const discarded = batteryImgArr.slice(0, batteryImgArr.length - 10);
      deletePhysicalFiles(discarded);
      batteryImgArr = batteryImgArr.slice(-10);
    }
    
    let result;
    if (existing.rows.length > 0) {
      result = await db.query(
        `UPDATE battery_tests SET voltage = $1, internal_resistance = $2, status = $3, battery_img = $4, installed_date = $5, warrantee_date = $6
        WHERE bat_id = $7 RETURNING *;`,
        [toNumOrNull(voltage), toNumOrNull(internal_resistance), status, batteryImgArr, cleanDate(installed_date), cleanDate(warrantee_date), existing.rows[0].bat_id]
      );
    } else {
      result = await db.query(
        `INSERT INTO battery_tests (bank_id, cell_no, voltage, internal_resistance, status, battery_img, installed_date, warrantee_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;`,
        [bank_id, cell_no, toNumOrNull(voltage), toNumOrNull(internal_resistance), status, batteryImgArr, cleanDate(installed_date), cleanDate(warrantee_date)]
      );
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dedicated Batch Save API for Bank + Cells 1-4
router.post('/rectifier/:rect_id/bank-save', upload.any(), async (req, res) => {
  const { rect_id } = req.params;
  const { bank_name, brand, capacity, installed_date, warrantee_date, cells: cellsJson } = req.body;
  let rpm_id = req.query.rpm_id || 'UNKNOWN';
  let site_code = req.query.site_code || req.body.site_code || 'UNKNOWN';

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

  const cleanDate = (d) => (d && typeof d === 'string' && d.trim() !== '') ? d.trim() : null;

  try {
    let cellsData = {};
    if (typeof cellsJson === 'string') {
      try { cellsData = JSON.parse(cellsJson); } catch (e) {}
    } else if (typeof cellsJson === 'object' && cellsJson !== null) {
      cellsData = cellsJson;
    }

    let bankResult = await db.query(
      "SELECT bank_id FROM rectifier_banks WHERE rect_id = $1 AND LOWER(REPLACE(bank_name, ' ', '')) = LOWER(REPLACE($2, ' ', ''));",
      [rect_id, bank_name || 'Bank 1']
    );

    let bank_id;
    if (bankResult.rows.length > 0) {
      bank_id = bankResult.rows[0].bank_id;
      await db.query(
        `UPDATE rectifier_banks SET
          bank_name = $1,
          brand = $2,
          capacity = $3,
          installed_date = $4,
          warrantee_date = $5
        WHERE bank_id = $6;`,
        [bank_name || 'Bank 1', brand || null, capacity || null, cleanDate(installed_date), cleanDate(warrantee_date), bank_id]
      );
    } else {
      const newBank = await db.query(
        'INSERT INTO rectifier_banks (rect_id, bank_name, brand, capacity, installed_date, warrantee_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING bank_id;',
        [rect_id, bank_name || 'Bank 1', brand || null, capacity || null, cleanDate(installed_date), cleanDate(warrantee_date)]
      );
      bank_id = newBank.rows[0].bank_id;
    }

    const filesByField = {};
    if (req.files && req.files.length > 0) {
      req.files.forEach(f => {
        if (!filesByField[f.fieldname]) filesByField[f.fieldname] = [];
        filesByField[f.fieldname].push(f);
      });
    }

    const getCleanRectNo = (rNo) => {
      const rawNo = rNo || 'rect_1';
      if (rawNo.includes('ตู้ที่')) return 'rect_' + rawNo.replace(/[^0-9]/g, '');
      return rawNo.replace(/\s+/g, '_').toLowerCase();
    };

    const getCleanBankName = (bName) => {
      const rawName = bName || 'bank_1';
      return rawName.replace(/\s+/g, '_').toLowerCase();
    };

    let rect_no = req.body.rect_no || 'rect_1';
    const rectQuery = await db.query('SELECT rect_no FROM power_rectifier WHERE rect_id = $1;', [rect_id]);
    if (rectQuery.rows.length > 0) {
      rect_no = rectQuery.rows[0].rect_no;
    }
    const cycleDir = req.query.rpm_cycle || req.body.rpm_cycle || rpm_id || 'UNKNOWN';

    // Process cell numbers 1 to 4
    for (let num = 1; num <= 4; num++) {
      const cell = cellsData[num] || cellsData[String(num)] || {};
      const voltage = cell.voltage;
      const internal_resistance = cell.ir !== undefined ? cell.ir : cell.internal_resistance;
      const status = cell.status || 'Good';

      // A cell counts as "actually submitted" if the payload carries a real
      // voltage/IR value. If neither is present, the cell was simply never
      // touched in this request (e.g. stale/empty form state on the client) —
      // in that case we must NOT let NULL overwrite whatever is already
      // saved in the DB for this cell.
      const hasVoltage = voltage !== undefined && voltage !== null && voltage !== '';
      const hasIr = internal_resistance !== undefined && internal_resistance !== null && internal_resistance !== '';
      const fieldName = `battery_img_${num}`;
      const uploadedFiles = filesByField[fieldName] || [];
      const newImgPaths = uploadedFiles.map(f => `/storage/db_img/${site_code}/${cycleDir}/power_rectifier/${getCleanRectNo(rect_no)}/${getCleanBankName(bank_name)}/batt_${num}/${f.filename}`);

      const existingPathKey = `battery_img_path_${num}`;
      let existingImgPaths = [];
      if (req.body[existingPathKey]) {
        const val = req.body[existingPathKey];
        if (Array.isArray(val)) existingImgPaths = val;
        else if (typeof val === 'string' && val.trim() !== '') existingImgPaths = [val];
      } else if (cell.existingPath) {
        if (Array.isArray(cell.existingPath)) existingImgPaths = cell.existingPath;
        else if (typeof cell.existingPath === 'string') existingImgPaths = [cell.existingPath];
      }

      let combinedImg = [...existingImgPaths];
      newImgPaths.forEach(p => {
        if (!combinedImg.includes(p)) combinedImg.push(p);
      });

      const hasImages = combinedImg.length > 0;

      const existingTest = await db.query(
        'SELECT * FROM battery_tests WHERE bank_id = $1 AND cell_no = $2;',
        [bank_id, num]
      );

      if (existingTest.rows.length > 0) {
        const oldRow = existingTest.rows[0];
        const finalVoltage = hasVoltage ? toNumOrNull(voltage) : oldRow.voltage;
        const finalIr = hasIr ? toNumOrNull(internal_resistance) : oldRow.internal_resistance;
        const finalStatus = (hasVoltage || hasIr) ? status : (oldRow.status || 'Good');

        await db.query(
          `UPDATE battery_tests SET
            voltage = $1,
            internal_resistance = $2,
            status = $3,
            battery_img = $4,
            installed_date = $5,
            warrantee_date = $6
          WHERE bat_id = $7;`,
          [
            finalVoltage,
            finalIr,
            finalStatus, combinedImg, cleanDate(installed_date), cleanDate(warrantee_date),
            oldRow.bat_id
          ]
        );
      } else if (hasVoltage || hasIr || hasImages) {
        await db.query(
          `INSERT INTO battery_tests (bank_id, cell_no, voltage, internal_resistance, status, battery_img, installed_date, warrantee_date)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8);`,
          [bank_id, num, toNumOrNull(voltage), toNumOrNull(internal_resistance), status, combinedImg, cleanDate(installed_date), cleanDate(warrantee_date)]
        );
      }
    }

    res.json({ message: 'บันทึกข้อมูล Bank และลูกที่ 1-4 สำเร็จ', bank_id });
  } catch (err) {
    console.error('[BANK BATCH SAVE ERROR]', err);
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
  const filesMap = {};
  if (req.files) {
    const getCycleDir = () => req.query.rpm_cycle || req.body.rpm_cycle || rpm_id || 'UNKNOWN';
    req.files.forEach(f => {
      let sub = 'misc';
      if (f.fieldname.startsWith('air') || f.fieldname.startsWith('control')) sub = 'air';
      else if (f.fieldname.startsWith('alarm')) sub = 'alarm';
      else if (f.fieldname.startsWith('vent')) sub = 'vent';
      else if (f.fieldname.startsWith('fac')) sub = 'fac';
      
      const filePath = `/storage/db_img/${getSiteCode()}/${getCycleDir()}/system_and_facilities/${sub}/${f.filename}`;
      if (!filesMap[f.fieldname]) {
        filesMap[f.fieldname] = [];
      }
      filesMap[f.fieldname].push(filePath);
    });
  }

  const fields = [
    'alarm_door', 'alarm_ac_fail', 'alarm_low_bat', 'alarm_high_temp', 'alarm_smoke', 'alarm_air_fail',
    'vent_ac_fan', 'vent_ac_fan_hood', 'vent_dc_fan', 'vent_dc_fan_hood', 'vent_air_cond', 'vent_filters',
    'fac_site_sign', 'fac_outdoor_clean', 'fac_indoor_clean', 'fac_lighting', 'fac_grass_cut',
    'vent_filter_door', 'vent_filter_window', 'vent_equip_fan', 'vent_filter_equip', 'air_owner', 'control_air_type', 'control_air_status'
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

      const newFiles = filesMap[`${field}_img`];
      if (Array.isArray(newFiles)) {
        newFiles.forEach(nf => {
          if (!arr.includes(nf)) arr.push(nf);
        });
      }

      if (data[`${field}_img_path`]) {
        const pathVal = data[`${field}_img_path`];
        if (Array.isArray(pathVal)) {
          pathVal.forEach(pv => {
            if (!arr.includes(pv)) arr.push(pv);
          });
        } else if (typeof pathVal === 'string' && !arr.includes(pathVal)) {
          arr.push(pathVal);
        }
      }
      if (arr.length > 10) {
        const discarded = arr.slice(0, arr.length - 10);
        deletePhysicalFiles(discarded);
        arr = arr.slice(-10);
      }

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

    const token = generateToken(user);

    res.json({ message: 'ลงชื่อเข้าใช้สำเร็จ', user, token });
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
  const { tab_name, field_name, is_required, is_enabled, dropdown_options } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO field_configs (tab_name, field_name, is_required, is_enabled, dropdown_options)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tab_name, field_name)
       DO UPDATE SET 
         is_required = COALESCE(EXCLUDED.is_required, field_configs.is_required), 
         is_enabled = COALESCE(EXCLUDED.is_enabled, field_configs.is_enabled),
         dropdown_options = COALESCE(EXCLUDED.dropdown_options, field_configs.dropdown_options)
       RETURNING *;`,
      [tab_name, field_name, is_required, is_enabled, dropdown_options]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Storage File Browser API
router.get('/storage/browse', async (req, res) => {
  const relPath = req.query.path || '';
  // The storage folder is at the workspace root level
  const storageRoot = path.resolve(__dirname, '../../storage');
  
  // Safely resolve target path
  const targetPath = path.resolve(storageRoot, relPath);
  
  // Prevent directory traversal attacks
  if (!targetPath.startsWith(storageRoot)) {
    return res.status(403).json({ error: 'Access Denied: Path is outside storage root.' });
  }
  
  try {
    if (!fs.existsSync(targetPath)) {
      return res.status(404).json({ error: 'Folder not found.' });
    }
    
    const stats = fs.statSync(targetPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory.' });
    }
    
    const files = fs.readdirSync(targetPath);
    const items = files.map(file => {
      const filePath = path.join(targetPath, file);
      const fileStats = fs.statSync(filePath);
      const isDir = fileStats.isDirectory();
      
      return {
        name: file,
        isDir,
        size: isDir ? null : fileStats.size,
        updatedAt: fileStats.mtime,
        relPath: path.relative(storageRoot, filePath)
      };
    });
    
    // Sort: directories first, then files alphabetically
    items.sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });
    
    res.json({
      currentPath: relPath,
      items
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Storage Download Folder as ZIP API
router.get('/storage/download-folder', async (req, res) => {
  const relPath = req.query.path || '';
  const storageRoot = path.resolve(__dirname, '../../storage');
  const targetPath = path.resolve(storageRoot, relPath);
  
  if (!targetPath.startsWith(storageRoot)) {
    return res.status(403).json({ error: 'Access Denied: Path is outside storage root.' });
  }
  
  if (!fs.existsSync(targetPath)) {
    return res.status(404).json({ error: 'Folder not found.' });
  }
  
  try {
    const stats = fs.statSync(targetPath);
    if (!stats.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory.' });
    }
    
    const folderName = path.basename(targetPath) || 'storage';
    
    // Set response headers for zip file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(folderName)}.zip"`);
    
    const archiver = require('archiver');
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    // Pipe the archive data directly to the client
    archive.pipe(res);
    
    // Add all files from targetPath (recursively) to the ZIP
    archive.directory(targetPath, false);
    
    await archive.finalize();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// 13. Storage Download Selected Files as ZIP API
router.post('/storage/download-selected', async (req, res) => {
  const { paths } = req.body;
  if (!Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ error: 'No files selected for download.' });
  }
  
  const storageRoot = path.resolve(__dirname, '../../storage');
  
  try {
    // Set response headers for zip file download
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="selected_files.zip"');
    
    const archiver = require('archiver');
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    // Pipe the archive data directly to the client
    archive.pipe(res);
    
    for (const relPath of paths) {
      const targetPath = path.resolve(storageRoot, relPath);
      // Safety check to prevent directory traversal
      if (targetPath.startsWith(storageRoot) && fs.existsSync(targetPath)) {
        const fileStats = fs.statSync(targetPath);
        if (fileStats.isFile()) {
          archive.file(targetPath, { name: path.basename(targetPath) });
        } else if (fileStats.isDirectory()) {
          // Append directory recursively with its own folder name inside the zip
          archive.directory(targetPath, path.basename(targetPath));
        }
      }
    }
    
    await archive.finalize();
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// Get active work orders (that have job_number_sl6 or sap_number)
router.get('/workorders/active', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT site_code, job_number_sl6, sap_number, rpm_cycle FROM rpm_records_master 
       WHERE (job_number_sl6 IS NOT NULL AND job_number_sl6 != '') 
          OR (sap_number IS NOT NULL AND sap_number != '');`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit a work order
router.post('/workorder/:rpm_id/submit', async (req, res) => {
  const { rpm_id } = req.params;
  try {
    const result = await db.query(
      "UPDATE rpm_records_master SET status = 'Submitted' WHERE rpm_id = $1 RETURNING *;",
      [rpm_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลใบงานหลัก' });
    }
    res.json({ message: 'Work order submitted successfully', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export detail for a single work order
router.get('/workorder/:rpm_id/export-detail', async (req, res) => {
  const userRole = req.headers['x-user-role'];
  if (userRole !== 'Admin' && userRole !== 'Team Lead') {
    return res.status(403).json({ error: 'การ Export ข้อมูลอนุญาตเฉพาะสิทธิ์ Admin และ Team Lead เท่านั้น' });
  }
  const { rpm_id } = req.params;
  try {
    const masterRes = await db.query(
      `SELECT m.*, s.site_name, s.site_type, s.site_grade, s.area, s.subarea 
       FROM rpm_records_master m
       LEFT JOIN sites s ON m.site_code = s.site_code
       WHERE m.rpm_id = $1`,
      [rpm_id]
    );
    if (masterRes.rows.length === 0) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    const master = masterRes.rows[0];

    const acRes = await db.query('SELECT * FROM power_main_ac WHERE rpm_id = $1', [rpm_id]);
    const acMain = acRes.rows.length > 0 ? acRes.rows[0] : null;

    const rectRes = await db.query('SELECT * FROM power_rectifier WHERE rpm_id = $1 ORDER BY rect_no', [rpm_id]);
    const rectifiers = rectRes.rows;

    const batRes = await db.query(
      `SELECT 
         b.bank_id,
         b.bank_name,
         b.brand,
         b.capacity,
         b.installed_date,
         b.warrantee_date,
         t.bat_id,
         t.cell_no,
         t.voltage,
         t.internal_resistance,
         t.status,
         t.battery_img,
         r.rect_no
       FROM rectifier_banks b
       LEFT JOIN battery_tests t ON b.bank_id = t.bank_id
       JOIN power_rectifier r ON b.rect_id = r.rect_id
       WHERE r.rpm_id = $1`,
      [rpm_id]
    );
    const batteries = batRes.rows;

    const facRes = await db.query('SELECT * FROM systems_and_facilities WHERE rpm_id = $1', [rpm_id]);
    const facilities = facRes.rows.length > 0 ? facRes.rows[0] : null;

    res.json({
      master,
      acMain,
      rectifiers,
      batteries,
      facilities
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all work orders with detail counts
router.get('/workorders/all-detail', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT m.*, s.site_name, s.site_type, s.site_grade, s.area, s.subarea,
        (SELECT COUNT(*) FROM power_main_ac ac WHERE ac.rpm_id = m.rpm_id) as has_ac,
        (SELECT COUNT(*) FROM power_rectifier r WHERE r.rpm_id = m.rpm_id) as rectifier_count,
        (SELECT COUNT(*) FROM systems_and_facilities f WHERE f.rpm_id = m.rpm_id) as has_facilities
       FROM rpm_records_master m
       JOIN sites s ON m.site_code = s.site_code
       WHERE m.rpm_cycle IS NOT NULL AND m.rpm_cycle != '' AND m.status != 'Unopened'
       ORDER BY m.created_at DESC;`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all work orders with site info (for Admin review)
router.get('/workorders/all', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT m.*, s.site_name, s.site_type, s.site_grade, s.area, s.subarea 
       FROM rpm_records_master m
       JOIN sites s ON m.site_code = s.site_code
       WHERE m.rpm_cycle IS NOT NULL AND m.rpm_cycle != '' AND m.status != 'Unopened'
       ORDER BY m.created_at DESC;`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// TL Approve a work order
router.post('/workorder/:rpm_id/tl-approve', async (req, res) => {
  const { rpm_id } = req.params;
  try {
    const result = await db.query(
      "UPDATE rpm_records_master SET status = 'TL Approved' WHERE rpm_id = $1 RETURNING *;",
      [rpm_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลใบงานหลัก' });
    }
    res.json({ message: 'TL Approved successfully', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Approve a work order (Final Approval -> Approved)
router.post('/workorder/:rpm_id/admin-approve', async (req, res) => {
  const { rpm_id } = req.params;
  try {
    const result = await db.query(
      "UPDATE rpm_records_master SET status = 'Approved' WHERE rpm_id = $1 RETURNING *;",
      [rpm_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลใบงานหลัก' });
    }
    res.json({ message: 'Admin Approved successfully', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Reject a work order (send back to Inspector as Rejected)
router.post('/workorder/:rpm_id/reject', async (req, res) => {
  const { rpm_id } = req.params;
  const { reason } = req.body;
  try {
    const result = await db.query(
      "UPDATE rpm_records_master SET status = 'Rejected', summary_issue = COALESCE($2, summary_issue) WHERE rpm_id = $1 RETURNING *;",
      [rpm_id, reason ? `[ตีกลับแก้ไขโดย TL/Admin]: ${reason}` : null]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลใบงานหลัก' });
    }
    res.json({ message: 'Work order rejected back to Inspector', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unlock a work order (set status back to Pending)
router.post('/workorder/:rpm_id/unlock', async (req, res) => {
  const { rpm_id } = req.params;
  try {
    const result = await db.query(
      "UPDATE rpm_records_master SET status = 'Pending' WHERE rpm_id = $1 RETURNING *;",
      [rpm_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลใบงานหลัก' });
    }
    res.json({ message: 'Work order unlocked successfully', data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 14. Storage Delete Files/Folders API
router.delete('/storage/delete', async (req, res) => {
  const { paths } = req.body;
  if (!paths) {
    return res.status(400).json({ error: 'ไม่พบรายการไฟล์ที่ต้องการลบ' });
  }

  const pathList = Array.isArray(paths) ? paths : [paths];
  const storageRoot = path.resolve(__dirname, '../../storage');

  try {
    for (const relPath of pathList) {
      const targetPath = path.resolve(storageRoot, relPath);

      // Security checks
      if (!targetPath.startsWith(storageRoot) || targetPath === storageRoot) {
        continue; // Skip invalid or dangerous paths
      }

      if (fs.existsSync(targetPath)) {
        const stats = fs.statSync(targetPath);
        if (stats.isDirectory()) {
          fs.rmSync(targetPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(targetPath);
        }
      }
    }
    res.json({ message: 'ลบข้อมูลสำเร็จแล้ว' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 15. Manage Users & Roles API
router.get('/users/me', async (req, res) => {
  try {
    const userEmail = req.headers['x-user-email'];
    if (!userEmail) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }
    const result = await db.query('SELECT user_id, email, name, role, area, subarea, created_at FROM users WHERE email = $1;', [userEmail]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const result = await db.query('SELECT user_id, email, name, role, area, subarea, created_at FROM users ORDER BY user_id DESC;');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users/update-role', async (req, res) => {
  const { userId, role, area, subarea, requesterEmail } = req.body;
  if (!userId || !role) {
    return res.status(400).json({ error: 'Missing userId or role' });
  }

  try {
    // 1. Fetch requester role if email provided
    let requesterRole = 'Admin';
    if (requesterEmail) {
      const reqRes = await db.query('SELECT role FROM users WHERE email = $1;', [requesterEmail.trim()]);
      if (reqRes.rows.length > 0) {
        requesterRole = reqRes.rows[0].role;
      }
    }

    // 2. Check target user current role
    const targetResult = await db.query('SELECT role, email FROM users WHERE user_id = $1;', [userId]);
    if (targetResult.rows.length === 0) {
      return res.status(404).json({ error: 'ไม่พบผู้ใช้ที่ระบุ' });
    }

    const targetUser = targetResult.rows[0];

    // Cannot modify roles of Admins!
    if (targetUser.role === 'Admin') {
      return res.status(403).json({ error: 'คุณไม่สามารถแก้ไขสิทธิ์ของบัญชีผู้ดูแลระบบ (Admin) ได้' });
    }

    // Team Lead constraints
    if (requesterRole === 'Team Lead') {
      if (targetUser.role !== 'Inspector' && targetUser.role !== 'Viewer') {
        return res.status(403).json({ error: 'สิทธิ์ Team Lead สามารถจัดการสิทธิ์และพื้นที่ได้เฉพาะ Inspector และ Viewer เท่านั้น' });
      }
      if (role !== 'Inspector' && role !== 'Viewer') {
        return res.status(403).json({ error: 'สิทธิ์ Team Lead ไม่สามารถปรับเปลี่ยนตำแหน่งเป็น Admin หรือ Team Lead ได้' });
      }
    }

    // 3. Perform update
    const updateResult = await db.query(
      'UPDATE users SET role = $1, area = $2, subarea = $3 WHERE user_id = $4 RETURNING user_id, email, name, role, area, subarea;',
      [role, area || null, subarea || null, userId]
    );

    res.json({ message: 'ปรับปรุงสิทธิ์และพื้นที่เรียบร้อยแล้ว', user: updateResult.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/auth/version', (req, res) => {
  res.json({ version: '1.0.2' });
});

// RPM Cycles Management APIs
router.get('/rpm-cycles', async (req, res) => {
  try {
    const result = await db.query('SELECT cycle_id, cycle_name, created_at FROM rpm_cycles ORDER BY cycle_name ASC;');
    res.json(result.rows.map(r => r.cycle_name));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rpm-cycles', async (req, res) => {
  const { cycle_name } = req.body;
  if (!cycle_name || !cycle_name.trim()) {
    return res.status(400).json({ error: 'กรุณาระบุชื่อรอบการตรวจ' });
  }
  try {
    const result = await db.query(
      'INSERT INTO rpm_cycles (cycle_name) VALUES ($1) ON CONFLICT (cycle_name) DO UPDATE SET cycle_name = EXCLUDED.cycle_name RETURNING *;',
      [cycle_name.trim()]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/rpm-cycles/:cycle_name', async (req, res) => {
  const { cycle_name } = req.params;
  try {
    // Delete only from the active choices list table `rpm-cycles`
    // Historical workorders in `rpm_records_master` with this rpm_cycle remain 100% untouched and safe
    await db.query('DELETE FROM rpm_cycles WHERE cycle_name = $1;', [cycle_name]);
    res.json({ message: `ลบตัวเลือกรอบการตรวจ ${cycle_name} ออกจากตัวเลือกเปิดงานใหม่เรียบร้อยแล้ว (ข้อมูลประวัติเดิมยังคงอยู่สมบูรณ์ 100%)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Database Query APIs
router.get('/query/cycles', async (req, res) => {
  try {
    // Admin restriction check
    const userRoleHeader = req.headers['x-user-role'];
    const userEmailHeader = req.headers['x-user-email'];
    if (userRoleHeader !== 'Admin' || !userEmailHeader) {
      return res.status(403).json({ error: 'ปฏิเสธการเข้าถึง: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถใช้งานส่วนนี้ได้' });
    }
    const dbUserResult = await db.query('SELECT role FROM users WHERE email = $1', [userEmailHeader]);
    if (dbUserResult.rows.length === 0 || dbUserResult.rows[0].role !== 'Admin') {
      return res.status(403).json({ error: 'ปฏิเสธการเข้าถึง: บัญชีของคุณไม่มีสิทธิ์เป็นผู้ดูแลระบบ' });
    }

    const result = await db.query("SELECT DISTINCT rpm_cycle FROM rpm_records_master WHERE rpm_cycle IS NOT NULL AND rpm_cycle != '' ORDER BY rpm_cycle DESC;");
    res.json(result.rows.map(r => r.rpm_cycle));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/query/tables', async (req, res) => {
  try {
    // Admin restriction check
    const userRoleHeader = req.headers['x-user-role'];
    const userEmailHeader = req.headers['x-user-email'];
    if (userRoleHeader !== 'Admin' || !userEmailHeader) {
      return res.status(403).json({ error: 'ปฏิเสธการเข้าถึง: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถใช้งานส่วนนี้ได้' });
    }
    const dbUserResult = await db.query('SELECT role FROM users WHERE email = $1', [userEmailHeader]);
    if (dbUserResult.rows.length === 0 || dbUserResult.rows[0].role !== 'Admin') {
      return res.status(403).json({ error: 'ปฏิเสธการเข้าถึง: บัญชีของคุณไม่มีสิทธิ์เป็นผู้ดูแลระบบ' });
    }

    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    const tablesResult = await db.query(tablesQuery);
    
    const tables = [];
    for (const row of tablesResult.rows) {
      const tableName = row.table_name;
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position;
      `;
      const columnsResult = await db.query(columnsQuery, [tableName]);
      tables.push({
        tableName,
        columns: columnsResult.rows.map(c => ({
          name: c.column_name,
          type: c.data_type,
          nullable: c.is_nullable
        }))
      });
    }
    res.json(tables);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/query/execute', async (req, res) => {
  const { sql } = req.body;
  if (!sql) {
    return res.status(400).json({ error: 'กรุณากรอกคำสั่ง SQL' });
  }
  
  try {
    // Admin restriction check
    const userRoleHeader = req.headers['x-user-role'];
    const userEmailHeader = req.headers['x-user-email'];
    if (userRoleHeader !== 'Admin' || !userEmailHeader) {
      return res.status(403).json({ error: 'ปฏิเสธการเข้าถึง: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถใช้งานส่วนนี้ได้' });
    }
    const dbUserResult = await db.query('SELECT role FROM users WHERE email = $1', [userEmailHeader]);
    if (dbUserResult.rows.length === 0 || dbUserResult.rows[0].role !== 'Admin') {
      return res.status(403).json({ error: 'ปฏิเสธการเข้าถึง: บัญชีของคุณไม่มีสิทธิ์เป็นผู้ดูแลระบบ' });
    }

    const result = await db.query(sql);
    const fields = result.fields ? result.fields.map(f => f.name) : [];
    res.json({
      success: true,
      command: result.command,
      rowCount: result.rowCount,
      fields: fields,
      rows: result.rows
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;