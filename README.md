# NetOps Portal - RPM Application

ระบบบันทึกและบริหารจัดการผลการเข้าตรวจบำรุงรักษาอุปกรณ์ตามรอบการปฏิบัติงาน (**Routine Preventive Maintenance - RPM**) สำหรับสถานีโทรคมนาคม (Sites) ของทีมวิศวกรรมเครือข่าย

---

## ภาพรวมระบบ (Project Overview)

**NetOps Portal (RPM App)** เป็นเว็บแอปพลิเคชันระดับองค์กรแบบ Full-stack (Next.js 14 + Node.js Express + PostgreSQL 15) ที่พัฒนาขึ้นเพื่อยกระดับการตรวจรับงานบำรุงรักษาอุปกรณ์หน้างานให้มีมาตรฐาน ปลอดภัย และตรวจสอบย้อนหลังได้ 100% 

### จุดเด่นและฟังก์ชันหลักของระบบ (Key Features)
1. ** Multi-Method Authentication & Security**:
   - **Google Workspace OAuth (Official Popup)**: ยืนยันตัวตนด้วยบัญชีองค์กร
   - **2-Factor Authenticator (TOTP OTP 6 หลัก)**: สร้างและสแกน QR Code ด้วย Google / Microsoft Authenticator โดยระบบบังคับตรวจสอบว่า Email ต้องเคยมีในฐานข้อมูลก่อนเสมอ
   - **Stateless JWT & NextAuth**: จัดการ Session และ Token ความปลอดภัยข้าม Frontend และ Backend
2. ** Role-Based & Multi-Area Scope Control**:
   - แบ่งระดับผู้ใช้งานเป็น **Admin**, **Team Lead**, **Inspector**, และ **Viewer**
   - **Area & Sub-area Scoping**: กำหนดสิทธิ์ช่างให้มองเห็นและจัดการเฉพาะสถานีในเขตพื้นที่ (Area) หรือพื้นที่ย่อย (Sub-area) ที่ได้รับมอบหมาย
3. ** Dynamic RPM Work Order (6 แท็บการตรวจงาน)**:
   - **Master Site**: บันทึกข้อมูลใบงานหลัก, เลขที่ Job SL6, SAP ID, ผู้ตรวจสอบ, จำนวนตู้ Rectifier, วันเวลาที่เข้าตรวจ
   - **AC Main**: บันทึกมิเตอร์ไฟ AC, สายไฟเมน, Changeover Switch, Surge Protection, อุณหภูมิ MDB, แรงดัน/กระแสไฟ 3 เฟส และค่าต้านทานกราวด์
   - **Rectifier (1-6 ตู้)**: บันทึกข้อมูลตู้, เบรกเกอร์, DC PDB, โมดูลปกติ/เสีย, ค่ากระแสไฟ และ Surge ประจำตู้
   - **Battery Bank (VRLA AGM & Lithium)**:
     - **VRLA AGM**: บันทึกผลทดสอบรายลูก (Cell 1-4: Volt, IR, แบรนด์, ประกัน, รูปถ่าย)
     - **Lithium**: บันทึกสถานะ RUN, SOH%, SOC%, Capacity%, LED Alarm และภาพรวม Bank
   - **Facilities**: ตรวจสอบระบบ Alarm (ประตู, ไฟดับ, แบตเตอรี่ Low, ความร้อน, ควัน, แอร์เสีย), พัดลมระบายอากาศ, แผ่นกรองอากาศ, เครื่องปรับอากาศ และความสะอาดสถานี
   - **Summary & Approval Flow**: สรุปปัญหาหน้างาน พร้อมระบบส่งอนุมัติ (**Submit** ➔ **TL Approve** ➔ **Admin Approve** / **Reject**)
4. ** Intelligent Storage & Image Management**:
   - จัดเก็บรูปภาพแยกโฟลเดอร์ตามสถานีและรอบการตรวจอย่างเป็นระเบียบ (`storage/db_img/[site_code]/[rpm_cycle]/...`)
   - ระบบ FIFO Queue จำกัดไม่เกิน 10 รูปต่อหัวข้อ
   - **Storage Browser (`/admin/storage`)**: หน้าจอเปิดดู ดาวน์โหลด และบริหารจัดการไฟล์รูปภาพสำหรับ Admin และ Team Lead
   - รองรับการย้ายที่เก็บไฟล์ไปที่ NAS หรือ Drive อื่นผ่านตัวแปร `STORAGE_PATH` ใน `.env`
