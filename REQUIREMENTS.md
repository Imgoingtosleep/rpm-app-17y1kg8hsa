# RPM Application - System Dependencies Specification Document
# เอกสารอธิบายรายละเอียดความต้องการและไลบรารีของระบบ RPM (Backend & Frontend)

---

## 🟢 1. BACKEND DEPENDENCIES (Node.js & Express Stack)
ไฟล์ตั้งค่า: `backend-node/package.json`

### 📦 Core System Packages (Dependencies)

1. **`express` (`^4.19.2`)**
   - **คำอธิบาย**: Web Application Framework หลักสำหรับ Node.js
   - **หน้าที่การทำงาน**: ใช้สร้าง RESTful API Web Server รับ-ส่งข้อมูล HTTP Request/Response, จัดการ Routing, API Endpoints และ Middleware ต่างๆ ของระบบ RPM

2. **`pg` (`^8.12.0`)**
   - **คำอธิบาย**: PostgreSQL Database Client สำหรับ Node.js
   - **หน้าที่การทำงาน**: ทำหน้าที่เชื่อมต่อและจัดการคิวรี (Connection Pool & SQL Queries) กับฐานข้อมูล PostgreSQL เพื่อบันทึก ค้นหา และอัปเดตข้อมูลสถานี, ผู้ใช้งาน, ใบงาน RPM และผลตรวจแบตเตอรี่

3. **`cors` (`^2.8.5`)**
   - **คำอธิบาย**: Cross-Origin Resource Sharing Middleware
   - **หน้าที่การทำงาน**: อนุญาตและควบคุมการเข้าถึง API จากต่างโดเมน/พอร์ต (เช่น อนุญาตให้ Frontend ที่รันคนละพอร์ตสามารถเรียกใช้ Backend API ได้อย่างปลอดภัย)

4. **`dotenv` (`^16.4.5`)**
   - **คำอธิบาย**: Environment Variable Loader
   - **หน้าที่การทำงาน**: โหลดค่าการตั้งค่าจากไฟล์ `.env` เช่น พอร์ตเซิร์ฟเวอร์, รหัสผ่านฐานข้อมูล (`DATABASE_URL`), และ Secret Keys เข้าสู่ `process.env`

5. **`multer` (`^1.4.5-lts.1`)**
   - **คำอธิบาย**: Multipart/Form-Data Handling Middleware
   - **หน้าที่การทำงาน**: จัดการการอัปโหลดไฟล์รูปภาพจากแบบฟอร์ม (เช่น รูปตู้ Rectifier, รูปผลตรวจแบตเตอรี่, รูปตู้ไฟ AC/DC) และบันทึกลงดิสก์ในโฟลเดอร์ `/uploads`

6. **`pdfkit` (`^0.15.0`)**
   - **คำอธิบาย**: PDF Generation Library
   - **หน้าที่การทำงาน**: ใช้สำหรับสร้างและส่งออกรายงานสรุปผลการตรวจ RPM (Work Order Inspection Report) ในรูปแบบไฟล์เอกสาร PDF

7. **`tesseract.js` (`^5.1.0`)**
   - **คำอธิบาย**: Pure JavaScript Optical Character Recognition (OCR) Library
   - **หน้าที่การทำงาน**: ใช้สแกนอ่านตัวอักษรและตัวเลขจากรูปภาพป้ายตู้/เพลทอุปกรณ์อัตโนมัติ (เช่น อ่านรหัสสถานี, ยี่ห้อ Rectifier หรือ Serial Number)

8. **`archiver` (`^5.3.1`)**
   - **คำอธิบาย**: Streaming Archive & Zip Builder
   - **หน้าที่การทำงาน**: บีบอัดไฟล์รูปภาพและเอกสารหลายๆ ไฟล์รวมกันเป็นไฟล์ `.zip` สำหรับให้ Admin ดาวน์โหลดไฟล์ภาพย้อนหลังทั้งหมดของสถานี

