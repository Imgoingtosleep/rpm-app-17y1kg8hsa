# 🚀 NetOps Portal (RPM App)

ระบบบันทึกผลการเข้าตรวจบำรุงรักษาอุปกรณ์ตามรอบการปฏิบัติงาน (Routine Preventive Maintenance - RPM) สำหรับสถานี (Sites) ของทีมวิศวกรรมเครือข่าย

---

## 📋 ภาพรวมโครงการ (Project Overview)

**NetOps Portal (RPM App)** เป็นเว็บแอปพลิเคชันแบบ Full-stack ที่ออกแบบมาเพื่อช่วยอำนวยความสะดวกในการจัดเก็บข้อมูลการตรวจรับงาน Preventive Maintenance (PM) ของสถานีหลักต่าง ๆ รองรับการเก็บข้อมูลระบบไฟฟ้า (Power Main AC), ตู้แปลงกระแสไฟฟ้า (Power Rectifier), แบตเตอรี่สำรอง (Rectifier Banks & Battery Tests) และอุปกรณ์ประกอบอื่น ๆ (Systems & Facilities)

### ฟังก์ชันเด่น (Key Features)
* 📝 **RPM Forms**: กรอกแบบฟอร์มตรวจสอบสถานะพร้อมอัปโหลดรูปภาพของอุปกรณ์แยกประเภท
* 🔍 **OCR Processing**: ถอดความภาพถ่ายตัวเลขมิเตอร์หรือป้ายสถิติผ่านการประมวลผล OCR (Tesseract.js) ในหลังบ้าน
* 📄 **Auto PDF Export**: ออกรายงานสรุปผลการทำงาน (Report PDF) ของใบงานโดยอัตโนมัติ
* 📦 **Data Backup**: ส่งออกข้อมูลดิบในรูปแบบ JSON Backup
* 🐳 **Dockerized Setup**: ติดตั้งและเริ่มใช้งานง่ายผ่าน Docker Compose สำหรับทั้งฐานข้อมูล (PostgreSQL), ระบบจัดการ (pgAdmin), หลังบ้าน (Node.js/Express) และหน้าบ้าน (React/Vite)

---

## 🛠️ โครงสร้างสแต็คเทคโนโลยี (Tech Stack)

* **Frontend**:
  * React (v18)
  * Vite (เครื่องมือจัดเตรียมและรันโค้ดรวดเร็ว)
  * Tailwind CSS (การออกแบบและตกแต่งสไตล์)
  * React Router DOM (จัดการเส้นทางและหน้าเพจ)
* **Backend**:
  * Node.js & Express
  * PostgreSQL (ฐานข้อมูลความสัมพันธ์)
  * PDFKit (สำหรับสร้าง PDF Report)
  * Tesseract.js (สำหรับงาน OCR ค้นหาข้อความจากภาพ)
  * Archiver (สำหรับบีบอัดและจัดการไฟล์)
* **DevOps / Database Tools**:
  * Docker & Docker Compose
  * pgAdmin 4 (เครื่องมือจัดการ Database GUI)

---

## 📂 โครงสร้างโฟลเดอร์ของโปรเจกต์ (Project Directory Structure)

```text
rpm-app/
├── backend-node/         # ซอร์สโค้ดฝั่ง Server (Node.js + Express)
│   ├── src/
│   │   ├── config/       # ตัวกำหนดค่าระบบ เช่น ฐานข้อมูล
│   │   ├── middlewares/  # มิดเดิลแวร์คัดกรองคำขอ (เช่น อัปโหลดไฟล์)
│   │   ├── routes/       # จัดการเส้นทาง API (api.js)
│   │   ├── services/     # ตัวประมวลผลงานเฉพาะด้าน (PDF, OCR, DB query)
│   │   └── server.js     # จุดเริ่มรันเซิร์ฟเวอร์หลัก
│   ├── Dockerfile
│   ├── init.sql          # สคริปต์เตรียมฐานข้อมูลเริ่มต้น
│   └── migration.sql     # สคริปต์ปรับปรุงโครงสร้างตารางเพิ่มเติม
│
├── frontend/             # ซอร์สโค้ดฝั่ง Client (React + Vite + Tailwind)
│   ├── src/              # ส่วนประกอบของเว็บ, หน้าจอ (Pages), และ Logic หน้าบ้าน
│   ├── Dockerfile        # สำหรับ Production
│   ├── Dockerfile.dev    # สำหรับโหมด Development
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── storage/              # พื้นที่จัดเก็บไฟล์อัปโหลดและรายงาน (ดูรายละเอียดด้านล่าง)
├── .env                  # การตั้งค่าตัวแปรระบบ (Environment Variables)
├── docker-compose.yml    # ไฟล์เชื่อมโยง Services ทั้งหมด
├── rebuild.sh            # สคริปต์สำหรับ Clean Build Docker ใหม่ทั้งหมดแบบไม่ใช้ Cache
└── update.sh             # สคริปต์สำหรับ Git Pull, Build และรันอัตโนมัติพร้อมตรวจสอบ Health Check
```

---

## 💾 โครงสร้างการจัดเก็บไฟล์อัปโหลด (File Storage Directory Tree)

