import React from 'react';
import { Joyride } from 'react-joyride';

interface GuidedTourProps {
  run: boolean;
  onComplete: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ run }) => {

  const steps = [
    {
      target: '.sidebar-calendar',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">📅 New Calendar Feature</h3>
          <p className="text-gray-700">
            Schedule meetings, track important dates, and manage your entrepreneurial journey with our new calendar system.
            Never miss a funding deadline or investor meeting!
          </p>
        </div>
      ),
      placement: 'right' as const,
      disableBeacon: true,
    },
    {
      target: '.sidebar-video',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">📹 Video Calling</h3>
          <p className="text-gray-700">
            Connect face-to-face with investors and partners through our integrated video calling system.
            Build stronger relationships and close deals faster.
          </p>
        </div>
      ),
      placement: 'right' as const,
    },
    {
      target: '.sidebar-documents',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">📄 Document Chamber</h3>
          <p className="text-gray-700">
            Securely share and collaborate on important documents like pitch decks, financials, and legal agreements.
            Keep all your business documents organized in one place.
          </p>
        </div>
      ),
      placement: 'right' as const,
    },
    {
      target: '.sidebar-settings',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">💰 New Wallet & Payments</h3>
          <p className="text-gray-700">
            Manage your investments and funding with our new wallet system. Track transactions, deposit/withdraw funds,
            and securely transfer money to promising startups.
          </p>
        </div>
      ),
      placement: 'right' as const,
    },
    {
      target: '.sidebar-investors',
      content: (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">🎯 Enhanced Networking</h3>
          <p className="text-gray-700">
            Connect with the right investors or find promising startups. Our improved matching system helps you
            find the perfect partners for your entrepreneurial journey.
          </p>
        </div>
      ),
      placement: 'right' as const,
    },
  ];

  // Temporarily disabled due to "Open the dialog" button issue
  // TODO: Fix react-joyride configuration to remove unwanted buttons
  return null;
};