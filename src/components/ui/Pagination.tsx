import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { clsx } from 'clsx';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,  // Reduced from 7 to 5 for better performance
  className = ''
}) => {
  // Don't render pagination if there's only 1 page or less
  if (totalPages <= 1) return null;

  const getVisiblePages = (): (number | 'ellipsis')[] => {
    if (totalPages <= 3) {
      // Show all pages if total is very small
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // For larger page counts, show minimal pagination: prev, current, next
    // This renders ONLY the current page number, not all pages
    return [currentPage];
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={clsx('flex justify-center items-center gap-1', className)}>
      {/* Previous button */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {/* Page numbers */}
      {visiblePages.map((page, index) => (
        page === 'ellipsis' ? (
          <div
            key={`ellipsis-${index}`}
            className="flex items-center justify-center w-10 h-10 text-gray-500"
          >
            <MoreHorizontal size={16} />
          </div>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={clsx(
              'w-10 h-10 rounded-md font-medium transition-colors',
              currentPage === page
                ? 'bg-primary-600 text-white'
                : 'border border-gray-300 hover:bg-gray-50 text-gray-700'
            )}
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? 'page' : undefined}
          >
            {page}
          </button>
        )
      ))}

      {/* Next button */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};