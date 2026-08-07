# System Architecture & Infrastructure Specification Document
**Project**: NetOps Portal (RPM App)  

---

## 1. ข้อกำหนดฮาร์ดแวร์และเซิร์ฟเวอร์ (Hardware & Server Specifications)

### Minimum Recommended Spec (สำหรับผู้ใช้งานไม่เกิน 10–20 Concurrent Users / Site Inspector)
* **CPU**: 2 Cores (vCPU)
* **RAM**: 4 GB (ขั้นต่ำจริง 2 GB แต่แนะนำ 4 GB เนื่องจากมี Node.js OCR Process)
* **Storage**: 50 GB SSD (Expandable)
* **OS**: Ubuntu 22.04 LTS / Debian 12 / RHEL 9

### Production Recommended Spec (สำหรับผู้ใช้งาน 50+ Concurrent Users & เก็บรูปภาพจำนวนมาก)
* **CPU**: 4 Cores (vCPU)
* **RAM**: 8 GB
* **Storage**: 100–200 GB NVMe/SSD (รองรับรูปภาพที่อัปโหลดเข้า Storage Volume)
* **Network**: 100 Mbps / 1 Gbps Bandwidth

---

## 2. การประมาณการใช้งานทรัพยากร (Resource Allocation Breakdown)

| Container / Service | Minimum RAM | Recommended RAM | CPU Share | หมายเหตุ |
| :--- | :--- | :--- | :--- | :--- |
| **Database (`db`)** | 256 MB | 1.0 - 2.0 GB | 25% | PostgreSQL 15 (ขึ้นอยู่กับขนาด Cache/Buffer) |
| **Backend API (`backend`)** | 512 MB | 1.5 - 2.5 GB | 40% | Node.js + Express + Tesseract.js (OCR ใช้ RAM สูงขณะวิเคราะห์ภาพ) |
| **Frontend (`frontend`)** | 64 MB | 128 - 256 MB | 10% | Nginx Production Build (Serving Static HTML/JS) |
| **pgAdmin (`pgadmin`)** | 128 MB | 256 - 512 MB | 10% | Web Admin UI |
| **System Overhead (Docker Engine/OS)** | 500 MB | 1.0 GB | 15% | Docker Daemon + OS Core |
| **รวมทั้งหมด (Total)** | **~1.5 GB** | **~4.0 - 6.5 GB** | **100%** | |

---

## 3. การคำนวณและประมาณการพื้นที่จัดเก็บข้อมูล (Storage Requirement Estimation)

1. **System & Docker Images**: `~5 - 10 GB` (สำหรับ Base Images & OS)
2. **Database Data (`postgres_data`)**: `~2 - 10 GB` (สำหรับข้อความ ประวัติ และ Audit Logs)
3. **Uploaded Media & Images (`storage`)**:
   * รูปถ่ายเฉลี่ยต่อใบงาน: ~10 - 15 รูป
   * ขนาดรูปถ่ายเฉลี่ย (หลังบีบอัด): ~500 KB - 1 MB / รูป
   * 1 ใบงาน = ~10 MB
   * **1,000 ใบงาน = ~10 GB**
   * **10,000 ใบงาน = ~100 GB**

---

## 4. ข้อกำหนดซอฟต์แวร์และ Docker Container Versions

### Docker Components & Versions
* **Docker Engine**: `24.0.x` หรือสูงกว่า
* **Docker Compose**: `v2.20.x` หรือสูงกว่า (หรือ Docker Compose plugin)

### Container Stack Specifications
```yaml
version: '3.8'

services:
  # 1. Database Service
  db:
    image: postgres:15-alpine            # PostgreSQL Version 15.x (Lightweight Alpine Linux)
    ports:
      - "5432:5432"

  # 2. Database Management UI
  pgadmin:
    image: dpage/pgadmin4:latest         # pgAdmin4 Web UI (Port 5050)
    ports:
      - "5050:80"

  # 3. Backend API Engine
  backend:
    build: ./backend-node
    environment:
      - Node.js: 20.x LTS
      - Express: ^4.19.2
      - Tesseract.js: ^5.1.0 (OCR Engine)
      - PDFKit: ^0.15.0 (PDF Engine)

  # 4. Frontend Web App
  frontend:
    build: ./frontend
    environment:
      - Nginx: 1.25-alpine (สำหรับ Production) หรือ Node.js 20 (สำหรับ Dev)
      - React: ^18.3.1
      - Vite: ^5.3.1
```

---

## 5. รายการบริการเสริมที่ต้องเตรียมเพิ่ม (Required Third-Party / External Dependencies)

1. **Google Cloud Console (OAuth 2.0 Client ID)**:
   * สำหรับการทำ Google Authentication (`VITE_GOOGLE_CLIENT_ID`)
2. **SSL Certificate / Reverse Proxy (แนะนำ Nginx / Traefik / Cloudflare)**:
   * เพื่อเปิดใช้งาน HTTPS (Port 443) ป้องกันข้อมูลการตรวจวัดและรูปภาพ
3. **Backup System**:
   * Cronjob สำหรับ Backup `postgres_data` (`pg_dump`) และโฟลเดอร์ `/app/storage` เป็นประจำทุกวัน
