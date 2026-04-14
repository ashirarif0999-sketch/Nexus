import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Users, Calendar, Building2, MapPin, UserCircle, FileText, DollarSign, Send, X, Check, Plus, ArrowLeft, BarChart3, Activity, AlertCircle, Award, CheckCircle, Circle, Clock, Lightbulb, PieChart, Target, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../context/AuthContext';
import { findUserById } from '../../data/users';
import { createCollaborationRequest, getRequestsFromInvestor } from '../../data/collaborationRequests';
import { Entrepreneur } from '../../types';
import { ROUTES } from '../../config/routes';

export const EntrepreneurProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [collaborationMessage, setCollaborationMessage] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [investmentMessage, setInvestmentMessage] = useState('');
  
  // Fetch entrepreneur data
  const entrepreneur = findUserById(id || '') as Entrepreneur | null;
  
  if (!entrepreneur || entrepreneur.role !== 'entrepreneur') {
    // Check if this is the current user's profile (they haven't created their profile yet)
    const isCurrentUser = currentUser?.id === id && currentUser?.role === 'entrepreneur';
    
    if (isCurrentUser) {
      return (
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Entrepreneur Profile</h2>
          <p className="text-gray-600 mt-2">You haven't created your entrepreneur profile yet. Complete it to showcase your startup to investors.</p>
          <Link to={ROUTES.PROFILE.CREATE_ENTREPRENEUR}>
            <Button className="mt-4" leftIcon={<Plus size={18} />}>Create Your Profile</Button>
          </Link>
        </div>
      );
    }
    
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Entrepreneur not found</h2>
        <p className="text-gray-600 mt-2">The entrepreneur profile you're looking for doesn't exist or has been removed.</p>
        <Link to={ROUTES.DASHBOARD.INVESTOR}>
          <Button variant="outline" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  const isCurrentUser = currentUser?.id === entrepreneur.id;
  const isInvestor = currentUser?.role === 'investor';
  
  // Check if the current investor has already sent a request to this entrepreneur
  const hasRequestedCollaboration = isInvestor && id 
    ? getRequestsFromInvestor(currentUser.id).some(req => req.entrepreneurId === id)
    : false;
  
  const handleSendRequest = () => {
    if (isInvestor && currentUser && id) {
      createCollaborationRequest(
        currentUser.id,
        id,
        collaborationMessage || `I'm interested in learning more about ${entrepreneur.startupName} and would like to explore potential investment opportunities.`
      );

      toast.success(`Collaboration request sent to ${entrepreneur.name}!`);
      setShowCollaborationModal(false);
      setCollaborationMessage('');
    }
  };

  const handleInvest = () => {
    // Mock investment - in a real app, this would call an API
    alert(`Investment of $${investmentAmount} submitted to ${entrepreneur.startupName}! This would update your wallet balance and transaction history.`);

    // Reset form and close modal
    setInvestmentAmount('');
    setInvestmentMessage('');
    setShowInvestModal(false);
  };
  
  return (
    <div className="entrepreneur-profile-page space-y-6 animate-fade-in">
      {/* Back button */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => navigate(-1)}
          className="profile-page-navigation bg-[#f0f0f0] text-gray-600 hover:text-white "
        >
        </Button>
      </div>

      {/* Profile header */}
      <Card className="entrepreneur-profile-header">
        <CardBody className="sm:flex sm:items-start sm:justify-between p-6">
          <div className="sm:flex sm:space-x-6">
            <Avatar
              src={entrepreneur.avatarUrl}
              alt={entrepreneur.name}
              size="xl"
              status={entrepreneur.isOnline ? 'online' : 'offline'}
              className="mx-auto sm:mx-0"
            />
            
            <div className="mt-4 sm:mt-0 text-center sm:text-left">
              <h1 className="text-2xl font-bold text-gray-900">{entrepreneur.name}</h1>
              <p className="text-gray-600 flex items-center justify-center sm:justify-start mt-1">
                <Building2 size={16} className="mr-1" />
                Founder at {entrepreneur.startupName}
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-3">
                <Badge variant="primary">{entrepreneur.industry}</Badge>
                <Badge variant="gray">
                  <MapPin size={14} className="mr-1" />
                  {entrepreneur.location}
                </Badge>
                <Badge variant="accent">
                  <Calendar size={14} className="mr-1" />
                  Founded {entrepreneur.foundedYear}
                </Badge>
                <Badge variant="secondary">
                  <Users size={14} className="mr-1" />
                  {entrepreneur.teamSize} team members
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="card-buttons-parent mt-6 sm:mt-0 flex flex-col sm:flex-row gap-2 justify-center sm:justify-end">
            {!isCurrentUser && (
              <>
                 <Link to={ROUTES.MESSAGES_CONVERSATION(entrepreneur.id)}>
                   <Button
                     variant="outline"
                     leftIcon={<MessageCircle size={18} />}
                   >
                     Message
                   </Button>
                 </Link>
                
                {isInvestor && (
                  <>
                    <Button
                      leftIcon={<Send size={18} />}
                      disabled={hasRequestedCollaboration}
                      onClick={() => setShowCollaborationModal(true)}
                    >
                      {hasRequestedCollaboration ? 'Request Sent' : 'Request Collaboration'}
                    </Button>

                    <Button
                      leftIcon={<DollarSign size={18} />}
                      onClick={() => setShowInvestModal(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Invest Now
                    </Button>
                  </>
                )}
              </>
            )}
            
            {isCurrentUser && (
              <Link to={ROUTES.PROFILE.CREATE_ENTREPRENEUR}>
                <Button
                  variant="outline"
                  leftIcon={<UserCircle size={18} />}
                >
                  Edit Profile
                </Button>
              </Link>
            )}
          </div>
        </CardBody>
      </Card>
      
      <div className="entrepreneur-profile-content-grid grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - left side */}
        <div className="entrepreneur-profile-main-content lg:col-span-2 space-y-6">
          {/* About */}
          <Card className="entrepreneur-profile-about-section">
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">About</h2>
            </CardHeader>
            <CardBody>
              <p className="text-gray-700">{entrepreneur.bio}</p>
            </CardBody>
          </Card>
          
          {/* Startup Description */}
          <Card className="startup-overview-card">
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <Building2 size={20} className="mr-2 text-primary-600" />
                Startup Overview
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                 <div className="startup-overview-item p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                   <div className="flex items-start">
                     <div className="flex-shrink-0 p-2 bg-red-100 rounded-lg mr-4">
                       <Target size={20} className="text-red-600" />
                     </div>
                     <div className="flex-1">
                       <h3 className="text-md font-semibold text-red-900 mb-2">Problem Statement</h3>
                       <p className="text-red-800 leading-relaxed">
                         {entrepreneur.problemStatement || 'SMBs struggle with complex financial data analysis without enterprise-level tools or expertise.'}
                       </p>
                     </div>
                   </div>
                 </div>

                 <div className="startup-overview-item p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                   <div className="flex items-start">
                     <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg mr-4">
                       <Lightbulb size={20} className="text-blue-600" />
                     </div>
                     <div className="flex-1">
                       <h3 className="text-md font-semibold text-blue-900 mb-2">Solution</h3>
                       <p className="text-blue-800 leading-relaxed">
                         {entrepreneur.pitchSummary || 'AI-powered financial analytics platform helping SMBs make data-driven decisions.'}
                       </p>
                     </div>
                   </div>
                 </div>

                 <div className="startup-overview-item p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                   <div className="flex items-start">
                     <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg mr-4">
                       <TrendingUp size={20} className="text-green-600" />
                     </div>
                     <div className="flex-1">
                       <h3 className="text-md font-semibold text-green-900 mb-2">Market Opportunity</h3>
                       <p className="text-green-800 leading-relaxed">
                         {entrepreneur.marketOpportunity || '99% of businesses are SMBs ($15T global market) needing affordable analytics.'}
                       </p>
                     </div>
                   </div>
                 </div>

                 <div className="startup-overview-item p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                   <div className="flex items-start">
                     <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg mr-4">
                       <Award size={20} className="text-purple-600" />
                     </div>
                     <div className="flex-1">
                       <h3 className="text-md font-semibold text-purple-900 mb-2">Competitive Advantage</h3>
                       <p className="text-purple-800 leading-relaxed">
                         {entrepreneur.competitiveAdvantage || 'Patented AI models trained on 10M+ SMB datasets with 92% accuracy vs. 78% industry avg.'}
                       </p>
                     </div>
                   </div>
                 </div>

                 <div className="startup-overview-item p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
                   <div className="flex items-start">
                     <div className="flex-shrink-0 p-2 bg-orange-100 rounded-lg mr-4">
                       <Activity size={20} className="text-orange-600" />
                     </div>
                     <div className="flex-1">
                       <h3 className="text-md font-semibold text-orange-900 mb-2">Traction</h3>
                       <p className="text-orange-800 leading-relaxed">
                         {entrepreneur.traction || 'Early-stage startup with promising technology and market validation.'}
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             </CardBody>
           </Card>
          
          {/* Team */}
          <Card>
            <CardHeader className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Team</h2>
              <span className="text-sm text-gray-500">{entrepreneur.teamSize} members</span>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center p-3 border border-gray-200 rounded-md">
                  <Avatar
                    src={entrepreneur.avatarUrl}
                    alt={entrepreneur.name}
                    size="md"
                    className="mr-3"
                  />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{entrepreneur.name}</h3>
                    <p className="text-xs text-gray-500">Founder & CEO</p>
                  </div>
                </div>
                
                {/* Dynamic team members from database */}
                {entrepreneur.teamMembers && entrepreneur.teamMembers.map((member, index) => (
                  <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md">
                    <Avatar
                      src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`}
                      alt={member.name}
                      size="md"
                      className="mr-3"
                    />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{member.name}</h3>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                ))}
                
                {(!entrepreneur.teamMembers || entrepreneur.teamMembers.length === 0) && entrepreneur.teamSize <= 1 && (
                  <div className="flex items-center justify-center p-3 border border-dashed border-gray-200 rounded-md col-span-2">
                    <p className="text-sm text-gray-500">No additional team members added yet.</p>
                  </div>
                )}
                
                {entrepreneur.teamSize > 1 && (!entrepreneur.teamMembers || entrepreneur.teamMembers.length < entrepreneur.teamSize - 1) && (
                  <div className="flex items-center justify-center p-3 border border-dashed border-gray-200 rounded-md">
                    <p className="text-sm text-gray-500">+ {entrepreneur.teamSize - 1} more team members</p>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Sidebar - right side */}
        <div className="entrepreneur-profile-sidebar space-y-6">
          {/* Funding Details */}
          <Card className="entrepreneur-profile-funding-section">
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <PieChart size={20} className="mr-2 text-primary-600" />
                Funding
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                {/* Current Round */}
                <div className="funding-current-round p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <DollarSign size={20} className="text-green-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-green-800">Current Round</span>
                        <p className="text-xl font-bold text-green-900">{entrepreneur.fundingNeeded}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Seeking Investment</span>
                    </div>
                  </div>
                </div>

                {/* Valuation */}
                {entrepreneur.valuation && (
                  <div className="funding-valuation p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <TrendingUp size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-blue-800">Valuation</span>
                        <p className="text-lg font-semibold text-blue-900">{entrepreneur.valuation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Dynamic Funding Timeline */}
                {entrepreneur.fundingTimeline && entrepreneur.fundingTimeline.length > 0 && (
                  <div className="funding-timeline pt-4 border-t border-gray-100">
                    <div className="flex items-center mb-4">
                      <Clock size={18} className="text-gray-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900">Funding Timeline</span>
                    </div>
                    <div className="space-y-3">
                      {entrepreneur.fundingTimeline.map((round, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-3 ${
                              round.status === 'completed' ? 'bg-green-500' :
                              round.status === 'in-progress' ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`}></div>
                            <div>
                              <span className="text-sm font-medium text-gray-900">{round.name}</span>
                              {round.year && <span className="text-xs text-gray-500 ml-1">({round.year})</span>}
                            </div>
                          </div>
                          <div className="flex items-center">
                            {round.status === 'completed' && <CheckCircle size={16} className="text-green-500 mr-2" />}
                            {round.status === 'in-progress' && <AlertCircle size={16} className="text-yellow-500 mr-2" />}
                            {round.status === 'planned' && <Circle size={16} className="text-gray-400 mr-2" />}
                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                              round.status === 'completed' ? 'bg-green-100 text-green-800' :
                              round.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {round.status === 'completed' ? 'Completed' :
                               round.status === 'in-progress' ? 'In Progress' : 'Planned'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Investment Readiness Indicator */}
                <div className="investment-readiness mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg mr-3">
                        <CheckCircle size={20} className="text-purple-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-purple-800">Investment Ready</span>
                        <p className="text-xs text-purple-600">Profile complete and seeking funding</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 ml-2">Ready</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
          
          {/* Documents */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900">Documents</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {/* Dynamic documents from database */}
                {entrepreneur.documents && entrepreneur.documents.length > 0 ? (
                  entrepreneur.documents.map((doc, index) => (
                    <div key={index} className="flex items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                      <div className="p-2 bg-primary-50 rounded-md mr-3">
                        <FileText size={18} className="text-primary-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">{doc.name}</h3>
                        {doc.lastUpdated && (
                          <p className="text-xs text-gray-500">Updated {new Date(doc.lastUpdated).toLocaleDateString()}</p>
                        )}
                      </div>
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">View</Button>
                        </a>
                      ) : (
                        <Button variant="outline" size="sm" disabled>View</Button>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center p-4 border border-dashed border-gray-200 rounded-md">
                    <p className="text-sm text-gray-500">No documents uploaded yet.</p>
                  </div>
                )}
              </div>
              
              {!isCurrentUser && isInvestor && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500">
                    Request access to detailed documents and financials by sending a collaboration request.
                  </p>
                  
                  {!hasRequestedCollaboration ? (
                    <Button
                      className="mt-3 w-full"
                      onClick={() => setShowCollaborationModal(true)}
                    >
                      Request Collaboration
                    </Button>
                  ) : (
                    <Button
                      className="mt-3 w-full"
                      disabled
                    >
                      Request Sent
                    </Button>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <BarChart3 size={20} className="mr-2 text-primary-600" />
                Key Metrics
              </h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-900">{entrepreneur.metrics?.monthlyRevenue || '$45K'}</div>
                  <div className="text-xs text-blue-600 font-medium">Monthly Revenue</div>
                  <div className="text-xs text-blue-500 mt-1">MRR</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-900">{entrepreneur.metrics?.totalUsers || '2,847'}</div>
                  <div className="text-xs text-green-600 font-medium">Total Users</div>
                  <div className="text-xs text-green-500 mt-1">Active Customers</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-900">{entrepreneur.metrics?.growthRate || '156%'}</div>
                  <div className="text-xs text-purple-600 font-medium">YoY Growth</div>
                  <div className="text-xs text-purple-500 mt-1">Annual Growth</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-900">{entrepreneur.metrics?.customerRetention || '94%'}</div>
                  <div className="text-xs text-orange-600 font-medium">Retention Rate</div>
                  <div className="text-xs text-orange-500 mt-1">12-Month</div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="mt-2 grid grid-cols-1 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">Churn Rate</span>
                    <span className="text-sm text-gray-600">{entrepreneur.metrics?.churnRate || '3.2%'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{width: '3.2%'}}></div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">CAC Payback</span>
                    <span className="text-sm text-gray-600">{entrepreneur.metrics?.cacPayback || '8 months'}</span>
                  </div>
                  <div className="text-xs text-gray-500">Customer Acquisition Cost payback period</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Investment Modal */}
      {showInvestModal && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50" onClick={() => setShowInvestModal(false)} />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Invest in {entrepreneur.startupName}</h3>
                  <button
                    onClick={() => setShowInvestModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                  {/* Investment Amount */}
                  <div>
                    <Input
                      label="Investment Amount ($)"
                      type="number"
                      placeholder="Enter amount"
                      value={investmentAmount}
                      onChange={(e) => {
                        const amount = e.target.value;
                        setInvestmentAmount(amount);
                        
                        // Calculate processing fee: 1.5% min $10, max $500
                        const numAmount = parseFloat(amount) || 0;
                        let fee = 0;
                        if (numAmount > 0) {
                          fee = Math.max(0.5, Math.min(999999, numAmount * 0.10));
                        }
                        
                        // Update DOM elements
                        const feeEl = document.getElementById('processing-fee');
                        const totalEl = document.getElementById('total-amount');
                        if (feeEl) feeEl.textContent = `$${fee.toFixed(2)}`;
                        if (totalEl) totalEl.textContent = `$${(numAmount + fee).toFixed(2)}`;
                      }}
                    />
                  </div>

                  {/* Funding Source */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Funding Source
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Wallet Balance</p>
                            <p className="text-xs text-gray-500">$50,000.00 available</p>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="fundingSource"
                          defaultChecked
                          className="ml-auto"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Optional Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message to Entrepreneur (Optional)
                    </label>
                    <textarea
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      rows={3}
                      placeholder="Add a personal message..."
                      value={investmentMessage}
                      onChange={(e) => setInvestmentMessage(e.target.value)}
                    />
                  </div>

                  {/* Investment Summary */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Investment Summary</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Amount:</span>
                        <span>${investmentAmount || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Fee:</span>
                        <span id="processing-fee">$0.00</span>
                      </div>
                      <div className="border-t border-gray-200 pt-1 mt-2">
                        <div className="flex justify-between font-medium text-gray-900">
                          <span>Total:</span>
                          <span id="total-amount">${investmentAmount || '0'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setShowInvestModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleInvest}
                    disabled={!investmentAmount || parseFloat(investmentAmount) <= 0}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check size={18} className="mr-2" />
                    Confirm Investment
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Collaboration Request Modal */}
      {showCollaborationModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-[-30px] bg-black/50 z-40"
            onClick={() => setShowCollaborationModal(false)}
          />
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-pop-in" style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Request Collaboration</h3>
                <button 
                  onClick={() => setShowCollaborationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                Send a collaboration request to <span className="font-medium">{entrepreneur.name}</span> about their startup <span className="font-medium">{entrepreneur.startupName}</span>.
              </p>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Message
                </label>
                <textarea
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  rows={4}
                  placeholder="Introduce yourself and explain why you're interested in collaborating..."
                  value={collaborationMessage}
                  onChange={(e) => setCollaborationMessage(e.target.value)}
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button 
                  variant="outline"
                  onClick={() => setShowCollaborationModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendRequest}
                  leftIcon={<Send size={18} />}
                >
                  Send Request
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};