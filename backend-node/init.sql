-- 1. ตารางสิทธิ์ผู้ใช้งาน (Users & Roles)
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Inspector', 'Viewer')) DEFAULT 'Viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ตารางข้อมูลหลักสถานี (Sites Master)
CREATE TABLE IF NOT EXISTS sites (
    site_id SERIAL PRIMARY KEY,
    site_code VARCHAR(50) UNIQUE NOT NULL, -- ใช้เป็น Unique สำหรับอ้างอิงภายนอก
    site_name VARCHAR(255) NOT NULL,
    site_grade VARCHAR(10) CHECK (site_grade IN ('A', 'B', 'C')), -- บังคับเกรด A, B, C ตาม Scope of Work
    site_type VARCHAR(50) CHECK (site_type IN ('Indoor', 'Outdoor')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ตารางบันทึกประวัติใบงานหลัก (RPM Records Master)
CREATE TABLE IF NOT EXISTS rpm_records_master (
    rpm_id SERIAL PRIMARY KEY,
    site_code VARCHAR(50) NOT NULL REFERENCES sites(site_code) ON UPDATE CASCADE ON DELETE RESTRICT,
    job_number_sl6 VARCHAR(100) UNIQUE NOT NULL, -- SL6 No.
    sap_number VARCHAR(100) NOT NULL,            -- SAP No.
    rpm_date DATE NOT NULL DEFAULT CURRENT_DATE,
    summary_issue TEXT,                          -- สรุปปัญหาหน้างาน
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ตารางระบบไฟฟ้าเมนหลัก (Power Main AC) [1-to-1 กับใบงาน]
CREATE TABLE IF NOT EXISTS power_main_ac (
    main_ac_id SERIAL PRIMARY KEY,
    rpm_id INT UNIQUE NOT NULL REFERENCES rpm_records_master(rpm_id) ON DELETE CASCADE, -- 1 ใบงานมีได้ 1 บันทึก AC
    meter_ac_size VARCHAR(100),
    meter_ac_img VARCHAR(500), -- เก็บเป็น Path รูปภาพ เช่น '/BKK001/20260623/ac_meter.jpg'
    cable_status VARCHAR(100),
    cable_img VARCHAR(500),
    change_over_switch VARCHAR(100),
    change_over_img VARCHAR(500),
    ac_phase_qty VARCHAR(50),
    surge_protection VARCHAR(100),
    surge_img VARCHAR(500),
    mdb_temp NUMERIC(5,2), -- รองรับทศนิยม เช่น 35.50
    mdb_temp_img VARCHAR(500),
    voltage_p1 INT,
    voltage_p2 INT,
    voltage_p3 INT,
    current_p1 NUMERIC(5,2),
    current_p2 NUMERIC(5,2),
    current_p3 NUMERIC(5,2),
    ground_resistance NUMERIC(5,2),
    ground_img VARCHAR(500)
);

-- 4. ตารางระบบตู้ Rectifier (Power Rectifier) - สัมพันธ์แบบ 1 ใบงาน มีได้หลายตู้ (1-to-Many)
CREATE TABLE IF NOT EXISTS power_rectifier (
    rect_id SERIAL PRIMARY KEY,
    rpm_id INT NOT NULL REFERENCES rpm_records_master(rpm_id) ON DELETE CASCADE,
    rect_no VARCHAR(50) NOT NULL, -- เช่น ตู้ที่ 1, ตู้ที่ 2
    model VARCHAR(100),
    ac_cable_size VARCHAR(50),
    breaker_size VARCHAR(50),
    breaker_img VARCHAR(500),
    modules_all INT DEFAULT 0,
    modules_fail INT DEFAULT 0,
    input_current_ac NUMERIC(5,2),
    output_current_dc NUMERIC(5,2),
    pdb_temp_img VARCHAR(500),
    surge_status VARCHAR(100),
    surge_rect_img VARCHAR(500)
);

-- 5. ตารางชั้น Bank (Rectifier Banks) [1 ตู้ มีหลาย Bank]
CREATE TABLE IF NOT EXISTS rectifier_banks (
    bank_id SERIAL PRIMARY KEY,
    rect_id INT NOT NULL REFERENCES power_rectifier(rect_id) ON DELETE CASCADE,
    bank_name VARCHAR(50) NOT NULL, -- เช่น 'Bank 1', 'Bank 2'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ตารางตรวจสอบแบตเตอรี่รายลูก (Battery Tests) [1 Bank มี 4 ลูก]
CREATE TABLE IF NOT EXISTS battery_tests (
    bat_id SERIAL PRIMARY KEY,
    bank_id INT NOT NULL REFERENCES rectifier_banks(bank_id) ON DELETE CASCADE, -- อ้างอิง Bank แทน Rectifier
    cell_no INT NOT NULL,          -- ลูกที่ 1, 2, 3, 4
    voltage NUMERIC(4,2),          -- เช่น 13.21
    internal_resistance NUMERIC(5,2), -- ค่า IR (มิลลิโอห์ม)
    status VARCHAR(100),           -- ปกติ / เสื่อม
    installed_date DATE,
    warrantee_date DATE,
    battery_img VARCHAR(500)
);

-- 7. ตารางระบบ Alarm และสิ่งอำนวยความสะดวก (Systems And Facilities) [1-to-1 กับใบงาน]
CREATE TABLE IF NOT EXISTS systems_and_facilities (
    facility_id SERIAL PRIMARY KEY,
    rpm_id INT UNIQUE NOT NULL REFERENCES rpm_records_master(rpm_id) ON DELETE CASCADE,
    -- หมวด Alarms
    alarm_door VARCHAR(100), alarm_door_img VARCHAR(500),
    alarm_ac_fail VARCHAR(100), alarm_ac_fail_img VARCHAR(500),
    alarm_low_bat VARCHAR(100), alarm_low_bat_img VARCHAR(500),
    alarm_high_temp VARCHAR(100), alarm_high_temp_img VARCHAR(500),
    alarm_smoke VARCHAR(100), alarm_smoke_img VARCHAR(500),
    alarm_air_fail VARCHAR(100), alarm_air_fail_img VARCHAR(500),
    -- หมวด Ventilation Systems
    vent_ac_fan VARCHAR(100), vent_ac_fan_img VARCHAR(500),
    vent_ac_fan_hood VARCHAR(100), vent_ac_fan_hood_img VARCHAR(500),
    vent_dc_fan VARCHAR(100), vent_dc_fan_img VARCHAR(500),
    vent_dc_fan_hood VARCHAR(100), vent_dc_fan_hood_img VARCHAR(500),
    vent_air_cond VARCHAR(100), vent_air_cond_img VARCHAR(500),
    vent_filters VARCHAR(100), vent_filters_img VARCHAR(500),
    -- หมวด Site Facility
    fac_site_sign VARCHAR(100), fac_site_sign_img VARCHAR(500),
    fac_outdoor_clean VARCHAR(100), fac_outdoor_clean_img VARCHAR(500),
    fac_indoor_clean VARCHAR(100), fac_indoor_clean_img VARCHAR(500),
    fac_lighting VARCHAR(100), fac_lighting_img VARCHAR(500),
    fac_grass_cut VARCHAR(100), fac_grass_cut_img VARCHAR(500)
);

-- สร้าง Index
CREATE INDEX IF NOT EXISTS idx_rpm_site ON rpm_records_master(site_code);
CREATE INDEX IF NOT EXISTS idx_rect_rpm ON power_rectifier(rpm_id);
CREATE INDEX IF NOT EXISTS idx_bank_rect ON rectifier_banks(rect_id);
CREATE INDEX IF NOT EXISTS idx_bat_bank ON battery_tests(bank_id);
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);

-- Seed initial users
INSERT INTO users (email, name, role) VALUES
('anan.dev@rpm.com', 'Anan Developer', 'Admin'),
('inspector@rpm.com', 'John Inspector', 'Inspector'),
('viewer@rpm.com', 'Jane Viewer', 'Viewer')
ON CONFLICT (email) DO NOTHING;
