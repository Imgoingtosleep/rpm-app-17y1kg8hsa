# NetOps Portal (RPM App)

ระบบบันทึกและจัดการผลการเข้าตรวจบำรุงรักษาอุปกรณ์ตามรอบการปฏิบัติงาน (**Routine Preventive Maintenance - RPM**) สำหรับสถานี (Sites) ของทีมวิศวกรรมเครือข่าย

---

## ภาพรวมโครงการ (Project Overview)

**NetOps Portal (RPM App)** เป็นเว็บแอปพลิเคชันระดับองค์กรแบบ Full-stack (React + Node.js + PostgreSQL) สำหรับบริหารจัดการและจัดเก็บข้อมูลการตรวจรับงาน Preventive Maintenance (PM) รายสถานี มีระบบจำกัดสิทธิ์ผู้ใช้งานตามขอบเขตพื้นที่ (**Multi-Area & Sub-Area Scoping**), การบันทึกสถานะแบตเตอรี่สำรองแบบไดนามิก (VRLA AGM & Lithium), การอัปโหลดภาพถ่ายประกอบพร้อมการตรวจเช็คจำนวนรูปภาพ, การออกรายงาน PDF สรุปผลอัตโนมัติ และระบบบันทึกประวัติการแก้ไข (**Audit Logging**)

### ฟังก์ชันเด่น (Key Features & Current Logic)

1. **Dynamic RPM Work Order Tabs**:
   - **Master Site**: บันทึกข้อมูลใบงานหลัก, เลข Job SL6, SAP ID, ผู้ตรวจสอบ, จำนวนตู้ Rectifier, วันเวลาที่เข้าตรวจ และสรุปปัญหาหน้างาน
   - **AC Main**: บันทึกมิเตอร์ไฟ, สายไฟ, Changeover Switch, Surge Protection, อุณหภูมิ MDB, ค่าแรงดัน/กระแสไฟ (3-Phase) และค่าต้านทานกราวด์
   - **Rectifier**: บันทึกรุ่น, AC Cable, Breaker (Phase 1-3), โมดูลปกติ/เสีย, ค่ากระแส Input/Output, Surge และเลือกประเภทแบตเตอรี่ (VRLA AGM หรือ Lithium)
   - **Battery Bank (Dynamic Logic)**:
     - รองรับแบตเตอรี่ประเภท **VRLA AGM** (กรอกรายละเอียดรายลูก 1-4 ค่า Volt, IR, แบรนด์, สเปก วันที่ติดตั้ง/ประกัน และรูปถ่าย)
     - รองรับแบตเตอรี่ประเภท **Lithium** (บันทึกสเปกความจุ, สถานะการทำงาน RUN, SOH%, SOC%, Capacity%, LED Alarm และรูปถ่ายภาพรวม Bank)
     - ระบบปรับแต่ง State การค้นหาและสลับ Bank อัตโนมัติ ป้องกันข้อมูลสูญหายเมื่อเปลี่ยน Bank หรือกด F5 Refresh
   - **Facilities**: ตรวจสอบระบบความปลอดภัย (Security, Fire Alarm, FM200), พัดลมระบายอากาศ, แผ่นกรองอากาศ, เครื่องปรับอากาศ และความสะอาดสถานี
   - **Summary**: หน้าสรุปสถานะใบงาน พร้อมการกดส่งอนุมัติ (**Submit Work Order**) หรือการปลดล็อกใบงาน (**Unlock**) สำหรับ Admin / Team Lead

2. **Role-Based Access Control & Scope Access**:
   - แบ่งสิทธิ์ออกเป็น **Admin**, **Team Lead**, **Inspector**, และ **Viewer**
   - **Multi-Area & Sub-Area Scope**: กำหนดสิทธิ์ช่าง/ผู้ตรวจสอบให้มองเห็นเฉพาะสถานีที่อยู่ในเขตพื้นที่ (Area) หรือพื้นที่ย่อย (Sub-Area) ที่ได้รับมอบหมายเท่านั้น
   - **Audit Logging**: บันทึกการแก้ไข (POST, PUT, DELETE) ลงไฟล์ `audit_log.txt` ใน `/storage/db_text` พร้อมระบุตัวตนผู้ทำรายการและเวลา Asia/Bangkok

