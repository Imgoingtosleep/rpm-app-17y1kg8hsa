import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

export default function ManageUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [editingUserId, setEditingUserId] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [selectedAreas, setSelectedAreas] = useState([]); // Array of strings
  const [selectedSubareas, setSelectedSubareas] = useState([]); // Array of strings

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        if (parsed.role !== 'Admin') {
          alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้ (เฉพาะ Admin เท่านั้น)');
          navigate('/select-site');
        }
      } else {
        navigate('/');
      }
    } catch (e) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (currentUser && currentUser.role === 'Admin') {
      fetchUsers();
      fetchSites();
    }
  }, [currentUser]);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/users')
      .then(res => {
        if (!res.ok) throw new Error('ไม่สามารถดึงรายชื่อผู้ใช้งานได้');
        return res.json();
      })
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const fetchSites = () => {
    fetch('/api/sites')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSites(data);
      })
      .catch(err => console.error('Error fetching sites list:', err));
  };

  // Helper to parse comma-separated or JSON list into array
  const parseList = (str) => {
    if (!str) return [];
    if (Array.isArray(str)) return str;
    if (str.startsWith('[')) {
      try { return JSON.parse(str); } catch (e) {}
    }
    return str.split(',').map(s => s.trim()).filter(Boolean);
  };

  // Dynamic unique Areas and Subareas list from sites database
  const availableAreasList = Array.from(new Set(sites.map(s => s.rawArea).filter(Boolean))).sort();
  
  const availableSubareasList = Array.from(new Set(
    sites
      .filter(s => selectedAreas.length === 0 || selectedAreas.includes('All') || selectedAreas.includes(s.rawArea))
      .map(s => s.rawSubarea)
      .filter(Boolean)
  )).sort();

  const handleStartEdit = (user) => {
    if (user.role === 'Admin') {
      alert('คุณไม่สามารถแก้ไขสิทธิ์ของบัญชีผู้ดูแลระบบ (Admin) ได้');
      return;
    }
    setEditingUserId(user.user_id);
    setEditRole(user.role || 'Inspector');
    setSelectedAreas(parseList(user.area));
    setSelectedSubareas(parseList(user.subarea));
  };

  const toggleAreaSelect = (areaName) => {
    setSelectedAreas(prev => {
      if (prev.includes(areaName)) {
        return prev.filter(a => a !== areaName);
      } else {
        return [...prev, areaName];
      }
    });
  };

  const toggleSubareaSelect = (subareaName) => {
    setSelectedSubareas(prev => {
      if (prev.includes(subareaName)) {
        return prev.filter(s => s !== subareaName);
      } else {
        return [...prev, subareaName];
      }
    });
  };

  const handleSaveEdit = async (targetUser) => {
    try {
      const res = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: targetUser.user_id,
          role: editRole,
          area: selectedAreas.length > 0 ? JSON.stringify(selectedAreas) : null,
          subarea: selectedSubareas.length > 0 ? JSON.stringify(selectedSubareas) : null,
          requesterEmail: currentUser.email
        })
      });

      if (res.ok) {
        alert('ปรับปรุงสิทธิ์และพื้นที่รับผิดชอบเรียบร้อยแล้ว!');
        setEditingUserId(null);
        fetchUsers();
      } else {
        const data = await res.json();
        alert('เกิดข้อผิดพลาด: ' + data.error);
      }
    } catch (e) {
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderBadgeList = (rawVal, defaultLabel) => {
    const list = parseList(rawVal);
    if (list.length === 0) return <span className="text-gray-500 italic">{defaultLabel}</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {list.map((item, idx) => (
          <span key={idx} className="px-2 py-0.5 rounded bg-dark-bg border border-dark-border text-[11px] font-medium text-gray-200">
            {item}
          </span>
        ))}
      </div>
    );
  };

  return (
    <MainLayout currentStep="admin-users" currentSite={null} onNavigateBack={() => navigate('/admin/dashboard')}>
      <div className="space-y-8 py-6">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">จัดการสิทธิ์ผู้ใช้งาน (User Roles & Multi-Area Permissions)</h2>
          <p className="text-gray-400 mt-1">ผู้ดูแลระบบสามารถกำหนดบทบาท 4 ระดับ และสามารถมอบหมายพื้นที่รับผิดชอบได้หลาย Area / Sub-Area พร้อมกัน</p>
        </div>

        {/* Detailed Role Specifications Cards */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>ข้อกำหนดและคำอธิบายสิทธิ์ของแต่ละบทบาท (Role Specifications)</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Admin */}
            <div className="bg-dark-card border border-indigo-500/40 rounded-xl p-5 space-y-3 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold text-indigo-400">Admin</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">ผู้ดูแลระบบสูงสุด</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                เข้าถึงสิทธิ์ได้สูงสุด 100% ครอบคลุมทุกไซต์ ทุก Area/Sub-Area ทั่วประเทศ สามารถจัดการผู้ใช้, ตรวจสอบงาน (Approve/Reject), แก้ไขฟิลด์, และสืบค้นฐานข้อมูล SQL
              </p>
              <div className="pt-2 border-t border-dark-border/60 text-[11px] text-gray-400 space-y-1">
                <div>• <strong>สิทธิ์ตรวจงาน:</strong> ทุก Area ทั่วประเทศ</div>
                <div>• <strong>สิทธิ์จัดการ:</strong> เพิ่ม/ลบผู้ใช้, ปรับ Config</div>
              </div>
            </div>

            {/* Team Lead (TL) */}
            <div className="bg-dark-card border border-amber-500/40 rounded-xl p-5 space-y-3 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold text-amber-400">Team Lead (TL)</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">หัวหน้าทีมประจำ Area</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                รับผิดชอบจัดการและตรวจงานประจำ Area ใหญ่ (เลือกได้หลาย Area) ครอบคลุมทุก Sub-Area ในสังกัด มีสิทธิ์กด Approve หรือ Reject (ส่งกลับไปแก้ไข) ใบงานของ Inspector
              </p>
              <div className="pt-2 border-t border-dark-border/60 text-[11px] text-gray-400 space-y-1">
                <div>• <strong>สิทธิ์ตรวจงาน:</strong> ทุก Area / Sub-Area ที่มอบหมาย</div>
                <div>• <strong>สิทธิ์จัดการ:</strong> Approve / Reject ส่งต่อ Admin</div>
              </div>
            </div>

            {/* Inspector */}
            <div className="bg-dark-card border border-emerald-500/40 rounded-xl p-5 space-y-3 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold text-emerald-400">Inspector</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">ผู้ตรวจหน้างาน</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                ช่างผู้ตรวจหน้างาน (Sub-Contact / Admin Sub-Contact) สามารถเลือกรับผิดชอบหลาย Sub-Area มีสิทธิ์เปิดใบงาน บันทึกผลทดสอบ ถ่ายรูปหลักฐาน และกด Submit ใบงาน
              </p>
              <div className="pt-2 border-t border-dark-border/60 text-[11px] text-gray-400 space-y-1">
                <div>• <strong>สิทธิ์ตรวจงาน:</strong> เฉพาะ Sub-Area ที่ได้รับมอบหมาย</div>
                <div>• <strong>สิทธิ์จัดการ:</strong> กรอกข้อมูล & Submit ใบงาน</div>
              </div>
            </div>

            {/* Viewer */}
            <div className="bg-dark-card border border-blue-500/40 rounded-xl p-5 space-y-3 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold text-blue-400">Viewer</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">ผู้รับชม (Read-Only)</span>
              </div>
              <p className="text-gray-300 text-xs leading-relaxed">
                ผู้รับชมรายงาน ผู้บริหาร หรือ Auditor สามารถเข้าชมข้อมูลผลการตรวจย้อนหลัง ดูกราฟสถิติ Health Index ได้แบบอ่านอย่างเดียว (Read-Only) ไม่สามารถแก้ไขหรือบันทึกได้
              </p>
              <div className="pt-2 border-t border-dark-border/60 text-[11px] text-gray-400 space-y-1">
                <div>• <strong>สิทธิ์ตรวจงาน:</strong> Read-Only ตามโซนที่ได้รับสิทธิ์</div>
                <div>• <strong>สิทธิ์จัดการ:</strong> รับชมรายงาน & Export</div>
              </div>
            </div>
          </div>
        </div>

        {/* User Table Section */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">กำลังโหลดข้อมูลผู้ใช้งาน...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : (
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-xl space-y-4 p-4">
            <div className="flex items-center justify-between px-2 pt-2">
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <span>รายชื่อผู้ใช้งานและกำหนดสิทธิ์ (User Directory & Roles)</span>
              </h3>
              <span className="text-xs text-gray-400">ทั้งหมด {users.length} บัญชี</span>
            </div>

            <div className="overflow-x-auto border border-dark-border/60 rounded-lg">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-dark-bg/80 text-xs font-semibold uppercase text-gray-400 border-b border-dark-border/60">
                  <tr>
                    <th className="px-5 py-3.5">ผู้ใช้งาน / อีเมล</th>
                    <th className="px-5 py-3.5">บทบาท (Role)</th>
                    <th className="px-5 py-3.5">Area ใหญ่ที่ดูแล (Multiple)</th>
                    <th className="px-5 py-3.5">Sub-Area ย่อยที่ดูแล (Multiple)</th>
                    <th className="px-5 py-3.5">วันที่ลงทะเบียน</th>
                    <th className="px-5 py-3.5 text-center">จัดการสิทธิ์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/40">
                  {users.map((u) => {
                    const isAdminProtected = u.role === 'Admin';
                    const isEditing = editingUserId === u.user_id;

                    return (
                      <tr key={u.user_id} className="hover:bg-dark-accent/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="font-mono text-xs text-gray-400">{u.email}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          {isEditing ? (
                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              className="bg-dark-bg border border-indigo-500 rounded px-2.5 py-1 text-xs text-white outline-none font-medium"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Team Lead">Team Lead (TL)</option>
                              <option value="Inspector">Inspector</option>
                              <option value="Viewer">Viewer</option>
                            </select>
                          ) : (
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              u.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                              u.role === 'Team Lead' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              u.role === 'Inspector' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}>
                              {u.role || 'Viewer'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          {isEditing ? (
                            <div className="space-y-1.5 max-w-xs">
                              <div className="text-[10px] text-gray-400 font-semibold uppercase">เลือก Area ใหญ่ (เลือกได้หลายรายการ):</div>
                              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1.5 bg-dark-bg border border-dark-border rounded">
                                {availableAreasList.map(aName => {
                                  const isSelected = selectedAreas.includes(aName);
                                  return (
                                    <button
                                      key={aName}
                                      type="button"
                                      onClick={() => toggleAreaSelect(aName)}
                                      className={`px-2 py-0.5 rounded text-xs font-medium border transition-all ${
                                        isSelected 
                                          ? 'bg-amber-500/30 text-amber-300 border-amber-500/60' 
                                          : 'bg-dark-card text-gray-400 border-dark-border hover:border-gray-500'
                                      }`}
                                    >
                                      {isSelected ? '✓ ' : '+ '}{aName}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            renderBadgeList(u.area, 'ทุก Area (All)')
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          {isEditing ? (
                            <div className="space-y-1.5 max-w-xs">
                              <div className="text-[10px] text-gray-400 font-semibold uppercase">เลือก Sub-Area ย่อย (เลือกได้หลายรายการ):</div>
                              <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1.5 bg-dark-bg border border-dark-border rounded">
                                {availableSubareasList.map(sName => {
                                  const isSelected = selectedSubareas.includes(sName);
                                  return (
                                    <button
                                      key={sName}
                                      type="button"
                                      onClick={() => toggleSubareaSelect(sName)}
                                      className={`px-2 py-0.5 rounded text-xs font-medium border transition-all ${
                                        isSelected 
                                          ? 'bg-indigo-500/30 text-indigo-300 border-indigo-500/60' 
                                          : 'bg-dark-card text-gray-400 border-dark-border hover:border-gray-500'
                                      }`}
                                    >
                                      {isSelected ? '✓ ' : '+ '}{sName}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            renderBadgeList(u.subarea, 'ทุก Sub-Area (All)')
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-400">{formatDate(u.created_at)}</td>
                        <td className="px-5 py-3.5 text-center">
                          {isAdminProtected ? (
                            <span className="text-xs text-gray-500 italic">Admin (Protected)</span>
                          ) : isEditing ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(u)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-all shadow"
                              >
                                บันทึก
                              </button>
                              <button
                                onClick={() => setEditingUserId(null)}
                                className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-all"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartEdit(u)}
                              className="px-3 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 rounded text-xs font-semibold transition-all"
                            >
                              แก้ไขสิทธิ์ / โซน
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