5. ** Admin Management Hub**:
   - **Dashboard (`/admin/dashboard`)**: ตรวจสอบสถานะใบงาน, กรองตามพื้นที่/รอบตรวจ, อนุมัติ/ตีกลับงาน, Export ข้อมูล Excel/CSV
   - **User Management (`/admin/users`)**: กำหนดสิทธิ์และพื้นที่ดูแลของผู้ใช้งาน
   - **Field Settings (`/admin/fields`)**: เปิด/ปิด หรือตั้งค่าบังคับกรอกฟิลด์ข้อมูลในแต่ละแท็บ
   - **SQL Query Console (`/admin/query`)**: รันคำสั่งสืบค้นและจัดการฐานข้อมูลโดยตรงสำหรับ Admin
6. ** Complete 3-Layer Logging Architecture**:
   - **HTTP Access Logs**: บันทึก Traffic, Status Code, และ Response Time (ms)
   - **Audit Trail Logs**: บันทึกประวัติการบันทึก/แก้ไข/อนุมัติลงไฟล์ `storage/db_text/audit_log.txt`
   - **Centralized Error Handling**: ดักจับและบันทึก Stack Trace ข้อผิดพลาดอย่างละเอียด

---

## สแต็คเทคโนโลยี (Tech Stack)

| ส่วนของระบบ | เทคโนโลยีที่ใช้งาน | รายละเอียด |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14 (App Router)** | React 18, Tailwind CSS, NextAuth.js, Google OAuth GSI |
| **Backend API** | **Node.js & Express** | RESTful API, Multer (Dynamic Storage), JWT, Speakeasy (TOTP) |
| **Database** | **PostgreSQL 15 (Alpine)** | Relational DB พร้อม Connection Pooling และ Healthcheck |
| **Storage & File** | **Local / NAS / POSIX File System** | จัดเก็บภาพและไฟล์แบบแยกโครงสร้างไดนามิก |
| **DevOps / Infra** | **Docker & Docker Compose v2** | Named Volumes, Alpine Containers, Nginx Reverse Proxy Ready |
| **DB Admin Tool** | **pgAdmin 4** | Web UI สำหรับจัดการฐานข้อมูล PostgreSQL |

---

## โครงสร้างโปรเจกต์ (Project Structure)

```text
rpm-app/
├── backend-node/                 # Backend API Server (Express Node.js)
│   ├── src/
│   │   ├── config/               # Database Connection (pg pool)
│   │   ├── middlewares/          # Auth JWT, Multer Dynamic Upload
│   │   ├── routes/               # API Endpoints & Audit Logging (api.js)
│   │   ├── services/             # TOTP Authenticator, OCR, PDF Services
│   │   └── server.js             # Entry Point & Centralized Error Handler
│   ├── Dockerfile
│   └── init.sql                  # PostgreSQL Initial Schema & Seed Data
│
├── frontend/                     # Frontend Application (Next.js 14)
│   ├── src/
│   │   ├── app/                  # Next.js App Router Pages
│   │   │   ├── admin/            # Dashboard, Fields, Users, Query, Storage
│   │   │   ├── api/auth/         # NextAuth.js API Routes
│   │   │   ├── workorder/        # Inspection Forms & Tabs
│   │   │   ├── select-site/      # Gatekeeper & Site Selector
│   │   │   ├── setup-qr/         # Authenticator QR Setup
│   │   │   └── page.jsx          # Login Page (Google + TOTP + Demo)
│   │   ├── components/           # ImagePreviewManager, Providers, Modals
│   │   ├── layouts/              # MainLayout & Sidebar Navigation
│   │   └── utils/                # Scope Access & Navigation Helpers
│   ├── Dockerfile                # Production Multi-Stage Dockerfile
│   ├── Dockerfile.dev            # Development Hot-Reload Dockerfile
│   └── nginx.conf                # Nginx Reverse Proxy Template
│
├── storage/                      # โฟลเดอร์จัดเก็บข้อมูลจริง (Persistent Storage)
│   ├── db_img/                   # รูปภาพหน้างานแยกตาม [site_code]/[rpm_cycle]/...
│   ├── db_text/                  # ไฟล์ประวัติการแก้ไข audit_log.txt
│   └── sites/                    # ไฟล์ Master Template / Import CSV
│
├── docker-compose.yml            # Docker Compose Orchestration (v2)
├── path.md                       # เอกสารผังโฟลเดอร์และการประเมินขนาดพื้นที่จัดเก็บ (Sizing)
├── .env.example                  # Template ตัวแปร Environment สำหรับเริ่มต้นระบบ
├── .gitignore                    # กฎการป้องกันไฟล์ความลับและ Cache ขึ้น Git
└── rebuild.sh / update.sh        # สคริปต์ช่วย Build และ Deploy อัตโนมัติ
```

