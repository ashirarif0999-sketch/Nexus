import React from 'react';
import { clsx } from 'clsx';

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const getStrength = (password: string): { level: number; label: string; color: string } => {
    if (!password) return { level: 0, label: '', color: 'bg-gray-200' };

    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;

    // Character variety
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { level: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { level: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (score <= 5) return { level: 3, label: 'Good', color: 'bg-blue-500' };
    return { level: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrength(password);

  return (
    <div className="password-strength-meter mt-2">
      <div className="password-strength-meter-header flex items-center justify-between mb-1">
        <span className={clsx(
          'password-strength-meter-value text-xs font-medium',
          strength.level === 1 && 'password-strength-weak text-red-600',
          strength.level === 2 && 'password-strength-fair text-yellow-600',
          strength.level === 3 && 'password-strength-good text-blue-600',
          strength.level === 4 && 'password-strength-strong text-green-600'
        )}>
          {strength.label}
        </span>
      </div>
      <div className="password-strength-meter-bar w-full bg-gray-200 rounded-full h-2">
        <div
          className={clsx('password-strength-meter-progress h-2 rounded-full transition-all duration-300', strength.color)}
          style={{ width: `${(strength.level / 4) * 100}%` }}
        />
      </div>
      <div className="password-strength-meter-hint mt-1 text-xs text-gray-500">
        Use at least 8 characters with uppercase, lowercase, numbers, and symbols
      </div>
    </div>
  );
};