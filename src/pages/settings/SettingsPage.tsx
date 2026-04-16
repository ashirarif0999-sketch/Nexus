import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Bell, Globe, Palette, CreditCard, DollarSign, ArrowUpCircle, ArrowDownCircle, History, Wallet, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { PasswordStrengthMeter } from '../../components/ui/PasswordStrengthMeter';
import { useAuth } from '../../context/AuthContext';
import { save2FAEnabledEmail, is2FAEnabledForEmail, remove2FAEnabledEmail } from '../../utils/2faStorage';
import toast from 'react-hot-toast';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'language' | 'appearance' | 'billing';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [newPassword, setNewPassword] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: 'San Francisco, CA'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load 2FA status and initialize form on mount
  useEffect(() => {
    if (user?.email) {
      const isEnabled = is2FAEnabledForEmail(user.email);
      setTwoFactorEnabled(isEnabled);
    }

    if (user) {
      setProfileForm({
        name: user.name,
        email: user.email,
        bio: user.bio || '',
        location: 'San Francisco, CA'
      });
    }
  }, [user]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
toast.error('Please select an image file');
        return;
      }

      // Validate file size (800KB = 800 * 1024 bytes)
      if (file.size > 800 * 1024) {
toast.error('File size must be less than 800KB');
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle photo upload
  const handlePhotoUpload = async () => {
    if (!selectedFile || !user) return;

    try {
      const base64 = await fileToBase64(selectedFile);
      await updateProfile(user.id, { avatarUrl: base64 });

      // Clean up
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

toast.success('Profile photo updated successfully!');
    } catch (error) {
      console.error('Error updating profile photo:', error);
toast.error('Failed to update profile photo. Please try again.');
    }
  };

  // Handle cancel
  const handleCancelUpload = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      await updateProfile(user.id, {
        name: profileForm.name,
        bio: profileForm.bio,
      });

    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    }
  };

  if (!user) return null;
  
  return (
    <div className="settings-page page-main-content space-y-6 animate-fade-in">
      <div className="settings-header page-header">
        <h1 className="settings-title text-2xl font-bold text-gray-900">Settings</h1>
        <p className="settings-subtitle text-gray-600">Manage your account preferences and settings</p>
      </div>
      
      <div className="settings-content grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings navigation */}
        <Card className="settings-nav-card lg:col-span-1">
          <CardBody className="settings-nav-body p-2">
            <nav className="settings-nav-list space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={clsx(
                  'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md',
                  activeTab === 'profile'
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <User size={18} className="mr-3" />
                Profile
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={clsx(
                  'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md',
                  activeTab === 'security'
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Lock size={18} className="mr-3" />
                Security
              </button>

              <button
                onClick={() => setActiveTab('notifications')}
                className={clsx(
                  'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md',
                  activeTab === 'notifications'
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Bell size={18} className="mr-3" />
                Notifications
              </button>

              <button
                onClick={() => setActiveTab('language')}
                className={clsx(
                  'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md',
                  activeTab === 'language'
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Globe size={18} className="mr-3" />
                Language
              </button>

              <button
                onClick={() => setActiveTab('appearance')}
                className={clsx(
                  'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md',
                  activeTab === 'appearance'
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Palette size={18} className="mr-3" />
                Appearance
              </button>

              <button
                onClick={() => setActiveTab('billing')}
                className={clsx(
                  'flex items-center w-full px-3 py-2 text-sm font-medium rounded-md',
                  activeTab === 'billing'
                    ? 'text-primary-700 bg-primary-50'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <CreditCard size={18} className="mr-3" />
                Billing
              </button>
            </nav>
          </CardBody>
        </Card>
        
        {/* Main settings content */}
        <div className="settings-main lg:col-span-3 space-y-6">
          {/* Profile Settings */}
          {activeTab === 'profile' && (
            <Card className="settings-profile-card">
              <CardHeader className="settings-profile-header">
                <h2 className="settings-profile-title text-lg font-medium text-gray-900">Profile Settings</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                 <div className="flex items-center gap-6">
                   <Avatar
                     src={previewUrl || user.avatarUrl}
                     alt={user.name}
                     size="xl"
                   />

                    <div>
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="choose-file-upload-btn flex items-center gap-2"
                        >
                          <svg className="svg-item-file-upload" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Choose File
                        </Button>
                        <Input
                          ref={fileInputRef}
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileSelect}
                        />
                      </div>
                     {selectedFile && (
                       <div className="mt-2 flex gap-2">
                         <Button size="sm" onClick={handlePhotoUpload}>
                           Upload
                         </Button>
                         <Button variant="outline" size="sm" onClick={handleCancelUpload}>
                           Cancel
                         </Button>
                       </div>
                     )}
                     <p className="mt-2 text-sm text-gray-500">
                       JPG, GIF or PNG. Max size of 800K
                     </p>
                   </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Input
                     label="Full Name"
                     value={profileForm.name}
                     onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                   />

                   <Input
                     label="Email"
                     type="email"
                     value={profileForm.email}
                     disabled
                   />

                   <Input
                     label="Role"
                     value={user.role}
                     disabled
                   />

                   <Input
                     label="Location"
                     value={profileForm.location}
                     onChange={(e) => setProfileForm(prev => ({ ...prev, location: e.target.value }))}
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">
                     Bio
                   </label>
                   <textarea
                     className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                     rows={4}
                     value={profileForm.bio}
                     onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                   ></textarea>
                 </div>

                 <div className="flex justify-end gap-3">
                   <Button variant="outline" onClick={() => setProfileForm({
                     name: user?.name || '',
                     email: user?.email || '',
                     bio: user?.bio || '',
                     location: 'San Francisco, CA'
                   })}>Cancel</Button>
                   <Button onClick={handleSaveProfile}>Save Changes</Button>
                 </div>
              </CardBody>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card className="settings-security-card">
              <CardHeader className="settings-security-header">
                <h2 className="settings-security-title text-lg font-medium text-gray-900">Security Settings</h2>
              </CardHeader>
              <CardBody className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        Add an extra layer of security to your account
                      </p>
                      <Badge variant={twoFactorEnabled ? "success" : "error"} className="mt-1">
                        {twoFactorEnabled ? "Enabled" : "Not Enabled"}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      {twoFactorEnabled ? (
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (user?.email) {
                              remove2FAEnabledEmail(user.email);
                              setTwoFactorEnabled(false);
                              alert('Two-Factor Authentication has been disabled!');
                            }
                          }}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Disable
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => setShow2FAModal(true)}
                        >
                          Enable
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                    />

                    <Input
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
  
                    <PasswordStrengthMeter password={newPassword} />
  
                    <Input
                      label="Confirm New Password"
                      type="password"
                    />

                    <div className="flex justify-end">
                      <Button>Update Password</Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Billing & Wallet */}
          {activeTab === 'billing' && (
            <>
              {/* Wallet Balance Card */}
              <Card className="settings-wallet-card">
                <CardBody className="settings-wallet-body p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Wallet Balance</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <DollarSign className="text-green-600" size={24} />
                        <span className="text-3xl font-bold text-green-600">$50,000.00</span>
                      </div>
                    </div>
                    <div className="flex gap-0">
                      <Button variant="outline" className="flex items-center gap-2">
                        <ArrowUpCircle size={18} />
                        Deposit
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2">
                        <ArrowDownCircle size={18} />
                        Withdraw
                      </Button>
                      <Button className="flex items-center gap-2">
                        <Wallet size={18} />
                        Transfer
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Transaction History */}
              <Card className="settings-transactions-card">
                <CardHeader className="settings-transactions-header">
                  <div className="settings-transactions-title flex items-center gap-2">
                    <History size={20} />
                    <h2 className="text-lg font-medium text-gray-900">Transaction History</h2>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sender/Receiver
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            2024-03-24
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            +$25,000.00
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Investment from John Smith
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="success">Completed</Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            2024-03-20
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                            -$5,000.00
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Transfer to TechCorp
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="success">Completed</Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            2024-03-18
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                            +$10,000.00
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Deposit from Bank Account
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="success">Completed</Badge>
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            2024-03-15
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 font-medium">
                            +$20,000.00
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Investment from Sarah Johnson
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="warning">Pending</Badge>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>
            </>
          )}

          {/* Placeholder content for other tabs */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Notification Settings</h2>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600">Notification settings will be implemented here.</p>
              </CardBody>
            </Card>
          )}

          {activeTab === 'language' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Language Settings</h2>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600">Language settings will be implemented here.</p>
              </CardBody>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Appearance Settings</h2>
              </CardHeader>
              <CardBody>
                <p className="text-gray-600">Appearance settings will be implemented here.</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50" onClick={() => setShow2FAModal(false)} />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Enable Two-Factor Authentication</h3>
                  <button
                    onClick={() => setShow2FAModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
                      <Lock className="h-6 w-6 text-primary-600" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Step 1: Install Authenticator App</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Download an authenticator app like Google Authenticator, Authy, or Microsoft Authenticator on your phone.
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">Your QR Code:</p>
                    <div className="bg-white p-4 rounded border-2 border-dashed border-gray-300 text-center">
                      <div className="w-32 h-32 bg-gray-200 mx-auto rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">QR Code Placeholder</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Scan this QR code with your authenticator app
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Step 2: Enter 6-digit code from your app
                    </label>
                    <Input
                      type="text"
                      placeholder="000000"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setShow2FAModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      // Save 2FA enabled email to localStorage
                      save2FAEnabledEmail(user.email);
                      console.log('2FA enabled for:', user.email);
                      // Update state
                      setTwoFactorEnabled(true);
                      setShow2FAModal(false);
                      setOtpCode('');
                      alert('Two-Factor Authentication has been enabled successfully!');
                    }}
                    disabled={otpCode.length !== 6}
                  >
                    Enable 2FA
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};