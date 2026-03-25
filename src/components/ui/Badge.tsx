import React from 'react';
import { clsx } from 'clsx';

export type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'gray';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = false,
  className = '',
  onClick,
}) => {
  const variantClasses = {
    primary: 'badge-variant-primary bg-primary-100 text-primary-800',
    secondary: 'badge-variant-secondary bg-secondary-100 text-secondary-800',
    accent: 'badge-variant-accent bg-accent-100 text-accent-800',
    success: 'badge-variant-success bg-success-50 text-success-700',
    warning: 'badge-variant-warning bg-warning-50 text-warning-700',
    error: 'badge-variant-error bg-error-50 text-error-700',
    gray: 'badge-variant-gray bg-gray-100 text-gray-800',
  };

  const sizeClasses = {
    sm: 'badge-size-sm text-xs px-2 py-0.5',
    md: 'badge-size-md text-sm px-2.5 py-0.5',
    lg: 'badge-size-lg text-base px-3 py-1',
  };

  const roundedClass = rounded ? 'rounded-full' : 'rounded';

  return (
    <span
      className={clsx(
        'badge-base inline-flex items-center font-medium',
        roundedClass,
        variantClasses[variant],
        sizeClasses[size],
        className,
        onClick && 'badge-clickable cursor-pointer hover:opacity-80'
      )}
      onClick={onClick}
    >
      {children}
    </span>
  );
};