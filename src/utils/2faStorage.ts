// localStorage helper for 2FA settings

const STORAGE_KEY = 'nexus_2fa_enabled_emails';

// Get all 2FA enabled emails from localStorage
export const getAll2FAEnabledEmails = (): string[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading 2FA emails from localStorage:', error);
    return [];
  }
};

// Save 2FA enabled email to localStorage
export const save2FAEnabledEmail = (email: string): void => {
  try {
    const emails = getAll2FAEnabledEmails();
    const lowerEmail = email.toLowerCase();
    
    if (!emails.includes(lowerEmail)) {
      emails.push(lowerEmail);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(emails));
      console.log('2FA enabled for:', lowerEmail, 'Total emails:', emails);
    }
  } catch (error) {
    console.error('Error saving 2FA email to localStorage:', error);
  }
};

// Check if an email has 2FA enabled
export const is2FAEnabledForEmail = (email: string): boolean => {
  try {
    const emails = getAll2FAEnabledEmails();
    return emails.includes(email.toLowerCase());
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return false;
  }
};

// Remove 2FA enabled email from localStorage
export const remove2FAEnabledEmail = (email: string): void => {
  try {
    const emails = getAll2FAEnabledEmails();
    const filtered = emails.filter(e => e !== email.toLowerCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing 2FA email from localStorage:', error);
  }
};