3. **Automated PDF Report & Backup**:
   - ระบบสร้างรายงานสรุปผลการตรวจรับงาน (`report-[rpm_id].pdf`) และไฟล์สำรองข้อมูลดิบ (`backup-[rpm_id].json`) ลงในระบบจัดเก็บไฟล์โดยอัตโนมัติ

4. **Field Configuration System**:
   - ปรับแต่งการเปิด/ปิด (Enable/Disable) และการบังคับกรอก (Required) ของแต่ละฟิลด์ข้อมูลได้จากหน้าแอดมิน (`/admin/fields`)

5. **Dockerized Microservices Setup**:
   - บริหารจัดการผ่าน Docker Compose ประกอบด้วย PostgreSQL 15, Node.js Express Backend, React Vite Frontend และ pgAdmin 4 GUI

---

## สแต็คเทคโนโลยี (Tech Stack)

* **Frontend**:
  * **React 18** (Vite Bundler)
  * **Tailwind CSS** (Custom Styling Framework)
  * **React Router DOM v6** (Nested & Param-based Routing)
* **Backend**:
  * **Node.js** & **Express**
  * **PostgreSQL 15** (pg pool with SSL support)
  * **Multer** (จัดการไฟล์อัปโหลดและสร้าง Structure ไดเรกทอรีอัตโนมัติ)
  * **PDFKit** (สร้างเอกสารรายงาน PDF)
* **DevOps & Tools**:
  * **Docker** & **Docker Compose**
  * **pgAdmin 4** (Database Management UI)

---

## โครงสร้างโปรเจกต์ (Project Structure)

```text
rpm-app/
├── backend-node/         # Backend API Server (Node.js + Express)
│   ├── src/
│   │   ├── config/       # Database & Environment configuration
│   │   ├── middlewares/  # Auth & File Upload (Multer) Middlewares
│   │   ├── routes/       # API endpoints definitions (api.js)
│   │   ├── services/     # Utility services (PDF generator, etc.)
│   │   └── server.js     # Entry point server
│   ├── Dockerfile
│   └── init.sql          # Initial database schema setup
│
├── frontend/             # Frontend Web Application (React + Vite + Tailwind)
│   ├── src/
│   │   ├── components/   # Shared UI components (ImagePreview, Navbars)
│   │   ├── layouts/      # MainLayout & Navigation Sidebars
│   │   ├── pages/        # Gatekeeper, Admin Pages, WorkOrder Tabs
│   │   │   └── WorkOrder/ # Master, AcMain, Rectifier, Battery, Facilities, Summary Tabs
│   │   ├── utils/        # Scope Access Filtering & Helpers
│   │   └── App.jsx       # Main Application Routing & React State Context
│   ├── Dockerfile
│   └── vite.config.js
│
├── storage/              # Physical storage for uploaded images & PDF reports
├── .env                  # Environment Variables Configuration
├── docker-compose.yml    # Docker orchestration setup
├── rebuild.sh            # Complete No-Cache Docker Rebuild script
└── update.sh             # Automated Deployment & Health-check script
```

---

## โครงสร้างจัดเก็บไฟล์ (File Storage Directory Tree)

ไฟล์อัปโหลดและเอกสารจะถูกจัดเก็บเข้าไดเรกทอรีใน `storage/` ตามโครงสร้างมาตรฐานดังนี้:

