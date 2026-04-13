import React from 'react';
import { clsx } from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'link' | 'success' | 'warning' | 'error';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // Base styles
  const baseStyles = 'button-base inline-flex items-center justify-center font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

  // Size styles
  const sizeStyles = {
    xs: 'button-size-xs text-xs px-2 py-1',
    sm: 'button-size-sm text-sm px-3 py-1.5',
    md: 'button-size-md text-sm px-4 py-2',
    lg: 'button-size-lg text-base px-5 py-2.5',
    xl: 'button-size-xl text-lg px-6 py-3',
  };

  // Variant styles
  const variantStyles = {
    primary: 'button-variant-primary bg-[#405CFF] text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'button-variant-secondary bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
    accent: 'button-variant-accent bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400',
    outline: 'button-variant-outline border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
    ghost: 'button-variant-ghost bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-primary-500',
    link: 'button-variant-link bg-transparent text-primary-600 hover:text-primary-700 hover:underline focus:ring-primary-500 p-0',
    success: 'button-variant-success bg-success-500 text-white hover:bg-success-700 focus:ring-success-500',
    warning: 'button-variant-warning bg-warning-500 text-white hover:bg-warning-700 focus:ring-warning-500',
    error: 'button-variant-error bg-error-500 text-white hover:bg-error-700 focus:ring-error-500',
  };

  // Loading state
  const loadingClass = isLoading ? 'button-loading opacity-70 cursor-not-allowed' : '';

  // Width
  const widthClass = fullWidth ? 'button-full-width w-full' : '';

  // Disabled state
  const disabledClass = disabled ? 'button-disabled opacity-50 cursor-not-allowed pointer-events-none' : '';

  const combinedClassName = clsx(
    baseStyles,
    sizeStyles[size],
    variantStyles[variant],
    widthClass,
    loadingClass,
    disabledClass,
    className
  );

  return (
    <button
      className={combinedClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="button-spinner animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="button-spinner-circle opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="button-spinner-path opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}

      {!isLoading && leftIcon && <span className="button-left-icon mr-2">{leftIcon}</span>}
      <span className="button-content">{children}</span>
      {!isLoading && rightIcon && <span className="button-right-icon ml-2">{rightIcon}</span>}
    </button>
  );
};