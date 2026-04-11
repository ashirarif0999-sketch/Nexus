import React, { useState } from 'react';
import { Video, Calendar, Clock, User, Plus, Search, MoreVertical, Phone, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes';

// Mock meetings data
const mockMeetings = [
  {
    id: '1',
    title: 'Investment Discussion - TechWave AI',
    host: 'Michael Rodriguez',
    participant: 'Sarah Johnson',
    date: '2024-03-20',
    time: '10:00 AM',
    duration: '45 min',
    status: 'completed',
    type: 'video'
  },
  {
    id: '2',
    title: 'Startup Pitch Review',
    host: 'Sarah Johnson',
    participant: 'Jennifer Lee',
    date: '2024-03-18',
    time: '2:00 PM',
    duration: '30 min',
    status: 'completed',
    type: 'video'
  },
  {
    id: '3',
    title: 'Follow-up Meeting - GreenLife Solutions',
    host: 'Michael Rodriguez',
    participant: 'David Chen',
    date: '2024-03-22',
    time: '11:00 AM',
    duration: '60 min',
    status: 'scheduled',
    type: 'video'
  },
  {
    id: '4',
    title: 'Portfolio Review',
    host: 'Robert Torres',
    participant: 'Maya Patel',
    date: '2024-03-25',
    time: '3:00 PM',
    duration: '45 min',
    status: 'scheduled',
    type: 'video'
  }
];

export const VideoMeetingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  const filteredMeetings = mockMeetings.filter(meeting => {
    const matchesSearch = appliedSearchTerm === '' ||
      meeting.title.toLowerCase().includes(appliedSearchTerm.toLowerCase()) ||
      meeting.participant.toLowerCase().includes(appliedSearchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || meeting.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleJoinMeeting = (meetingId: string) => {
    // Navigate to actual video room
    navigate(ROUTES.VIDEO.ROOM(meetingId));
  };

  const handleStartNewMeeting = () => {
    // Start a new meeting
    const newRoomId = `room-${Date.now()}`;
    navigate(ROUTES.VIDEO.ROOM(newRoomId));
  };

  return (
    <div className="video-meetings-page page-main-content p-6">
      {/* Header */}
      <div className="video-meetings-header page-header mb-8">
        <h1 className="page-title text-2xl font-bold text-gray-900">Video Meetings</h1>
        <p className="page-description text-gray-600 mt-1">Manage your video calls and meetings</p>
      </div>

      {/* Action Bar */}
      <div className="video-meetings-action-bar page-action-bar flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={handleStartNewMeeting}
          className="new-meeting-button flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          New Meeting
        </button>

        <div className="search-container relative flex-1 max-w-md">
          <Search className="search-icon absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAppliedSearchTerm(searchTerm);
              }
            }}
            className="search-input w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="filter-buttons flex gap-2">
          {(['all', 'scheduled', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`filter-button px-4 py-2 rounded-lg capitalize transition-colors ${
                filter === f
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Meetings List */}
      <div className="meetings-list page-content space-y-4">
        {filteredMeetings.length === 0 ? (
          <div className="no-meetings-empty-state text-center py-12">
            <Video className="empty-state-icon mx-auto h-12 w-12 text-gray-400" />
            <h3 className="empty-state-title mt-2 text-sm font-medium text-gray-900">No meetings found</h3>
            <p className="empty-state-description mt-1 text-sm text-gray-500">Get started by creating a new meeting</p>
            <button
              onClick={handleStartNewMeeting}
              className="empty-state-action mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              New Meeting
            </button>
          </div>
        ) : (
          filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="meeting-card bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="meeting-card-content flex items-center justify-between">
                <div className="meeting-info flex items-center gap-4">
                  <div className={`meeting-icon p-3 rounded-full ${
                    meeting.status === 'completed' ? 'bg-green-100' : 'bg-primary-100'
                  }`}>
                    <Video className={`h-6 w-6 ${
                      meeting.status === 'completed' ? 'text-green-600' : 'text-primary-600'
                    }`} />
                  </div>

                  <div className="meeting-details">
                    <h3 className="meeting-title font-medium text-gray-900">{meeting.title}</h3>
                    <div className="meeting-meta flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="meeting-participant flex items-center gap-1">
                        <User size={14} />
                        {meeting.participant}
                      </span>
                      <span className="meeting-date flex items-center gap-1">
                        <Calendar size={14} />
                        {meeting.date}
                      </span>
                      <span className="meeting-time flex items-center gap-1">
                        <Clock size={14} />
                        {meeting.time}
                      </span>
                      <span className="meeting-duration">{meeting.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="meeting-actions flex items-center gap-2">
                  <span className={`meeting-status-badge px-3 py-1 rounded-full text-xs font-medium ${
                    meeting.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {meeting.status === 'completed' ? 'Completed' : 'Scheduled'}
                  </span>

                  {meeting.status === 'scheduled' ? (
                    <button
                      onClick={() => handleJoinMeeting(meeting.id)}
                      className="join-meeting-button flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Phone size={16} />
                      Join
                    </button>
                  ) : (
                     <button
                       onClick={() => handleJoinMeeting(meeting.id)}
                       className="review-meeting-button flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                     >
                      <MessageSquare size={16} />
                      Review
                    </button>
                  )}

                   <button className="more-options-button p-2 text-gray-400 hover:text-gray-600">
                     <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleStartNewMeeting}
          className="quick-action-button p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all text-left"
        >
          <div className="action-content flex items-center gap-3">
            <div className="action-icon p-2 bg-primary-100 rounded-lg">
              <Video className="h-5 w-5 text-primary-600" />
            </div>
            <div className="action-text">
              <h3 className="font-medium text-gray-900">Start Instant Meeting</h3>
              <p className="text-sm text-gray-500">Start a new video call now</p>
            </div>
          </div>
        </button>

        <button className="quick-action-button p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all text-left">
          <div className="action-content flex items-center gap-3">
            <div className="action-icon p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div className="action-text">
              <h3 className="font-medium text-gray-900">Schedule Meeting</h3>
              <p className="text-sm text-gray-500">Plan a meeting for later</p>
            </div>
          </div>
        </button>

        <button className="quick-action-button p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all text-left">
          <div className="action-content flex items-center gap-3">
            <div className="action-icon p-2 bg-green-100 rounded-lg">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
            <div className="action-text">
              <h3 className="font-medium text-gray-900">Join Meeting</h3>
              <p className="text-sm text-gray-500">Enter a meeting code</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
