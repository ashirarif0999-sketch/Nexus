import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, Download, Trash2, Share2, X, Check, Clock, Edit3, PenTool } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import SignatureCanvas from 'react-signature-canvas';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';

import { useMemo } from 'react';

// IndexedDB helpers
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('documentsDB', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const storeFile = async (key: string, file: File): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction('files', 'readwrite');
  tx.objectStore('files').put(file, key);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getFile = async (key: string): Promise<File | null> => {
  const db = await openDB();
  const tx = db.transaction('files', 'readonly');
  const request = tx.objectStore('files').get(key);
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

const deleteFile = async (key: string): Promise<void> => {
  const db = await openDB();
  const tx = db.transaction('files', 'readwrite');
  tx.objectStore('files').delete(key);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const pdfjsVersion = '4.7.0';

const getSamplePdfUrl = (doc: Document): { url: string, type: string } => {
  // Find first PDF file and return its URL and type, fallback to sample
  const pdfFile = doc.files.find(file => file.type === 'PDF');
  if (pdfFile) {
    return { url: pdfFile.url, type: 'application/pdf' };
  }
  // If no PDF, return first file's url and type
  const firstFile = doc.files[0];
  if (firstFile && firstFile.url) {
    return { url: firstFile.url, type: firstFile.mime || (firstFile.type === 'Document' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : firstFile.type === 'Spreadsheet' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/octet-stream') };
  }
  return { url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf', type: 'application/pdf' };
};

// Types
interface FileInfo {
  name: string;
  type: string;
  size: string;
  lastModified: string;
  url: string;
  fileId?: string;
  mime?: string;
}

interface Document {
  id: number;
  title: string;
  files: FileInfo[];
  shared: boolean;
  status: 'draft' | 'in-review' | 'signed';
}

// Initial documents with status
const initialDocuments: Document[] = [
  {
    id: 1,
    title: 'Investment Agreement Package',
    files: [
      {
        name: 'Investment Agreement.pdf',
        type: 'PDF',
        size: '2.4 MB',
        lastModified: '2024-02-15',
        url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
      },
      {
        name: 'Investment Terms Addendum.pdf',
        type: 'PDF',
        size: '1.5 MB',
        lastModified: '2024-02-14',
        url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
      }
    ],
    shared: true,
    status: 'in-review'
  },
  {
    id: 2,
    title: 'NDA Contract',
    files: [
      {
        name: 'NDA Contract.pdf',
        type: 'PDF',
        size: '1.2 MB',
        lastModified: '2024-02-10',
        url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
      }
    ],
    shared: true,
    status: 'in-review'
  },
  {
    id: 3,
    title: 'Terms of Investment',
    files: [
      {
        name: 'Terms of Investment.docx',
        type: 'Document',
        size: '3.2 MB',
        lastModified: '2024-02-05',
        url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
      },
      {
        name: 'Investment Schedule.xlsx',
        type: 'Spreadsheet',
        size: '0.8 MB',
        lastModified: '2024-02-05',
        url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
      }
    ],
    shared: true,
    status: 'draft'
  },
  {
    id: 4,
    title: 'Due Diligence Checklist',
    files: [
      {
        name: 'Due Diligence Checklist.pdf',
        type: 'PDF',
        size: '5.1 MB',
        lastModified: '2024-01-28',
        url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
      }
    ],
    shared: false,
    status: 'draft'
  },
  {
    id: 5,
    title: 'Equity Term Sheet',
    files: [
      {
        name: 'Equity Term Sheet.pdf',
        type: 'PDF',
        size: '1.8 MB',
        lastModified: '2024-01-25',
        url: 'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf'
      }
    ],
    shared: true,
    status: 'in-review'
  }
];

// Status Badge Component
const StatusBadge: React.FC<{ status: Document['status'] }> = ({ status }) => {
  const styles = {
    'draft': 'bg-gray-100 text-gray-700',
    'in-review': 'bg-yellow-100 text-yellow-700',
    'signed': 'bg-green-100 text-green-700'
  };

  const icons = {
    'draft': <Edit3 className="w-3 h-3 mr-1" />,
    'in-review': <Clock className="w-3 h-3 mr-1" />,
    'signed': <Check className="w-3 h-3 mr-1" />
  };

  const labels = {
    'draft': 'Draft',
    'in-review': 'In Review',
    'signed': 'Signed'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {icons[status]}
      {labels[status]}
    </span>
  );
};

// Drag and Drop Upload Zone
const UploadZone: React.FC<{ onUpload: (files: FileList) => void }> = ({ onUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  };

  return (
    <div
      className={clsx(
        'border-2 border-dashed rounded-2xl p-8 transition-all duration-200 cursor-pointer',
        isDragging
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50/50'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        multiple
        onChange={handleFileSelect}
      />

        <div className={clsx('w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center', isDragging ? 'bg-primary-100' : 'bg-gray-100')}>
          <Upload className={clsx('w-8 h-8', isDragging ? 'text-primary-600' : 'text-gray-400')} />
        </div>
        <p className="text-lg font-semibold text-gray-900 mb-1">
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </p>
        <p className="text-sm text-gray-500">
          or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-2">
          Supports PDF, DOC, DOCX, XLS, XLSX
        </p>
      </div>
)};

// E-Signature Modal
interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onSign: () => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, document, onSign }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'pdf' | 'html' | 'excel' | null>(null);
  const [excelData, setExcelData] = useState<any[][] | null>(null);
  const [visibleRows, setVisibleRows] = useState(30);

  useEffect(() => {
    if (document && isOpen) {
      const preview = getSamplePdfUrl(document);
      if (preview.type === 'application/pdf') {
        setPreviewType('pdf');
        setPreviewContent(null);
      } else if (!preview.url) {
        setPreviewType('html');
        setPreviewContent('<p>Preview not available for this file type.</p>');
      } else {
        setPreviewType('html');
        fetch(preview.url)
          .then(r => r.arrayBuffer())
          .then(async (buffer) => {
            try {
              if (preview.type.includes('wordprocessingml') && preview.type.includes('openxmlformats')) {
                // DOCX
                const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
                const wordStyles = `<style>
                  body { font-family: 'Calibri', sans-serif; font-size: 11pt; line-height: 1.15; color: #000; margin: 1in; }
                  p { margin: 0 0 10pt 0; text-align: justify; }
                  h1 { font-size: 20pt; font-weight: bold; margin: 24pt 0 0 0; page-break-after: avoid; color: #2e75b6; }
                  h2 { font-size: 16pt; font-weight: bold; margin: 18pt 0 0 0; page-break-after: avoid; color: #2e75b6; }
                  h3 { font-size: 14pt; font-weight: bold; margin: 14pt 0 0 0; page-break-after: avoid; color: #2e75b6; }
                  h4 { font-size: 12pt; font-weight: bold; margin: 12pt 0 0 0; page-break-after: avoid; color: #2e75b6; }
                  strong, b { font-weight: bold; }
                  em, i { font-style: italic; }
                  u { text-decoration: underline; }
                  s { text-decoration: line-through; }
                  ol { margin: 12pt 0; padding-left: 0.5in; counter-reset: list; }
                  ul { margin: 12pt 0; padding-left: 0.5in; }
                  li { margin: 6pt 0; }
                  table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
                  td, th { border: 1pt solid #000; padding: 4pt; vertical-align: top; }
                  th { font-weight: bold; background-color: #f2f2f2; }
                  .center { text-align: center; }
                  .right { text-align: right; }
                  .left { text-align: left; }
                </style>`;
                setPreviewContent(wordStyles + result.value);
              } else if (preview.type.includes('spreadsheetml') && preview.type.includes('openxmlformats')) {
                // XLSX
                const workbook = XLSX.read(buffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
                setExcelData(json);
                setVisibleRows(30);
                setPreviewType('excel');
              } else {
                setPreviewContent(null);
              }
            } catch (error) {
              setPreviewContent(null);
            }
          })
          .catch((error) => setPreviewContent('<p>Failed to load preview: ' + error.message + '</p>'));
      }
    }
  }, [document, isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleEnd = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setIsEmpty(false);
    }
  };

  const handleSign = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      onSign();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose} />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <PenTool className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">E-Signature</h3>
                <p className="text-sm text-gray-500">{document?.title || ''}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="flex flex-col md:flex-row">
            {/* Document Preview */}
            <div className="flex-1 p-6 bg-gray-50 border-r border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Document Preview</h4>
                <div className="bg-white rounded-xl border border-gray-200 p-4 min-h-[400px]">
                  {previewType === 'pdf' ? (
                    <object
                      data={document ? getSamplePdfUrl(document).url : ''}
                      type="application/pdf"
                      width="100%"
                      height="450"
                      title="Document Preview"
                    />
                  ) : previewType === 'excel' && excelData ? (
                    <div className="excel-container">
                      <style>
                        {`.excel-table { border-collapse: collapse; font-family: 'Calibri', sans-serif; font-size: 10pt; margin: 0; }
                        .excel-table td, .excel-table th { border: 1px solid #ccc; padding: 2px 4px; text-align: left; vertical-align: top; background-color: #fff; min-width: 60px; max-width: 120px; overflow: hidden; white-space: nowrap; }
                        .excel-table th { font-weight: bold; background-color: #f0f0f0; border-bottom: 2px solid #000; border-right: 2px solid #000; position: sticky; top: 0; z-index: 2; }
                        .excel-table th:first-child { background-color: #e6e6e6; border-right: 2px solid #000; position: sticky; left: 0; z-index: 3; }
                        .excel-table tr:nth-child(even) td { background-color: #f9f9f9; }
                        .excel-table tr:hover td { background-color: #e6f3ff; }
                        .excel-table .number { text-align: right; font-family: 'Consolas', monospace; color: #0066cc; }
                        .excel-table .date { text-align: center; color: #008000; }
                        .excel-table .boolean { text-align: center; font-weight: bold; color: #800080; }
                        .excel-container { overflow-x: auto; overflow-y: auto; max-height: 400px; max-width: 100%; border: 1px solid #ccc; }`}
                      </style>
                      <table className="excel-table">
                        <thead>
                          <tr>
                            <th></th>
                            {Array.from({ length: Math.max(...excelData.map((row: any[]) => row.length)) }, (_, c) => (
                              <th key={c}>{String.fromCharCode(65 + c)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {excelData.slice(0, visibleRows).map((row: any[], r: number) => (
                            <tr key={r}>
                              <th>{r + 1}</th>
                              {Array.from({ length: Math.max(...excelData.map((row: any[]) => row.length)) }, (_, c) => {
                                const cell = row[c] || '';
                                const cellType = typeof cell === 'number' ? 'number' : cell instanceof Date ? 'date' : typeof cell === 'boolean' ? 'boolean' : 'text';
                                return <td key={c} className={cellType}>{cell}</td>;
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {visibleRows < excelData.length && (
                        <div style={{ textAlign: 'center', padding: '10px' }}>
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setVisibleRows(prev => Math.min(prev + 50, excelData.length));
                            }}
                            style={{ color: '#007bff', textDecoration: 'none', fontSize: '14px' }}
                          >
                            Load More
                          </a>
                        </div>
                      )}
                    </div>
                  ) : previewContent ? (
                    <div dangerouslySetInnerHTML={{ __html: previewContent }} />
                  ) : null}
                </div>
            </div>

            {/* Signature Pad */}
            <div className="w-full md:w-80 p-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Your Signature</h4>
              <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{
                    width: 280,
                    height: 150,
                    className: 'signature-canvas'
                  }}
                  onEnd={handleEnd}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 mb-4">
                Draw your signature above
              </p>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button
                  onClick={handleSign}
                  disabled={isEmpty}
                  className="flex-1"
                >
                  Sign Document
                </Button>
              </div>

              <p className="text-xs text-gray-400 mt-4 text-center">
                By signing, you agree to the terms and conditions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Documents Page
export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments);
  const [showUploadZone, setShowUploadZone] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetic'>('recent');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'in-review' | 'signed'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterDropdown && !(event.target as Element).closest('.documents-filter-dropdown')) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterDropdown]);

  // Animate storage progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => setProgressWidth(65), 1250);
    return () => clearTimeout(timer);
  }, []);

  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;
    if (filterStatus !== 'all') {
      filtered = documents.filter(doc => doc.status === filterStatus);
    }
    const sorted = [...filtered];
    if (sortBy === 'recent') {
      sorted.sort((a, b) => new Date(b.files[0]?.lastModified || '').getTime() - new Date(a.files[0]?.lastModified || '').getTime());
    } else if (sortBy === 'alphabetic') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    return sorted;
  }, [documents, sortBy, filterStatus]);

  // Load persisted documents and files on mount
  useEffect(() => {
    const loadPersistedData = async () => {
      const stored = localStorage.getItem('documents');
      if (stored) {
        const persistedDocs: Document[] = JSON.parse(stored);
        // For each doc, load files and create blob URLs
        const loadedDocs = await Promise.all(
          persistedDocs.map(async (doc) => ({
            ...doc,
            files: await Promise.all(
              doc.files.map(async (file) => {
                if (file.fileId) {
                  const storedFile = await getFile(file.fileId);
                  if (storedFile) {
                    return { ...file, url: URL.createObjectURL(storedFile) };
                  }
                }
                return file;
              })
            )
          }))
        );
        setDocuments([...initialDocuments, ...loadedDocs]);
      }
    };
    loadPersistedData();
  }, []);

  // Persist documents to localStorage when changed
  useEffect(() => {
    // Only persist non-initial documents
    const toPersist = documents.filter(doc => !initialDocuments.find(init => init.id === doc.id));
    localStorage.setItem('documents', JSON.stringify(toPersist));
  }, [documents]);

  const handleFileUpload = async (files: FileList) => {
    const newFiles: FileInfo[] = await Promise.all(
      Array.from(files).map(async (file, index) => {
        const fileId = `file_${Date.now()}_${index}`;
        await storeFile(fileId, file);
        return {
          name: file.name,
          type: file.type.includes('pdf') ? 'PDF' : file.type.includes('spreadsheet') ? 'Spreadsheet' : 'Document',
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          lastModified: new Date().toISOString().split('T')[0],
          url: URL.createObjectURL(file),
          fileId: fileId,
          mime: file.type
        };
      })
    );

    const newDoc: Document = {
      id: Date.now(),
      title: newFiles.length > 1 ? `${newFiles[0].name.split('.')[0]} Package` : newFiles[0].name.split('.')[0],
      files: newFiles,
      shared: false,
      status: 'draft' as const
    };

    setDocuments([newDoc, ...documents]);
    setShowUploadZone(false);
  };

  const handleSignDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowSignatureModal(true);
  };

  const handleConfirmSignature = () => {
    if (selectedDocument) {
      setDocuments(documents.map(doc =>
        doc.id === selectedDocument.id
          ? { ...doc, status: 'signed' as const }
          : doc
      ));
    }
  };

  const handleDeleteDocument = async (id: number) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      // Revoke blob URLs
      doc.files.forEach(file => {
        if (file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url);
        }
      });
      // Delete associated files
      await Promise.all(
        doc.files.map(file => file.fileId ? deleteFile(file.fileId) : Promise.resolve())
      );
    }
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  return (
    <div className="documents-page page-main-content space-y-6 animate-fade-in p-4 md:p-6">
      {/* Header */}
      <div className="documents-header page-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="documents-title-section">
          <h1 className="documents-title text-2xl md:text-3xl font-bold text-gray-900">Document Chamber</h1>
          <p className="documents-subtitle text-gray-600 mt-1">Manage contracts, deals, and e-signatures</p>
        </div>
        
        <Button
          className="documents-upload-btn"
          leftIcon={<Upload size={18} />}
          onClick={() => setShowUploadZone(!showUploadZone)}
        >
          Upload New Document
        </Button>
      </div>

      {/* Upload Zone */}
      {showUploadZone && (
        <div className="documents-upload-zone animate-fade-in">
          <UploadZone onUpload={handleFileUpload} />
        </div>
      )}

      <div className="documents-content flex flex-col lg:flex-row gap-6 h-screen">
        {/* Storage Info Sidebar */}
        <Card className="documents-storage-card lg:w-80 flex-shrink-0">
          <CardHeader className="documents-storage-header">
            <h2 className="documents-storage-title text-lg font-semibold text-gray-900">Storage</h2>
          </CardHeader>
          <CardBody className="documents-storage-body space-y-4">
            <div className="documents-storage-usage space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Used</span>
                <span className="font-medium text-gray-900">12.5 GB</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div
                  className="progress-bar-length-01 h-2 bg-primary-600 rounded-full transition-all duration-5000 ease-out"
                  style={{ width: `${progressWidth}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available</span>
                <span className="font-medium text-gray-900">7.5 GB</span>
              </div>
            </div>
            
            <div className="documents-filters pt-4 border-t border-gray-200">
              <h3 className="documents-filters-title text-sm font-medium text-gray-900 mb-3">Quick Filters</h3>
              <div className="documents-filters-list space-y-1">
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${
                    filterStatus === 'all' ? 'bg-[#e7eaff] text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setFilterStatus('all')}
                >
                  <span>All Documents</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{documents.length}</span>
                </button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${
                    filterStatus === 'draft' ? 'bg-[#e7eaff] text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setFilterStatus('draft')}
                >
                  <span className="flex items-center"><Edit3 className="w-4 h-4 mr-2" />Drafts</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {documents.filter(d => d.status === 'draft').length}
                  </span>
                </button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${
                    filterStatus === 'in-review' ? 'bg-[#e7eaff] text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setFilterStatus('in-review')}
                >
                  <span className="flex items-center"><Clock className="w-4 h-4 mr-2" />In Review</span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                    {documents.filter(d => d.status === 'in-review').length}
                  </span>
                </button>
                <button
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg flex items-center justify-between ${
                    filterStatus === 'signed' ? 'bg-[#e7eaff] text-primary-700' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setFilterStatus('signed')}
                >
                  <span className="flex items-center"><Check className="w-4 h-4 mr-2" />Signed</span>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                    {documents.filter(d => d.status === 'signed').length}
                  </span>
                </button>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Document List */}
        <div className="documents-list-section flex-1 overflow-y-auto">
          <Card className="documents-all-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardHeader className="documents-list-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="documents-list-title text-lg font-semibold text-gray-900">All Documents</h2>
              <div className="documents-list-actions flex items-center gap-2">
                <Button
                  className="documents-sort-btn"
                  variant="outline"
                  size="sm"
                  onClick={() => setSortBy(prev => prev === 'recent' ? 'alphabetic' : 'recent')}
                >
                  Sort by {sortBy === 'recent' ? 'Recent' : 'Alphabetical'}
                </Button>
                <div className="relative">
                  <Button
                    className="documents-filter-btn"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    Filter
                  </Button>
                  {showFilterDropdown && (
                    <div className="documents-filter-dropdown absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-[12px] shadow-lg z-10">
                      <div className="py-1 px-1">
                        <button
                          className={`w-full rounded-[8px] text-left px-4 py-2 text-sm hover:bg-[#7a7a7a17] mb-1 ${
                            filterStatus === 'all' ? 'bg-[#e7eaff] text-primary-700' : 'text-gray-700'
                          }`}
                          onClick={() => {
                            setFilterStatus('all');
                            setShowFilterDropdown(false);
                          }}
                        >
                          All Documents
                        </button>
                        <button
                          className={`w-full rounded-[8px] text-left px-4 py-2 text-sm hover:bg-[#7a7a7a17] mb-1 ${
                            filterStatus === 'draft' ? 'bg-[#e7eaff] text-primary-700' : 'text-gray-700'
                          }`}
                          onClick={() => {
                            setFilterStatus('draft');
                            setShowFilterDropdown(false);
                          }}
                        >
                          Drafts
                        </button>
                        <button
                          className={`w-full rounded-[8px] text-left px-4 py-2 text-sm hover:bg-[#7a7a7a17] mb-1 ${
                            filterStatus === 'in-review' ? 'bg-[#e7eaff] text-primary-700' : 'text-gray-700'
                          }`}
                          onClick={() => {
                            setFilterStatus('in-review');
                            setShowFilterDropdown(false);
                          }}
                        >
                          In Review
                        </button>
                        <button
                          className={`w-full rounded-[8px] text-left px-4 py-2 text-sm hover:bg-[#7a7a7a17] ${
                            filterStatus === 'signed' ? 'bg-[#e7eaff] text-primary-700' : 'text-gray-700'
                          }`}
                          onClick={() => {
                            setFilterStatus('signed');
                            setShowFilterDropdown(false);
                          }}
                        >
                          Signed
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardBody className="documents-list-body" style={{ flex: 1, overflowY: 'auto' }}>
              <div className="documents-grid space-y-4">
                {filteredAndSortedDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="documents-item p-4 hover:bg-gray-50 rounded-xl transition-colors duration-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{doc.title}</h3>
                      <StatusBadge status={doc.status} />
                    </div>
                    <div className="space-y-2 mb-4">
                      {doc.files.map((file, index) => (
                        <div key={index} className="flex items-center p-2 bg-[#f3f2f6] rounded-lg">
                          <FileText className="w-4 h-4 mr-2 text-gray-600" />
                          <span className="text-sm text-gray-700 flex-1">{file.name}</span>
                          <span className="text-xs text-gray-500 mr-2">{file.size}</span>
                          <span className="text-xs text-gray-500">Modified {file.lastModified}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status !== 'signed' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSignDocument(doc)}
                          className="flex items-center"
                        >
                          <PenTool className="w-4 h-4 mr-1" />
                          Sign
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        aria-label="Download"
                      >
                        <Download size={18} className="text-gray-500" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        aria-label="Share"
                      >
                        <Share2 size={18} className="text-gray-500" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                        aria-label="Delete"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 size={18} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* E-Signature Modal */}
      <SignatureModal
        isOpen={showSignatureModal}
        onClose={() => setShowSignatureModal(false)}
        document={selectedDocument}
        onSign={handleConfirmSignature}
      />
    </div>
  );
};

export default DocumentsPage;
