import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  MapPin, 
  Linkedin, 
  Globe, 
  Building2, 
  Briefcase, 
  DollarSign, 
  Target,
  Save,
  X,
  ArrowLeft,
  Plus,
  Trash2,
  FileText,
  Users,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { useAuth } from '../../context/AuthContext';
import { users } from '../../data/users';
import { ROUTES } from '../../config/routes';
import { Entrepreneur, Investor, UserRole, TeamMember, FundingRound, StartupDocument } from '../../types';

export const CreateProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, updateProfile } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    // Common fields
    name: '',
    bio: '',
    location: '',
    linkedinUrl: '',
    websiteUrl: '',
    avatarUrl: '',
    
    // Entrepreneur specific
    startupName: '',
    pitchSummary: '',
    fundingNeeded: '',
    industry: '',
    foundedYear: new Date().getFullYear(),
    teamSize: 1,
    
    // Additional entrepreneur fields
    problemStatement: '',
    solution: '',
    marketOpportunity: '',
    competitiveAdvantage: '',
    valuation: '',
    
    // Team members (stored as JSON string for simplicity)
    teamMembersJson: '[]',
    
    // Funding timeline (stored as JSON string)
    fundingTimelineJson: '[]',
    
    // Documents (stored as JSON string)
    documentsJson: '[]',
    
    // Investor specific
    investmentInterests: '',
    investmentStages: '',
    minimumInvestment: '',
    maximumInvestment: '',
    
    // Additional investor fields
    investmentPhilosophy: '',
    background: '',
  });
  
  // Temporary state for adding items
  const [newTeamMember, setNewTeamMember] = useState({ name: '', role: '' });
  const [newFundingRound, setNewFundingRound] = useState({ name: '', amount: '', year: new Date().getFullYear().toString(), status: 'planned' as const });
  const [newDocument, setNewDocument] = useState({ name: '', url: '' });
  
  // Determine user role from URL or current user
  const isInvestorRoute = window.location.pathname.includes('/investor/');
  const userRole: UserRole = isInvestorRoute ? 'investor' : (currentUser?.role || 'entrepreneur');
  
  // Load existing user data if editing
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.name || '',
        bio: currentUser.bio || '',
        avatarUrl: currentUser.avatarUrl || '',
      }));
      
      // If user is entrepreneur, load entrepreneur-specific data
      if (currentUser.role === 'entrepreneur') {
        const entrepreneur = users.find(u => u.id === currentUser.id && u.role === 'entrepreneur') as Entrepreneur | undefined;
        if (entrepreneur) {
          setFormData(prev => ({
            ...prev,
            startupName: entrepreneur.startupName || '',
            pitchSummary: entrepreneur.pitchSummary || '',
            fundingNeeded: entrepreneur.fundingNeeded || '',
            industry: entrepreneur.industry || '',
            location: entrepreneur.location || '',
            foundedYear: entrepreneur.foundedYear || new Date().getFullYear(),
            teamSize: entrepreneur.teamSize || 1,
            problemStatement: entrepreneur.problemStatement || '',
            solution: entrepreneur.solution || '',
            marketOpportunity: entrepreneur.marketOpportunity || '',
            competitiveAdvantage: entrepreneur.competitiveAdvantage || '',
            valuation: entrepreneur.valuation || '',
            teamMembersJson: JSON.stringify(entrepreneur.teamMembers || []),
            fundingTimelineJson: JSON.stringify(entrepreneur.fundingTimeline || []),
            documentsJson: JSON.stringify(entrepreneur.documents || []),
          }));
        }
      }
      
      // If user is investor, load investor-specific data
      if (currentUser.role === 'investor') {
        const investor = users.find(u => u.id === currentUser.id && u.role === 'investor') as Investor | undefined;
        if (investor) {
          setFormData(prev => ({
            ...prev,
            investmentInterests: investor.investmentInterests?.join(', ') || '',
            investmentStages: investor.investmentStage?.join(', ') || '',
            minimumInvestment: investor.minimumInvestment || '',
            maximumInvestment: investor.maximumInvestment || '',
            investmentPhilosophy: investor.investmentPhilosophy || '',
            background: investor.background || '',
            location: 'San Francisco, CA', // Default for demo
          }));
        }
      }
    }
  }, [currentUser]);
  
  // Parse JSON fields
  const getTeamMembers = (): TeamMember[] => {
    try {
      return JSON.parse(formData.teamMembersJson);
    } catch {
      return [];
    }
  };
  
  const getFundingTimeline = (): FundingRound[] => {
    try {
      return JSON.parse(formData.fundingTimelineJson);
    } catch {
      return [];
    }
  };
  
  const getDocuments = (): StartupDocument[] => {
    try {
      return JSON.parse(formData.documentsJson);
    } catch {
      return [];
    }
  };
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle avatar URL change
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      avatarUrl: value
    }));
  };
  
  // Add team member
  const handleAddTeamMember = () => {
    if (!newTeamMember.name.trim() || !newTeamMember.role.trim()) return;
    
    const members = getTeamMembers();
    members.push({ name: newTeamMember.name, role: newTeamMember.role });
    setFormData(prev => ({
      ...prev,
      teamMembersJson: JSON.stringify(members),
      teamSize: members.length + 1
    }));
    setNewTeamMember({ name: '', role: '' });
  };
  
  // Remove team member
  const handleRemoveTeamMember = (index: number) => {
    const members = getTeamMembers();
    members.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      teamMembersJson: JSON.stringify(members),
      teamSize: members.length + 1
    }));
  };
  
  // Add funding round
  const handleAddFundingRound = () => {
    if (!newFundingRound.name.trim()) return;
    
    const rounds = getFundingTimeline();
    rounds.push({
      name: newFundingRound.name,
      amount: newFundingRound.amount,
      year: parseInt(newFundingRound.year),
      status: newFundingRound.status
    });
    setFormData(prev => ({
      ...prev,
      fundingTimelineJson: JSON.stringify(rounds)
    }));
    setNewFundingRound({ name: '', amount: '', year: new Date().getFullYear().toString(), status: 'planned' });
  };
  
  // Remove funding round
  const handleRemoveFundingRound = (index: number) => {
    const rounds = getFundingTimeline();
    rounds.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      fundingTimelineJson: JSON.stringify(rounds)
    }));
  };
  
  // Add document
  const handleAddDocument = () => {
    if (!newDocument.name.trim()) return;
    
    const docs = getDocuments();
    docs.push({
      name: newDocument.name,
      url: newDocument.url,
      lastUpdated: new Date().toISOString()
    });
    setFormData(prev => ({
      ...prev,
      documentsJson: JSON.stringify(docs)
    }));
    setNewDocument({ name: '', url: '' });
  };
  
  // Remove document
  const handleRemoveDocument = (index: number) => {
    const docs = getDocuments();
    docs.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      documentsJson: JSON.stringify(docs)
    }));
  };
  
  // Form validation
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (userRole === 'entrepreneur') {
      if (!formData.startupName.trim()) {
        setError('Startup name is required');
        return false;
      }
      if (!formData.pitchSummary.trim()) {
        setError('Pitch summary is required');
        return false;
      }
      if (!formData.fundingNeeded.trim()) {
        setError('Funding needed is required');
        return false;
      }
    }
    
    if (userRole === 'investor') {
      if (!formData.investmentInterests.trim()) {
        setError('Investment interests are required');
        return false;
      }
      if (!formData.minimumInvestment.trim()) {
        setError('Minimum investment is required');
        return false;
      }
    }
    
    // Validate URLs if provided
    if (formData.linkedinUrl && !isValidUrl(formData.linkedinUrl)) {
      setError('Please enter a valid LinkedIn URL');
      return false;
    }
    if (formData.websiteUrl && !isValidUrl(formData.websiteUrl)) {
      setError('Please enter a valid Website URL');
      return false;
    }
    
    return true;
  };
  
  // URL validation helper
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    if (!currentUser) {
      setError('You must be logged in to update your profile');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Prepare the updates
      const updates: Partial<Entrepreneur | Investor> = {
        name: formData.name,
        bio: formData.bio,
        avatarUrl: formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
        linkedinUrl: formData.linkedinUrl,
        websiteUrl: formData.websiteUrl,
      };
      
      if (userRole === 'entrepreneur') {
        Object.assign(updates, {
          startupName: formData.startupName,
          pitchSummary: formData.pitchSummary,
          fundingNeeded: formData.fundingNeeded,
          industry: formData.industry || 'Technology',
          location: formData.location,
          foundedYear: formData.foundedYear,
          teamSize: formData.teamSize,
          problemStatement: formData.problemStatement,
          solution: formData.solution,
          marketOpportunity: formData.marketOpportunity,
          competitiveAdvantage: formData.competitiveAdvantage,
          valuation: formData.valuation,
          teamMembers: getTeamMembers(),
          fundingTimeline: getFundingTimeline(),
          documents: getDocuments(),
        });
      }
      
      if (userRole === 'investor') {
        Object.assign(updates, {
          investmentInterests: formData.investmentInterests.split(',').map(s => s.trim()).filter(Boolean),
          investmentStage: formData.investmentStages.split(',').map(s => s.trim()).filter(Boolean),
          minimumInvestment: formData.minimumInvestment,
          maximumInvestment: formData.maximumInvestment || formData.minimumInvestment,
          investmentPhilosophy: formData.investmentPhilosophy,
          background: formData.background,
        });
      }
      
      // Update the user profile
      await updateProfile(currentUser.id, updates);
      
      // Navigate to the appropriate profile page
      const targetPath = userRole === 'entrepreneur'
        ? ROUTES.PROFILE.ENTREPRENEUR(currentUser.id)
        : ROUTES.PROFILE.INVESTOR(currentUser.id);
      
      navigate(targetPath);
    } catch (err) {
      setError((err as Error).message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    const targetPath = userRole === 'entrepreneur' 
      ? ROUTES.DASHBOARD.ENTREPRENEUR
      : ROUTES.DASHBOARD.INVESTOR;
    navigate(targetPath);
  };
  
  const teamMembers = getTeamMembers();
  const fundingTimeline = getFundingTimeline();
  const documents = getDocuments();
  
  return (
    <div className="create-profile-page page-main-content space-y-6 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleCancel}
            leftIcon={<ArrowLeft size={18} />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentUser?.role === 'entrepreneur' ? 'Create Entrepreneur Profile' : 'Create Investor Profile'}
            </h1>
            <p className="text-gray-600">Complete your profile to connect with {currentUser?.role === 'entrepreneur' ? 'investors' : 'entrepreneurs'}</p>
          </div>
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Photo & Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Profile Photo</h2>
              </CardHeader>
              <CardBody className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar
                    src={formData.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name || 'User')}&background=random`}
                    alt={formData.name || 'User'}
                    size="xl"
                    className="w-32 h-32"
                  />
                </div>
                <Input
                  label="Photo URL"
                  name="avatarUrl"
                  value={formData.avatarUrl}
                  onChange={handleAvatarChange}
                  placeholder="https://example.com/photo.jpg"
                  fullWidth
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter a URL to your profile photo
                </p>
              </CardBody>
            </Card>
            
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Social Links</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <Input
                  label="LinkedIn URL"
                  name="linkedinUrl"
                  value={formData.linkedinUrl}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                  startAdornment={<Linkedin size={18} />}
                  fullWidth
                />
                <Input
                  label="Website URL"
                  name="websiteUrl"
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                  startAdornment={<Globe size={18} />}
                  fullWidth
                />
              </CardBody>
            </Card>
          </div>
          
          {/* Right Column - Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Display Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    required
                    startAdornment={<User size={18} />}
                    fullWidth
                  />
                  <Input
                    label="Location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="San Francisco, CA"
                    startAdornment={<MapPin size={18} />}
                    fullWidth
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    About You *
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    placeholder="Tell us about yourself, your experience, and what makes you unique..."
                  />
                </div>
              </CardBody>
            </Card>
            
            {userRole === 'entrepreneur' && (
              <>
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-medium text-gray-900">Startup Overview</h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Startup Name"
                        name="startupName"
                        value={formData.startupName}
                        onChange={handleChange}
                        placeholder="My Startup"
                        required
                        startAdornment={<Building2 size={18} />}
                        fullWidth
                      />
                      <Input
                        label="Industry"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        placeholder="Technology"
                        startAdornment={<Briefcase size={18} />}
                        fullWidth
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Funding Needed"
                        name="fundingNeeded"
                        value={formData.fundingNeeded}
                        onChange={handleChange}
                        placeholder="$500,000"
                        required
                        startAdornment={<DollarSign size={18} />}
                        fullWidth
                      />
                      <Input
                        label="Valuation"
                        name="valuation"
                        value={formData.valuation}
                        onChange={handleChange}
                        placeholder="$8M - $12M"
                        startAdornment={<TrendingUp size={18} />}
                        fullWidth
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Founded Year"
                        name="foundedYear"
                        type="number"
                        value={formData.foundedYear}
                        onChange={handleChange}
                        placeholder="2024"
                        fullWidth
                      />
                      <Input
                        label="Team Size"
                        name="teamSize"
                        type="number"
                        value={formData.teamSize}
                        onChange={handleChange}
                        placeholder="5"
                        fullWidth
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pitch Summary *
                      </label>
                      <textarea
                        name="pitchSummary"
                        value={formData.pitchSummary}
                        onChange={handleChange}
                        rows={4}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="Describe your startup, the problem you solve, and your vision..."
                        required
                      />
                    </div>
                  </CardBody>
                </Card>
                
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-medium text-gray-900">Business Details</h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Problem Statement
                      </label>
                      <textarea
                        name="problemStatement"
                        value={formData.problemStatement}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="What problem does your startup solve? What pain points do you address?"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Solution
                      </label>
                      <textarea
                        name="solution"
                        value={formData.solution}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="How does your product or service solve this problem?"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Market Opportunity
                      </label>
                      <textarea
                        name="marketOpportunity"
                        value={formData.marketOpportunity}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="What is the size of your target market? What is the growth potential?"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Competitive Advantage
                      </label>
                      <textarea
                        name="competitiveAdvantage"
                        value={formData.competitiveAdvantage}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        placeholder="What makes your startup different from competitors? What is your unique value proposition?"
                      />
                    </div>
                  </CardBody>
                </Card>
                
                {/* Team Members */}
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    {teamMembers.length > 0 ? (
                      <div className="space-y-2">
                        {teamMembers.map((member, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                            <div className="flex items-center">
                              <Avatar src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random`} alt={member.name} size="sm" className="mr-3" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.role}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveTeamMember(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No team members added yet.</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        placeholder="Team member name"
                        value={newTeamMember.name}
                        onChange={(e) => setNewTeamMember(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        placeholder="Role (e.g., CTO, CEO)"
                        value={newTeamMember.role}
                        onChange={(e) => setNewTeamMember(prev => ({ ...prev, role: e.target.value }))}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddTeamMember}
                      leftIcon={<Plus size={16} />}
                    >
                      Add Team Member
                    </Button>
                  </CardBody>
                </Card>
                
                {/* Funding Timeline */}
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-medium text-gray-900">Funding Timeline</h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    {fundingTimeline.length > 0 ? (
                      <div className="space-y-2">
                        {fundingTimeline.map((round, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{round.name}</p>
                              <p className="text-xs text-gray-500">{round.amount} {round.year && `(${round.year})`}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                round.status === 'completed' ? 'bg-green-100 text-green-800' :
                                round.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {round.status === 'completed' ? 'Completed' : round.status === 'in-progress' ? 'In Progress' : 'Planned'}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFundingRound(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No funding rounds added yet.</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        placeholder="Round name (e.g., Seed, Series A)"
                        value={newFundingRound.name}
                        onChange={(e) => setNewFundingRound(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        placeholder="Amount (e.g., $1M)"
                        value={newFundingRound.amount}
                        onChange={(e) => setNewFundingRound(prev => ({ ...prev, amount: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        placeholder="Year"
                        type="number"
                        value={newFundingRound.year}
                        onChange={(e) => setNewFundingRound(prev => ({ ...prev, year: e.target.value }))}
                      />
                      <select
                        className="rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        value={newFundingRound.status}
                        onChange={(e) => setNewFundingRound(prev => ({ ...prev, status: e.target.value as any }))}
                      >
                        <option value="planned">Planned</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddFundingRound}
                      leftIcon={<Plus size={16} />}
                    >
                      Add Funding Round
                    </Button>
                  </CardBody>
                </Card>
                
                {/* Documents */}
                <Card>
                  <CardHeader>
                    <h2 className="text-lg font-medium text-gray-900">Documents</h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    {documents.length > 0 ? (
                      <div className="space-y-2">
                        {documents.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                            <div className="flex items-center">
                              <FileText size={18} className="mr-3 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                                {doc.lastUpdated && (
                                  <p className="text-xs text-gray-500">Updated {new Date(doc.lastUpdated).toLocaleDateString()}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDocument(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No documents added yet.</p>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        placeholder="Document name (e.g., Pitch Deck)"
                        value={newDocument.name}
                        onChange={(e) => setNewDocument(prev => ({ ...prev, name: e.target.value }))}
                      />
                      <Input
                        placeholder="Document URL (optional)"
                        value={newDocument.url}
                        onChange={(e) => setNewDocument(prev => ({ ...prev, url: e.target.value }))}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddDocument}
                      leftIcon={<Plus size={16} />}
                    >
                      Add Document
                    </Button>
                  </CardBody>
                </Card>
              </>
            )}
            
            {userRole === 'investor' && (
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-medium text-gray-900">Investment Profile</h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Investment Interests *
                    </label>
                    <Input
                      name="investmentInterests"
                      value={formData.investmentInterests}
                      onChange={handleChange}
                      placeholder="FinTech, AI, HealthTech (comma separated)"
                      startAdornment={<Target size={18} />}
                      fullWidth
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Enter your investment interests separated by commas
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Investment Stages
                    </label>
                    <Input
                      name="investmentStages"
                      value={formData.investmentStages}
                      onChange={handleChange}
                      placeholder="Seed, Series A, Series B (comma separated)"
                      startAdornment={<Briefcase size={18} />}
                      fullWidth
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Minimum Investment"
                      name="minimumInvestment"
                      value={formData.minimumInvestment}
                      onChange={handleChange}
                      placeholder="$50,000"
                      required
                      startAdornment={<DollarSign size={18} />}
                      fullWidth
                    />
                    <Input
                      label="Maximum Investment"
                      name="maximumInvestment"
                      value={formData.maximumInvestment}
                      onChange={handleChange}
                      placeholder="$500,000"
                      startAdornment={<DollarSign size={18} />}
                      fullWidth
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Investment Philosophy
                    </label>
                    <textarea
                      name="investmentPhilosophy"
                      value={formData.investmentPhilosophy}
                      onChange={handleChange}
                      rows={4}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Describe your investment philosophy, approach, and what you look for in startups..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Your Background
                    </label>
                    <textarea
                      name="background"
                      value={formData.background}
                      onChange={handleChange}
                      rows={4}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      placeholder="Tell us about your professional background, experience, and what makes you a great investor..."
                    />
                  </div>
                </CardBody>
              </Card>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                leftIcon={<X size={18} />}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSaving}
                leftIcon={<Save size={18} />}
              >
                Save Profile
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateProfilePage;