---

### 🛠️ Backend Development Tools (DevDependencies)

1. **`nodemon` (`^3.1.4`)**
   - **คำอธิบาย**: Live Reload Development Tool
   - **หน้าที่การทำงาน**: ตรวจจับการเปลี่ยนแปลงไฟล์ซอร์สโค้ดฝั่ง Backend แล้วทำการรีสตาร์ทเซิร์ฟเวอร์ให้อัตโนมัติในระหว่างการพัฒนาโปรแกรม (Development Mode)

---

## 🔵 2. FRONTEND DEPENDENCIES (React & Vite Stack)
ไฟล์ตั้งค่า: `frontend/package.json`

### 📦 Core UI Packages (Dependencies)

1. **`react` (`^18.3.1`)**
   - **คำอธิบาย**: User Interface Library หลักสำหรับการสร้างเว็บแอปพลิเคชันแบบ Single Page Application (SPA)
   - **หน้าที่การทำงาน**: จัดการ Component, State, Lifecycle และการแสดงผลหน้าจอเว็บแบบไดนามิก

2. **`react-dom` (`^18.3.1`)**
   - **คำอธิบาย**: React Document Object Model Renderer
   - **หน้าที่การทำงาน**: ทำหน้าที่แปลง React Components ให้กลายเป็น HTML DOM elements ที่แสดงผลจริงบนเว็บเบราว์เซอร์

3. **`react-router-dom` (`^6.23.1`)**
   - **คำอธิบาย**: Client-Side Routing Library
   - **หน้าที่การทำงาน**: จัดการเปลี่ยนหน้าเว็บและ URL ภายในแอปพลิเคชัน (เช่น หน้าเลือกสถานี `/select-site`, หน้าตาราง Admin `/admin/dashboard`, หน้าสิทธิ์ `/admin/users`) โดยไม่ต้องโหลดหน้าใหม่ทั้งหน้า

---

### 🛠️ Frontend Development & Styling Tools (DevDependencies)

1. **`vite` (`^5.3.1`)**
   - **คำอธิบาย**: Next-Generation Frontend Build Tool & Dev Server
   - **หน้าที่การทำงาน**: รันเซิร์ฟเวอร์พัฒนาอย่างรวดเร็ว (Hot Module Replacement) และคอมไพล์ซอร์สโค้ด JS/JSX/CSS ออกมาเป็น Bundle สำหรับ Production Build

2. **`tailwindcss` (`^3.4.4`)**
   - **คำอธิบาย**: Utility-First CSS Framework
   - **หน้าที่การทำงาน**: ใช้สำหรับตกแต่งดีไซน์ UI หน้าจอทั้งหมด (เช่น การกำหนดโทนสีมืด Glassmorphism, Responsive Grid, Buttons, Alerts, Modals)

3. **`postcss` (`^8.4.38`) & `autoprefixer` (`^10.4.19`)**
   - **คำอธิบาย**: CSS Processor & Vendor Prefixing Tools
   - **หน้าที่การทำงาน**: ประมวลผลโค้ด CSS ของ Tailwind ให้พร้อมใช้งาน และเติม Vendor Prefixes ให้รองรับเบราว์เซอร์ต่างๆ

4. **`@types/react` (`^18.3.3`) & `@types/react-dom` (`^18.3.0`)**
   - **คำอธิบาย**: Type Definitions for React
   - **หน้าที่การทำงาน**: ช่วยเสริมระบบ Autocomplete และ Type Checking สำหรับสภาพแวดล้อมการเขียนโค้ด React

5. **`@vitejs/plugin-react` (`^4.3.1`)**
   - **คำอธิบาย**: Official React Plugin for Vite
   - **หน้าที่การทำงาน**: ช่วยให้ Vite รองรับการคอมไพล์ JSX และความสามารถ Fast Refresh ในการพัฒนา React