อ้างอิงตามข้อกำหนด [file_structure_spec.md](file_structure_spec.md) ระบบจะสร้างไดเรกทอรีจัดเก็บไฟล์แยกตามรายสถานี (`site_code`) ดังนี้:

```text
storage/sites/
└── [site_code]/                           # รหัสสถานีหลัก (เช่น BKK-999)
    ├── db_img/                            # เก็บรูปภาพประกอบแยกตามหมวดหมู่
    │   ├── power_main_ac/                 # ระบบไฟฟ้าเมนหลัก
    │   ├── power_rectifier/               # ระบบตู้แปลงไฟ (แยกตาม [rect_no])
    │   └── systems_and_facilities/        # ระบบเตือนภัยและความสะอาด
    └── db_text/                           # ไฟล์รายงานเชิงอักษร
        ├── report-[rpm_id].pdf            * ไฟล์ PDF สรุปผลงานตรวจรับ
        └── backup-[rpm_id].json           * ไฟล์ JSON แบ็กอัปข้อมูลดิบ
```

---

## 🚀 วิธีการติดตั้งและเริ่มใช้งาน (Getting Started)

### 1. การเตรียมไฟล์ค่าติดตั้ง (.env)
ให้สร้างไฟล์ `.env` ที่โฟลเดอร์ราก (Root Directory) ของโปรเจกต์ โดยตั้งค่าระบบดังตัวอย่างนี้:
```ini
NODE_ENV=development

# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=rpm_db
DB_PORT_EXTERNAL=5432

# pgAdmin Configuration
PGADMIN_EMAIL=admin@netops.local
PGADMIN_PASSWORD=admin_password

# Port Settings
BACKEND_PORT=8001
FRONTEND_PORT=3000

# API Endpoints
VITE_API_URL=http://localhost:8001
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 2. การสั่งรันผ่าน Docker Compose
เริ่มระบบทั้งหมด (Database, pgAdmin, Backend, Frontend) ในโหมดเบื้องหลัง (Background/Detached):
```bash
docker-compose up -d
```

### 3. การเข้าใช้งานพอร์ตต่าง ๆ
* **Frontend**: เข้าใช้งานได้ที่ [http://localhost:3000](http://localhost:3000)
* **Backend API Docs / Health**: [http://localhost:8001](http://localhost:8001) หรือ ตรวจสอบสถานะการทำงานผ่าน `/health`
* **pgAdmin**: เข้าสู่ระบบเพื่อควบคุมฐานข้อมูลได้ที่ [http://localhost:5050](http://localhost:5050)
  * *Username*: อีเมลตามที่ตั้งค่าใน `PGADMIN_EMAIL`
  * *Password*: รหัสผ่านตามที่ตั้งค่าใน `PGADMIN_PASSWORD`

---

## 🛠️ สคริปต์ผู้ดูแลระบบ (Admin Scripts)

ในโฟลเดอร์โครงการ มีสคริปต์ Bash เพื่ออำนวยความสะดวกในการดูแลระบบและการติดตั้ง:

### 1. สคริปต์ Clean Rebuild (`./rebuild.sh`)
ใช้สำหรับล้าง Cache ทั้งหมดของ Docker และบังคับให้ Build ภาพอิมเมจใหม่ตั้งแต่บรรทัดแรก:
```bash
chmod +x rebuild.sh
./rebuild.sh
```

### 2. สคริปต์อัปเดตอัตโนมัติ (`./update.sh`)
สคริปต์ระดับมืออาชีพสำหรับใช้ในการดึงโค้ดล่าสุดจาก GitHub, ตรวจสอบ Docker Daemon, ทำการ Build ใหม่, เช็กสถานะการทำงานของบริการหลังบ้าน (Health Check), และล้าง Image ส่วนเกินอัตโนมัติ:
```bash
chmod +x update.sh
./update.sh
```

---

## 🗄️ โครงสร้างฐานข้อมูล (Database Schema)

ตารางข้อมูลหลักที่ใช้งานภายในระบบ (สามารถศึกษาเพิ่มเติมได้ใน [init.sql](file:///home/rachatacnx13/Desktop/Project/rpm-app/backend-node/init.sql) และ [migration.sql](file:///home/rachatacnx13/Desktop/Project/rpm-app/backend-node/migration.sql)):
1. `users`: ข้อมูลสมาชิกและสิทธิ์การเข้าถึง (`Admin`, `Inspector`, `Viewer`)
2. `sites`: ข้อมูลสถานีและเกรดของแต่ละพื้นที่
3. `rpm_records_master`: ข้อมูลใบงานหลักและการตรวจสอบ
4. `power_main_ac`: การวัดกระแสไฟฟ้า, แรงดัน, ค่ากราวด์ และรูปถ่ายมิเตอร์ AC
5. `power_rectifier`: ข้อมูลเบรกเกอร์และรายละเอียดแบตเตอรี่ในแต่ละตู้ Rectifier
6. `rectifier_banks`: ข้อมูลรุ่น/แบรนด์/วันรับประกันของธนาคารแบตเตอรี่ (Battery Bank)
7. `battery_tests`: ผลการทดสอบแรงดันและความต้านทานภายในของเซลล์แบตเตอรี่รายลูก
8. `systems_and_facilities`: บันทึกระบบความปลอดภัย, พัดลมระบายอากาศ, เครื่องปรับอากาศ และความสะอาดของสถานที่
