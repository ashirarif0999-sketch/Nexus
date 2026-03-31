import React, { useState, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Share2, X, Check, Clock, Edit3, PenTool } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import SignatureCanvas from 'react-signature-canvas';

// Types
interface Document {
  id: number;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  status: 'draft' | 'in-review' | 'signed';
}

// Initial documents with status
const initialDocuments: Document[] = [
  {
    id: 1,
    name: 'Investment Agreement.pdf',
    type: 'PDF',
    size: '2.4 MB',
    lastModified: '2024-02-15',
    shared: true,
    status: 'signed'
  },
  {
    id: 2,
    name: 'NDA Contract.pdf',
    type: 'PDF',
    size: '1.2 MB',
    lastModified: '2024-02-10',
    shared: true,
    status: 'in-review'
  },
  {
    id: 3,
    name: 'Terms of Investment.docx',
    type: 'Document',
    size: '3.2 MB',
    lastModified: '2024-02-05',
    shared: true,
    status: 'draft'
  },
  {
    id: 4,
    name: 'Due Diligence Checklist.pdf',
    type: 'PDF',
    size: '5.1 MB',
    lastModified: '2024-01-28',
    shared: false,
    status: 'draft'
  },
  {
    id: 5,
    name: 'Equity Term Sheet.pdf',
    type: 'PDF',
    size: '1.8 MB',
    lastModified: '2024-01-25',
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
      <div className="text-center">
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
    </div>
  );
};

// E-Signature Modal
interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  onSign: () => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, documentName, onSign }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

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
                <p className="text-sm text-gray-500">{documentName}</p>
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
              <div className="bg-white rounded-xl border border-gray-200 p-8 min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Document preview placeholder</p>
                  <p className="text-sm text-gray-400 mt-1">{documentName}</p>
                </div>
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

  const handleFileUpload = (files: FileList) => {
    // Add new documents
    const newDocs: Document[] = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      name: file.name,
      type: file.type.includes('pdf') ? 'PDF' : file.type.includes('spreadsheet') ? 'Spreadsheet' : 'Document',
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      lastModified: new Date().toISOString().split('T')[0],
      shared: false,
      status: 'draft' as const
    }));

    setDocuments([...newDocs, ...documents]);
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

  const handleDeleteDocument = (id: number) => {
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

      <div className="documents-content grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Storage Info Sidebar */}
        <Card className="documents-storage-card lg:col-span-1">
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
                <div className="h-2 bg-primary-600 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Available</span>
                <span className="font-medium text-gray-900">7.5 GB</span>
              </div>
            </div>
            
            <div className="documents-filters pt-4 border-t border-gray-200">
              <h3 className="documents-filters-title text-sm font-medium text-gray-900 mb-3">Quick Filters</h3>
              <div className="documents-filters-list space-y-1">
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                  <span>All Documents</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{documents.length}</span>
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                  <span className="flex items-center"><Edit3 className="w-4 h-4 mr-2" />Drafts</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                    {documents.filter(d => d.status === 'draft').length}
                  </span>
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between">
                  <span className="flex items-center"><Clock className="w-4 h-4 mr-2" />In Review</span>
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                    {documents.filter(d => d.status === 'in-review').length}
                  </span>
                </button>
                <button className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between">
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
        <div className="documents-list-section lg:col-span-3">
          <Card className="documents-all-card">
            <CardHeader className="documents-list-header flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="documents-list-title text-lg font-semibold text-gray-900">All Documents</h2>
              <div className="documents-list-actions flex items-center gap-2">
                <Button className="documents-sort-btn" variant="outline" size="sm">
                  Sort by Date
                </Button>
                <Button className="documents-filter-btn" variant="outline" size="sm">
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardBody className="documents-list-body">
              <div className="documents-grid space-y-2">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className="documents-item flex flex-col sm:flex-row sm:items-center p-4 hover:bg-gray-50 rounded-xl transition-colors duration-200 gap-4"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className={clsx(
                        'p-3 rounded-xl mr-4',
                        doc.status === 'signed' ? 'bg-green-100' :
                        doc.status === 'in-review' ? 'bg-yellow-100' : 'bg-gray-100'
                      )}>
                        <FileText size={24} className={clsx(
                          doc.status === 'signed' ? 'text-green-600' :
                          doc.status === 'in-review' ? 'text-yellow-600' : 'text-gray-600'
                        )} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {doc.name}
                          </h3>
                          <StatusBadge status={doc.status} />
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
                          <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">{doc.type}</span>
                          <span>{doc.size}</span>
                          <span>Modified {doc.lastModified}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:ml-4">
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
        documentName={selectedDocument?.name || ''}
        onSign={handleConfirmSignature}
      />
    </div>
  );
};

export default DocumentsPage;
