import React, { useState, useEffect, useCallback, useMemo, memo, useRef, Suspense, lazy } from 'react';

// Lazy load FullCalendar for better performance
const FullCalendar = lazy(() => import('@fullcalendar/react'));
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { Plus, X, Clock, Calendar as CalendarIcon, Video, ExternalLink, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ROUTES } from '../../config/routes';

// Types
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  extendedProps?: {
    type: 'availability' | 'meeting' | 'scheduled';
    description?: string;
    meetingLink?: string;
  };
}

interface AvailabilitySlot {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  meetingLink?: string;
}



// Modal Component
interface AddAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (slot: AvailabilitySlot) => void;
  selectedDate?: string;
}

const AddAvailabilityModal: React.FC<AddAvailabilityModalProps> = memo(({
  isOpen,
  onClose,
  onSubmit,
  selectedDate,
}) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(selectedDate || '');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  // Modal positioning state
  const [modalTrigger, setModalTrigger] = useState<'calendar' | 'button'>('button');
  const [referencePoint, setReferencePoint] = useState<{ x: number; y: number } | null>(null);
  const [contextualContent, setContextualContent] = useState<any>(null);

  // Drag functionality
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [modalPosition, setModalPosition] = useState({ x: 0, y: 0 });
  const [modalHeight, setModalHeight] = useState<number | null>(null); // For squeezing behavior
  const [hasBeenDragged, setHasBeenDragged] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Calculate smart modal position based on cursor coordinates
  const calculateModalPosition = useCallback(() => {
    if (!referencePoint || modalTrigger !== 'calendar') return null;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const modalWidth = 448; // Approximate modal width
    const offset = 20; // Space between cursor and modal

    let modalX, modalY;

    // Position modal right of cursor if cursor is in left half, left if in right half
    if (referencePoint.x < viewportWidth / 2) {
      // Cursor in left half - place modal to the right
      modalX = referencePoint.x + offset;
    } else {
      // Cursor in right half - place modal to the left
      modalX = referencePoint.x - modalWidth - offset;
    }

    // Position modal below cursor, but ensure it fits in viewport
    modalY = referencePoint.y + offset;

    // Ensure modal stays within viewport bounds horizontally
    modalX = Math.max(10, Math.min(modalX, viewportWidth - modalWidth - 10));

    // For vertical positioning, allow the modal to be squeezed at the bottom
    // This will make the modal resize to fit available space
    modalY = Math.max(10, modalY);

    return { x: modalX, y: modalY };
  }, [referencePoint, modalTrigger]);

  // Get the calculated position for calendar-triggered modals
  const smartPosition = useMemo(() => calculateModalPosition(), [calculateModalPosition]);





  // Check if device is mobile (< 480px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 480);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate contextual content based on trigger and selected date
  const generateContextualContent = useCallback((trigger: 'calendar' | 'button', date?: string) => {
    if (trigger === 'button') {
      return {
        title: "Schedule New Meeting",
        subtitle: "Create a new calendar event",
        tips: [
          "Block time for deep work to maximize productivity",
          "Use time blocking to batch similar tasks together",
          "Schedule meetings during your peak energy hours",
          "Keep meetings focused and time-boxed"
        ],
        suggestions: [
          "Consider time-blocking your day for better focus",
          "Review your calendar weekly to optimize scheduling",
          "Use buffer time between meetings for transitions"
        ]
      };
    }

    if (trigger === 'calendar' && date) {
      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      const isToday = selectedDate.toDateString() === new Date().toDateString();
      const isTomorrow = selectedDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

      let dayContext = "";
      let productivityTips = [];

      if (isToday) {
        dayContext = "Today";
        productivityTips = [
          "Focus on high-priority tasks first",
          "Use the Pomodoro technique for focused work",
          "Review your progress at the end of the day",
          "Take regular breaks to maintain mental clarity"
        ];
      } else if (isTomorrow) {
        dayContext = "Tomorrow";
        productivityTips = [
          "Prepare your task list the night before",
          "Identify your top 3 priorities for tomorrow",
          "Schedule your most important work for peak energy times",
          "Consider your energy levels throughout the day"
        ];
      } else if (dayOfWeek === 'Monday') {
        dayContext = `Monday (${selectedDate.toLocaleDateString()})`;
        productivityTips = [
          "Start the week strong with your most important tasks",
          "Plan your week ahead during Monday mornings",
          "Set clear goals for the week",
          "Use Monday momentum to build productivity habits"
        ];
      } else if (dayOfWeek === 'Friday') {
        dayContext = `Friday (${selectedDate.toLocaleDateString()})`;
        productivityTips = [
          "Review your weekly accomplishments",
          "Complete any loose ends before the weekend",
          "Plan for next week while energy is still high",
          "Use Friday momentum to finish strong"
        ];
      } else {
        dayContext = `${dayOfWeek} (${selectedDate.toLocaleDateString()})`;
        productivityTips = [
          "Focus on deep work during your peak hours",
          "Batch similar tasks together for efficiency",
          "Schedule creative work when you're most alert",
          "Track your time to optimize your schedule"
        ];
      }

      return {
        title: `Schedule for ${dayContext}`,
        subtitle: `Plan your day effectively`,
        selectedDate: date,
        dayOfWeek,
        tips: productivityTips,
        suggestions: [
          "Consider your natural energy patterns when scheduling",
          "Block time for both focused work and collaboration",
          "Include buffer time between meetings",
          "Regular breaks improve productivity and focus"
        ]
      };
    }

    return null;
  }, []);

  // Reset modal position when closed or mobile state changes
  useEffect(() => {
    if (!isOpen || isMobile) {
      setModalPosition({ x: 0, y: 0 });
      setModalHeight(null); // Reset squeezed height
      setIsDragging(false);
      setHasBeenDragged(false);
      setModalTrigger('button');
      setReferencePoint(null);
      setContextualContent(null);
    }
  }, [isOpen, isMobile]);

  // Ensure modal actions stay within viewport and manage height expansion
  useEffect(() => {
    if (hasBeenDragged && !isDragging) {
      const viewportHeight = window.innerHeight;
      const currentModalHeight = modalHeight || 600; // Default height when null
      const naturalHeight = 600; // Natural modal height
      const modalBottom = modalPosition.y + currentModalHeight;

      // If actions would be below viewport, adjust position upward
      if (modalBottom > viewportHeight - 20) {
        const newY = viewportHeight - currentModalHeight - 20;
        setModalPosition(prev => ({ ...prev, y: Math.max(20, newY) }));
      }

      // If modal has been squeezed but now has enough space, expand it back
      const availableSpace = viewportHeight - modalPosition.y - 40;
      if (modalHeight && modalHeight < naturalHeight && availableSpace >= naturalHeight) {
        setModalHeight(null); // Reset to natural height
      }
    }
  }, [modalHeight, hasBeenDragged, isDragging, modalPosition.y]);

  // Expand modal height when dragged to a position with more space
  useEffect(() => {
    if (hasBeenDragged && !isDragging && modalHeight) {
      const viewportHeight = window.innerHeight;
      const naturalHeight = 600;
      const availableSpace = viewportHeight - modalPosition.y - 40;

      // If there's enough space and modal is squeezed, expand it
      if (availableSpace >= naturalHeight && modalHeight < naturalHeight) {
        setModalHeight(null);
      }
    }
  }, [modalPosition.y, hasBeenDragged, isDragging, modalHeight]);

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  // Drag handlers (disabled on mobile < 480px)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!modalRef.current || isMobile) return;

    e.preventDefault();
    setIsDragging(true);

    // Get the modal's current position relative to viewport
    const rect = modalRef.current.getBoundingClientRect();

    // Calculate offset from mouse to modal's top-left corner
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    // Set initial drag position
    setModalPosition({
      x: rect.left,
      y: rect.top,
    });
  }, [isMobile]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !modalRef.current) return;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Get modal dimensions
    const modalWidth = modalRef.current.offsetWidth;
    const naturalModalHeight = modalRef.current.scrollHeight || 600; // Natural height of content

    // Calculate new position
    let newX = e.clientX - dragOffset.x;
    let newY = e.clientY - dragOffset.y;

    // Constrain horizontally
    const margin = 20;
    newX = Math.max(margin, Math.min(newX, viewportWidth - modalWidth - margin));

    // Calculate available space for vertical positioning
    const availableHeight = viewportHeight - newY - margin;
    const minModalHeight = 300; // Minimum height to accommodate form actions (was 200)

    // If there's not enough space, squeeze the modal height
    if (availableHeight < naturalModalHeight && newY > margin) {
      const squeezedHeight = Math.max(minModalHeight, availableHeight); // Ensure minimum height for actions
      setModalHeight(squeezedHeight);
      newY = viewportHeight - squeezedHeight - margin; // Position at bottom
    } else {
      // Reset to natural height when there's enough space
      setModalHeight(null);
      newY = Math.max(margin, newY);
    }

    setModalPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setHasBeenDragged(true);

    // When drag ends, check if modal needs repositioning to keep actions visible
    // Keep the squeezed height instead of resetting it
    const viewportHeight = window.innerHeight;
    const currentModalHeight = modalHeight || 600; // Use squeezed height if available
    const modalBottom = modalPosition.y + currentModalHeight;

    // If actions would be below viewport, adjust position
    if (modalBottom > viewportHeight - 20) {
      const newY = viewportHeight - currentModalHeight - 20;
      setModalPosition(prev => ({ ...prev, y: Math.max(20, newY) }));
    }

    // Keep the squeezed height - don't reset it
    // The height will only be reset when modal is closed or repositioned
  }, [modalPosition, modalHeight]);

  // Add/remove global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !startTime || !endTime) return;

    onSubmit({
      date,
      startTime,
      endTime,
      title,
      description,
      meetingLink: meetingLink.trim() || undefined,
    });

    // Reset form
    setTitle('');
    setStartTime('09:00');
    setEndTime('10:00');
    setDescription('');
    setMeetingLink('');
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0 }}
          className="schedule-meeting-modal modal-overlay fixed inset-0 z-50 overflow-y-auto"
        >
          <div
            className={`schedule-meeting-container modal-container ${modalTrigger === 'calendar' ? 'fixed' : `fixed inset-0 ${isMobile ? 'flex items-start justify-center px-2 pt-2 pb-2' : 'flex items-center justify-center px-4 pt-4 pb-20'}`}`}
          >
            {/* Modal panel */}
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                height: modalHeight || 'auto'
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`schedule-meeting-panel modal-panel bg-white rounded-2xl text-left shadow-2xl ${isMobile ? 'px-4 pt-4 pb-4 mx-2' : 'px-6 pt-6 pb-6'}`}
              style={{
                zIndex: 1000,
                maxWidth: isMobile ? 'none' : '28rem',
                width: isMobile ? 'calc(100vw - 1rem)' : '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative', // For absolute positioning of actions
                // Use smart positioning for calendar-triggered modals
                ...(modalTrigger === 'calendar' && smartPosition && !isDragging && !hasBeenDragged ? {
                  position: 'fixed',
                  left: `${smartPosition.x}px`,
                  top: `${Math.min(smartPosition.y, window.innerHeight - 600)}px`, // Ensure actions stay in viewport
                } : {}),
                // Override with drag positioning if actively dragged
                ...((isDragging || hasBeenDragged) && !isMobile ? {
                  position: 'fixed',
                  left: `${modalPosition.x}px`,
                  top: `${modalPosition.y}px`,
                } : {}),
                cursor: isDragging && !isMobile ? 'grabbing' : hasBeenDragged && !isMobile ? 'grab' : 'default',
              }}>
          {/* Header - fixed at top */}
          <div
            className={`schedule-meeting-header modal-header flex items-center justify-between ${isMobile ? 'px-0 pt-0 pb-4' : 'px-0 pt-0 pb-6'} ${isMobile ? '' : 'cursor-grab active:cursor-grabbing'}`}
            onMouseDown={handleMouseDown}
          >
            <div>
              <h3 className="modal-title text-xl font-semibold text-gray-900 flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2 text-primary-600" />
                {contextualContent?.title || "Schedule Meeting"}
              </h3>
              {contextualContent?.subtitle && (
                <p className="modal-subtitle text-sm text-gray-600 mt-1">{contextualContent.subtitle}</p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent drag when clicking close button
                onClose();
              }}
              className="modal-close-button text-gray-400 hover:text-gray-500 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="modal-content flex-1 overflow-y-auto" style={{ paddingBottom: '5rem' }}>
            {/* Contextual Content Section */}
            {contextualContent && modalTrigger === 'calendar' && (
              <div className="contextual-content bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-6 border border-blue-100">
                <div className="contextual-content-layout flex items-start space-x-3">
                  <div className="contextual-content-icon-container flex-shrink-0">
                    <div className="contextual-content-icon w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="contextual-content-text flex-1">
                    <h4 className="contextual-content-title text-sm font-semibold text-blue-900 mb-2">
                      Productivity Tips for {contextualContent.dayOfWeek}
                    </h4>
                    <ul className="contextual-content-tips space-y-1">
                      {contextualContent.tips.slice(0, 3).map((tip: string, index: number) => (
                        <li key={index} className="contextual-content-tip-item text-xs text-blue-800 flex items-start">
                          <span className="contextual-content-tip-bullet mr-2">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {contextualContent && modalTrigger === 'button' && (
              <div className="contextual-content bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-100">
                <div className="contextual-content-layout flex items-start space-x-3">
                  <div className="contextual-content-icon-container flex-shrink-0">
                    <div className="contextual-content-icon w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <Video className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="contextual-content-text flex-1">
                    <h4 className="contextual-content-title text-sm font-semibold text-green-900 mb-2">
                      Scheduling Best Practices
                    </h4>
                    <ul className="contextual-content-tips space-y-1">
                      {contextualContent.tips.slice(0, 3).map((tip: string, index: number) => (
                        <li key={index} className="contextual-content-tip-item text-xs text-green-800 flex items-start">
                          <span className="contextual-content-tip-bullet mr-2">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="schedule-meeting-form modal-form space-y-5">
            <div className="form-field meeting-title-field">
              <label htmlFor="title" className="form-label block text-sm font-semibold text-gray-700">
                Meeting Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Investor Pitch Session"
                className="form-input mt-2 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              />
            </div>

            <div className="form-field meeting-date-field">
              <label htmlFor="date" className="form-label block text-sm font-semibold text-gray-700">
                Date
              </label>
               <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input mt-2 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white/80 backdrop-blur-sm hover:border-gray-300"
                required
              />
            </div>

            <div className="time-fields-grid grid grid-cols-2 gap-4">
              <div className="form-field meeting-start-time-field">
                <label htmlFor="startTime" className="form-label block text-sm font-semibold text-gray-700">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="form-input mt-2 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
              <div className="form-field meeting-end-time-field">
                <label htmlFor="endTime" className="form-label block text-sm font-semibold text-gray-700">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="form-input mt-2 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div className="form-field meeting-description-field">
              <label htmlFor="description" className="form-label block text-sm font-semibold text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Add meeting notes..."
                className="form-input mt-2 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div className="form-field meeting-link-field">
              <label htmlFor="meetingLink" className="form-label block text-sm font-semibold text-gray-700">
                Google Meet Link (Optional)
              </label>
              <input
                type="url"
                id="meetingLink"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij"
                className="form-input mt-2 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            {/* Meeting Link Preview */}
            {meetingLink && (
              <div className="meeting-link-display p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <p className="meeting-link-label text-xs font-semibold text-blue-700 mb-1">Google Meet Link</p>
                <p className="meeting-link-url text-sm text-blue-800 font-mono truncate">{meetingLink}</p>
              </div>
            )}
          </form>
          </div>

          {/* Form Actions - Fixed at bottom of modal */}
          <div className="form-actions absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4" >
            <div className="form-actions-buttons flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="cancel-button flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // Create a synthetic event for form submission
                  const syntheticEvent = {
                    preventDefault: () => { },
                    target: document.createElement('form')
                  } as unknown as React.FormEvent<HTMLFormElement>;
                  handleSubmit(syntheticEvent);
                }}
                className="submit-button flex-1 px-4 py-3 text-sm font-semibold text-white bg-primary-600 border border-transparent rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg shadow-primary-200"
              >
                Confirm
              </button>
            </div>
          </div>
          </motion.div>
       </div>
      </motion.div>
      )}
    </AnimatePresence>
  );
});

// Main Calendar Page
export const CalendarPage: React.FC = memo(() => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Debounced resize handler to prevent excessive re-renders
    let timeoutId: number;
    const debouncedCheckMobile = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(checkMobile, 100);
    };

    window.addEventListener('resize', debouncedCheckMobile);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedCheckMobile);
    };
  }, []);

  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Investor Meeting',
      start: new Date().toISOString().split('T')[0] + 'T10:00:00',
      end: new Date().toISOString().split('T')[0] + 'T11:00:00',
      backgroundColor: '#2563EB',
      borderColor: '#1D4ED8',
      extendedProps: {
        type: 'meeting',
        description: 'Discussion with potential investors',
        meetingLink: 'https://meet.google.com/abc-defg-hij',
      },
    },
    {
      id: '2',
      title: 'Pitch Session',
      start: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T14:00:00',
      end: new Date(Date.now() + 86400000).toISOString().split('T')[0] + 'T15:30:00',
      backgroundColor: '#7C3AED',
      borderColor: '#6D28D9',
      extendedProps: {
        type: 'meeting',
        description: 'Startup pitch with investors',
        meetingLink: 'https://meet.google.com/xyz-uvwx-yz',
      },
    },
    {
      id: '3',
      title: 'Available',
      start: new Date(Date.now() + 172800000).toISOString().split('T')[0] + 'T09:00:00',
      end: new Date(Date.now() + 172800000).toISOString().split('T')[0] + 'T12:00:00',
      backgroundColor: '#10B981',
      borderColor: '#059669',
      extendedProps: {
        type: 'availability',
        description: 'Open for meetings',
      },
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [modalTrigger, setModalTrigger] = useState<'calendar' | 'button'>('button');
  const [referencePoint, setReferencePoint] = useState<{ x: number; y: number } | null>(null);
const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [contextualContent, setContextualContent] = useState<any>(null);

  // Generate contextual content based on trigger and selected date
  const generateContextualContent = useCallback((trigger: 'calendar' | 'button', date?: string) => {
    if (trigger === 'button') {
      return {
        title: "Schedule New Meeting",
        subtitle: "Create a new calendar event",
        tips: [
          "Block time for deep work to maximize productivity",
          "Use time blocking to batch similar tasks together",
          "Schedule meetings during your peak energy hours",
          "Keep meetings focused and time-boxed"
        ],
        suggestions: [
          "Consider time-blocking your day for better focus",
          "Review your calendar weekly to optimize scheduling",
          "Use buffer time between meetings for transitions"
        ]
      };
    }

    if (trigger === 'calendar' && date) {
      const selectedDate = new Date(date);
      const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
      const isToday = selectedDate.toDateString() === new Date().toDateString();
      const isTomorrow = selectedDate.toDateString() === new Date(Date.now() + 86400000).toDateString();

      let dayContext = "";
      let productivityTips = [];

      if (isToday) {
        dayContext = "Today";
        productivityTips = [
          "Focus on high-priority tasks first",
          "Use the Pomodoro technique for focused work",
          "Review your progress at the end of the day",
          "Take regular breaks to maintain mental clarity"
        ];
      } else if (isTomorrow) {
        dayContext = "Tomorrow";
        productivityTips = [
          "Prepare your task list the night before",
          "Identify your top 3 priorities for tomorrow",
          "Schedule your most important work for peak energy times",
          "consider your energy levels throughout the day"
        ];
      } else if (dayOfWeek === 'Monday') {
        dayContext = `Monday (${selectedDate.toLocaleDateString()})`;
        productivityTips = [
          "Start the week strong with your most important tasks",
          "Plan your week ahead during Monday mornings",
          "Set clear goals for the week",
          "Use Monday momentum to build productivity habits"
        ];
      } else if (dayOfWeek === 'Friday') {
        dayContext = `Friday (${selectedDate.toLocaleDateString()})`;
        productivityTips = [
          "Review your weekly accomplishments",
          "Complete any loose ends before the weekend",
          "Plan for next week while energy is still high",
          "Use Friday momentum to finish strong"
        ];
      } else {
        dayContext = `${dayOfWeek} (${selectedDate.toLocaleDateString()})`;
        productivityTips = [
          "Focus on deep work during your peak hours",
          "Batch similar tasks together for efficiency",
          "Schedule creative work when you're most alert",
          "Track your time to optimize your schedule"
        ];
      }

      return {
        title: `Schedule for ${dayContext}`,
        subtitle: `Plan your day effectively`,
        selectedDate: date,
        dayOfWeek,
        tips: productivityTips,
        suggestions: [
          "Consider your natural energy patterns when scheduling",
          "Block time for both focused work and collaboration",
          "Include buffer time between meetings",
          "Regular breaks improve productivity and focus"
        ]
      };
    }

    return null;
  }, []);

  const handleDateClick = useCallback((info: any) => {
    const selectedDateStr = info.dateStr;
    setSelectedDate(selectedDateStr);
    setModalTrigger('calendar');
    // Store cursor position for smart positioning
    setReferencePoint({ x: info.jsEvent.clientX, y: info.jsEvent.clientY });
    // Generate contextual content for the selected date
    const content = generateContextualContent('calendar', selectedDateStr);
    setContextualContent(content);
    setIsModalOpen(true);
  }, [generateContextualContent]);

  const handleEventClick = useCallback((info: any) => {
    const event = info.event;
    const eventData: CalendarEvent = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      extendedProps: event.extendedProps,
    };
    setSelectedEvent(eventData);
  }, []);

  const closeEventModal = useCallback(() => {
    setSelectedEvent(null);
  }, []);

  const handleJoinMeeting = useCallback((link: string) => {
    window.open(link, '_blank');
  }, []);

  const handleAddAvailability = useCallback((slot: AvailabilitySlot) => {
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: slot.title,
      start: `${slot.date}T${slot.startTime}:00`,
      end: `${slot.date}T${slot.endTime}:00`,
      backgroundColor: slot.meetingLink ? '#2563EB' : '#10B981',
      borderColor: slot.meetingLink ? '#1D4ED8' : '#059669',
      extendedProps: {
        type: slot.meetingLink ? 'meeting' : 'availability',
        description: slot.description,
        meetingLink: slot.meetingLink,
      },
    };

    setEvents(prevEvents => [...prevEvents, newEvent]);
  }, []);

  // Responsive initial view
  const initialView = useMemo(() => isMobile ? 'listWeek' : 'dayGridMonth', [isMobile]);

  // Memoize events to prevent unnecessary re-renders
  const memoizedEvents = useMemo(() => events, [events]);

  return (
    <div className="calendar-page page-main-content min-h-screen bg-gray-50">
      {/* Mobile Header */}
      

      {/* Main Content */}
      <div className="calendar-content flex flex-col md:flex-row">
        {/* Page Content */}
        <main className="calendar-main page-content flex-1 p-0">
          {/* Header - Glassmorphism Effect */}
          <div className="calendar-header page-header bg-white/80 backdrop-blur-md sticky top-0 z-10 -mx-4  px-4 md:px-8 py-4 mb-6 border-b border-gray-200/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="calendar-title-section">
              <h1 className="calendar-title text-2xl md:text-3xl font-bold text-gray-900">Scheduling Hub</h1>
              <p className="calendar-subtitle mt-1 text-sm text-gray-500">
                Manage your investor meetings and availability
              </p>
            </div>
            <div className="calendar-actions flex items-center justify-between gap-2 whitespace-nowrap">

              <button
                onClick={() => navigate(ROUTES.VIDEO.ROOM('meeting-1'))}
                className="join-call-button inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-green-600 border border-transparent rounded-[8px] hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg shadow-green-200   transform"
              >
                <Video className="w-4 h-4 mr-2" />
                Join Call
              </button>
              <button
                onClick={() => {
                  setSelectedDate(undefined);
                  setModalTrigger('button');
                  setReferencePoint(null);
                  const content = generateContextualContent('button');
                  setContextualContent(content);
                  setIsModalOpen(true);
                }}
                className="schedule-meeting-button inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 border border-transparent rounded-[8px] hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg shadow-primary-200 transform"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </button>

            </div>
          </div>

          {/* Legend */}
          <div className="calendar-legend flex flex-wrap items-center space-x-4 md:space-x-6 mb-6">
            <div className="legend-item legend-item-meetings flex items-center">
              <span className="legend-color legend-color-meetings w-3 h-3 bg-primary-600 rounded-full mr-2" />
              <span className="legend-label legend-label-meetings text-sm text-gray-600">Meetings</span>
            </div>
            <div className="legend-item legend-item-scheduled flex items-center">
              <span className="legend-color legend-color-scheduled w-3 h-3 bg-purple-600 rounded-full mr-2" />
              <span className="legend-label legend-label-scheduled text-sm text-gray-600">Scheduled</span>
            </div>
            <div className="legend-item legend-item-availability flex items-center">
              <span className="legend-color legend-color-availability w-3 h-3 bg-green-500 rounded-full mr-2" />
              <span className="legend-label legend-label-availability text-sm text-gray-600">Availability</span>
            </div>
          </div>

          {/* Calendar Card - Premium Nexus Styling */}
          <div className="calendar-card bg-white/95 backdrop-blur-sm p-4 md:p-6 rounded-3xl shadow-lg border border-gray-200/60 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <Suspense fallback={<div className="calendar-loading flex items-center justify-center h-96"><div className="calendar-spinner animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>}>
              <FullCalendar
               plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
               initialView={initialView}
               headerToolbar={{
                 left: 'prev,next today',
                 center: 'title',
                 right: isMobile ? 'listWeek' : 'dayGridMonth,timeGridWeek,listWeek',
               }}
                events={memoizedEvents}
               dateClick={handleDateClick}
               eventClick={handleEventClick}
               height="auto"
               dayMaxEvents={isMobile ? 999 : 3}
               eventDisplay="block"
               eventTimeFormat={{
                 hour: '2-digit',
                 minute: '2-digit',
                 meridiem: 'short',
               }}
               slotMinTime="06:00:00"
               slotMaxTime="22:00:00"
               allDaySlot={false}
               nowIndicator={true}
               selectable={true}
               selectMirror={true}
               editable={true}
               // Premium Nexus Styling
               eventBackgroundColor="#2563EB"
               eventBorderColor="#1D4ED8"
               eventClassNames="rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
               dayHeaderClassNames="text-gray-600 uppercase text-xs font-bold tracking-wider py-3 bg-gray-50/50"
               dayCellClassNames="hover:bg-blue-50/30 transition-colors duration-200"
               buttonText={{
                 today: 'Today',
                 month: 'Month',
                 week: 'Week',
                 day: 'Day',
                 list: 'List',
               }}
              />
            </Suspense>
          </div>

          {/* Upcoming Meetings Section */}
          <div className="upcoming-meetings-section mt-8">
            <h2 className="upcoming-meetings-title text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gray-500" />
              Upcoming Meetings
            </h2>
            <div className="upcoming-meetings-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events
                .filter((event) => new Date(event.start) >= new Date())
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .slice(0, 3)
                .map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="meeting-card group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-xl hover:ring-2 hover:ring-primary-500 hover:border-transparent duration-300 cursor-pointer transform hover:-translate-y-1"
                  >
                    <div className="meeting-card-header flex items-start justify-between mb-3">
                      <div className="meeting-card-info">
                        <h3 className="meeting-title font-semibold text-gray-900">{event.title}</h3>
                        <p className="meeting-date mt-1 text-sm text-gray-500">
                          {new Date(event.start).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="meeting-time text-sm text-gray-500">
                          {new Date(event.start).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}{' '}
                          -{' '}
                          {new Date(event.end).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span
                        className={clsx(
                          'meeting-type-badge inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
                          event.extendedProps?.type === 'meeting'
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-green-100 text-green-700'
                        )}
                      >
                        {event.extendedProps?.type}
                      </span>
                    </div>
                    {event.extendedProps?.meetingLink && (
                      <button
                        onClick={() => handleJoinMeeting(event.extendedProps!.meetingLink!)}
                        className="join-meeting-button w-full mt-2 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Join Google Meet
                      </button>
                    )}
                  </motion.div>
                ))}
            </div>
          </div>
        </main>
      </div>

      {/* Add Availability Modal */}
      <AddAvailabilityModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddAvailability}
        selectedDate={selectedDate}
      />

      {/* Event Detail Modal */}
      <AnimatePresence mode="wait">
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0 }}
            className="event-detail-modal modal-overlay fixed inset-0 z-50 overflow-y-auto"
          >
            <div className="event-detail-container modal-container fixed inset-0 flex items-center justify-center px-4 pt-4 pb-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.0, type: "spring", stiffness: 300, damping: 30 }}
                className="event-detail-panel modal-panel bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl"
                style={{
                  zIndex: 1000,
                  maxWidth: '28rem',
                  width: '100%'
                }}>
              <div className="event-detail-header modal-header flex items-center justify-between mb-4">
                <h3 className="event-detail-title text-xl font-semibold text-gray-900">{selectedEvent.title}</h3>
                <button
                  onClick={closeEventModal}
                  className="modal-close-button text-gray-400 hover:text-gray-500 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="event-detail-content space-y-3">
                <div className="event-detail-time flex items-center text-gray-600">
                  <Clock className="w-5 h-5 mr-3" />
                  <span>
                    {new Date(selectedEvent.start).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })} •{' '}
                    {new Date(selectedEvent.start).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    -{' '}
                    {new Date(selectedEvent.end!).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {selectedEvent.extendedProps?.description && (
                  <p className="event-detail-description text-gray-500 text-sm">{selectedEvent.extendedProps.description}</p>
                )}
                {selectedEvent.extendedProps?.meetingLink && (
                  <button
                    onClick={() => handleJoinMeeting(selectedEvent.extendedProps!.meetingLink!)}
                    className="join-meeting-button w-full mt-4 inline-flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Join Google Meet
                  </button>
                 )}
               </div>
             </motion.div>
           </div>
          </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
});

CalendarPage.displayName = 'CalendarPage';

export default CalendarPage;