---

## ขั้นตอนการติดตั้งและรันระบบ (Getting Started)

### 1. โคลนโปรเจกต์และเตรียมไฟล์ `.env`
```bash
git clone rpm-app.git
cd rpm-app

# คัดลอกไฟล์ตั้งค่าจาก Template
cp .env.example .env
```

### 2. ตั้งค่าไฟล์ Environment Variables (`.env`)
เปิดไฟล์ `.env` และกำหนดค่าความปลอดภัยตามสภาพแวดล้อม (ดูตัวอย่างโครงสร้างเต็มได้ที่ [`.env.example`](.env.example)):
```ini
# Database Settings
DB_USER=postgres
DB_PASSWORD=your_secure_db_password
DB_NAME=rpm_db
DB_PORT_EXTERNAL=8432

# Backend & Storage Settings
BACKEND_PORT=8050
NODE_ENV=development
STORAGE_PATH=./storage

# Security Secrets
JWT_SECRET=your_super_secret_jwt_signing_key_min_32_chars
SHARED_JWT_SECRET=your_super_secret_jwt_signing_key_min_32_chars
NEXTAUTH_SECRET=your_super_secret_nextauth_cookie_key
NEXTAUTH_URL=http://localhost:8000

# Frontend & OAuth Settings
FRONTEND_PORT=8001
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# pgAdmin Settings (Port 8055)
PGADMIN_EMAIL=admin@rpm.com
PGADMIN_PASSWORD=your_secure_pgadmin_password
```

### 3. สั่งรันระบบผ่าน Docker Compose
```bash
docker compose up -d
```

### 4. การเข้าใช้งานผ่านเว็บเบราว์เซอร์
* **Web Portal (Main Entry via Nginx)**: [http://localhost:8000](http://localhost:8000)
* **Frontend Direct**: [http://localhost:8001](http://localhost:8001)
* **Backend Health Check**: [http://localhost:8050/api/health](http://localhost:8050/api/health)
* **pgAdmin 4 Database UI**: [http://localhost:8055](http://localhost:8055)
* **Admin Dashboard**: [http://localhost:8000/admin/dashboard](http://localhost:8000/admin/dashboard)
* **Storage Browser**: [http://localhost:8000/admin/storage](http://localhost:8000/admin/storage)

---

##  การเตรียมความพร้อมขึ้น Production (Production Deployment)

1. **ตั้งค่า Nginx Reverse Proxy (พอร์ต 8000 HTTP / 8443 HTTPS SSL)**:
   - Forward `/*` ➔ `http://frontend:8001` (Frontend)
   - Forward `/api/*` ➔ `http://backend:8050/api/*` (Backend API)
   - Forward `/storage/*` ➔ `http://backend:8050/storage/*` (Storage Images)
   - กำหนด `client_max_body_size 50M;` สำหรับรองรับการอัปโหลดรูปภาพ
2. **อัปเดต Google Cloud OAuth**:
   - เพิ่ม Domain จริง (เช่น `https://rpm.co.th`) ลงใน *Authorized JavaScript origins* และ *Authorized redirect URIs* บน Google Cloud Console
3. **กำหนดที่เก็บ Storage**:
   - หากต้องการชี้รูปภาพไปที่ NAS หรือ Drive อื่น ให้กำหนด `STORAGE_PATH=/mnt/nas/rpm_storage` ใน `.env`
   - ดูรายละเอียดโครงสร้างและแผนประเมินขนาดข้อมูล (Capacity Planning) ได้ที่ [`path.md`](path.md)

---