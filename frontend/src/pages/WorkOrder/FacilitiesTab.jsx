import React, { useState } from 'react';

export default function FacilitiesTab({ site, onComplete }) {
  // Facility parameters config
  const [params, setParams] = useState({
    alarm_door: { status: 'ปกติ', file: null },
    alarm_ac_fail: { status: 'ปกติ', file: null },
    alarm_low_bat: { status: 'ปกติ', file: null },
    alarm_high_temp: { status: 'ปกติ', file: null },
    alarm_smoke: { status: 'ปกติ', file: null },
    alarm_air_fail: { status: 'ปกติ', file: null },

    vent_ac_fan: { status: 'ปกติ', file: null },
    vent_ac_fan_hood: { status: 'ปกติ', file: null },
    vent_dc_fan: { status: 'ปกติ', file: null },
    vent_dc_fan_hood: { status: 'ปกติ', file: null },
    vent_air_cond: { status: 'ปกติ', file: null },
    vent_filters: { status: 'ปกติ', file: null },

    fac_site_sign: { status: 'ปกติ', file: null },
    fac_outdoor_clean: { status: 'ปกติ', file: null },
    fac_indoor_clean: { status: 'ปกติ', file: null },
    fac_lighting: { status: 'ปกติ', file: null },
    fac_grass_cut: { status: 'ปกติ', file: null },
  });

  const handleStatusChange = (key, status) => {
    setParams(prev => ({
      ...prev,
      [key]: { ...prev[key], status }
    }));
  };

  const handleFileChange = (key, file) => {
    setParams(prev => ({
      ...prev,
      [key]: { ...prev[key], file }
    }));
  };

  const handleSaveAll = (e) => {
    e.preventDefault();
    alert('บันทึกข้อมูลและอัปโหลดรูปภาพ Systems & Facilities ครบถ้วนเสร็จสมบูรณ์!');
    if (onComplete) onComplete();
  };

  const renderRow = (key, label) => {
    const item = params[key];
    return (
      <div key={key} className="py-4 border-b border-dark-border/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="md:w-1/3">
          <span className="text-sm font-bold text-gray-200">{label}</span>
          <p className="text-[10px] text-gray-500 font-mono mt-0.5">{key}</p>
        </div>

        <div className="flex flex-wrap items-center gap-6 md:w-2/3">
          {/* Status Radio Buttons */}
          <div className="flex items-center gap-2 bg-dark-bg/60 p-1 rounded-lg border border-dark-border">
            {['ปกติ', 'ผิดปกติ', 'ไม่มีระบบนี้'].map((statusOption) => (
              <button
                key={statusOption}
                type="button"
                onClick={() => handleStatusChange(key, statusOption)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  item.status === statusOption
                    ? statusOption === 'ปกติ'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : statusOption === 'ผิดปกติ'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {statusOption}
              </button>
            ))}
          </div>

          {/* Image Uploader */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="file"
              className="w-full text-[10px] text-gray-500 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-[10px] file:bg-dark-accent file:text-gray-300"
              onChange={(e) => handleFileChange(key, e.target.files[0])}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">🚨 5. Alarms & Facilities (Systems & Facilities)</h3>
        <p className="text-gray-400 text-sm mt-1">บันทึกสถานะ Alarms, ระบบระบายอากาศ และความสะอาดของสถานที่</p>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-8">
        {/* Group 1: Alarms */}
        <div className="bg-dark-bg/25 border border-dark-border rounded-xl p-6">
          <h4 className="font-bold text-indigo-400 border-b border-dark-border pb-2 mb-4">🚨 1. หมวดสัญญาณเตือนภัย (Alarms)</h4>
          <div className="divide-y divide-dark-border/20">
            {renderRow('alarm_door', 'Door Open Alarm')}
            {renderRow('alarm_ac_fail', 'AC Failure Alarm')}
            {renderRow('alarm_low_bat', 'Low Battery Alarm')}
            {renderRow('alarm_high_temp', 'High Temperature Alarm')}
            {renderRow('alarm_smoke', 'Smoke & Fire Detector Alarm')}
            {renderRow('alarm_air_fail', 'Air Conditioner Failure Alarm')}
          </div>
        </div>

        {/* Group 2: Ventilation */}
        <div className="bg-dark-bg/25 border border-dark-border rounded-xl p-6">
          <h4 className="font-bold text-indigo-400 border-b border-dark-border pb-2 mb-4">🌀 2. หมวดระบบระบายอากาศ (Ventilation Systems)</h4>
          <div className="divide-y divide-dark-border/20">
            {renderRow('vent_ac_fan', 'Ventilation AC Fan Status')}
            {renderRow('vent_ac_fan_hood', 'Ventilation AC Fan Hood')}
            {renderRow('vent_dc_fan', 'Ventilation DC Fan Status')}
            {renderRow('vent_dc_fan_hood', 'Ventilation DC Fan Hood')}
            {renderRow('vent_air_cond', 'Air Conditioner System Test')}
            {renderRow('vent_filters', 'Air Filters Condition')}
          </div>
        </div>

        {/* Group 3: Site Facility */}
        <div className="bg-dark-bg/25 border border-dark-border rounded-xl p-6">
          <h4 className="font-bold text-indigo-400 border-b border-dark-border pb-2 mb-4">🌳 3. หมวดความสะอาดและสิ่งอำนวยความสะดวกสถานี (Site Facility)</h4>
          <div className="divide-y divide-dark-border/20">
            {renderRow('fac_site_sign', 'ป้ายชื่อสถานี (Site Sign)')}
            {renderRow('fac_outdoor_clean', 'ความสะอาดภายนอกห้องเครื่อง')}
            {renderRow('fac_indoor_clean', 'ความสะอาดภายในห้องเครื่อง')}
            {renderRow('fac_lighting', 'ระบบไฟส่องสว่างสถานี (Lighting)')}
            {renderRow('fac_grass_cut', 'การตัดหญ้า/ถางวัชพืช')}
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button type="submit" className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm shadow-lg transition-all hover:shadow-indigo-600/20">
            🚀 บันทึกข้อมูลสรุประบบและปิดเล่มใบงาน (Submit All Data)
          </button>
        </div>
      </form>
    </div>
  );
}
