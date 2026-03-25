import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, Calendar, TrendingUp, AlertCircle, PlusCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { FilterModal, FilterButton } from '../../components/ui/FilterModal';
import { Pagination } from '../../components/ui/Pagination';
import { CollaborationRequestCard } from '../../components/collaboration/CollaborationRequestCard';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { BlurFadeIn } from '../../components/ui/BlurFadeIn';
import TextType from '../../components/ui/TextType';
import { useAuth } from '../../context/AuthContext';
import { CollaborationRequest } from '../../types';
import { getRequestsForEntrepreneur } from '../../data/collaborationRequests';
import { investors } from '../../data/users';
import { useDebounce } from '../../hooks/useDebounce';
const ITEMS_PER_PAGE = 6;

const EntrepreneurDashboardComponent: React.FC = () => {
  const { user } = useAuth();
  const [collaborationRequests, setCollaborationRequests] = useState<CollaborationRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Debounced search for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Filter modal state
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  
  // Get unique stages and interests for filters
  const allStages = useMemo(() => Array.from(new Set(investors.flatMap(i => i.investmentStage))), [investors]);
  const allInterests = useMemo(() => Array.from(new Set(investors.flatMap(i => i.investmentInterests))), [investors]);

  // Prepare filter options for modal
  const stageOptions = useMemo(() => allStages.map(s => ({ id: s, label: s })), [allStages]);
  const interestOptions = useMemo(() => allInterests.map(i => ({ id: i, label: i })), [allInterests]);
  
  // Filter investors based on search and filters
  const filteredInvestors = useMemo(() => {
    return investors.filter(investor => {
      const matchesSearch = debouncedSearchQuery === '' ||
        investor.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        investor.investmentInterests.some(interest =>
          interest.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        );

      const matchesStage = selectedStages.length === 0 ||
        investor.investmentStage.some(stage => selectedStages.includes(stage));

      const matchesInterest = selectedInterests.length === 0 ||
        investor.investmentInterests.some(interest => selectedInterests.includes(interest));

      return matchesSearch && matchesStage && matchesInterest;
    });
  }, [investors, debouncedSearchQuery, selectedStages, selectedInterests]);
  
  // Pagination calculations
  const totalPages = useMemo(() => Math.ceil(filteredInvestors.length / ITEMS_PER_PAGE), [filteredInvestors.length]);
  const paginatedInvestors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvestors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvestors, currentPage]);

  // Simulate loading when page changes with optimized delay
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setIsLoading(true);
      setCurrentPage(page);
      // Optimized 4-second delay for better UX and perceived performance
      setTimeout(() => {
        setIsLoading(false);
      }, 1200);
    }
  };

  useEffect(() => {
    if (user) {
      // Load collaboration requests
      const requests = getRequestsForEntrepreneur(user.id);
      setCollaborationRequests(requests);
    }
  }, [user]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedStages, selectedInterests]);
  
  // Toggle functions
  const toggleStage = (stage: string) => {
    setSelectedStages(prevSelected => 
      prevSelected.includes(stage)
        ? prevSelected.filter(s => s !== stage)
        : [...prevSelected, stage]
    );
  };
  
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prevSelected => 
      prevSelected.includes(interest)
        ? prevSelected.filter(i => i !== interest)
        : [...prevSelected, interest]
    );
  };
  
  const handleRequestStatusUpdate = (requestId: string, status: 'accepted' | 'rejected') => {
    setCollaborationRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId ? { ...req, status } : req
      )
    );
  };

  
  if (!user) return null;
  
  const pendingRequests = useMemo(() =>
    collaborationRequests.filter(req => req.status === 'pending'),
    [collaborationRequests]
  );
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <BlurFadeIn>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          </BlurFadeIn>
          <TextType
            text={["Here's what's happening with your startup today", "Track your collaboration requests", "Connect with investors"]}
            typingSpeed={75}
            pauseDuration={2000}
            deletingSpeed={50}
            showCursor={true}
            cursorCharacter="|"
          />
        </div>
        
        <Link to="/investors">
          <Button leftIcon={<PlusCircle size={18} />}>
            Find Investors
          </Button>
        </Link>
      </div>
      
      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Bell size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Pending Requests</p>
                <h3 className="text-xl font-semibold text-primary-900">{pendingRequests.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <Users size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Total Connections</p>
                <h3 className="text-xl font-semibold text-secondary-900">
                  {collaborationRequests.filter(req => req.status === 'accepted').length}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Calendar size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Upcoming Meetings</p>
                <h3 className="text-xl font-semibold text-accent-900">2</h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-success-50 border border-success-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full mr-4">
                <TrendingUp size={20} className="text-success-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-success-700">Profile Views</p>
                <h3 className="text-xl font-semibold text-success-900">24</h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Collaboration Requests */}
      <Card>
        <CardHeader className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Collaboration Requests</h2>
          <Badge variant="primary">{pendingRequests.length} pending</Badge>
        </CardHeader>
        
        <CardBody>
          {collaborationRequests.length > 0 ? (
            <div className="space-y-4">
              {collaborationRequests.map(request => (
                <CollaborationRequestCard
                  key={request.id}
                  request={request}
                  onStatusUpdate={handleRequestStatusUpdate}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <AlertCircle size={24} className="text-gray-500" />
              </div>
              <p className="text-gray-600">No collaboration requests yet</p>
              <p className="text-sm text-gray-500 mt-1">When investors are interested in your startup, their requests will appear here</p>
            </div>
          )}
        </CardBody>
      </Card>
      
      {/* Recommended Investors - Now at the bottom */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-medium text-gray-900">Recommended Investors</h2>
            <Link to="/investors" className="text-sm font-medium text-primary-600 hover:text-primary-500">
              View all
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search investors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
                startAdornment={<Search size={18} />}
              />
            </div>
            <FilterButton
              label="Stage"
              count={allStages.length}
              selectedCount={selectedStages.length}
              onClick={() => setIsStageModalOpen(true)}
            />
            <FilterButton
              label="Interest"
              count={allInterests.length}
              selectedCount={selectedInterests.length}
              onClick={() => setIsInterestModalOpen(true)}
            />
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {isLoading ? (
            Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
              <SkeletonCard key={`skeleton-${index}`} />
            ))
          ) : paginatedInvestors.length > 0 ? (
            paginatedInvestors.map(investor => (
              <InvestorCard
                key={investor.id}
                investor={investor}
                showActions={false}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Users size={24} className="text-gray-500" />
              </div>
              <p className="text-gray-600">No investors match your filters</p>
              <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </CardBody>

        {/* Pagination */}
        {!isLoading && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="pb-4"
          />
        )}
      </Card>
      
      {/* Filter Modals */}
      <FilterModal
        isOpen={isStageModalOpen}
        onClose={() => setIsStageModalOpen(false)}
        title="Filter by Investment Stage"
        options={stageOptions}
        selectedOptions={selectedStages}
        onToggle={toggleStage}
        type="checkbox"
      />
      
      <FilterModal
        isOpen={isInterestModalOpen}
        onClose={() => setIsInterestModalOpen(false)}
        title="Filter by Investment Interest"
        options={interestOptions}
        selectedOptions={selectedInterests}
        onToggle={toggleInterest}
        type="checkbox"
      />
    </div>
  );
};

export const EntrepreneurDashboard = React.memo(EntrepreneurDashboardComponent);
