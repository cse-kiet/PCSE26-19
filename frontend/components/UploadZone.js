'use client';
import { useRef, useState } from 'react';
import styles from './UploadZone.module.css';

export default function UploadZone({ onImageSelect, imagePreview, onReset }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    onImageSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      className={`${styles.zone} ${dragging ? styles.dragging : ''} ${imagePreview ? styles.hasImage : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !imagePreview && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />

      {imagePreview ? (
        <div className={styles.preview}>
          <img src={imagePreview} alt="Retinal fundus" className={styles.previewImg} />
          <div className={styles.previewOverlay}>
            <button className={styles.resetBtn} onClick={(e) => { e.stopPropagation(); onReset(); }}>
              ✕ Remove
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.placeholder}>
          <div className={styles.uploadIcon}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <circle cx="12" cy="12" r="3"/>
              <line x1="12" y1="2" x2="12" y2="5"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
              <line x1="2" y1="12" x2="5" y2="12"/>
              <line x1="19" y1="12" x2="22" y2="12"/>
            </svg>
          </div>
          <p className={styles.uploadTitle}>Drop retinal fundus image here</p>
          <p className={styles.uploadSub}>or click to browse · JPG, PNG supported</p>
        </div>
      )}
    </div>
  );
}
