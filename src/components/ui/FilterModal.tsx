import React from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';

interface FilterOption {
  id: string;
  label: string;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply?: () => void;
  title: string;
  options: FilterOption[];
  selectedOptions: string[];
  onToggle: (option: string) => void;
  type: 'checkbox' | 'badge';
}

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApply,
  title,
  options,
  selectedOptions,
  onToggle,
  type,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="filter-modal flex min-h-full items-center justify-center p-4">
        <div className="filter-modal-content relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="filter-modal-header flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="filter-modal-title text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="filter-modal-close p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="filter-modal-close-icon text-gray-500" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="filter-modal-content-body flex-1 overflow-y-auto p-4">
            {type === 'checkbox' ? (
              <div className="filter-modal-badges flex flex-wrap gap-2">
                {options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => onToggle(option.id)}
                    className={clsx(
                      'filter-modal-badge px-4 py-2 rounded-full text-sm font-medium transition-colors',
                      selectedOptions.includes(option.id)
                        ? 'filter-modal-badge-selected bg-[#405CFF] text-white'
                        : 'filter-modal-badge-default bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="filter-modal-badges flex flex-wrap gap-2">
                {options.map(option => (
                  <button
                    key={option.id}
                    onClick={() => onToggle(option.id)}
                    className={clsx(
                      'filter-modal-badge px-4 py-2 rounded-full text-sm font-medium transition-colors',
                      selectedOptions.includes(option.id)
                        ? 'filter-modal-badge-selected bg-[#405CFF] text-white'
                        : 'filter-modal-badge-default bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="filter-modal-footer p-4 border-t border-gray-200">
            <div className="filter-modal-footer-content flex items-center justify-between">
              <span className="filter-modal-selected-count text-sm text-gray-500">
                {selectedOptions.length} selected
              </span>
              <button
                onClick={onApply || onClose}
                className="filter-modal-apply-btn px-6 py-2 bg-[#405CFF] text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Filter Button Component
interface FilterButtonProps {
  label: string;
  count: number;
  selectedCount: number;
  onClick: () => void;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  label,
  count,
  selectedCount,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'filter-button flex items-center gap-2 px-4 py-2 border transition-colors',
        selectedCount > 0
          ? 'filter-button-active  bg-[#405CFF] text-white rounded-[8px]'
          : 'filter-button-default border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-[30px]'
      )}
    >
      <span className="filter-button-label">{label}</span>
      {selectedCount > 0 ? (
        <span className="filter-button-count px-2 py-0.5 bg-[white] text-black text-xs rounded-full">
          {selectedCount}
        </span>
      ) : (
        <span className="filter-button-total text-gray-400 text-xs">({count})</span>
      )}
    </button>
  );
};
