import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height,
}) => {
  const baseClasses = 'skeleton-base animate-pulse bg-gray-200';

  const variantClasses = {
    text: 'skeleton-variant-text rounded',
    circular: 'skeleton-variant-circular rounded-full',
    rectangular: 'skeleton-variant-rectangular rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1em' : '100%'),
  };

  return (
    <div
      className={clsx(baseClasses, variantClasses[variant], className)}
      style={style}
    />
  );
};

// Skeleton card that mimics the InvestorCard/EntrepreneurCard layout
export const SkeletonCard: React.FC = () => {
  return (
    <div className="skeleton-card bg-white rounded-lg shadow-md p-6 space-y-4">
      <div className="skeleton-card-header flex items-start space-x-4">
        <Skeleton variant="circular" width={64} height={64} />
        <div className="skeleton-card-header-content flex-1 space-y-2">
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={16} />
        </div>
      </div>
      <Skeleton width="100%" height={60} />
      <div className="skeleton-card-badges flex flex-wrap gap-2">
        <Skeleton width={60} height={24} />
        <Skeleton width={80} height={24} />
        <Skeleton width={70} height={24} />
      </div>
      <div className="skeleton-card-footer flex justify-between pt-2">
        <Skeleton width="45%" height={16} />
        <Skeleton width="45%" height={16} />
      </div>
    </div>
  );
};

// Skeleton for pagination
export const SkeletonPagination: React.FC = () => {
  return (
    <div className="skeleton-pagination flex justify-center items-center gap-2 py-4">
      <Skeleton variant="rectangular" width={40} height={40} className="skeleton-pagination-item rounded-md" />
      <Skeleton variant="rectangular" width={40} height={40} className="skeleton-pagination-item rounded-md" />
      <Skeleton variant="rectangular" width={40} height={40} className="skeleton-pagination-item rounded-md" />
      <Skeleton variant="rectangular" width={40} height={40} className="skeleton-pagination-item rounded-md" />
      <Skeleton variant="rectangular" width={40} height={40} className="skeleton-pagination-item rounded-md" />
    </div>
  );
};
