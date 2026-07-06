import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

export default function ManageUsers() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

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

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser.role === 'Admin') {
      alert('คุณไม่สามารถแก้ไขสิทธิ์ของบัญชีผู้ดูแลระบบ (Admin) ได้');
      return;
    }

    if (!window.confirm(`คุณต้องการเปลี่ยนสิทธิ์ของคุณ ${targetUser.name} เป็น ${newRole} ใช่หรือไม่?`)) {
      // Re-fetch users to reset state value
      fetchUsers();
      return;
    }

    try {
      const res = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: targetUser.user_id,
          role: newRole,
          requesterEmail: currentUser.email
        })
      });

      if (res.ok) {
        alert('ปรับปรุงสิทธิ์เรียบร้อยแล้ว!');
        fetchUsers();
      } else {
        const data = await res.json();
        alert('เกิดข้อผิดพลาด: ' + data.error);
        fetchUsers();
      }
    } catch (e) {
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
      fetchUsers();
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

  return (
    <MainLayout currentStep="admin-users" currentSite={null} onNavigateBack={() => navigate('/admin/dashboard')}>
      <div className="space-y-6 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">จัดการสิทธิ์ผู้ใช้งาน (User Roles)</h2>
            <p className="text-gray-400 mt-1">ผู้ดูแลระบบสามารถปรับปรุงสิทธิ์การเข้าถึงข้อมูลตามบทบาทต่าง ๆ ได้</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">กำลังโหลดข้อมูลผู้ใช้งาน...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">⚠️ {error}</div>
        ) : (
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-300">
                <thead className="bg-dark-bg/60 text-xs font-semibold uppercase text-gray-400 border-b border-dark-border/60">
                  <tr>
                    <th className="px-6 py-4">ผู้ใช้งาน</th>
                    <th className="px-6 py-4">อีเมล</th>
                    <th className="px-6 py-4">วันที่ลงทะเบียน</th>
                    <th className="px-6 py-4">สิทธิ์ปัจจุบัน</th>
                    <th className="px-6 py-4 text-center">แก้ไขสิทธิ์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-bo rder/40">
                  {users.map((u) => {
                    const isAdminProtected = u.role === 'Admin';
                    return (
                      <tr key={u.user_id} className="hover:bg-dark-accent/20 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">{u.name}</td>
                        <td className="px-6 py-4 font-mono text-xs">{u.email}</td>
                        <td className="px-6 py-4 text-xs text-gray-400">{formatDate(u.created_at)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            u.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                            u.role === 'Inspector' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isAdminProtected ? (
                            <span className="text-xs text-gray-500 italic flex items-center justify-center gap-1.5">
                              Admin (Protected)
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u, e.target.value)}
                              className="bg-dark-bg border border-dark-border rounded px-3 py-1.5 text-xs text-gray-200 focus:border-indigo-500 outline-none transition-colors"
                            >
                              <option value="Admin">Admin</option>
                              <option value="Inspector">Inspector</option>
                              <option value="Viewer">Viewer</option>
                            </select>
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
