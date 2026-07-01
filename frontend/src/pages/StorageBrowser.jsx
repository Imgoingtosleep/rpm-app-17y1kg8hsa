import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';

export default function StorageBrowser() {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [previewImage, setPreviewImage] = useState(null);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Selection states
  const [selectedItems, setSelectedItems] = useState([]);

  const fetchFolder = (path) => {
    setLoading(true);
    setError('');
    fetch(`/api/storage/browse?path=${encodeURIComponent(path)}`)
      .then(res => {
        if (!res.ok) throw new Error('ไม่สามารถโหลดข้อมูลพื้นที่เก็บข้อมูลได้');
        return res.json();
      })
      .then(data => {
        setItems(data.items || []);
        setCurrentPath(data.currentPath || '');
        setSelectedItems([]); // Clear selection when navigating folders
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleToggleSelect = (relPath) => {
    setSelectedItems(prev => 
      prev.includes(relPath) 
        ? prev.filter(p => p !== relPath) 
        : [...prev, relPath]
    );
  };

  const handleSelectAll = () => {
    const allPaths = filteredItems.map(item => item.relPath);
    const allSelected = allPaths.length > 0 && allPaths.every(p => selectedItems.includes(p));
    
    if (allSelected) {
      setSelectedItems(prev => prev.filter(p => !allPaths.includes(p)));
    } else {
      setSelectedItems(prev => {
        const union = new Set([...prev, ...allPaths]);
        return Array.from(union);
      });
    }
  };

  const handleDownloadSelected = async () => {
    if (selectedItems.length === 0) return;
    try {
      const response = await fetch('/api/storage/download-selected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paths: selectedItems })
      });
      if (!response.ok) throw new Error('ดาวน์โหลดล้มเหลว');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'selected_files.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์ที่เลือก: ' + err.message);
    }
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      if (user && user.role === 'Admin') {
        setIsAdmin(true);
        fetchFolder('');
      } else {
        setIsAdmin(false);
      }
    } catch (e) {
      setIsAdmin(false);
    } finally {
      setCheckingAuth(false);
    }
  }, []);

  const handleFolderClick = (relPath) => {
    fetchFolder(relPath);
  };

  const handleBreadcrumbClick = (index) => {
    const parts = currentPath.split('/').filter(Boolean);
    const targetParts = parts.slice(0, index + 1);
    const targetPath = targetParts.join('/');
    fetchFolder(targetPath);
  };

  const handleGoRoot = () => {
    fetchFolder('');
  };

  const handleBack = () => {
    const parts = currentPath.split('/').filter(Boolean);
    if (parts.length > 0) {
      parts.pop();
      fetchFolder(parts.join('/'));
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileExtension = (name) => {
    return name.split('.').pop().toLowerCase();
  };

  const isImageFile = (name) => {
    const ext = getFileExtension(name);
    return ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext);
  };

  const isPdfFile = (name) => {
    return getFileExtension(name) === 'pdf';
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (checkingAuth) {
    return (
      <MainLayout currentStep="storage-browser" currentSite={null} onNavigateBack={() => window.history.back()}>
        <div className="text-center py-16 text-gray-500">กำลังตรวจสอบสิทธิ์...</div>
      </MainLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MainLayout currentStep="storage-browser" currentSite={null} onNavigateBack={() => window.history.back()}>
        <div className="max-w-md mx-auto my-16 p-8 bg-red-950/15 border border-red-900/30 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl">⚠️</div>
          <h3 className="text-xl font-bold text-white">เข้าถึงข้อมูลไม่ได้ (Access Denied)</h3>
          <p className="text-gray-400 text-sm">ขออภัย เฉพาะผู้ใช้งานที่มีสิทธิ์ Admin เท่านั้นที่สามารถเรียกดูหรือดาวน์โหลดข้อมูลในระบบจัดเก็บได้</p>
          <button 
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-dark-accent border border-dark-border text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
          >
            ย้อนกลับ
          </button>
        </div>
      </MainLayout>
    );
  }

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <MainLayout currentStep="storage-browser" currentSite={null} onNavigateBack={() => window.history.back()}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              คลังจัดเก็บรูปภาพ (Storage Browser)
            </h2>
            <p className="text-gray-400 text-sm mt-1">เรียกดู ค้นหา ดาวน์โหลด และเปิดดูไฟล์รูปภาพที่อัปโหลดทั้งหมดในระบบ</p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg border transition-colors ${viewMode === 'grid' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-dark-card border-dark-border text-gray-400 hover:text-gray-200'}`}
              title="Grid View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg border transition-colors ${viewMode === 'list' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-dark-card border-dark-border text-gray-400 hover:text-gray-200'}`}
              title="List View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>

        {/* Toolbar & Breadcrumbs */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
          {/* Breadcrumbs */}
          <div className="flex items-center flex-wrap gap-2 text-sm text-gray-300 font-medium">
            <button 
              onClick={handleGoRoot}
              className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              root
            </button>

            {breadcrumbs.map((part, index) => (
              <React.Fragment key={index}>
                <span className="text-gray-600">/</span>
                <button 
                  onClick={() => handleBreadcrumbClick(index)}
                  className="hover:text-white transition-colors"
                >
                  {part}
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {filteredItems.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 bg-dark-bg border border-dark-border text-gray-300 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <input 
                  type="checkbox"
                  checked={filteredItems.length > 0 && filteredItems.every(item => selectedItems.includes(item.relPath))}
                  onChange={() => {}} // Controlled by button click
                  className="rounded border-gray-600 bg-dark-bg text-indigo-600 focus:ring-indigo-500 focus:ring-offset-dark-bg cursor-pointer"
                />
                เลือกทั้งหมด
              </button>
            )}

            {selectedItems.length > 0 && (
              <button 
                onClick={handleDownloadSelected}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-md shrink-0 hover:scale-[1.02]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                ดาวน์โหลดที่เลือก ({selectedItems.length}) (.zip)
              </button>
            )}

            <a 
              href={`/api/storage/download-folder?path=${encodeURIComponent(currentPath)}`}
              download
              className="px-4 py-2 bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-1.5 shadow-md shrink-0 hover:scale-[1.02]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              ดาวน์โหลดทั้งโฟลเดอร์ (.zip)
            </a>

            {/* Search bar */}
            <div className="relative w-full md:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </span>
              <input 
                type="text"
                placeholder="ค้นหาไฟล์หรือโฟลเดอร์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border rounded-lg pl-9 pr-4 py-2 text-xs text-gray-200 focus:border-indigo-500 outline-none transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Navigation Actions (Up one level) */}
        {currentPath && (
          <button 
            onClick={handleBack}
            className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            ย้อนกลับขึ้นไปหนึ่งระดับ
          </button>
        )}

        {/* File Browser Area */}
        {loading ? (
          <div className="text-center py-16 text-gray-500">กำลังโหลดรายการไฟล์...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-400 bg-red-950/10 border border-red-900/30 rounded-xl">⚠️ {error}</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-dark-card/30 border border-dark-border/60 rounded-xl">
            {searchQuery ? 'ไม่พบไฟล์หรือโฟลเดอร์ที่ตรงกับการค้นหา' : 'โฟลเดอร์นี้ว่างเปล่า'}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid Layout */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredItems.map((item, idx) => (
              <div 
                key={idx}
                className="bg-dark-card border border-dark-border/80 hover:border-indigo-500/80 rounded-xl p-4 flex flex-col items-center justify-between text-center transition-all hover:-translate-y-0.5 group shadow-md relative"
              >
                {/* Select checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input 
                    type="checkbox"
                    checked={selectedItems.includes(item.relPath)}
                    onChange={() => handleToggleSelect(item.relPath)}
                    className="w-4 h-4 rounded border-gray-600 bg-dark-bg text-indigo-600 focus:ring-indigo-500 focus:ring-offset-dark-bg cursor-pointer"
                  />
                </div>
                {/* File/Folder Icon / Image Preview */}
                <div 
                  onClick={() => item.isDir ? handleFolderClick(item.relPath) : isImageFile(item.name) ? setPreviewImage(`/storage/${item.relPath}`) : null}
                  className="w-16 h-16 flex items-center justify-center mb-3 cursor-pointer select-none relative overflow-hidden rounded"
                >
                  {item.isDir ? (
                    <svg className="w-12 h-12 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                  ) : isImageFile(item.name) ? (
                    <svg className="w-12 h-12 text-indigo-400 group-hover:scale-105 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  ) : isPdfFile(item.name) ? (
                    <svg className="w-12 h-12 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg className="w-12 h-12 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="w-full space-y-1">
                  <p 
                    onClick={() => item.isDir ? handleFolderClick(item.relPath) : isImageFile(item.name) ? setPreviewImage(`/storage/${item.relPath}`) : null}
                    className="text-xs font-semibold text-gray-200 truncate cursor-pointer hover:text-indigo-400 select-all" 
                    title={item.name}
                  >
                    {item.name}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {item.isDir ? 'โฟลเดอร์' : formatSize(item.size)}
                  </p>
                </div>

                {/* Action buttons */}
                {!item.isDir && (
                  <div className="mt-3 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={`/storage/${item.relPath}`} 
                      download={item.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold shadow flex items-center gap-1"
                    >
                      ดาวน์โหลด
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* List Layout */
          <div className="bg-dark-card border border-dark-border rounded-xl overflow-hidden shadow-lg">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-dark-bg/60 border-b border-dark-border text-xs font-bold text-gray-400">
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox"
                      checked={filteredItems.length > 0 && filteredItems.every(item => selectedItems.includes(item.relPath))}
                      onChange={handleSelectAll}
                      className="rounded border-gray-600 bg-dark-bg text-indigo-600 focus:ring-indigo-500 focus:ring-offset-dark-bg cursor-pointer"
                    />
                  </th>
                  <th className="p-4">ชื่อ</th>
                  <th className="p-4">ประเภท/ขนาด</th>
                  <th className="p-4 hidden sm:table-cell">วันที่แก้ไขล่าสุด</th>
                  <th className="p-4 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border/40 text-xs">
                {filteredItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-dark-bg/30 transition-colors">
                    <td className="p-4 w-12 text-center">
                      <input 
                        type="checkbox"
                        checked={selectedItems.includes(item.relPath)}
                        onChange={() => handleToggleSelect(item.relPath)}
                        className="rounded border-gray-600 bg-dark-bg text-indigo-600 focus:ring-indigo-500 focus:ring-offset-dark-bg cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div 
                        onClick={() => item.isDir ? handleFolderClick(item.relPath) : isImageFile(item.name) ? setPreviewImage(`/storage/${item.relPath}`) : null}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        {item.isDir ? (
                          <svg className="w-5 h-5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" /></svg>
                        ) : isImageFile(item.name) ? (
                          <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-500 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                        )}
                        <span className="font-semibold text-gray-200 hover:text-indigo-400 truncate max-w-md">{item.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-400 font-medium">
                      {item.isDir ? 'โฟลเดอร์' : formatSize(item.size)}
                    </td>
                    <td className="p-4 text-gray-500 hidden sm:table-cell">
                      {formatDate(item.updatedAt)}
                    </td>
                    <td className="p-4 text-center">
                      {!item.isDir ? (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => setPreviewImage(`/storage/${item.relPath}`)}
                            className="text-gray-400 hover:text-white transition-colors"
                          >
                            ดูรูปภาพ
                          </button>
                          <span className="text-gray-700">|</span>
                          <a 
                            href={`/storage/${item.relPath}`} 
                            download={item.name}
                            className="text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            ดาวน์โหลด
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-600">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Image Preview Modal */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <a 
                href={previewImage} 
                download
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-sm transition-colors flex items-center gap-1.5 shadow-lg"
              >
                📥 ดาวน์โหลด
              </a>
              <button 
                onClick={() => setPreviewImage(null)}
                className="p-2 bg-dark-card border border-dark-border text-gray-400 hover:text-white rounded-lg transition-colors shadow-lg"
              >
                ✕ ปิด
              </button>
            </div>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg border border-dark-border shadow-2xl"
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
