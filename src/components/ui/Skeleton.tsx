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

// Skeleton for chat user list items
export const ChatUserListSkeleton: React.FC = () => {
  return (
    <div className="space-y-1 px-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={16} />
            <Skeleton width="80%" height={12} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Skeleton for chat message bubble
export const ChatMessageSkeleton: React.FC<{ isCurrentUser?: boolean }> = ({ isCurrentUser = false }) => {
  return (
    <div className={clsx('flex w-full mb-6 px-4', isCurrentUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={clsx('flex-shrink-0', isCurrentUser ? 'ml-3' : 'mr-3')}>
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <div className={clsx('flex flex-col max-w-[75%]', isCurrentUser ? 'items-end' : 'items-start')}>
        <Skeleton variant="rectangular" width={512} height={64} className="rounded-2xl" />
        <div className="flex items-center gap-2 mt-1 px-1">
          <Skeleton width={40} height={10} />
        </div>
      </div>
    </div>
  );
};
