import React, { useState, useEffect } from 'react';

/**
 * ImagePreviewManager
 * Component for uploading, previewing, and removing images before submit
 */
export default function ImagePreviewManager({
  files = [],
  existingPaths = [],
  onFilesChange,
  onExistingRemove,
  isReadOnly = false,
  maxFiles = 10,
  label = 'อัปโหลดรูปภาพ'
}) {
  const [previews, setPreviews] = useState([]);

  // Generate Object URLs for newly selected File objects
  useEffect(() => {
    if (!files || files.length === 0) {
      setPreviews([]);
      return;
    }

    const objectUrls = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setPreviews(objectUrls);

    // Clean up memory
    return () => {
      objectUrls.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, [files]);

  const handleFileAdd = (e) => {
    if (isReadOnly || !e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    
    const normalizedExisting = Array.isArray(existingPaths) ? existingPaths : (existingPaths ? [existingPaths] : []);
    const totalCount = normalizedExisting.length + files.length + selectedFiles.length;

    if (totalCount > maxFiles) {
      alert(`คุณไม่สามารถเพิ่มรูปภาพเกิน ${maxFiles} รูปได้ในฟิลด์นี้ (มีรูปเดิม ${normalizedExisting.length} รูป และรูปใหม่ ${files.length + selectedFiles.length} รูป)`);
      return;
    }

    const updatedFiles = [...files, ...selectedFiles];
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
  };

  const handleNewFileRemove = (indexToRemove) => {
    if (isReadOnly) return;
    const updatedFiles = files.filter((_, idx) => idx !== indexToRemove);
    if (onFilesChange) {
      onFilesChange(updatedFiles);
    }
  };

  const handleExistingFileRemove = (pathToRemove) => {
    if (isReadOnly) return;
    if (window.confirm('คุณต้องการลบรูปภาพที่เคยอัปโหลดไว้แล้วนี้ใช่หรือไม่?')) {
      if (onExistingRemove) {
        onExistingRemove(pathToRemove);
      }
    }
  };

  const normalizedExisting = Array.isArray(existingPaths) ? existingPaths : (existingPaths ? [existingPaths] : []);

  return (
    <div className="space-y-2.5">
      {!isReadOnly && (
        <div className="flex items-center gap-3">
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-dark-accent hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold transition-all">
            <span>เลือกรูปภาพเพิ่ม...</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileAdd}
            />
          </label>
          <span className="text-[11px] text-gray-500">
            (เลือกแล้ว {normalizedExisting.length + files.length}/{maxFiles} รูป)
          </span>
        </div>
      )}

      {/* Preview Grid for Existing and Newly Selected Files */}
      {(normalizedExisting.length > 0 || previews.length > 0) && (
        <div className="flex flex-wrap gap-2.5 p-2.5 bg-dark-bg/40 rounded-xl border border-dark-border/60">
          {/* Existing Server Images */}
          {normalizedExisting.map((item, idx) => {
            const rawPath = typeof item === 'object' && item !== null ? (item.path || item.url || '') : String(item);
            if (!rawPath) return null;
            const imgUrl = rawPath.startsWith('/storage') ? rawPath : `/storage/${rawPath.replace(/^\/+/, '')}`;
            const fileName = rawPath.split('/').pop() || `รูปเดิม ${idx + 1}`;

            return (
              <ExistingImageItem
                key={`existing-${idx}-${rawPath}`}
                imgUrl={imgUrl}
                fileName={fileName}
                item={item}
                isReadOnly={isReadOnly}
                onRemove={handleExistingFileRemove}
              />
            );
          })}

          {/* Newly Selected Preview Images */}
          {previews.map((item, idx) => (
            <div key={`new-${idx}`} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-indigo-500/50 bg-dark-bg shadow-md">
              <img
                src={item.url}
                alt={item.name}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="absolute bottom-0 left-0 right-0 bg-indigo-950/80 text-indigo-200 text-[9px] text-center font-bold py-0.5 truncate px-1">
                ใหม่
              </span>
              {!isReadOnly && (
                <button
                  type="button"
                  title="ลบรูปภาพใหม่นี้"
                  onClick={() => handleNewFileRemove(idx)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white font-bold text-xs flex items-center justify-center shadow-md hover:bg-red-500 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExistingImageItem({ imgUrl, fileName, item, isReadOnly, onRemove }) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative group w-20 h-20 rounded-lg overflow-hidden border border-emerald-500/40 bg-dark-bg flex flex-col items-center justify-center p-1 text-center">
      {!hasError ? (
        <img
          src={imgUrl}
          alt={fileName}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={() => setHasError(true)}
        />
      ) : (
        <span className="text-[9px] text-gray-400 font-mono break-all line-clamp-3 p-1">
          {fileName}
        </span>
      )}
      <span className="absolute bottom-0 left-0 right-0 bg-emerald-950/80 text-emerald-300 text-[9px] text-center font-bold py-0.5 truncate px-1">
        รูปเดิม
      </span>
      {!isReadOnly && (
        <button
          type="button"
          title="ลบรูปภาพนี้"
          onClick={() => onRemove(item)}
          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white font-bold text-xs flex items-center justify-center shadow-md hover:bg-red-500 transition-colors z-10"
        >
          ✕
        </button>
      )}
    </div>
  );
}
