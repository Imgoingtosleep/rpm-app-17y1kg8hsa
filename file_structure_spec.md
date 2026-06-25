# ข้อกำหนดโครงสร้างการจัดเก็บไฟล์ (File Storage Directory Tree Specification)

เอกสารนี้ระบุโครงสร้างโฟลเดอร์สำหรับจัดเก็บรูปภาพอัปโหลดและเอกสารประวัติ (Text Logs) แยกรายสถานี (Sites) เพื่อให้สามารถปรับแต่งหรือเปลี่ยนแปลงโครงสร้างในอนาคตได้ง่าย

---

## 📂 แผนผังโครงสร้างไดเรกทอรี (Directory Tree Diagram)

เมื่อมีการทำใบงานตรวจรับ ระบบจะสร้างและแยกเก็บไฟล์ตามแผนผังด้านล่างนี้:

```text
storage/sites/
├── [site_code]/                           # รหัสสถานีหลัก (เช่น BKK-999, CM-002)
│   ├── db_img/                            # โฟลเดอร์หลักสำหรับเก็บรูปภาพประกอบทั้งหมด
│   │   ├── power_main_ac/                 # ระบบไฟฟ้าเมนหลัก (Power Main AC)
│   │   │   ├── meter_ac_img-[ts].jpg      * เก็บรูปหน้าปัดมิเตอร์ AC
│   │   │   ├── cable_img-[ts].jpg         * เก็บรูปสายไฟเมน
│   │   │   ├── change_over_img-[ts].jpg   * เก็บรูปสวิตช์ Change Over
│   │   │   ├── surge_img-[ts].jpg         * เก็บรูปสายและอุปกรณ์กันฟ้าผ่า
│   │   │   ├── mdb_temp_img-[ts].jpg      * เก็บรูปอุณหภูมิตู้ MDB (Thermo Scan)
│   │   │   └── ground_img-[ts].jpg        * เก็บรูปการวัดค่ากราวด์หลัก
│   │   │
│   │   ├── power_rectifier/               # ระบบตู้แปลงไฟ (Power Rectifier)
│   │   │   └── [rect_no]/                 # แยกรายหมายเลขตู้ (เช่น rect_1, rect_2)
│   │   │       ├── breaker_img-[ts].jpg   * รูปเบรกเกอร์ควบคุมของตู้
│   │   │       ├── pdb_temp_img-[ts].jpg  * รูปอุณหภูมิ/เทอร์โมสแกนตู้ Rect
│   │   │       ├── surge_rect_img-[ts].jpg* รูป Surge Protection ของตู้ Rect
│   │   │       │
│   │   │       └── rectifier_banks/       # ชั้นและชุดแบตเตอรี่ในตู้ (Rectifier Banks)
│   │   │           └── [bank_name]/       # แยกราย Bank (เช่น bank_1, bank_2)
│   │   │               └── battery_tests/ # การทดสอบแบตเตอรี่รายลูก
│   │   │                   ├── cell_1-[ts].jpg * รูปแบตเตอรี่ลูกที่ 1
│   │   │                   ├── cell_2-[ts].jpg * รูปแบตเตอรี่ลูกที่ 2
│   │   │                   ├── cell_3-[ts].jpg * รูปแบตเตอรี่ลูกที่ 3
│   │   │                   └── cell_4-[ts].jpg * รูปแบตเตอรี่ลูกที่ 4
│   │   │
│   │   └── systems_and_facilities/        # ระบบเตือนภัยและความสะอาด (Systems & Facilities)
│   │       ├── alarm_door_img-[ts].jpg
│   │       ├── alarm_ac_fail_img-[ts].jpg
│   │       ├── alarm_low_bat_img-[ts].jpg
│   │       ├── alarm_high_temp_img-[ts].jpg
│   │       ├── alarm_smoke_img-[ts].jpg
│   │       ├── alarm_air_fail_img-[ts].jpg
│   │       ├── vent_ac_fan_img-[ts].jpg
│   │       ├── vent_ac_fan_hood_img-[ts].jpg
│   │       ├── vent_dc_fan_img-[ts].jpg
│   │       ├── vent_dc_fan_hood_img-[ts].jpg
│   │       ├── vent_air_cond_img-[ts].jpg
│   │       ├── vent_filters_img-[ts].jpg
│   │       ├── fac_site_sign_img-[ts].jpg
│   │       ├── fac_outdoor_clean_img-[ts].jpg
│   │       ├── fac_indoor_clean_img-[ts].jpg
│   │       ├── fac_lighting_img-[ts].jpg
│   │       └── fac_grass_cut_img-[ts].jpg
│   │
│   └── db_text/                           # โฟลเดอร์หลักสำหรับเก็บรายงานและประวัติเชิงอักษร
│       ├── report-[rpm_id].pdf            * ไฟล์ PDF สรุปผลงานตรวจรับของใบงานนี้
│       └── backup-[rpm_id].json           * ไฟล์ JSON แบ็กอัปข้อมูลดิบสำหรับส่งออกข้อมูล
```

> [!NOTE]
> ตัวแปรทดแทนค่าไดนามิก (Dynamic Placeholders):
> * `[site_code]`: รหัสสถานี เช่น `BKK-999`
> * `[rect_no]`: รหัสตู้แปลงกระแสไฟฟ้า เช่น `rect_1` (แปลงจาก "ตู้ที่ 1")
> * `[bank_name]`: ชื่อกลุ่มแบตเตอรี่ เช่น `bank_1` (แปลงจาก "Bank 1")
> * `[ts]`: วันเวลาที่อัปโหลดอ้างอิง (Timestamp) เพื่อป้องกันรูปทับกันเมื่ออัปโหลดใหม่
> * `[rpm_id]`: เลขไอดีใบงานของใบงานหลัก

---

## 🛠️ ข้อแนะนำการแปลงชื่อก่อนสร้างโฟลเดอร์ (Sanitization)

เพื่อป้องกันปัญหาชื่อโฟลเดอร์ภาษาไทยมีปัญหากับเว็บบราวเซอร์หรือระบบปฏิบัติการบางเวอร์ชัน ควรทำความสะอาดชื่อไดเรกทอรีดังนี้:
1. **ชื่อตู้ (เช่น "ตู้ที่ 1")**: แปลงให้เป็นสากล $\rightarrow$ `rect_1`
2. **ชื่อแบงก์ (เช่น "Bank 1")**: แปลงให้มีรูปแบบเดียวกัน $\rightarrow$ `bank_1`
3. **เว้นวรรคและอักขระพิเศษ**: ให้ลบออกหรือแทนที่ด้วยขีดล่าง `_` (Underscore) ทั้งหมด
