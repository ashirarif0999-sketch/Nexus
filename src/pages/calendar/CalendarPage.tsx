import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { Plus, X, Clock, Calendar as CalendarIcon, Video, ExternalLink, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

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
  generateMeetLink?: boolean;
  meetingLink?: string;
}

// Generate a mock Google Meet link
const generateMockMeetLink = (): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const segment = () => Array(3).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${segment()}-${segment()}-${segment()}`;
};

// Modal Component
interface AddAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (slot: AvailabilitySlot) => void;
  selectedDate?: string;
}

const AddAvailabilityModal: React.FC<AddAvailabilityModalProps> = ({
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
  const [generateMeetLink, setGenerateMeetLink] = useState(false);
  const [meetingLink, setMeetingLink] = useState('');

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [selectedDate]);

  // Auto-generate meeting link when toggle is on
  useEffect(() => {
    if (generateMeetLink && !meetingLink) {
      setMeetingLink(generateMockMeetLink());
    } else if (!generateMeetLink) {
      setMeetingLink('');
    }
  }, [generateMeetLink]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !startTime || !endTime) return;

    onSubmit({
      date,
      startTime,
      endTime,
      title,
      description,
      generateMeetLink,
      meetingLink: generateMeetLink ? meetingLink : undefined,
    });

    // Reset form
    setTitle('');
    setStartTime('09:00');
    setEndTime('10:00');
    setDescription('');
    setGenerateMeetLink(false);
    setMeetingLink('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <CalendarIcon className="w-5 h-5 mr-2 text-primary-600" />
              Schedule Meeting
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
                Meeting Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Investor Pitch Session"
                className="mt-2 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-semibold text-gray-700">
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-2 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-semibold text-gray-700">
                  Start Time
                </label>
                <input
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-2 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-semibold text-gray-700">
                  End Time
                </label>
                <input
                  type="time"
                  id="endTime"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="mt-2 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Add meeting notes..."
                className="mt-2 block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            {/* Google Meet Toggle */}
            <div 
              className={clsx(
                'flex items-center justify-between p-4 rounded-xl transition-colors',
                generateMeetLink ? 'bg-blue-50 border-2 border-primary-200' : 'bg-gray-50 border-2 border-gray-100'
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', generateMeetLink ? 'bg-primary-100' : 'bg-gray-200')}>
                  <Video className={clsx('w-5 h-5', generateMeetLink ? 'text-primary-600' : 'text-gray-500')} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Add Google Meet Link</p>
                  <p className="text-xs text-gray-500">Generate a virtual meeting room</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={generateMeetLink}
                  onChange={(e) => setGenerateMeetLink(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {/* Generated Meeting Link Display */}
            {meetingLink && (
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                <p className="text-xs font-semibold text-green-700 mb-1">Meeting Link Generated</p>
                <p className="text-sm text-green-800 font-mono truncate">{meetingLink}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 text-sm font-semibold text-white bg-primary-600 border border-transparent rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg shadow-primary-200 transition-all"
              >
                Confirm
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Main Calendar Page
export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
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
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleDateClick = (info: any) => {
    setSelectedDate(info.dateStr);
    setIsModalOpen(true);
  };

  const handleEventClick = (info: any) => {
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
  };

  const closeEventModal = () => {
    setSelectedEvent(null);
  };

  const handleJoinMeeting = (link: string) => {
    window.open(link, '_blank');
  };

  const handleAddAvailability = (slot: AvailabilitySlot) => {
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: slot.title,
      start: `${slot.date}T${slot.startTime}:00`,
      end: `${slot.date}T${slot.endTime}:00`,
      backgroundColor: slot.generateMeetLink ? '#2563EB' : '#10B981',
      borderColor: slot.generateMeetLink ? '#1D4ED8' : '#059669',
      extendedProps: {
        type: slot.generateMeetLink ? 'meeting' : 'availability',
        description: slot.description,
        meetingLink: slot.meetingLink,
      },
    };

    setEvents([...events, newEvent]);
  };

  // Responsive initial view
  const initialView = isMobile ? 'listWeek' : 'dayGridMonth';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Scheduling Hub</h1>
        <div className="w-10" /> {/* Spacer */}
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row">
        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Scheduling Hub</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your investor meetings and availability
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/video/meeting-1')}
                className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-green-600 border border-transparent rounded-xl hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 shadow-lg shadow-green-200 transition-all"
              >
                <Video className="w-4 h-4 mr-2" />
                Join Call
              </button>
              <button
                onClick={() => {
                  setSelectedDate(undefined);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-primary-600 border border-transparent rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-lg shadow-primary-200 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule Meeting
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center space-x-4 md:space-x-6 mb-6">
            <div className="flex items-center">
              <span className="w-3 h-3 bg-primary-600 rounded-full mr-2" />
              <span className="text-sm text-gray-600">Meetings</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-purple-600 rounded-full mr-2" />
              <span className="text-sm text-gray-600">Scheduled</span>
            </div>
            <div className="flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2" />
              <span className="text-sm text-gray-600">Availability</span>
            </div>
          </div>

          {/* Calendar Card - Nexus Styling */}
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={initialView}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: isMobile ? 'listWeek' : 'dayGridMonth,timeGridWeek,listWeek',
              }}
              events={events}
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
              // Nexus Blue Styling
              eventBackgroundColor="#2563EB"
              eventBorderColor="#1D4ED8"
              dayHeaderClassNames="text-gray-500 uppercase text-xs font-bold tracking-wider"
              dayCellClassNames="hover:bg-gray-50"
              buttonText={{
                today: 'Today',
                month: 'Month',
                week: 'Week',
                day: 'Day',
                list: 'List',
              }}
            />
          </div>

          {/* Upcoming Meetings Section */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-gray-500" />
              Upcoming Meetings
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {events
                .filter((event) => new Date(event.start) >= new Date())
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .slice(0, 3)
                .map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{event.title}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {new Date(event.start).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-gray-500">
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
                          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
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
                        className="w-full mt-2 inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Join Google Meet
                      </button>
                    )}
                  </div>
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
      {selectedEvent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity"
              onClick={closeEventModal}
            />
            <div className="inline-block align-bottom bg-white rounded-2xl px-6 pt-6 pb-6 text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">{selectedEvent.title}</h3>
                <button
                  onClick={closeEventModal}
                  className="text-gray-400 hover:text-gray-500 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
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
                  <p className="text-gray-500 text-sm">{selectedEvent.extendedProps.description}</p>
                )}
                {selectedEvent.extendedProps?.meetingLink && (
                  <button
                    onClick={() => handleJoinMeeting(selectedEvent.extendedProps!.meetingLink!)}
                    className="w-full mt-4 inline-flex items-center justify-center px-4 py-3 text-sm font-semibold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Join Google Meet
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
