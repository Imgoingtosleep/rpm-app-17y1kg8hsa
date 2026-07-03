ALTER TABLE rpm_records_master ADD COLUMN IF NOT EXISTS rectifier_qty_uih INT;

ALTER TABLE power_main_ac ADD COLUMN IF NOT EXISTS site_temp VARCHAR(50);
ALTER TABLE power_main_ac ALTER COLUMN mdb_temp TYPE VARCHAR(100);
ALTER TABLE power_main_ac ALTER COLUMN ground_resistance TYPE VARCHAR(100);

ALTER TABLE power_rectifier ADD COLUMN IF NOT EXISTS breaker_phase1 VARCHAR(50);
ALTER TABLE power_rectifier ADD COLUMN IF NOT EXISTS breaker_phase2 VARCHAR(50);
ALTER TABLE power_rectifier ADD COLUMN IF NOT EXISTS breaker_phase3 VARCHAR(50);
ALTER TABLE power_rectifier ADD COLUMN IF NOT EXISTS battery_type VARCHAR(50);
ALTER TABLE power_rectifier ADD COLUMN IF NOT EXISTS lithium_capacity VARCHAR(50);
ALTER TABLE power_rectifier ADD COLUMN IF NOT EXISTS battery_run VARCHAR(50);
ALTER TABLE power_rectifier ADD COLUMN IF NOT EXISTS battery_soh VARCHAR(50);
ALTER TABLE power_rectifier ADD COLUMN IF NOT EXISTS battery_soc VARCHAR(50);
ALTER TABLE power_rectifier ADD COLUMN IF NOT EXISTS battery_capacity_percent VARCHAR(50);
ALTER TABLE power_rectifier ADD COLUMN IF NOT EXISTS battery_alarm VARCHAR(50);
ALTER TABLE power_rectifier ADD COLUMN IF NOT EXISTS battery_qty_bank INT;

ALTER TABLE rectifier_banks ADD COLUMN IF NOT EXISTS brand VARCHAR(100);
ALTER TABLE rectifier_banks ADD COLUMN IF NOT EXISTS capacity VARCHAR(50);
ALTER TABLE rectifier_banks ADD COLUMN IF NOT EXISTS installed_date VARCHAR(50);
ALTER TABLE rectifier_banks ADD COLUMN IF NOT EXISTS warrantee_date VARCHAR(50);

ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS vent_filter_door VARCHAR(100);
ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS vent_filter_door_img VARCHAR(500);
ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS vent_filter_window VARCHAR(100);
ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS vent_filter_window_img VARCHAR(500);
ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS vent_equip_fan VARCHAR(100);
ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS vent_equip_fan_img VARCHAR(500);
ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS vent_filter_equip VARCHAR(100);
ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS vent_filter_equip_img VARCHAR(500);
ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS air_owner VARCHAR(100);
ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS air_owner_img VARCHAR(500);
ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS control_air_type VARCHAR(100);
ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS control_air_type_img VARCHAR(500);
ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS control_air_status VARCHAR(100);
ALTER TABLE systems_and_facilities ADD COLUMN IF NOT EXISTS control_air_status_img VARCHAR(500);

ALTER TABLE rpm_records_master ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';

-- Increase precision of numeric fields to prevent numeric field overflow
ALTER TABLE battery_tests ALTER COLUMN voltage TYPE NUMERIC(10,2);
ALTER TABLE battery_tests ALTER COLUMN internal_resistance TYPE NUMERIC(10,2);
ALTER TABLE power_main_ac ALTER COLUMN current_p1 TYPE NUMERIC(10,2);
ALTER TABLE power_main_ac ALTER COLUMN current_p2 TYPE NUMERIC(10,2);
ALTER TABLE power_main_ac ALTER COLUMN current_p3 TYPE NUMERIC(10,2);
ALTER TABLE power_rectifier ALTER COLUMN input_current_ac TYPE NUMERIC(10,2);
ALTER TABLE power_rectifier ALTER COLUMN output_current_dc TYPE NUMERIC(10,2);

