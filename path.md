# RPM System - Storage Path Architecture & Capacity Sizing Guide

## 1. โครงสร้างโฟลเดอร์หลัก (ข้อ 1: Root & Main Storage Paths)

พาธหลักของระบบจะถูกเก็บไว้ที่โฟลเดอร์ `storage/` ซึ่งถูกเชื่อมโยง (Mount) กับ Docker Container ไปที่ `/app/storage`

```
rpm-app/
├── storage/
│   ├── db_text/              # ไฟล์บันทึกการทำธุรกรรม (Audit Log / Operation Logs)
│   ├── sites/                # ไฟล์ Master Data (CSV Templates, Import/Export Batch Files)
│   └── db_img/               # โฟลเดอร์จัดเก็บรูปภาพหน้างานทั้งหมด (Images Storage)
│       └── [SITE_CODE]/      # รหัสสถานี (เช่น BKK-5001-UR, CNX-5003-UR)
│           └── [RPM_CYCLE]/  # รอบการตรวจ (เช่น 2026-R1, 2026-R2, 2026-R3)
```

## 2. โครงสร้างโฟลเดอร์ย่อยตามหมวดหมู่อุปกรณ์ (ข้อ 2: Category & Equipment Paths)

รูปภาพจะถูกจัดเก็บลงโฟลเดอร์ย่อยตามหมวดหมู่อุปกรณ์ภายใต้ `storage/db_img/[SITE_CODE]/[RPM_CYCLE]/`:

```
storage/db_img/[SITE_CODE]/[RPM_CYCLE]/
│
├──  power_ac_main/                             # หมวดที่ 1: ระบบไฟฟ้าเมนหลัก (AC Main)
│   ├── master_ac_img_1.jpg ... (max 10)         # ภาพมิเตอร์ไฟ AC (KWHrs Meter)
│   ├── cable_img_1.jpg ... (max 10)             # ภาพสายไฟเมนเข้าสถานี
│   ├── change_over_img_1.jpg ... (max 10)       # ภาพสวิตช์ Change Over
│   ├── surge_img_1.jpg ... (max 10)             # ภาพ Surge Protection ตู้ Main
│   ├── mdb_temp_img_1.jpg ... (max 10)          # ภาพเทอร์โมสแกน/อุณหภูมิตู้ MDB
│   └── ground_img_1.jpg ... (max 10)            # ภาพการวัดค่า Ground Resistance
│
├──  power_rectifier/                           # หมวดที่ 2: ตู้ Rectifier และ Battery Bank
│   └── rectifier_[1-6]/                         # โฟลเดอร์ตู้ Rectifier (1 ถึง 6 ตู้)
│       ├── breaker_img_1.jpg ... (max 10)       # ภาพเบรกเกอร์ของตู้
│       ├── pdb_temp_img_1.jpg ... (max 10)      # ภาพอุณหภูมิตู้ DC PDB
│       ├── surge_rect_img_1.jpg ... (max 10)    # ภาพ Surge Protection ตู้ Rectifier
│       │
│       ├── bank_[1-8]/                          # กรณีเป็นแบตเตอรี่ Lithium (1-8 Bank)
│       │   └── lithium_bank_img_[1-8]_1.jpg     # ภาพแบตเตอรี่ลิเธียมราย Bank
│       │
│       └── bank_[1-8]/                          # กรณีเป็นแบตเตอรี่ VRLA AGM (1-8 Bank)
│           ├── batt_1/battery1_img_1.jpg ...    # ภาพ Cell ที่ 1
│           ├── batt_2/battery2_img_1.jpg ...    # ภาพ Cell ที่ 2
│           ├── batt_3/battery3_img_1.jpg ...    # ภาพ Cell ที่ 3
│           └── batt_4/battery4_img_1.jpg ...    # ภาพ Cell ที่ 4
│
└──  system_and_facilities/                     # หมวดที่ 3: ระบบแจ้งเตือนและสิ่งอำนวยความสะดวก
    ├── alarm/                                   # หมวด Alarm ระบบแจ้งเตือน
    │   ├── alarm_door_1.jpg                     # ภาพ Alarm ประตู
    │   ├── alarm_ac_fail_1.jpg                  # ภาพ Alarm ไฟดับ
    │   ├── alarm_low_bat_1.jpg                  # ภาพ Alarm แบตเตอรี่ Low
    │   ├── alarm_high_temp_1.jpg                # ภาพ Alarm อุณหภูมิสูง
    │   ├── alarm_smoke_1.jpg                    # ภาพ Alarm ควัน
    │   └── alarm_air_fail_1.jpg                 # ภาพ Alarm แอร์เสีย
    │
    ├── vent/                                    # หมวดระบบระบายอากาศ
    │   ├── vent_ac_fan_1.jpg / hood_1.jpg       # ภาพพัดลม AC และฝาครอบ
    │   ├── vent_dc_fan_1.jpg / hood_1.jpg       # ภาพพัดลม DC และฝาครอบ
    │   ├── vent_air_cloud_1.jpg                 # ภาพเครื่องปรับอากาศ (Air Conditioner)
    │   └── vent_filters_1.jpg                   # ภาพฟิลเตอร์กรองอากาศ
    │
    ├── air/                                     # หมวดควบคุมเครื่องปรับอากาศ
    │   ├── air_owner_1.jpg                      # ภาพเจ้าของกรรมสิทธิ์แอร์
    │   ├── control_air_type_1.jpg               # ภาพประเภทตัวควบคุมแอร์
    │   └── control_air_status_1.jpg             # ภาพสถานะตัวควบคุมแอร์
    │
    └── fac/                                     # หมวดพื้นที่สถานีโดยรอบ
        ├── fac_site_sign_1.jpg                  # ภาพป้ายชื่อสถานี
        ├── fac_outdoor_clean_1.jpg              # ภาพความสะอาดภายนอก
        ├── fac_indoor_clean_1.jpg               # ภาพความสะอาดภายใน
        ├── fac_lighting_1.jpg                   # ภาพระบบไฟส่องสว่าง
        └── fac_glass_cut_1.jpg                  # ภาพการตัดหญ้าและกำจัดวัชพืช
```