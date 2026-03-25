import React, { useState } from 'react';
import { Video, Calendar, Clock, User, Plus, Search, MoreVertical, Phone, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

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
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  const filteredMeetings = mockMeetings.filter(meeting => {
    const matchesSearch = meeting.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          meeting.participant.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || meeting.status === filter;
    return matchesSearch && matchesFilter;
  });

  const handleJoinMeeting = (meetingId: string) => {
    // Navigate to actual video room
    navigate(`/video/${meetingId}`);
  };

  const handleStartNewMeeting = () => {
    // Start a new meeting
    const newRoomId = `room-${Date.now()}`;
    navigate(`/video/${newRoomId}`);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Video Meetings</h1>
        <p className="text-gray-600 mt-1">Manage your video calls and meetings</p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={handleStartNewMeeting}
          className="flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} className="mr-2" />
          New Meeting
        </button>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'scheduled', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
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
      <div className="space-y-4">
        {filteredMeetings.length === 0 ? (
          <div className="text-center py-12">
            <Video className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No meetings found</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new meeting</p>
            <button
              onClick={handleStartNewMeeting}
              className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              New Meeting
            </button>
          </div>
        ) : (
          filteredMeetings.map((meeting) => (
            <div
              key={meeting.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${
                    meeting.status === 'completed' ? 'bg-green-100' : 'bg-primary-100'
                  }`}>
                    <Video className={`h-6 w-6 ${
                      meeting.status === 'completed' ? 'text-green-600' : 'text-primary-600'
                    }`} />
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900">{meeting.title}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User size={14} />
                        {meeting.participant}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {meeting.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {meeting.time}
                      </span>
                      <span>{meeting.duration}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    meeting.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {meeting.status === 'completed' ? 'Completed' : 'Scheduled'}
                  </span>
                  
                  {meeting.status === 'scheduled' ? (
                    <button
                      onClick={() => handleJoinMeeting(meeting.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <Phone size={16} />
                      Join
                    </button>
                  ) : (
                    <button
                      onClick={() => handleJoinMeeting(meeting.id)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <MessageSquare size={16} />
                      Review
                    </button>
                  )}
                  
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={handleStartNewMeeting}
          className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Video className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Start Instant Meeting</h3>
              <p className="text-sm text-gray-500">Start a new video call now</p>
            </div>
          </div>
        </button>
        
        <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Schedule Meeting</h3>
              <p className="text-sm text-gray-500">Plan a meeting for later</p>
            </div>
          </div>
        </button>
        
        <button className="p-4 bg-white rounded-lg border border-gray-200 hover:border-primary-500 hover:shadow-md transition-all text-left">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Join Meeting</h3>
              <p className="text-sm text-gray-500">Enter a meeting code</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};
