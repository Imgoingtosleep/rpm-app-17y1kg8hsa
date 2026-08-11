import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [workorders, setWorkorders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cycleFilter, setCycleFilter] = useState('All');
  const [areaFilter, setAreaFilter] = useState('All');
  const [expandedRow, setExpandedRow] = useState(null);
  const [detailData, setDetailData] = useState({});
  const [detailLoading, setDetailLoading] = useState({});
  const [exportingId, setExportingId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  const getUserObj = () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : {};
    } catch {
      return {};
    }
  };

  const parseUserList = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string' && raw.startsWith('[')) {
      try { return JSON.parse(raw); } catch (e) {}
    }
    return typeof raw === 'string' ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
  };

  const currentUser = getUserObj();
  const isAdmin = currentUser?.role === 'Admin';
  const isTeamLead = currentUser?.role === 'Team Lead';
  const isInspector = currentUser?.role === 'Inspector';
  const userAreas = parseUserList(currentUser?.area);
  const userSubareas = parseUserList(currentUser?.subarea);

  useEffect(() => {
    if (!isAdmin && !isTeamLead && !isInspector) {
      alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
      navigate('/select-site');
      return;
    }
    fetchWorkorders();
  }, [navigate]);

  // Close the action menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const fetchWorkorders = () => {
    setLoading(true);
    fetch('/api/workorders/all-detail')
      .then(res => {
        if (!res.ok) return fetch('/api/workorders/all').then(r => r.json());
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setWorkorders(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  const handleTLApprove = async (rpmId) => {
    if (!window.confirm('คุณต้องการอนุมัติใบงานนี้และส่งต่อให้ Admin ตรวจสอบใช่หรือไม่?')) return;
    try {
      const res = await fetch(`/api/workorder/${rpmId}/tl-approve`, { method: 'POST' });
      if (res.ok) {
        alert('อนุมัติใบงาน (TL Approved) เรียบร้อยแล้ว');
        fetchWorkorders();
      } else {
        const data = await res.json();
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleAdminApprove = async (rpmId) => {
    if (!window.confirm('คุณต้องการอนุมัติใบงานนี้เป็นขั้นสุดท้าย (อนุมัติเสร็จสมบูรณ์) ใช่หรือไม่?')) return;
    try {
      const res = await fetch(`/api/workorder/${rpmId}/admin-approve`, { method: 'POST' });
      if (res.ok) {
        alert('อนุมัติใบงานเสร็จสมบูรณ์ (Approved) เรียบร้อยแล้ว');
        fetchWorkorders();
      } else {
        const data = await res.json();
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const handleReject = async (rpmId) => {
    const reason = window.prompt('กรุณาระบุเหตุผลการตีกลับใบงาน (ส่งกลับให้ Inspector แก้ไขใหม่):');
    if (reason === null) return; // cancelled
    try {
      const res = await fetch(`/api/workorder/${rpmId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        alert('ตีกลับใบงานเพื่อให้ Inspector แก้ไขใหม่เรียบร้อยแล้ว');
        fetchWorkorders();
      } else {
        const data = await res.json();
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  const fetchDetail = async (rpmId) => {
    if (detailData[rpmId]) return;
    setDetailLoading(prev => ({ ...prev, [rpmId]: true }));
    try {
      const res = await fetch(`/api/workorder/${rpmId}/export-detail`);
      if (res.ok) {
        const data = await res.json();
        setDetailData(prev => ({ ...prev, [rpmId]: data }));
      }
    } catch (e) {
      console.error('Error fetching detail:', e);
    } finally {
      setDetailLoading(prev => ({ ...prev, [rpmId]: false }));
    }
  };

  const toggleExpand = (rpmId) => {
    if (expandedRow === rpmId) {
      setExpandedRow(null);
    } else {
      setExpandedRow(rpmId);
      fetchDetail(rpmId);
    }
  };

  // ─── Filtered Data ───
  const uniqueCycles = ['All', ...new Set(workorders.map(wo => wo.rpm_cycle).filter(Boolean))];
  const uniqueAreas = ['All', ...new Set(workorders.map(wo => wo.area).filter(Boolean))];

  const filteredWorkorders = useMemo(() => workorders.filter(wo => {
    let matchesScope = true;
    const hasUserAreas = userAreas.length > 0 && !userAreas.includes('All');
    const hasUserSubareas = userSubareas.length > 0 && !userSubareas.includes('All');

    if (!isAdmin && (hasUserAreas || hasUserSubareas)) {
      const areaMatch = hasUserAreas && userAreas.includes(wo.area);
      const subareaMatch = hasUserSubareas && (userSubareas.includes(wo.subarea) || userSubareas.includes(wo.area));
      matchesScope = areaMatch || subareaMatch;
    }

    const matchesSearch = 
      wo.site_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      wo.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (wo.area && wo.area.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (wo.subarea && wo.subarea.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (wo.job_number_sl6 && wo.job_number_sl6.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (wo.sap_number && wo.sap_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = 
      statusFilter === 'All' || 
      (statusFilter === 'Approved' && wo.status === 'Approved') ||
      (statusFilter === 'Submitted' && wo.status === 'Submitted') ||
      (statusFilter === 'TL Approved' && wo.status === 'TL Approved') ||
      (statusFilter === 'Rejected' && wo.status === 'Rejected') ||
      (statusFilter === 'Pending' && (wo.status === 'Pending' || !wo.status));

    const matchesCycle = cycleFilter === 'All' || wo.rpm_cycle === cycleFilter;
    const matchesArea = areaFilter === 'All' || wo.area === areaFilter;

    return matchesScope && matchesSearch && matchesStatus && matchesCycle && matchesArea;
  }), [workorders, searchTerm, statusFilter, cycleFilter, areaFilter, isAdmin, userAreas, userSubareas]);

  // ─── Statistics ───
  const stats = useMemo(() => {
    const total = filteredWorkorders.length;
    const approved = filteredWorkorders.filter(wo => wo.status === 'Approved').length;
    const tlApproved = filteredWorkorders.filter(wo => wo.status === 'TL Approved').length;
    const submitted = filteredWorkorders.filter(wo => wo.status === 'Submitted').length;
    const rejected = filteredWorkorders.filter(wo => wo.status === 'Rejected').length;
    const pending = filteredWorkorders.filter(wo => wo.status === 'Pending' || !wo.status).length;
    const hasAcCount = filteredWorkorders.filter(wo => Number(wo.has_ac) > 0).length;
    return { total, approved, tlApproved, submitted, rejected, pending, hasAcCount };
  }, [filteredWorkorders]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const getDataCompleteness = (wo) => {
    let sections = 0;
    let filled = 0;
    sections++;
    if (Number(wo.has_ac) > 0) filled++;
    if (Number(wo.rectifier_qty_uih) > 0) {
      sections++;
      if (Number(wo.rectifier_count) > 0) filled++;
    }
    sections++;
    if (Number(wo.has_facilities) > 0) filled++;
    return { sections, filled, pct: sections > 0 ? Math.round((filled / sections) * 100) : 0 };
  };

  const exportSingleXLSX = async (wo) => {
    setExportingId(wo.rpm_id);
    try {
      const res = await fetch(`/api/workorder/${wo.rpm_id}/export-detail`);
      if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
      const data = await res.json();

      const wb = XLSX.utils.book_new();

      // 1. Master Sheet
      const masterRows = [
        ['หัวข้อ', 'รายละเอียด'],
        ['รหัสสถานี (Site Code)', wo.site_code || ''],
        ['ชื่อสถานี (Site Name)', wo.site_name || ''],
        ['ประเภทสถานี (Site Type)', wo.site_type || ''],
        ['Grade สถานี (Site Grade)', wo.site_grade || ''],
        ['เขต/พื้นที่ (Area)', wo.area || ''],
        ['พื้นที่ย่อย (Subarea)', wo.subarea || ''],
        ['รอบการตรวจ (RPM Cycle)', wo.rpm_cycle || ''],
        ['วันที่ตรวจ (Inspection Date)', wo.inspection_date ? wo.inspection_date.split('T')[0] : ''],
        ['เวลาตรวจ (Inspection Time)', wo.inspection_time || ''],
        ['สถานะใบงาน (Status)', wo.status || ''],
        ['SL6 Job Number', data.master?.job_number_sl6 || ''],
        ['SAP Number', data.master?.sap_number || ''],
        ['จำนวน Rectifier UIH', data.master?.rectifier_qty_uih || 0]
      ];
      const wsMaster = XLSX.utils.aoa_to_sheet(masterRows);
      XLSX.utils.book_append_sheet(wb, wsMaster, 'Master Overview');

      // 2. AC Main Sheet
      if (data.acMain) {
        const ac = data.acMain;
        const acRows = [
          ['รายการตรวจสอบ AC Main', 'ค่าที่วัดได้ / สถานะ'],
          ['ขนาดมิเตอร์ AC (Meter Size)', ac.meter_ac_size || '-'],
          ['สภาพสายไฟ/เคเบิล (Cable Status)', ac.cable_status || '-'],
          ['Change Over Switch', ac.change_over_switch || '-'],
          ['จำนวน Phase AC', ac.ac_phase_qty || '-'],
          ['Surge Protection AC', ac.surge_protection || '-'],
          ['อุณหภูมิ MDB (°C)', ac.mdb_temp || '-'],
          ['อุณหภูมิภายในสถานี (°C)', ac.site_temp || '-'],
          ['แรงดันไฟฟ้า Voltage Phase 1 (V)', ac.voltage_p1 || '-'],
          ['กระแสไฟฟ้า Current Phase 1 (A)', ac.current_p1 || '-'],
          ['แรงดันไฟฟ้า Voltage Phase 2 (V)', ac.voltage_p2 || '-'],
          ['กระแสไฟฟ้า Current Phase 2 (A)', ac.current_p2 || '-'],
          ['แรงดันไฟฟ้า Voltage Phase 3 (V)', ac.voltage_p3 || '-'],
          ['กระแสไฟฟ้า Current Phase 3 (A)', ac.current_p3 || '-'],
          ['ความต้านทานระบบสายดิน Grounding (Ω)', ac.ground_resistance || '-']
        ];
        const wsAC = XLSX.utils.aoa_to_sheet(acRows);
        XLSX.utils.book_append_sheet(wb, wsAC, 'AC Main System');
      }

      // 3. Rectifiers Sheet
      if (data.rectifiers && data.rectifiers.length > 0) {
        const rectHeaders = [
          'ตู้ที่', 'ยี่ห้อ/รุ่น', 'ขนาดสาย AC', 'ขนาด Breaker', 'Breaker Phase 1', 'Breaker Phase 2', 'Breaker Phase 3',
          'จำนวน Module ทั้งหมด', 'จำนวน Module เสีย', 'กระแส Input AC (A)', 'กระแส Output DC (A)',
          'สถานะ Surge', 'ชนิดแบตเตอรี่', 'SOH (%)', 'SOC (%)', 'จำนวน Bank'
        ];
        const rectDataRows = data.rectifiers.map(r => [
          r.rect_no,
          r.model || '-',
          r.ac_cable_size || '-',
          r.breaker_size || '-',
          r.breaker_phase1 || '-',
          r.breaker_phase2 || '-',
          r.breaker_phase3 || '-',
          r.modules_all ?? '-',
          r.modules_fail ?? '-',
          r.input_current_ac ?? '-',
          r.output_current_dc ?? '-',
          r.surge_status || '-',
          r.battery_type || '-',
          r.battery_soh ?? '-',
          r.battery_soc ?? '-',
          r.battery_qty_bank ?? '-'
        ]);
        const wsRect = XLSX.utils.aoa_to_sheet([rectHeaders, ...rectDataRows]);
        XLSX.utils.book_append_sheet(wb, wsRect, 'Rectifier Systems');
      }

      // 4. Batteries Sheet
      if (data.batteries && data.batteries.length > 0) {
        const batHeaders = ['ตู้ที่', 'ชื่อ Bank', 'ยี่ห้อแบตเตอรี่', 'ความจุ (AH)', 'วันที่ติดตั้ง', 'วันหมดประกัน', 'ลูกที่', 'แรงดันไฟฟ้า (V)', 'ความต้านทานภายใน IR (mΩ)', 'สถานะ'];
        const batDataRows = data.batteries.map(b => [
          `ตู้ที่ ${b.rect_no || '-'}`,
          b.bank_name || '-',
          b.brand || '-',
          b.capacity || '-',
          b.installed_date ? b.installed_date.split('T')[0] : '-',
          b.warrantee_date ? b.warrantee_date.split('T')[0] : '-',
          b.cell_no ?? '-',
          b.voltage ?? '-',
          b.internal_resistance ?? '-',
          b.status || 'ปกติ'
        ]);
        const wsBat = XLSX.utils.aoa_to_sheet([batHeaders, ...batDataRows]);
        XLSX.utils.book_append_sheet(wb, wsBat, 'Battery Test Results');
      }

      // 5. Facilities Sheet
      if (data.facilities) {
        const fac = data.facilities;
        const facRows = [
          ['รายการตรวจสอบ Alarm และสิ่งอำนวยความสะดวก', 'สถานะ'],
          ['Alarm ประตู (Door Open Alarm)', fac.alarm_door || '-'],
          ['Alarm ไฟดับ (AC Fail Alarm)', fac.alarm_ac_fail || '-'],
          ['Alarm แบตเตอรี่ต่ำ (Low Bat Alarm)', fac.alarm_low_bat || '-'],
          ['Alarm อุณหภูมิสูง (High Temp Alarm)', fac.alarm_high_temp || '-'],
          ['Alarm ควันไฟ (Smoke Alarm)', fac.alarm_smoke || '-'],
          ['Alarm แอร์เสีย (Air Fail Alarm)', fac.alarm_air_fail || '-'],
          ['พัดลมระบายอากาศ AC (Vent AC Fan)', fac.vent_ac_fan || '-'],
          ['Hood พัดลม AC (Vent AC Fan Hood)', fac.vent_ac_fan_hood || '-'],
          ['พัดลมระบายอากาศ DC (Vent DC Fan)', fac.vent_dc_fan || '-'],
          ['Hood พัดลม DC (Vent DC Fan Hood)', fac.vent_dc_fan_hood || '-'],
          ['เครื่องปรับอากาศ (Air Conditioner)', fac.vent_air_cond || '-'],
          ['เจ้าของเครื่องปรับอากาศ (Air Owner)', fac.air_owner || '-'],
          ['ประเภทการควบคุมแอร์ (Control Air Type)', fac.control_air_type || '-'],
          ['สถานะการควบคุมแอร์ (Control Air Status)', fac.control_air_status || '-'],
          ['ป้ายชื่อสถานี (Site Sign)', fac.fac_site_sign || '-'],
          ['ความสะอาดภายนอก (Outdoor Cleanliness)', fac.fac_outdoor_clean || '-'],
          ['ความสะอาดภายใน (Indoor Cleanliness)', fac.fac_indoor_clean || '-'],
          ['ระบบไฟส่องสว่าง (Lighting System)', fac.fac_lighting || '-'],
          ['การตัดหญ้า/ถางป่า (Grass Cutting)', fac.fac_grass_cut || '-'],
          ['ฟิลเตอร์ประตู (Filter Door)', fac.vent_filter_door || '-'],
          ['ฟิลเตอร์หน้าต่าง (Filter Window)', fac.vent_filter_window || '-'],
          ['พัดลมอุปกรณ์ (Equipment Fan)', fac.vent_equip_fan || '-'],
          ['ฟิลเตอร์อุปกรณ์ (Filter Equipment)', fac.vent_filter_equip || '-']
        ];
        const wsFac = XLSX.utils.aoa_to_sheet(facRows);
        XLSX.utils.book_append_sheet(wb, wsFac, 'Facilities & Systems');
      }

      XLSX.writeFile(wb, `RPM_${wo.site_code}_${wo.rpm_cycle || 'export'}.xlsx`);
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการ Export XLSX: ' + e.message);
    } finally {
      setExportingId(null);
    }
  };

  const exportAllXLSX = () => {
    if (filteredWorkorders.length === 0) return;
    const headers = [
      'Site Code', 'Site Name', 'Area', 'Subarea', 'Site Type', 'Site Grade',
      'RPM Cycle', 'SL6 Number', 'SAP Number', 'วันที่ตรวจ', 'เวลาตรวจ',
      'จำนวน Rectifier', 'สถานะใบงาน', 'มีข้อมูล AC Main', 'จำนวน Rectifier ที่บันทึก', 'มีข้อมูล Facilities'
    ];
    const rows = filteredWorkorders.map(wo => [
      wo.site_code, wo.site_name, wo.area || '', wo.subarea || '', wo.site_type || '', wo.site_grade || '',
      wo.rpm_cycle || '', wo.job_number_sl6 || '', wo.sap_number || '',
      wo.inspection_date ? wo.inspection_date.split('T')[0] : '', wo.inspection_time || '',
      wo.rectifier_qty_uih || 0, wo.status || 'Pending',
      Number(wo.has_ac) > 0 ? 'ใช่' : 'ไม่', wo.rectifier_count || 0, Number(wo.has_facilities) > 0 ? 'ใช่' : 'ไม่'
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'RPM Summary');
    XLSX.writeFile(wb, `RPM_Dashboard_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportSingleCSV = async (wo) => {
    setExportingId(wo.rpm_id);
    try {
      const res = await fetch(`/api/workorder/${wo.rpm_id}/export-detail`);
      if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
      const data = await res.json();
      const csvContent = buildCSVContent(wo, data);
      downloadCSV(csvContent, `RPM_${wo.site_code}_${wo.rpm_cycle || 'export'}.csv`);
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการ Export: ' + e.message);
    } finally {
      setExportingId(null);
    }
  };

  const exportAllCSV = () => {
    if (filteredWorkorders.length === 0) return;
    const headers = [
      'Site Code', 'Site Name', 'Area', 'Subarea', 'Site Type', 'Site Grade',
      'RPM Cycle', 'SL6 Number', 'SAP Number', 'วันที่ตรวจ', 'เวลาตรวจ',
      'จำนวน Rectifier', 'สรุปปัญหา', 'สถานะ',
      'มีข้อมูล AC Main', 'จำนวน Rectifier ที่บันทึก', 'มีข้อมูล Facilities'
    ];
    const rows = filteredWorkorders.map(wo => [
      wo.site_code, wo.site_name, wo.area || '', wo.subarea || '', wo.site_type || '', wo.site_grade || '',
      wo.rpm_cycle || '', wo.job_number_sl6 || '', wo.sap_number || '',
      wo.inspection_date ? wo.inspection_date.split('T')[0] : '', wo.inspection_time || '',
      wo.rectifier_qty_uih || 0, `"${(wo.summary_issue || '').replace(/"/g, '""')}"`, wo.status || 'Pending',
      Number(wo.has_ac) > 0 ? 'ใช่' : 'ไม่', wo.rectifier_count || 0, Number(wo.has_facilities) > 0 ? 'ใช่' : 'ไม่'
    ]);
    const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCSV(csv, `RPM_Dashboard_Export_${new Date().toISOString().slice(0,10)}.csv`);
  };

  const buildCSVContent = (wo, data) => {
    const lines = [];
    lines.push('\uFEFF');
    lines.push('=== ข้อมูลหลักสถานี (Master) ===');
    lines.push(['รหัสสถานี', 'ชื่อสถานี', 'Area', 'Subarea', 'ประเภท', 'เกรด', 'รอบตรวจ', 'SL6 No.', 'SAP No.', 'วันที่ตรวจ', 'เวลาตรวจ', 'จำนวน Rectifier', 'สถานะ'].join(','));
    lines.push([
      wo.site_code, wo.site_name, wo.area || '', wo.subarea || '', wo.site_type || '', wo.site_grade || '',
      wo.rpm_cycle || '', wo.job_number_sl6 || '', wo.sap_number || '',
      wo.inspection_date ? wo.inspection_date.split('T')[0] : '', wo.inspection_time || '',
      wo.rectifier_qty_uih || 0, wo.status || ''
    ].join(','));
    lines.push('');

    const ac = data.acMain;
    if (ac) {
      lines.push('=== ระบบไฟฟ้าเมนหลัก (AC Main) ===');
      lines.push(['มิเตอร์ AC', 'สายเคเบิล', 'สวิตช์ Change Over', 'เฟส AC', 'Surge Protection', 'อุณหภูมิตู้ MDB', 'V Phase1', 'V Phase2', 'V Phase3', 'A Phase1', 'A Phase2', 'A Phase3', 'ค่ากราวด์ (Ω)', 'อุณหภูมิสถานี'].join(','));
      lines.push([
        ac.meter_ac_size || '', ac.cable_status || '', ac.change_over_switch || '', ac.ac_phase_qty || '',
        ac.surge_protection || '', ac.mdb_temp || '',
        ac.voltage_p1 || '', ac.voltage_p2 || '', ac.voltage_p3 || '',
        ac.current_p1 || '', ac.current_p2 || '', ac.current_p3 || '',
        ac.ground_resistance || '', ac.site_temp || ''
      ].join(','));
      lines.push('');
    }

    const rects = data.rectifiers;
    if (rects && rects.length > 0) {
      lines.push('=== ตู้ Rectifier ===');
      lines.push(['ตู้ที่', 'รุ่น', 'สาย AC', 'Breaker', 'โมดูลทั้งหมด', 'โมดูลเสีย', 'กระแส AC In', 'กระแส DC Out', 'Surge', 'Breaker P1', 'Breaker P2', 'Breaker P3', 'ประเภทแบตเตอรี่', 'Lithium Capacity', 'Battery Run', 'SOH %', 'SOC %', 'Capacity %', 'Battery Alarm', 'จำนวน Bank'].join(','));
      rects.forEach(r => {
        lines.push([
          r.rect_no, r.model || '', r.ac_cable_size || '', r.breaker_size || '',
          r.modules_all || 0, r.modules_fail || 0,
          r.input_current_ac || '', r.output_current_dc || '',
          r.surge_status || '',
          r.breaker_phase1 || '', r.breaker_phase2 || '', r.breaker_phase3 || '',
          r.battery_type || '', r.lithium_capacity || '', r.battery_run || '',
          r.battery_soh || '', r.battery_soc || '', r.battery_capacity_percent || '',
          r.battery_alarm || '', r.battery_qty_bank || 0
        ].join(','));
      });
      lines.push('');
    }

    const bats = data.batteries;
    if (bats && bats.length > 0) {
      lines.push('=== ข้อมูลแบตเตอรี่ (Battery Tests) ===');
      lines.push(['ตู้ Rectifier', 'Bank', 'ยี่ห้อ', 'ความจุ', 'วันที่ติดตั้ง', 'วันหมดประกัน', 'ลูกที่', 'แรงดัน (V)', 'ค่า IR (mΩ)', 'สถานะ'].join(','));
      bats.forEach(b => {
        lines.push([
          b.rect_no || '', b.bank_name || '', b.brand || '', b.capacity || '',
          b.installed_date || '', b.warrantee_date || '',
          b.cell_no || '', b.voltage || '', b.internal_resistance || '', b.status || ''
        ].join(','));
      });
      lines.push('');
    }

    const fac = data.facilities;
    if (fac) {
      lines.push('=== ระบบ Alarm และสิ่งอำนวยความสะดวก ===');
      const facFields = [
        ['Alarm ประตู', fac.alarm_door], ['Alarm ไฟดับ', fac.alarm_ac_fail],
        ['Alarm แบต Low', fac.alarm_low_bat], ['Alarm อุณหภูมิสูง', fac.alarm_high_temp],
        ['Alarm ควัน', fac.alarm_smoke], ['Alarm แอร์เสีย', fac.alarm_air_fail],
        ['พัดลม AC', fac.vent_ac_fan], ['ฝาครอบพัดลม AC', fac.vent_ac_fan_hood],
        ['พัดลม DC', fac.vent_dc_fan], ['ฝาครอบพัดลม DC', fac.vent_dc_fan_hood],
        ['แอร์', fac.vent_air_cond], ['ฟิลเตอร์', fac.vent_filters],
        ['ป้ายสถานี', fac.fac_site_sign], ['ความสะอาดนอก', fac.fac_outdoor_clean],
        ['ความสะอาดใน', fac.fac_indoor_clean], ['ไฟส่องสว่าง', fac.fac_lighting],
        ['ตัดหญ้า', fac.fac_grass_cut]
      ];
      lines.push(['หัวข้อ', 'ผลตรวจ'].join(','));
      facFields.forEach(([label, value]) => {
        lines.push([label, value || '-'].join(','));
      });
      lines.push('');
    }

    if (wo.summary_issue) {
      lines.push('=== สรุปปัญหาหน้างาน ===');
      lines.push(`"${(wo.summary_issue || '').replace(/"/g, '""')}"`);
    }

    return lines.join('\n');
  };

  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const DetailSection = ({ title, children }) => (
    <div className="bg-dark-bg/50 border border-dark-border/50 rounded-lg p-4">
      <h4 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-2">
        {title}
      </h4>
      {children}
    </div>
  );

  const InfoCell = ({ label, value, highlight }) => (
    <div className="flex flex-col min-w-0 py-1">
      <span className="text-[10px] text-gray-400 uppercase font-semibold leading-tight break-words">{label}</span>
      <span className={`text-xs font-medium leading-normal break-words mt-0.5 ${highlight ? 'text-indigo-400 font-bold' : 'text-gray-200'}`}>{value || '-'}</span>
    </div>
  );

  // Menu item used inside the consolidated action popup
  const MenuItem = ({ onClick, children, tone = 'default', disabled = false, icon = null }) => {
    const toneClasses = {
      default: 'text-gray-200 hover:bg-dark-accent/60',
      indigo: 'text-indigo-400 hover:bg-indigo-600/10',
      emerald: 'text-emerald-400 hover:bg-emerald-600/10',
      rose: 'text-rose-400 hover:bg-rose-600/10',
      cyan: 'text-cyan-400 hover:bg-cyan-600/10',
      purple: 'text-purple-400 hover:bg-purple-600/10',
    };
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${toneClasses[tone]}`}
      >
        {icon}
        {children}
      </button>
    );
  };

  const renderDetailPanel = (rpmId) => {
    if (detailLoading[rpmId]) {
      return (
        <tr>
          <td colSpan={8} className="p-6 bg-dark-accent/5">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
              <span className="text-gray-400 text-sm">กำลังโหลดรายละเอียดใบงาน...</span>
            </div>
          </td>
        </tr>
      );
    }

    const d = detailData[rpmId];
    if (!d) return null;

    return (
      <tr>
        <td colSpan={8} className="p-0">
          <div className="bg-gradient-to-b from-dark-accent/10 to-dark-bg/30 border-t border-b border-indigo-500/20 p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailSection title="ระบบไฟฟ้าเมนหลัก (AC Main)">
                {d.acMain ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <InfoCell label="มิเตอร์ AC" value={d.acMain.meter_ac_size} />
                    <InfoCell label="สายเคเบิล" value={d.acMain.cable_status} />
                    <InfoCell label="Change Over" value={d.acMain.change_over_switch} />
                    <InfoCell label="เฟส AC" value={d.acMain.ac_phase_qty} />
                    <InfoCell label="Surge Protection" value={d.acMain.surge_protection} />
                    <InfoCell label="อุณหภูมิ MDB" value={d.acMain.mdb_temp} />
                    <InfoCell label="ค่ากราวด์ (Ω)" value={d.acMain.ground_resistance} highlight />
                    <InfoCell label="อุณหภูมิสถานี" value={d.acMain.site_temp} />
                    <InfoCell label="V Phase 1" value={d.acMain.voltage_p1} highlight />
                    <InfoCell label="A Phase 1" value={d.acMain.current_p1} />
                    <InfoCell label="V Phase 2" value={d.acMain.voltage_p2} highlight />
                    <InfoCell label="A Phase 2" value={d.acMain.current_p2} />
                    <InfoCell label="V Phase 3" value={d.acMain.voltage_p3} highlight />
                    <InfoCell label="A Phase 3" value={d.acMain.current_p3} />
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">ยังไม่มีข้อมูล AC Main</p>
                )}
              </DetailSection>

              <DetailSection title={`ตู้ Rectifier (${d.rectifiers?.length || 0} ตู้)`}>
                {d.rectifiers && d.rectifiers.length > 0 ? (
                  <div className="space-y-3">
                    {d.rectifiers.map((r, i) => (
                      <div key={i} className="bg-dark-card/50 rounded-md p-2.5 border border-dark-border/30">
                        <p className="text-xs font-bold text-indigo-400 mb-1.5">{r.rect_no} — {r.model || 'ไม่ระบุรุ่น'}</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          <InfoCell label="สาย AC / Breaker" value={`${r.ac_cable_size || '-'} / ${r.breaker_size || '-'}`} />
                          <InfoCell label="Breaker Ph1/2/3" value={`${r.breaker_phase1 || '-'}/${r.breaker_phase2 || '-'}/${r.breaker_phase3 || '-'}`} />
                          <InfoCell label="Module ทั้งหมด/เสีย" value={`${r.modules_all || 0}/${r.modules_fail || 0}`} />
                          <InfoCell label="AC In / DC Out" value={`${r.input_current_ac || '-'}A / ${r.output_current_dc || '-'}A`} />
                          <InfoCell label="Battery Type" value={r.battery_type} />
                          <InfoCell label="SOH / SOC" value={`${r.battery_soh || '-'}% / ${r.battery_soc || '-'}%`} highlight />
                          <InfoCell label="Surge Status" value={r.surge_status} />
                          <InfoCell label="จำนวน Bank" value={r.battery_type === 'VRLA AGM + Lithium' ? `VRLA: ${r.vrla_qty_bank || 0} / Lithium: ${r.lithium_qty_bank || 0}` : r.battery_qty_bank} />
                          {(r.battery_type === 'Lithium' || r.battery_type === 'VRLA AGM + Lithium') && (
                            <div className="col-span-2 mt-2 pt-2 border-t border-dark-border/40">
                              <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-1.5">
                                ข้อมูลราย Bank ของ Lithium ({r.lithium_brand || 'ไม่ระบุยี่ห้อ'})
                              </p>
                              <div className="space-y-1.5">
                                {(() => {
                                  const parseList = (val) => {
                                    if (!val) return [];
                                    if (Array.isArray(val)) return val;
                                    if (typeof val === 'string') {
                                      if (val.trim().startsWith('[') || val.trim().startsWith('{')) {
                                        try { return JSON.parse(val); } catch (e) {}
                                      }
                                      return val.split('|');
                                    }
                                    return [];
                                  };

                                  const caps = parseList(r.lithium_capacity);
                                  const runs = parseList(r.battery_run);
                                  const sohs = parseList(r.battery_soh);
                                  const socs = parseList(r.battery_soc);
                                  const capPercents = parseList(r.battery_capacity_percent);
                                  const alarms = parseList(r.battery_alarm);
                                  const qty = parseInt(r.battery_type === 'VRLA AGM + Lithium' ? r.lithium_qty_bank : r.battery_qty_bank, 10) || caps.length || 1;

                                  return Array.from({ length: qty }, (_, idx) => {
                                    const bNum = idx + 1;
                                    return (
                                      <div key={idx} className="bg-dark-bg/60 p-2 rounded border border-dark-border/40 text-[11px] grid grid-cols-2 sm:grid-cols-3 gap-1">
                                        <div className="font-bold text-indigo-400">Lithium Bank {bNum}</div>
                                        <div><span className="text-gray-400">ความจุ:</span> <strong className="text-gray-200">{caps[idx] || '-'}</strong></div>
                                        <div><span className="text-gray-400">RUN:</span> <strong className="text-gray-200">{runs[idx] || '-'}</strong></div>
                                        <div><span className="text-gray-400">SOH:</span> <strong className="text-emerald-400">{sohs[idx] !== undefined && sohs[idx] !== '' ? `${sohs[idx]}%` : '-'}</strong></div>
                                        <div><span className="text-gray-400">SOC:</span> <strong className="text-cyan-400">{socs[idx] !== undefined && socs[idx] !== '' ? `${socs[idx]}%` : '-'}</strong></div>
                                        <div><span className="text-gray-400">Alarm:</span> <strong className={alarms[idx] && alarms[idx] !== 'Normal' ? 'text-rose-400' : 'text-gray-300'}>{alarms[idx] || 'Normal'}</strong></div>
                                      </div>
                                    );
                                  });
                                })()}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">ยังไม่มีข้อมูล Rectifier</p>
                )}
              </DetailSection>

              <DetailSection title="Alarm & สิ่งอำนวยความสะดวก (Facilities & Alarms)">
                {d.facilities ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <InfoCell label="Door Open Alarm" value={d.facilities.alarm_door} />
                    <InfoCell label="AC Fail Alarm" value={d.facilities.alarm_ac_fail} />
                    <InfoCell label="Low Bat Alarm" value={d.facilities.alarm_low_bat} />
                    <InfoCell label="High Temp Alarm" value={d.facilities.alarm_high_temp} />
                    <InfoCell label="Smoke & Fire Alarm" value={d.facilities.alarm_smoke} />
                    <InfoCell label="Air Fail Alarm" value={d.facilities.alarm_air_fail} />
                    <InfoCell label="Vent AC Fan Status" value={d.facilities.vent_ac_fan} />
                    <InfoCell label="Vent AC Fan Hood" value={d.facilities.vent_ac_fan_hood} />
                    <InfoCell label="Vent DC Fan Status" value={d.facilities.vent_dc_fan} />
                    <InfoCell label="Vent DC Fan Hood" value={d.facilities.vent_dc_fan_hood} />
                    <InfoCell label="Air Cond System Test" value={d.facilities.vent_air_cond} />
                    <InfoCell label="เจ้าของแอร์" value={d.facilities.air_owner} />
                    <InfoCell label="Control Air Type" value={d.facilities.control_air_type} />
                    <InfoCell label="Control Air Status" value={d.facilities.control_air_status} />
                    <InfoCell label="ประตู ป้าย Site" value={d.facilities.fac_site_sign} />
                    <InfoCell label="ความสะอาดภายนอก" value={d.facilities.fac_outdoor_clean} />
                    <InfoCell label="ความสะอาดภายใน" value={d.facilities.fac_indoor_clean} />
                    <InfoCell label="ระบบไฟฟ้าแสงสว่าง" value={d.facilities.fac_lighting} />
                    <InfoCell label="ถางป่า/ตัดหญ้า" value={d.facilities.fac_grass_cut} />
                    <InfoCell label="ความสะอาด Filter Door" value={d.facilities.vent_filter_door} />
                    <InfoCell label="ความสะอาด Filter Window" value={d.facilities.vent_filter_window} />
                    <InfoCell label="ทำความสะอาด Equip Fan" value={d.facilities.vent_equip_fan} />
                    <InfoCell label="ความสะอาด Filter Equip" value={d.facilities.vent_filter_equip} />
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">ยังไม่มีข้อมูล Facilities</p>
                )}
              </DetailSection>
            </div>

            {d.batteries && d.batteries.length > 0 && (() => {
              const goodCount = d.batteries.filter(b => {
                const st = (b.status || '').toString().trim().toLowerCase();
                return st === 'ปกติ' || st === 'ดี' || st === 'good' || st === 'normal' || st === 'pass' || st.includes('ดี') || st.includes('ปกติ');
              }).length;

              const warningCount = d.batteries.filter(b => {
                const st = (b.status || '').toString().trim().toLowerCase();
                return st === 'เฝ้าระวัง' || st === 'warning' || st.includes('warn');
              }).length;

              const failCount = d.batteries.filter(b => {
                const st = (b.status || '').toString().trim().toLowerCase();
                return st === 'ผิดปกติ' || st === 'fail' || st === 'เสีย' || st.includes('ผิด') || st.includes('fail') || st.includes('เสีย');
              }).length;

              const getCellBadge = (status) => {
                const st = (status || '').toString().trim().toLowerCase();
                if (st === 'เฝ้าระวัง' || st === 'warning' || st.includes('warn')) {
                  return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                      {status || 'เฝ้าระวัง'}
                    </span>
                  );
                } else if (st === 'ผิดปกติ' || st === 'fail' || st === 'เสีย' || st.includes('ผิด') || st.includes('fail') || st.includes('เสีย')) {
                  return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                      {status || 'ผิดปกติ'}
                    </span>
                  );
                } else {
                  return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      {status || 'ปกติ'}
                    </span>
                  );
                }
              };

              return (
                <DetailSection 
                  title={
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full">
                      <span>ผลทดสอบแบตเตอรี่ ({d.batteries.length} รายการ)</span>
                      <div className="flex items-center gap-2 text-xs font-medium">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                          Good: {goodCount} ลูก
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
                          Warning: {warningCount} ลูก
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
                          Fail: {failCount} ลูก
                        </span>
                      </div>
                    </div>
                  }
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 border-b border-dark-border/30 uppercase">
                          <th className="py-1.5 px-2 text-left">ตู้</th>
                          <th className="py-1.5 px-2 text-left">Bank</th>
                          <th className="py-1.5 px-2 text-left">ยี่ห้อ</th>
                          <th className="py-1.5 px-2 text-left">ความจุ</th>
                          <th className="py-1.5 px-2 text-center">ติดตั้ง</th>
                          <th className="py-1.5 px-2 text-center">หมดประกัน</th>
                          <th className="py-1.5 px-2 text-center">ลูกที่</th>
                          <th className="py-1.5 px-2 text-right">แรงดัน (V)</th>
                          <th className="py-1.5 px-2 text-right">IR (mΩ)</th>
                          <th className="py-1.5 px-2 text-center">สถานะ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-dark-border/20">
                        {d.batteries.map((b, i) => (
                          <tr key={i} className="text-gray-300">
                            <td className="py-1.5 px-2">{b.rect_no}</td>
                            <td className="py-1.5 px-2">{b.bank_name}</td>
                            <td className="py-1.5 px-2">{b.brand || '-'}</td>
                            <td className="py-1.5 px-2">{b.capacity || '-'}</td>
                            <td className="py-1.5 px-2 text-center text-[10px] text-gray-400">{b.installed_date ? b.installed_date.split('T')[0] : '-'}</td>
                            <td className="py-1.5 px-2 text-center text-[10px] text-gray-400">{b.warrantee_date ? b.warrantee_date.split('T')[0] : '-'}</td>
                            <td className="py-1.5 px-2 text-center">{b.cell_no}</td>
                            <td className="py-1.5 px-2 text-right font-mono">{b.voltage || '-'}</td>
                            <td className="py-1.5 px-2 text-right font-mono">{b.internal_resistance || '-'}</td>
                            <td className="py-1.5 px-2 text-center">
                              {getCellBadge(b.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </DetailSection>
              );
            })()}

            {d.master?.summary_issue && (
              <div className={`rounded-xl p-4 border ${d.master.summary_issue.includes('[ตีกลับแก้ไข') ? 'bg-rose-500/10 border-rose-500/30' : 'bg-dark-card border-dark-border'}`}>
                <h4 className={`text-xs font-bold uppercase mb-2 ${d.master.summary_issue.includes('[ตีกลับแก้ไข') ? 'text-rose-400' : 'text-gray-400'}`}>
                  {d.master.summary_issue.includes('[ตีกลับแก้ไข') ? '⚠️ เหตุผลการตีกลับใบงาน ( Reject Reason )' : 'สรุปปัญหาหน้างาน'}
                </h4>
                <p className="text-xs text-gray-200 whitespace-pre-wrap leading-relaxed">{d.master.summary_issue}</p>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  const getStatusBadge = (status) => {
    if (status === 'Approved' || status === 'Completed') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          Completed
        </span>
      );
    } else if (status === 'TL Approved') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
          TL อนุมัติแล้ว
        </span>
      );
    } else if (status === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
          ตีกลับ
        </span>
      );
    } else if (status === 'Submitted') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
          รอ TL ตรวจ
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
          กำลังดำเนินการ
        </span>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            {isAdmin ? 'Admin Dashboard' : isTeamLead ? 'Team Lead Dashboard' : 'Inspector Dashboard'}
          </h2>
          <p className="text-gray-400 mt-1">
            {isInspector
              ? 'ติดตามสถานะใบงานในพื้นที่รับผิดชอบ ดูว่าส่งแล้ว รอ TL ตรวจ หรืออนุมัติเรียบร้อยแล้ว'
              : isTeamLead 
              ? 'ตรวจสอบใบงาน อนุมัติ (Approve) ส่ง Admin หรือตีกลับ (Reject) ให้ Inspector แก้ไข' 
              : 'ติดตามสถานะ ตรวจสอบใบงานที่ TL อนุมัติแล้ว และอนุมัติปิดงานขั้นสุดท้าย (Approved)'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(isAdmin || isTeamLead) && (
            <>
              <button
                onClick={exportAllXLSX}
                disabled={filteredWorkorders.length === 0}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Export ทั้งหมด (XLSX)
              </button>
              <button
                onClick={exportAllCSV}
                disabled={filteredWorkorders.length === 0}
                className="px-4 py-2.5 bg-cyan-600/10 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-cyan-500/30 font-bold rounded-lg text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Export ทั้งหมด (CSV)
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/select-site')}
            className="px-5 py-2.5 bg-dark-accent hover:bg-dark-accent/80 border border-dark-border text-gray-200 font-bold rounded-lg text-sm transition-all shadow-md flex items-center gap-2"
          >
            &larr; กลับหน้าเลือกสถานี
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 relative overflow-hidden">
          <p className="text-xs text-gray-500 font-semibold uppercase">ใบงานทั้งหมด</p>
          <p className="text-3xl font-black text-white mt-1">{stats.total}</p>
          <p className="text-[10px] text-gray-500 mt-1">ในขอบเขตที่เลือก</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 relative overflow-hidden">
          <p className="text-xs text-gray-500 font-semibold uppercase">อนุมัติแล้ว (เสร็จสิ้น)</p>
          <p className="text-3xl font-black text-emerald-400 mt-1">{stats.approved}</p>
          <p className="text-[10px] text-gray-500 mt-1">Admin อนุมัติจบงาน</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 relative overflow-hidden">
          <p className="text-xs text-gray-500 font-semibold uppercase">TL อนุมัติแล้ว</p>
          <p className="text-3xl font-black text-cyan-400 mt-1">{stats.tlApproved}</p>
          <p className="text-[10px] text-gray-500 mt-1">รอ Admin ปิดงาน</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 relative overflow-hidden">
          <p className="text-xs text-gray-500 font-semibold uppercase">รอ TL ตรวจ</p>
          <p className="text-3xl font-black text-amber-400 mt-1">{stats.submitted}</p>
          <p className="text-[10px] text-gray-500 mt-1">Inspector ส่งมาแล้ว</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 relative overflow-hidden">
          <p className="text-xs text-gray-500 font-semibold uppercase">ตีกลับ</p>
          <p className="text-3xl font-black text-rose-400 mt-1">{stats.rejected}</p>
          <p className="text-[10px] text-gray-500 mt-1">ส่งกลับให้แก้ไข</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 relative overflow-hidden">
          <p className="text-xs text-gray-500 font-semibold uppercase">กำลังดำเนินการ</p>
          <p className="text-3xl font-black text-yellow-400 mt-1">{stats.pending}</p>
          <p className="text-[10px] text-gray-500 mt-1">ยังไม่ส่งงาน / แก้ไขอยู่</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 bg-dark-bg/60 border border-dark-border rounded-lg px-3 py-2 w-full lg:max-w-md">
          <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="ค้นหาด้วยรหัส, ชื่อสถานี, Area/Subarea, Job หรือ SAP No..."
            className="bg-transparent border-0 outline-none w-full text-sm text-gray-200 placeholder-gray-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="text-gray-500 hover:text-gray-300 text-lg leading-none">&times;</button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto justify-end">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-semibold uppercase whitespace-nowrap">Area:</span>
            <select
              value={areaFilter}
              onChange={(e) => setAreaFilter(e.target.value)}
              className="bg-dark-bg border border-dark-border text-gray-200 text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-all cursor-pointer min-w-[120px]"
            >
              {uniqueAreas.map(area => (
                <option key={area} value={area} className="bg-dark-card text-gray-200">
                  {area === 'All' ? 'ทุก Area' : area}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-500 font-semibold uppercase whitespace-nowrap">รอบ:</span>
            <select
              value={cycleFilter}
              onChange={(e) => setCycleFilter(e.target.value)}
              className="bg-dark-bg border border-dark-border text-gray-200 text-xs font-semibold rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-all cursor-pointer min-w-[120px]"
            >
              {uniqueCycles.map(cycle => (
                <option key={cycle} value={cycle} className="bg-dark-card text-gray-200">
                  {cycle === 'All' ? 'ทุกรอบ' : cycle}
                </option>
              ))}
            </select>
          </div>

          <div className="flex bg-dark-bg border border-dark-border rounded-lg p-1">
            {[
              { id: 'All', label: 'ทั้งหมด' },
              { id: 'Approved', label: 'Completed' },
              { id: 'TL Approved', label: 'TL อนุมัติแล้ว' },
              { id: 'Submitted', label: 'รอ TL ตรวจ' },
              { id: 'Rejected', label: 'ตีกลับ' },
              { id: 'Pending', label: 'ดำเนินการ' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setStatusFilter(item.id)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  statusFilter === item.id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>แสดง {filteredWorkorders.length} จาก {workorders.length} รายการ</span>
        <span>คลิกแถวเพื่อดูรายละเอียดข้อมูลการตรวจสอบ</span>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-dark-card border border-dark-border rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <span className="ml-3 text-gray-400">กำลังโหลดประวัติใบงานทั้งหมด...</span>
        </div>
      ) : error ? (
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-6 text-red-200 text-sm text-center">
          {error}
        </div>
      ) : filteredWorkorders.length === 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-xl p-12 text-center text-gray-500 text-sm">
          ไม่พบรายการใบงานตามเงื่อนไขที่เลือก
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-xl shadow-xl">
          <div className="overflow-x-auto overflow-y-visible rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-accent/40 border-b border-dark-border text-xs text-gray-400 font-semibold uppercase">
                  <th className="p-4 w-8"></th>
                  <th className="p-4">รหัส / ชื่อสถานี</th>
                  <th className="p-4">พื้นที่</th>
                  <th className="p-4">รอบตรวจ</th>
                  <th className="p-4">SL6 / SAP</th>
                  <th className="p-4">วันที่ตรวจ</th>
                  <th className="p-4 text-center">ข้อมูล</th>
                  <th className="p-4 text-center">สถานะ</th>
                  <th className="p-4 text-center">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-sm text-gray-300">
                {filteredWorkorders.map((wo, index) => {
                  const isExpanded = expandedRow === wo.rpm_id;
                  const completeness = getDataCompleteness(wo);
                  const isSubmitted = wo.status === 'Submitted';
                  const isTLApproved = wo.status === 'TL Approved';
                  const isMenuOpen = openMenuId === wo.rpm_id;
                  const isTopRow = index < 2;

                  return (
                    <React.Fragment key={wo.rpm_id}>
                      <tr 
                        className={`hover:bg-dark-accent/10 transition-colors cursor-pointer ${isExpanded ? 'bg-dark-accent/10 border-l-2 border-l-indigo-500' : ''}`}
                        onClick={() => toggleExpand(wo.rpm_id)}
                      >
                        <td className="p-4">
                          <svg className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-dark-accent text-indigo-400 font-mono">
                              {wo.site_code}
                            </span>
                            <div>
                              <p className="font-bold text-white text-xs">{wo.site_name}</p>
                              <p className="text-[10px] text-gray-500">{wo.site_type} - เกรด {wo.site_grade}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs">
                          <p className="text-gray-300 font-semibold">{wo.area || '-'}</p>
                          <p className="text-gray-500 text-[10px]">{wo.subarea || '-'}</p>
                        </td>
                        <td className="p-4 font-semibold text-gray-200">{wo.rpm_cycle || '-'}</td>
                        <td className="p-4 font-mono text-xs">
                          <p className="text-gray-400"><span className="text-[10px] text-gray-500">SL6:</span> {wo.job_number_sl6 || '-'}</p>
                          <p className="text-gray-400"><span className="text-[10px] text-gray-500">SAP:</span> {wo.sap_number || '-'}</p>
                        </td>
                        <td className="p-4 text-xs">
                          <p className="text-gray-300 font-medium">{formatDate(wo.inspection_date)}</p>
                          <p className="text-gray-500 mt-0.5">{wo.inspection_time ? `${wo.inspection_time.slice(0, 5)} น.` : '-'}</p>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span title="AC Main" className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center ${Number(wo.has_ac) > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-dark-bg text-gray-600 border border-dark-border'}`}>AC</span>
                            <span title="Rectifier" className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center ${Number(wo.rectifier_count) > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-dark-bg text-gray-600 border border-dark-border'}`}>R</span>
                            <span title="Facilities" className={`w-5 h-5 rounded text-[9px] font-bold flex items-center justify-center ${Number(wo.has_facilities) > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-dark-bg text-gray-600 border border-dark-border'}`}>F</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">{completeness.filled}/{completeness.sections}</p>
                        </td>
                        <td className="p-4 text-center">
                          {getStatusBadge(wo.status)}
                          {wo.summary_issue && wo.summary_issue.includes('[ตีกลับแก้ไข') && (
                            <div className="mt-1 max-w-[160px] mx-auto text-[10px] text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded text-left truncate" title={wo.summary_issue}>
                              <span className="font-bold">สาเหตุตีกลับ:</span> {wo.summary_issue.replace(/\[ตีกลับแก้ไขโดย TL\/Admin\]:\s*/, '')}
                            </div>
                          )}
                        </td>

                        {/* ─── Consolidated Action Menu ─── */}
                        <td className="p-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isMenuOpen) {
                                setOpenMenuId(null);
                              } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const showBelow = spaceBelow > 220;
                                setOpenMenuId(wo.rpm_id);
                                setTimeout(() => {
                                  if (menuRef.current) {
                                    menuRef.current.style.position = 'fixed';
                                    menuRef.current.style.right = `${window.innerWidth - rect.right}px`;
                                    if (showBelow) {
                                      menuRef.current.style.top = `${rect.bottom + 4}px`;
                                      menuRef.current.style.bottom = 'auto';
                                    } else {
                                      menuRef.current.style.bottom = `${window.innerHeight - rect.top + 4}px`;
                                      menuRef.current.style.top = 'auto';
                                    }
                                  }
                                }, 0);
                              }
                            }}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                              isMenuOpen
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'bg-dark-bg border-dark-border text-gray-400 hover:text-gray-200 hover:border-gray-500'
                            }`}
                            title="จัดการ"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>

                          {isMenuOpen && (
                            <div
                              ref={menuRef}
                              onClick={(e) => e.stopPropagation()}
                              className="fixed z-50 w-52 bg-dark-card border border-dark-border rounded-xl shadow-2xl p-1.5 text-left"
                            >
                              <MenuItem
                                tone="indigo"
                                onClick={() => {
                                  if (wo.rpm_id) localStorage.setItem('currentRpmId', wo.rpm_id);
                                  localStorage.setItem('rpmCycle', wo.rpm_cycle || '');
                                  localStorage.setItem('inspectionDate', wo.inspection_date ? wo.inspection_date.split('T')[0] : '');
                                  localStorage.setItem('inspectionTime', wo.inspection_time || '');
                                  setOpenMenuId(null);
                                  navigate(`/workorder/${wo.site_code}/master`);
                                }}
                              >
                                {isInspector && wo.status === 'Pending' ? 'แก้ไขงาน' : 'ดูงาน'}
                              </MenuItem>

                              {/* Team Lead Actions on Submitted Work Orders */}
                              {isTeamLead && isSubmitted && (
                                <>
                                  <MenuItem tone="emerald" onClick={() => { setOpenMenuId(null); handleTLApprove(wo.rpm_id); }}>
                                    Approve
                                  </MenuItem>
                                  <MenuItem tone="rose" onClick={() => { setOpenMenuId(null); handleReject(wo.rpm_id); }}>
                                    Reject
                                  </MenuItem>
                                </>
                              )}

                              {/* Admin Actions */}
                              {isAdmin && wo.status !== 'Approved' && (
                                <>
                                  <MenuItem tone="emerald" onClick={() => { setOpenMenuId(null); handleAdminApprove(wo.rpm_id); }}>
                                    Approve (จบงาน)
                                  </MenuItem>
                                  <MenuItem tone="rose" onClick={() => { setOpenMenuId(null); handleReject(wo.rpm_id); }}>
                                    Reject
                                  </MenuItem>
                                </>
                              )}

                              {(isAdmin || isTeamLead) && (
                                <>
                                  <div className="my-1 border-t border-dark-border/60" />
                                  <MenuItem
                                    tone="emerald"
                                    disabled={exportingId === wo.rpm_id}
                                    onClick={() => { setOpenMenuId(null); exportSingleXLSX(wo); }}
                                  >
                                    {exportingId === wo.rpm_id ? 'กำลัง Export...' : 'Export Excel (XLSX)'}
                                  </MenuItem>
                                  <MenuItem
                                    tone="cyan"
                                    disabled={exportingId === wo.rpm_id}
                                    onClick={() => { setOpenMenuId(null); exportSingleCSV(wo); }}
                                  >
                                    {exportingId === wo.rpm_id ? 'กำลัง Export...' : 'Export CSV'}
                                  </MenuItem>
                                  <MenuItem
                                    tone="purple"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      const storagePath = `db_img/${wo.site_code}${wo.rpm_cycle ? '/' + wo.rpm_cycle : ''}`;
                                      navigate(`/admin/storage?path=${encodeURIComponent(storagePath)}`);
                                    }}
                                  >
                                    ดูรูปภาพสถานี
                                  </MenuItem>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                      {isExpanded && renderDetailPanel(wo.rpm_id)}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
