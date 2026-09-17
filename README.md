# RPM Portal (NetOps Portal) — ระบบบันทึกผลตรวจบำรุงรักษาสถานีโทรคมนาคม

[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?style=flat&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Nginx](https://img.shields.io/badge/Nginx-Reverse%20Proxy-009639?style=flat&logo=nginx&logoColor=white)](https://nginx.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)

**เว็บแอปสำหรับทีมวิศวกรรมเครือข่าย ใช้บันทึกผลการเข้าตรวจบำรุงรักษาอุปกรณ์ไฟฟ้าตามรอบ (Routine Preventive Maintenance — RPM) ของสถานีโทรคมนาคม ตั้งแต่ระบบไฟ AC, ตู้ Rectifier, แบตเตอรี่, Alarm และสภาพสถานี พร้อมรูปถ่ายหลักฐาน และขั้นตอนอนุมัติ Inspector → Team Lead → Admin**

ปัญหาที่แก้: เดิมผลตรวจหน้างานถูกกรอกผ่านแบบฟอร์มออนไลน์ทั่วไป (ไฟล์ตัวอย่างใน `data/`) ข้อมูลเป็นแถวยาวเกือบ 100 คอลัมน์ รูปภาพกระจัดกระจาย และไม่มีขั้นตอนตรวจรับ — ระบบนี้แยกข้อมูลเป็นหมวดตามอุปกรณ์ จัดเก็บรูปเป็นโฟลเดอร์ตามสถานี/รอบ กำหนดสิทธิ์ตามพื้นที่รับผิดชอบ และมีสถานะใบงานให้ติดตามได้

![Admin Dashboard](docs/screenshots/30-admin-dashboard.png)

---

## สารบัญ

1. [Architecture & Network Topology](#1-architecture--network-topology)
2. [Key Features](#2-key-features)
3. [Tech Stack](#3-tech-stack)
4. [Getting Started](#4-getting-started)
5. [Usage](#5-usage)
6. [Demo / Output](#6-demo--output)
7. [Database Schema](#7-database-schema)
8. [API Reference](#8-api-reference)
9. [Project Structure](#9-project-structure)
10. [Known Issues & Security Notes](#10-known-issues--security-notes)
11. [เอกสารเพิ่มเติม](#11-เอกสารเพิ่มเติม)

---

## 1. Architecture & Network Topology

### 1.1 Container & Network

มีเพียง **Nginx port 8000** ที่เปิดออกสู่ภายนอก — ทุก service อื่น (frontend, backend, db, pgAdmin) อยู่ใน Docker network ภายใน (บรรทัด `ports:` ถูก comment ไว้)

```mermaid
flowchart LR
    subgraph Users["ผู้ใช้งาน (LAN / VPN)"]
        INS["Inspector<br/>มือถือ / แท็บเล็ตหน้างาน"]
        TL["Team Lead"]
        ADM["Admin"]
    end

    subgraph Host["Docker Host (เช่น 10.x.x.x)"]
        NG["rpm-nginx<br/>:8000 (เปิดสู่ภายนอก)"]
        subgraph Net["docker network (internal)"]
            FE["rpm-frontend<br/>Next.js 14 :8001"]
            BE["rpm-backend<br/>Express :8050"]
            DB[("rpm-db<br/>PostgreSQL 15 :5432")]
            PGA["rpm-pgadmin<br/>:80 (ไม่ได้ publish)"]
        end
        ST[("STORAGE_PATH<br/>./storage หรือ NAS<br/>db_img / db_text / sites")]
    end

    SV["Single View<br/>Accounting / Auth server<br/>(SINGLE_VIEW_API_URL)"]
    GG["Google OAuth"]

    INS & TL & ADM -->|HTTP :8000| NG
    NG -->|"/"| FE
    NG -->|"/api/*"| BE
    NG -->|"/storage/*"| BE
    BE --> DB
    BE <-->|"multer / static"| ST
    PGA --> DB
    BE -->|"POST /api/auth/login"| SV
    FE -.-> GG
```

| Service | Container | Port ภายใน | เปิดสู่ host |
| :--- | :--- | :--- | :--- |
| Reverse proxy | `rpm-nginx` | 80, 8000 | **8000** |
| Frontend | `rpm-frontend` | 8001 | — |
| Backend API | `rpm-backend` | 8050 | — |
| Database | `rpm-db` | 5432 | — (เปิดได้ที่ `DB_PORT_EXTERNAL`) |
| DB admin | `rpm-pgadmin` | 80 | — |

### 1.2 Request & Security Pipeline (Backend)

```mermaid
flowchart LR
    R["Request /api/*"] --> LOG["HTTP access log<br/>method · path · status · ms · user"]
    LOG --> AUTH["authenticateToken<br/>Bearer token → x-user-* headers"]
    AUTH --> AUD["Audit middleware<br/>เขียน storage/db_text/audit_log.txt"]
    AUD --> UP["multer upload<br/>storage/db_img/site/cycle/หมวด<br/>สูงสุด 10 รูป/หัวข้อ, 10 MB/ไฟล์"]
    UP --> H["Route handler<br/>pg Pool + SQL"]
    H --> ERR["Centralized error handler"]
```

### 1.3 Authentication Options

```mermaid
flowchart TB
    L["หน้า Login"] --> SVL["Single View<br/>username + password"]
    L --> OTP["OTP 6 หลัก<br/>Google / Microsoft Authenticator"]
    L --> GOO["Google OAuth"]
    L --> DEMO["Demo 1-Click<br/>(Admin / TL / Inspector / Viewer)"]
    SVL -->|"ส่งต่อไป Single View server"| MAP["map role → สร้าง/อัปเดต users"]
    OTP -->|"email ต้องมีในตาราง users"| TOK
    GOO --> TOK
    MAP --> TOK["ออก token (HMAC-SHA256, 7 วัน)"]
    TOK --> SEL["/select-site"]
    DEMO --> SEL
```

### 1.4 Work Order Approval Flow

```mermaid
stateDiagram-v2
    [*] --> Pending: Inspector เปิดใบงาน<br/>(site + รอบ + SL6 + SAP)
    Pending --> Submitted: กรอกครบ 6 แท็บ → Submit
    Submitted --> TL_Approved: Team Lead อนุมัติ
    TL_Approved --> Approved: Admin อนุมัติขั้นสุดท้าย
    Submitted --> Rejected: TL / Admin ตีกลับ
    TL_Approved --> Rejected
    Rejected --> Pending: Unlock แก้ไข
    Approved --> [*]
```

---

## 2. Key Features

### ใบงานตรวจ (Work Order) — 6 แท็บ
| แท็บ | ข้อมูลที่บันทึก |
| :--- | :--- |
| **Master Site** | พื้นที่, รอบตรวจ, ผู้ตรวจ, วัน-เวลา, เลข Job SL6, SAP, จำนวนตู้ Rectifier |
| **AC Main** | อุณหภูมิสถานี/ตู้ MDB, ขนาดมิเตอร์, สายเมน, Change-over switch, Surge, แรงดัน/กระแส 3 เฟส, Ground resistance |
| **Rectifier (1–6 ตู้)** | รุ่น, สาย AC, เบรกเกอร์ต่อเฟส, โมดูลทั้งหมด/เสีย, กระแส AC in / DC out, Surge |
| **Battery Bank** | VRLA AGM: ผลทดสอบรายลูก (Volt, IR mΩ, สถานะ) สูงสุด 12 Bank · Lithium: RUN, SOH%, SOC%, Capacity%, Alarm |
| **Facilities** | Alarm (ประตู, ไฟดับ, แบตต่ำ, ความร้อน, ควัน, แอร์เสีย), พัดลม/ฟิลเตอร์/แอร์, ป้าย, ความสะอาด, ไฟส่องสว่าง, ตัดหญ้า |
| **Summary** | สรุปปัญหาหน้างาน แล้ว Submit |

- ทุกหัวข้อแนบรูปได้ **สูงสุด 10 รูป** (เกินแล้ววนแทนที่รูปเก่าแบบ FIFO) มี progress bar ความครบของใบงาน

### สถานีและรอบตรวจ
- เลือกสถานีตาม **Area / Sub-area** ที่ได้รับสิทธิ์ ค้นหาด้วยรหัส/ชื่อ
- เพิ่มสถานีทีละรายการ หรือ **bulk import** จาก Excel/CSV
- จัดการรอบตรวจ (เช่น `2026-R1`, `2026-R2`, `2026-R3`)

### Admin Hub
- **Dashboard**: การ์ดสรุปสถานะ, กรองตามพื้นที่/รอบ/สถานะ, อนุมัติ/ตีกลับ/ปลดล็อก, **Export XLSX / CSV** (รายละเอียดทุกแท็บ)
- **User Management**: บทบาท Admin / Team Lead / Inspector / Viewer + พื้นที่ดูแลหลายพื้นที่
- **Field Settings**: เปิด-ปิดฟิลด์, ตั้งค่าบังคับกรอก และตัวเลือก dropdown ของแต่ละแท็บ
- **Database Query Console**: รัน SQL (เฉพาะ Admin) มีคำสั่งสำเร็จรูป + Export CSV
- **Storage Browser**: เปิดดูโฟลเดอร์รูป, ดาวน์โหลดทั้งโฟลเดอร์หรือที่เลือกเป็น `.zip`, ลบไฟล์

### Security & Logging
- Login 4 แบบ: **Single View**, **TOTP (Authenticator)** พร้อมหน้าสร้าง QR, **Google**, และ **Demo**
- Token ลงลายเซ็น HMAC-SHA256 อายุ 7 วัน, backend เขียนทับ header `x-user-*` จาก token
- **HTTP access log** + **Audit trail** (ใคร บทบาทอะไร ทำอะไรกับใบงานไหน) + centralized error handler
- เก็บรูปไว้ที่ `STORAGE_PATH` ย้ายไป NAS ได้

---

## 3. Tech Stack

| Layer | เครื่องมือ |
| :--- | :--- |
| Frontend | **Next.js 14** (App Router), **React 18**, **Tailwind CSS 3**, NextAuth, xlsx (SheetJS) |
| Backend | **Node.js 18**, **Express 4**, `pg`, multer, archiver (zip), otplib (TOTP), pdfkit, tesseract.js |
| Database | **PostgreSQL 15** (+ `uuid-ossp`), pgAdmin 4 |
| Infra | **Docker Compose**, **Nginx** reverse proxy, named volumes |
| Auth | Single View (external), TOTP, Google OAuth, HMAC token |
| Testing | Jest + Supertest (`backend-node/tests/`) |

---

## 4. Getting Started

### 4.1 Prerequisites

| รายการ | ขั้นต่ำ | แนะนำ Production |
| :--- | :--- | :--- |
| Docker + Compose v2 | Docker 24+ | — |
| CPU / RAM | 2 vCPU / 4 GB | 4 vCPU / 8 GB (50+ ผู้ใช้พร้อมกัน, ดู `SYSTEM_SPEC.md`) |
| Disk | 10 GB | 200 GB+ SSD หรือ NAS สำหรับรูป (ดู `path.md`) |
| Port ว่าง | 8000 | — |
| Network | เครื่อง server ต้องเข้าถึง Single View server (ถ้าใช้ login แบบนี้) | — |

### 4.2 Clone & Environment

```bash
git clone git@github.com:Imgoingtosleep/rpm-app.git
cd rpm-app
cp .env.example .env
```

ค่าที่ **ต้อง** เปลี่ยนใน `.env`:

```ini
DB_PASSWORD=change-me
JWT_SECRET=long-random-string-at-least-32-chars
SHARED_JWT_SECRET=same-as-JWT_SECRET
NEXTAUTH_SECRET=another-long-random-string
PGADMIN_PASSWORD=change-me

NEXTAUTH_URL=http://<server-ip>:8000
NEXT_PUBLIC_API_URL=http://<server-ip>:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com

SINGLE_VIEW_API_URL=http://<single-view-server>
STORAGE_PATH=./storage            # หรือ /mnt/nas/rpm_storage
```

### 4.3 Run

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f backend
```

```text
> backend-node@1.0.0 start
> node src/server.js
Server is running on port 8050
```

เปิด **http://localhost:8000** — ตาราง + ข้อมูลเริ่มต้น (ผู้ใช้ 4 บทบาท, รอบตรวจ, field configs) ถูกสร้างจาก `backend-node/init.sql` อัตโนมัติ

```bash
curl http://localhost:8000/api/health
# {"status":"ok","message":"Node.js Core API is running"}
```

Rebuild แบบล้าง cache: `./rebuild.sh` (รัน `docker system prune -f` ด้วย)

### 4.4 Production checklist
1. เปลี่ยน secret ทุกตัว และตั้ง `NODE_ENV=production`
2. แก้ `server_name` ใน `nginx/default.conf` และเพิ่ม HTTPS
3. เพิ่มโดเมนจริงใน Google Cloud Console (Authorized origins / redirect URIs)
4. ชี้ `STORAGE_PATH` ไปที่ NAS และวางแผนพื้นที่ตาม `path.md`
5. ปิด Demo login และแก้ปัญหาใน [หัวข้อ 10](#10-known-issues--security-notes)

---

## 5. Usage

| บทบาท | ทำอะไรได้ |
| :--- | :--- |
| **Inspector** | เลือกสถานีในพื้นที่ตัวเอง → เปิดใบงาน (รอบ, SL6, SAP) → กรอก 6 แท็บ + ถ่ายรูป → Submit |
| **Team Lead** | ดูใบงานในพื้นที่ → TL Approve / Reject |
| **Admin** | อนุมัติขั้นสุดท้าย, ปลดล็อก, จัดการผู้ใช้/สถานี/รอบ/ฟิลด์, Export, SQL, Storage |
| **Viewer** | ดูข้อมูลอย่างเดียว |

ขั้นตอนหน้างาน: **Login → Select Site & Launch → Work Order Panel (Master → AC Main → Rectifier → Battery → Facilities → Summary) → Submit Work Order**

---

## 6. Demo / Output

> ภาพถ่ายจากระบบที่รันจริงด้วย Docker Compose (headless Chrome 1440×900) บน **ฐานข้อมูลทดสอบแยก** — สถานี (`*-DM`), ใบงาน, ผู้ใช้ และรูปหน้างานเป็นข้อมูลสมมติ ไม่ใช่ข้อมูลจริง

### 6.1 Login
| Single View | OTP (Authenticator) | Demo 1-Click |
| :---: | :---: | :---: |
| ![](docs/screenshots/01-login-singleview.png) | ![](docs/screenshots/02-login-otp.png) | ![](docs/screenshots/03-login-demo.png) |

### 6.2 เลือกสถานี / เพิ่มสถานี / ลงทะเบียน QR
| Select Site & Launch | Create Station | Setup QR Authenticator |
| :---: | :---: | :---: |
| ![](docs/screenshots/10-select-site.png) | ![](docs/screenshots/11-create-site.png) | ![](docs/screenshots/12-setup-qr.png) |

### 6.3 Work Order Panel — 6 แท็บ
| Master Site | AC Main | Rectifier |
| :---: | :---: | :---: |
| ![](docs/screenshots/20-wo-master.png) | ![](docs/screenshots/21-wo-acmain.png) | ![](docs/screenshots/22-wo-rectifier.png) |
| **Battery Bank** | **Facilities** | **Summary** |
| ![](docs/screenshots/23-wo-battery.png) | ![](docs/screenshots/24-wo-facilities.png) | ![](docs/screenshots/25-wo-summary.png) |

### 6.4 Admin
| Dashboard | User Roles & Areas |
| :---: | :---: |
| ![](docs/screenshots/30-admin-dashboard.png) | ![](docs/screenshots/31-admin-users.png) |
| **Field Settings** | **Database Query Console** |
| ![](docs/screenshots/32-admin-fields.png) | ![](docs/screenshots/33-admin-query.png) |
| **Storage Browser** (`db_img/BKK-9001-DM/2026-R3/power_ac_main`) | |
| ![](docs/screenshots/34-admin-storage.png) | |

### 6.5 Terminal: HTTP access log จาก backend

```text
[2026-09-17 15:44:08] [HTTP] GET /api/health -> 200 (27ms) [User: Anonymous]
[2026-09-17 15:44:08] [HTTP] GET /api/users/me -> 200 (16ms) [User: admin.dev@rpm.com]
[2026-09-17 15:44:08] [HTTP] POST /api/query/execute -> 200 (4ms) [User: admin.dev@rpm.com]
[2026-09-17 15:44:08] [HTTP] GET /api/users -> 401 (1ms) [User: Anonymous]
```

### 6.6 โครงสร้างไฟล์รูปที่ระบบสร้าง

```text
storage/
├── db_text/audit_log.txt
└── db_img/BKK-9001-DM/2026-R3/
    ├── power_ac_main/        master_ac_img_1.jpg  cable_img_1.jpg  mdb_temp_img_1.jpg  ground_img_1.jpg
    ├── power_rectifier/rectifier_1/  breaker_img_1.jpg ...  bank_1/ ...
    └── system_and_facilities/ ...
```

---

## 7. Database Schema

```mermaid
erDiagram
    sites ||--o{ rpm_records_master : "site_code"
    rpm_records_master ||--|| power_main_ac : ""
    rpm_records_master ||--o{ power_rectifier : "1-6 ตู้"
    power_rectifier ||--o{ rectifier_banks : ""
    rectifier_banks ||--o{ battery_tests : "cell 1-4"
    rpm_records_master ||--|| systems_and_facilities : ""

    users {
        serial user_id PK
        varchar email UK
        varchar role "Admin | Team Lead | Inspector | Viewer"
        varchar two_factor_secret
        text area "JSON list"
        text subarea
    }
    sites {
        serial site_id PK
        varchar site_code UK
        varchar site_name
        varchar site_grade "A | B | C"
        varchar site_type "Indoor | Outdoor"
        varchar area
    }
    rpm_records_master {
        serial rpm_id PK
        varchar job_number_sl6 UK
        varchar sap_number
        varchar rpm_cycle
        text summary_issue
        varchar status "Pending | Submitted | TL Approved | Approved | Rejected"
    }
    power_main_ac {
        int rpm_id FK
        int voltage_p1_p3
        numeric current_p1_p3
        varchar ground_resistance
        varchar_array images
    }
    power_rectifier {
        serial rect_id PK
        varchar rect_no
        int modules_all
        int modules_fail
        varchar battery_type "VRLA AGM | Lithium"
        text battery_soh_soc
    }
    rectifier_banks {
        serial bank_id PK
        varchar brand
        varchar capacity
    }
    battery_tests {
        int cell_no
        numeric voltage
        numeric internal_resistance
        varchar status
    }
    systems_and_facilities {
        int rpm_id FK
        varchar alarms_vent_facility "30+ fields + images"
    }
    field_configs {
        varchar tab_name
        varchar field_name
        bool is_required
        bool is_enabled
        text_array dropdown_options
    }
    rpm_cycles {
        varchar cycle_name UK
    }
```

---

## 8. API Reference

Base: `http://<host>:8000/api` — ต้องส่ง `Authorization: Bearer <token>` ยกเว้น `/api/health` และ `/api/auth/*`

| กลุ่ม | Endpoints |
| :--- | :--- |
| **Health** | `GET /health` |
| **Auth** | `POST /auth/login` (Single View) · `POST /auth/google` · `POST /auth/sync-user` · `POST /auth/totp/setup` · `POST /auth/totp/verify` · `GET /auth/version` |
| **Users** | `GET /users/me` · `GET /users` · `POST /users/update-role` |
| **Sites** | `GET /sites` · `POST /sites` · `PUT /sites/:site_id` · `POST /sites/bulk` |
| **RPM cycles** | `GET /rpm-cycles` · `POST /rpm-cycles` · `DELETE /rpm-cycles/:cycle_name` |
| **Work order** | `POST /workorder/start` · `GET/PUT /workorder/:rpm_id/master` · `PUT /workorder/:rpm_id/summary` · `GET/POST /workorder/:rpm_id/ac` · `GET/POST /workorder/:rpm_id/facilities` · `GET /workorders/active` |
| **Rectifier & battery** | `GET /workorder/:rpm_id/rectifiers` · `POST /workorder/:rpm_id/rectifier` · `GET /workorder/:rpm_id/all-batteries` · `GET /site/:site_code/rectifiers` · `GET /site/:site_code/all-batteries` · `GET /rectifier/:rect_id/batteries` · `POST /rectifier/:rect_id/bank-meta` · `POST /rectifier/:rect_id/battery` · `POST /rectifier/:rect_id/bank-save` |
| **Approval** | `POST /workorder/:rpm_id/submit` · `/tl-approve` · `/admin-approve` · `/reject` · `/unlock` |
| **Export** | `GET /workorder/:rpm_id/export-detail` · `GET /workorders/all-detail` · `GET /workorders/all` |
| **Field configs** | `GET /field-configs` · `POST /field-configs/update` |
| **Storage** | `GET /storage/browse?path=` · `GET /storage/download-folder` · `POST /storage/download-selected` · `DELETE /storage/delete` · static `GET /storage/*` |
| **SQL console** | `GET /query/cycles` · `GET /query/tables` · `POST /query/execute` (Admin) |

---

## 9. Project Structure

```text
rpm-app/
├── docker-compose.yml          # db, pgadmin, backend, frontend, nginx
├── .env.example
├── nginx/default.conf          # :8000 → frontend / api / storage
├── rebuild.sh
├── backend-node/
│   ├── Dockerfile
│   ├── init.sql                # schema + seed (users, cycles, field configs)
│   ├── src/
│   │   ├── server.js           # access log, static storage, error handler, auto init DB
│   │   ├── config/db.js
│   │   ├── middlewares/        # auth.js (token), upload.js (multer, 10 รูป/หัวข้อ)
│   │   ├── routes/api.js       # REST API + audit log
│   │   └── services/           # tokenService, totpService, ocrService, pdfService
│   └── tests/                  # health, auth, tokenService (Jest + Supertest)
├── frontend/
│   ├── Dockerfile / Dockerfile.dev
│   └── src/
│       ├── app/                # App Router: /, select-site, create-site, setup-qr,
│       │                       #   workorder/[site_code]/[[...tab]], admin/*
│       ├── views/              # AdminDashboard, ManageUsers, FieldSettings, DatabaseQuery,
│       │                       #   StorageBrowser, Gatekeeper, CreateSite, WorkOrder/* (6 tabs)
│       ├── components/ layouts/ lib/ utils/
│       └── middleware.js
├── data/                       # ตัวอย่างข้อมูลจากแบบฟอร์มเดิม + รายการคอลัมน์
├── docs/screenshots/           # ภาพประกอบ README
├── DOCUMENTATION.md  REQUIREMENTS.md  SYSTEM_SPEC.md  path.md
└── storage/                    # (gitignored) รูป / audit log / ไฟล์ import
```

---

## 10. Known Issues & Security Notes

ตรวจจากโค้ดและ **ทดสอบกับระบบ demo แล้ว** — ควรแก้ก่อนเปิดใช้งานจริง

| # | ปัญหา | ผลกระทบ (ทดสอบแล้ว) | แนวทางแก้ |
| :--- | :--- | :--- | :--- |
| 1 | `verifyToken` ยอมรับ token คงที่ `demo-token-admin` / `demo-token-team-lead` / ... **ทุก environment** | `Authorization: Bearer demo-token-admin` ได้สิทธิ์ Admin ทันที รวมถึง **รัน SQL ใดก็ได้** ผ่าน `/api/query/execute` | ปิด demo token เมื่อ `NODE_ENV=production` |
| 2 | `authenticateToken` ข้ามการตรวจถ้า URL **มีคำว่า** `/auth/` อยู่ที่ใดก็ได้ (`includes`) | `GET /api/users?x=/auth/` ได้รายชื่อผู้ใช้ทั้งหมดโดยไม่ต้อง login | ตรวจ `req.path.startsWith(...)` แทน |
| 3 | ถ้า `NODE_ENV` ไม่ใช่ production และไม่มี token แต่ส่ง header `x-user-email` → ผ่าน | ปลอมตัวเป็นใครก็ได้ในโหมด development | ลบ fallback หรือจำกัดเฉพาะ localhost |
| 4 | Nginx ส่ง `/api/*` ทั้งหมดไป backend | route ของ NextAuth (`/api/auth/session`) ตอบ 404 เมื่อเข้าผ่าน :8000 | แยก location `/api/auth/` ไป frontend |
| 5 | ค่า default ของ secret อยู่ในโค้ด/compose (`netops-secure-token-signing-key-7892`, `rpm-secure-auth-secret-key-9988`) | ถ้าลืมตั้ง `.env` ใครก็เซ็น token ได้ | บังคับให้ตั้งค่า ไม่ใช้ default |
| 6 | `data/input_data.csv` มีข้อมูลจากแบบฟอร์มจริง (อีเมลผู้ตรวจ, รหัสสถานี, Job/SAP ID) ถูก commit | ข้อมูลส่วนบุคคล/ข้อมูลองค์กรอยู่ใน git | แทนด้วยข้อมูลสมมติ และลบจาก history |
| 7 | `ocrService` และ `pdfService` เป็นโค้ดตัวอย่าง (placeholder) ยังไม่ถูกเรียกใช้ | — | |
| 8 | `npm test` ใช้ Jest + Supertest แต่ยังไม่อยู่ใน `devDependencies` | รันเทสต์ไม่ได้จนกว่าจะติดตั้ง | `npm i -D jest supertest` |
| 9 | `rebuild.sh` รัน `docker system prune -f` และ grep ชื่อ `netops` ซึ่งไม่ตรงกับ container `rpm-*` | ลบ resource ที่ไม่ได้ใช้ทั้งเครื่อง | |

**FAQ**
- **เข้า :8000 แล้วหน้าเว็บค้าง** — Next.js dev server compile ครั้งแรกใช้เวลา 1–2 นาที ดู `docker compose logs -f frontend`
- **Login Single View ไม่ได้** — ตรวจว่า backend เข้าถึง `SINGLE_VIEW_API_URL` ได้ (log: `Single View upstream unreachable`)
- **OTP แจ้งว่าไม่พบอีเมล** — ต้องมีผู้ใช้ในตาราง `users` ก่อน (เพิ่มผ่าน User Management)
- **แก้ `init.sql` แล้วไม่มีผล** — script รันเฉพาะ volume ใหม่: `docker compose down -v && docker compose up -d`

---

## 11. เอกสารเพิ่มเติม

| ไฟล์ | เนื้อหา |
| :--- | :--- |
| [`DOCUMENTATION.md`](DOCUMENTATION.md) | สถาปัตยกรรม, schema, API spec เชิงลึก |
| [`REQUIREMENTS.md`](REQUIREMENTS.md) | dependencies ทุก layer |
| [`SYSTEM_SPEC.md`](SYSTEM_SPEC.md) | สเปกเครื่องและการประมาณทรัพยากร |
| [`path.md`](path.md) | โครงสร้างโฟลเดอร์รูปและการประเมินพื้นที่จัดเก็บ |