```text
storage/
├── db_text/
│   ├── audit_log.txt                      # บันทึกประวัติการแก้ไขระบบ (Audit Logs)
│   │   # ตัวอย่างรูปแบบบรรทัดบันทึกประวัติ (Audit Log Format):
│   │   # [YYYY-MM-DD HH:mm:ss] | WHO: Name (Role: RoleName) | ACTION: Action Name | SITE: Site Code | PATH: API Endpoint
│   ├── report-[rpm_id].pdf                # เอกสาร PDF รายงานสรุปผลงาน
│   └── backup-[rpm_id].json               # ไฟล์สำรองข้อมูลดิบ JSON
└── db_img/
    └── [site_code]/                       # รหัสสถานี (เช่น BKK-5005-UR)
        └── [rpm_cycle]/                   # รอบการตรวจ (เช่น 2026-R1)
            ├── power_main_ac/             # รูปภาพระบบ AC Main
            ├── power_rectifier/           # รูปภาพระบบ Rectifier & Battery
            └── systems_and_facilities/    # รูปภาพระบบ Facilities & Security
```

---

## โครงสร้างฐานข้อมูล (Database Schema)

1. `users`: บัญชีผู้ใช้, รหัสผ่าน, สิทธิ์ (`Admin`, `Team Lead`, `Inspector`, `Viewer`), พื้นที่ดูแล (`area`, `subarea`)
2. `sites`: ข้อมูลสถานี (`site_code`, `site_name`, `site_grade`, `site_type`, `area`, `subarea`)
3. `rpm_records_master`: ข้อมูลหลักของใบงาน (`job_number_sl6`, `sap_number`, `rpm_cycle`, `status`, `inspection_date`, `inspection_time`)
4. `power_main_ac`: บันทึกระบบไฟฟ้าเมนหลัก AC
5. `power_rectifier`: บันทึกข้อมูลตู้ Rectifier และประเภทแบตเตอรี่
6. `rectifier_banks`: ข้อมูลกลุ่มแบตเตอรี่ (`bank_name`, `brand`, `capacity`, `installed_date`, `warrantee_date`)
7. `battery_tests`: บันทึกผลทดสอบแบตเตอรี่ VRLA รายลูก (Cell 1-4: `voltage`, `internal_resistance`, `status`, `battery_img`)
8. `systems_and_facilities`: บันทึกระบบความปลอดภัย สภาพแวดล้อม และเครื่องปรับอากาศ
9. `field_configs`: การตั้งค่าเปิด/ปิดฟิลด์กรอกข้อมูลในแต่ละแท็บ
10. `rpm_cycles`: รายการตัวเลือกรอบการตรวจ (เช่น 2026-R1, 2026-R2)

---

## ขั้นตอนการติดตั้งและรันระบบ (Getting Started)

### 1. การเตรียมไฟล์ Environment Variables (`.env`)
สร้างไฟล์ `.env` ไว้ที่โฟลเดอร์ Root ของโปรเจกต์:
```ini
NODE_ENV=development

# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=rpm_db
DB_PORT_EXTERNAL=5432

# pgAdmin Configuration
PGADMIN_EMAIL=admin@netops.local
PGADMIN_PASSWORD=admin_password

# Application Ports
BACKEND_PORT=8001
FRONTEND_PORT=3000

# API Configuration
VITE_API_URL=http://localhost:8001
```

### 2. สั่งรันผ่าน Docker Compose
```bash
docker-compose up -d
```

### 3. การเข้าใช้งานผ่านเบราว์เซอร์
* **Frontend Web App**: [http://localhost:3000](http://localhost:3000)
* **Backend API / Health**: [http://localhost:8001/health](http://localhost:8001/health)
* **pgAdmin 4 GUI**: [http://localhost:5050](http://localhost:5050)

---

## สคริปต์สำหรับการดูแลระบบ (Admin Utilities)

* **Clean Rebuild (ล้างแคชและบิลด์อิมเมจใหม่)**:
  ```bash
  chmod +x rebuild.sh
  ./rebuild.sh
  ```
* **Auto Deploy & Health Check**:
  ```bash
  chmod +x update.sh
  ./update.sh
  ```
