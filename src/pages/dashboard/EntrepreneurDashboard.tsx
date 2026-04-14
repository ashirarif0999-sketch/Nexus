import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Users, Bell, Calendar, TrendingUp, AlertCircle, PlusCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { FilterModal, FilterButton } from '../../components/ui/FilterModal';
import { Pagination } from '../../components/ui/Pagination';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { BlurFadeIn } from '../../components/ui/BlurFadeIn';
import TextType from '../../components/ui/TextType';
import { useAuth } from '../../context/AuthContext';
import { CollaborationRequest } from '../../types';
import { getRequestsForEntrepreneur } from '../../data/collaborationRequests';
import { ROUTES } from '../../config/routes';

// Lazy load heavy components for better initial load performance
const Card = lazy(() => import('../../components/ui/Card').then(module => ({ default: module.Card })));
const CardBody = lazy(() => import('../../components/ui/Card').then(module => ({ default: module.CardBody })));
const CardHeader = lazy(() => import('../../components/ui/Card').then(module => ({ default: module.CardHeader })));
const CollaborationRequestCard = lazy(() => import('../../components/collaboration/CollaborationRequestCard').then(module => ({ default: module.CollaborationRequestCard })));
const InvestorCard = lazy(() => import('../../components/investor/InvestorCard').then(module => ({ default: module.InvestorCard })));

// Custom stat card component
const StatCard: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, style, className }) => (
  <div
    className={`rounded-lg shadow-md overflow-hidden flex flex-col border relative ${className || ''}`}
    style={style}
  >
    {children}
  </div>
);

// Custom stat body component
const StatBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={`px-6 py-4 flex-1 ${className || ''}`}>
    {children}
  </div>
);

const ITEMS_PER_PAGE = 6;

const EntrepreneurDashboardComponent: React.FC = () => {
  const { user } = useAuth();
  const [collaborationRequests, setCollaborationRequests] = useState<CollaborationRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [investors, setInvestors] = useState<any[]>([]);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Filter modal state
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);

  // Lazy load investors data when component mounts
  useEffect(() => {
    import('../../data/users').then(module => {
      setInvestors(module.investors);
    });
  }, []);

  // Get unique stages and interests for filters
  const allStages = useMemo(() => Array.from(new Set(investors.flatMap((i: any) => i.investmentStage))), [investors]);
  const allInterests = useMemo(() => Array.from(new Set(investors.flatMap((i: any) => i.investmentInterests))), [investors]);

  // Prepare filter options for modal
  const stageOptions = useMemo(() => allStages.map(s => ({ id: s, label: s })), [allStages]);
  const interestOptions = useMemo(() => allInterests.map(i => ({ id: i, label: i })), [allInterests]);

  // Filter investors based on search and filters
  const filteredInvestors = useMemo(() => {
    return investors.filter((investor: any) => {
      const matchesSearch = appliedSearchQuery === '' ||
        investor.name.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
        investor.investmentInterests.some((interest: string) =>
          interest.toLowerCase().includes(appliedSearchQuery.toLowerCase())
        );

      const matchesStage = selectedStages.length === 0 ||
        investor.investmentStage.some((stage: string) => selectedStages.includes(stage));

      const matchesInterest = selectedInterests.length === 0 ||
        investor.investmentInterests.some((interest: string) => selectedInterests.includes(interest));

      return matchesSearch && matchesStage && matchesInterest;
    });
  }, [investors, appliedSearchQuery, selectedStages, selectedInterests]);
  
  // Pagination calculations
  const totalPages = useMemo(() => Math.ceil(filteredInvestors.length / ITEMS_PER_PAGE), [filteredInvestors.length]);
  const paginatedInvestors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvestors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvestors, currentPage]);

  // Simulate loading when page changes with optimized delay - memoized for performance
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setIsLoading(true);
      setCurrentPage(page);
      // Optimized delay for better UX and perceived performance
      setTimeout(() => {
        setIsLoading(false);
      }, 1200);
    }
  }, [totalPages]);

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
  }, [appliedSearchQuery, selectedStages, selectedInterests]);
  
  // Toggle functions - memoized for performance
  const toggleStage = useCallback((stage: string) => {
    setSelectedStages(prevSelected =>
      prevSelected.includes(stage)
        ? prevSelected.filter(s => s !== stage)
        : [...prevSelected, stage]
    );
  }, []);

  const toggleInterest = useCallback((interest: string) => {
    setSelectedInterests(prevSelected =>
      prevSelected.includes(interest)
        ? prevSelected.filter(i => i !== interest)
        : [...prevSelected, interest]
    );
  }, []);

  const handleRequestStatusUpdate = useCallback((requestId: string, status: 'accepted' | 'rejected') => {
    setCollaborationRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId ? { ...req, status } : req
      )
    );
  }, []);

  
  if (!user) return null;
  
  const pendingRequests = useMemo(() =>
    collaborationRequests.filter(req => req.status === 'pending'),
    [collaborationRequests]
  );
  
  return (
    <main className="nexus-entrepreneur-dashboard dashboard-main-content page-main-content space-y-6 animate-fade-in">
      <header className="nexus-entrepreneur-header dashboard-header page-header flex justify-between items-center">
        <section className="nexus-entrepreneur-welcome">
          <BlurFadeIn>
            <h1 className="nexus-entrepreneur-title text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          </BlurFadeIn>
          <TextType
            className="nexus-entrepreneur-subtitle"
            text={["Here's what's happening with your startup today", "Track your collaboration requests", "Connect with investors"]}
            typingSpeed={75}
            pauseDuration={2000}
            deletingSpeed={50}
            showCursor={true}
            cursorCharacter="|"
          />
        </section>

        <Link to={ROUTES.INVESTORS} className="nexus-entrepreneur-find-investors-link">
          <Button className="nexus-entrepreneur-find-investors-btn" leftIcon={<PlusCircle size={18} />}>
            Find Investors
          </Button>
        </Link>
      </header>
      
      {/* Summary cards */}
      <div className="entrepreneur-summary-cards dashboard-stats page-stats grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Suspense fallback={<SkeletonCard />}>
          <StatCard className="entrepreneur-pending-requests-card border-primary-100">
            <svg style={{ position: 'absolute', top: 0, left: 0, zIndex: -1, filter: 'blur(25px)', opacity: '20%', transform: 'scaleX(-1)' }} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1">
              <defs>
                <linearGradient id="grad1_0" x1="33.3%" y1="0%" x2="100%" y2="100%">
                  <stop offset="20%" stopColor="#ffffff" stopOpacity="1"></stop>
                  <stop offset="80%" stopColor="#ffffff" stopOpacity="1"></stop>
                </linearGradient>
              </defs>
              <defs>
                <linearGradient id="grad2_0" x1="0%" y1="0%" x2="66.7%" y2="100%">
                  <stop offset="20%" stopColor="#ffffff" stopOpacity="1"></stop>
                  <stop offset="80%" stopColor="#ffffff" stopOpacity="1"></stop>
                </linearGradient>
              </defs>
              <g transform="translate(900, 0)">
                <path d="M0 432.7C-32.7 374.6 -65.5 316.4 -126.7 305.8C-187.9 295.2 -277.6 332 -305.9 305.9C-334.3 279.9 -301.4 190.8 -312.3 129.3C-323.2 67.9 -377.9 33.9 -432.7 0L0 0Z" fill="#3ca9fa"></path>
              </g>
              <g transform="translate(0, 600)">
                <path d="M0 -432.7C67.6 -438.6 135.3 -444.5 165.6 -399.7C195.9 -354.9 188.9 -259.4 211.4 -211.4C234 -163.5 286.2 -163.2 328 -135.9C369.8 -108.6 401.2 -54.3 432.7 0L0 0Z" fill="#3ca9fa"></path>
              </g>
            </svg>
            <StatBody className="entrepreneur-pending-requests-body">
              <div className="entrepreneur-pending-requests-content flex items-center">
                <div className="entrepreneur-pending-requests-icon p-3 bg-primary-100 rounded-full mr-4">
                  <Bell size={20} className="text-primary-700" />
                </div>
                <div className="entrepreneur-pending-requests-text">
                  <p className="entrepreneur-pending-requests-label text-sm font-medium text-primary-700">Pending Requests</p>
                  <h3 className="entrepreneur-pending-requests-count text-xl font-semibold text-primary-900">{pendingRequests.length}</h3>
                </div>
              </div>
            </StatBody>
          </StatCard>
        </Suspense>

        <Suspense fallback={<SkeletonCard />}>
          <StatCard className="entrepreneur-total-connections-card border-secondary-100">
            <svg style={{ position: 'absolute', top: 0, left: 0, zIndex: -1, filter: 'blur(25px)', opacity: '20%', transform: 'scaleX(-1)' }} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1">
              <defs>
                <linearGradient id="grad1_1" x1="33.3%" y1="0%" x2="100%" y2="100%">
                  <stop offset="20%" stopColor="#ffffff" stopOpacity="1"></stop>
                  <stop offset="80%" stopColor="#ffffff" stopOpacity="1"></stop>
                </linearGradient>
              </defs>
              <defs>
                <linearGradient id="grad2_1" x1="0%" y1="0%" x2="66.7%" y2="100%">
                  <stop offset="20%" stopColor="#ffffff" stopOpacity="1"></stop>
                  <stop offset="80%" stopColor="#ffffff" stopOpacity="1"></stop>
                </linearGradient>
              </defs>
              <g transform="translate(900, 0)">
                <path d="M0 486.7C-45.8 437.6 -91.6 388.5 -154.2 372.3C-216.9 356.1 -296.3 372.8 -344.2 344.2C-392.1 315.6 -408.3 241.7 -426.8 176.8C-445.3 111.9 -466 55.9 -486.7 0L0 0Z" fill="#3cfad2"></path>
              </g>
              <g transform="translate(0, 600)">
                <path d="M0 -486.7C54.2 -448.2 108.4 -409.6 157.7 -380.6C207 -351.7 251.3 -332.4 304.1 -304.1C356.8 -275.7 417.9 -238.4 449.7 -186.3C481.5 -134.1 484.1 -67 486.7 0L0 0Z" fill="#3cfad2"></path>
              </g>
            </svg>
            <StatBody className="entrepreneur-total-connections-body">
              <div className="entrepreneur-total-connections-content flex items-center">
                <div className="entrepreneur-total-connections-icon p-3 bg-secondary-100 rounded-full mr-4">
                  <Users size={20} className="text-secondary-700" />
                </div>
                <div className="entrepreneur-total-connections-text">
                  <p className="entrepreneur-total-connections-label text-sm font-medium text-secondary-700">Total Connections</p>
                  <h3 className="entrepreneur-total-connections-count text-xl font-semibold text-secondary-900">
                    {collaborationRequests.filter(req => req.status === 'accepted').length}
                  </h3>
                </div>
              </div>
            </StatBody>
          </StatCard>
        </Suspense>

        <Suspense fallback={<SkeletonCard />}>
          <StatCard className="entrepreneur-upcoming-meetings-card border-accent-100">
            <svg style={{ position: 'absolute', top: 0, left: 0, zIndex: -1, filter: 'blur(25px)', opacity: '20%', transform: 'scaleX(-1)' }} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1">
              <defs>
                <linearGradient id="grad1_2" x1="33.3%" y1="0%" x2="100%" y2="100%">
                  <stop offset="20%" stopColor="#ffffff" stopOpacity="1"></stop>
                  <stop offset="80%" stopColor="#ffffff" stopOpacity="1"></stop>
                </linearGradient>
              </defs>
              <defs>
                <linearGradient id="grad2_2" x1="0%" y1="0%" x2="66.7%" y2="100%">
                  <stop offset="20%" stopColor="#ffffff" stopOpacity="1"></stop>
                  <stop offset="80%" stopColor="#ffffff" stopOpacity="1"></stop>
                </linearGradient>
              </defs>
              <g transform="translate(900, 0)">
                <path d="M0 432.7C-32.7 374.6 -65.5 316.4 -126.7 305.8C-187.9 295.2 -277.6 332 -305.9 305.9C-334.3 279.9 -301.4 190.8 -312.3 129.3C-323.2 67.9 -377.9 33.9 -432.7 0L0 0Z" fill="#fabb3c"></path>
              </g>
              <g transform="translate(0, 600)">
                <path d="M0 -432.7C67.6 -438.6 135.3 -444.5 165.6 -399.7C195.9 -354.9 188.9 -259.4 211.4 -211.4C234 -163.5 286.2 -163.2 328 -135.9C369.8 -108.6 401.2 -54.3 432.7 0L0 0Z" fill="#fabb3c"></path>
              </g>
            </svg>
            <StatBody className="entrepreneur-upcoming-meetings-body">
              <div className="entrepreneur-upcoming-meetings-content flex items-center">
                <div className="entrepreneur-upcoming-meetings-icon p-3 bg-accent-100 rounded-full mr-4">
                  <Calendar size={20} className="text-accent-700" />
                </div>
                <div className="entrepreneur-upcoming-meetings-text">
                  <p className="entrepreneur-upcoming-meetings-label text-sm font-medium text-accent-700">Upcoming Meetings</p>
                  <h3 className="entrepreneur-upcoming-meetings-count text-xl font-semibold text-accent-900">2</h3>
                </div>
              </div>
            </StatBody>
          </StatCard>
        </Suspense>

        <Suspense fallback={<SkeletonCard />}>
          <StatCard className="entrepreneur-profile-views-card border-success-100">
            <svg style={{ position: 'absolute', top: 0, left: 0, zIndex: -1, filter: 'blur(25px)', opacity: '20%', transform: 'scaleX(-1)' }} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1">
              <defs>
                <linearGradient id="grad1_3" x1="33.3%" y1="0%" x2="100%" y2="100%">
                  <stop offset="20%" stopColor="#ffffff" stopOpacity="1"></stop>
                  <stop offset="80%" stopColor="#ffffff" stopOpacity="1"></stop>
                </linearGradient>
              </defs>
              <defs>
                <linearGradient id="grad2_3" x1="0%" y1="0%" x2="66.7%" y2="100%">
                  <stop offset="20%" stopColor="#ffffff" stopOpacity="1"></stop>
                  <stop offset="80%" stopColor="#ffffff" stopOpacity="1"></stop>
                </linearGradient>
              </defs>
              <g transform="translate(900, 0)">
                <path d="M0 432.7C-32.7 374.6 -65.5 316.4 -126.7 305.8C-187.9 295.2 -277.6 332 -305.9 305.9C-334.3 279.9 -301.4 190.8 -312.3 129.3C-323.2 67.9 -377.9 33.9 -432.7 0L0 0Z" fill="#4dff8a"></path>
              </g>
              <g transform="translate(0, 600)">
                <path d="M0 -432.7C67.6 -438.6 135.3 -444.5 165.6 -399.7C195.9 -354.9 188.9 -259.4 211.4 -211.4C234 -163.5 286.2 -163.2 328 -135.9C369.8 -108.6 401.2 -54.3 432.7 0L0 0Z" fill="#4dff8a"></path>
              </g>
            </svg>
            <StatBody className="entrepreneur-profile-views-body">
              <div className="entrepreneur-profile-views-content flex items-center">
                <div className="entrepreneur-profile-views-icon p-3 bg-green-100 rounded-full mr-4">
                  <TrendingUp size={20} className="text-success-700" />
                </div>
                <div className="entrepreneur-profile-views-text">
                  <p className="entrepreneur-profile-views-label text-sm font-medium text-success-700">Profile Views</p>
                  <h3 className="entrepreneur-profile-views-count text-xl font-semibold text-success-900">24</h3>
                </div>
              </div>
            </StatBody>
          </StatCard>
        </Suspense>
      </div>
      
      {/* Collaboration Requests */}
      <Suspense fallback={<SkeletonCard />}>
        <Card className="entrepreneur-collaboration-requests-card dashboard-section page-section">
          <CardHeader className="entrepreneur-collaboration-requests-header flex justify-between items-center">
            <h2 className="entrepreneur-collaboration-requests-title text-lg font-medium text-gray-900">Collaboration Requests</h2>
            <Badge className="entrepreneur-collaboration-requests-badge" variant="primary">{pendingRequests.length} pending</Badge>
          </CardHeader>

          <CardBody className="entrepreneur-collaboration-requests-body">
          {collaborationRequests.length > 0 ? (
            <div className="entrepreneur-collaboration-requests-list grid grid-cols-1 lg:grid-cols-2 gap-4">
              {collaborationRequests.map(request => (
                <Suspense key={request.id} fallback={<SkeletonCard />}>
                  <CollaborationRequestCard
                    request={request}
                    onStatusUpdate={handleRequestStatusUpdate}
                  />
                </Suspense>
              ))}
            </div>
          ) : (
            <div className="entrepreneur-collaboration-requests-empty text-center py-8">
              <div className="entrepreneur-collaboration-requests-empty-icon inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <AlertCircle size={24} className="text-gray-500" />
              </div>
              <p className="entrepreneur-collaboration-requests-empty-text text-gray-600">No collaboration requests yet</p>
              <p className="entrepreneur-collaboration-requests-empty-subtext text-sm text-gray-500 mt-1">When investors are interested in your startup, their requests will appear here</p>
            </div>
          )}
        </CardBody>
      </Card>
      </Suspense>
      
      {/* Recommended Investors - Now at the bottom */}
      <Suspense fallback={<SkeletonCard />}>
        <Card className="entrepreneur-recommended-investors-card dashboard-section page-section">
          <CardHeader className="entrepreneur-recommended-investors-header flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="entrepreneur-recommended-investors-title-section flex items-center gap-3">
              <h2 className="entrepreneur-recommended-investors-title text-lg font-medium text-gray-900">Recommended Investors</h2>
              
            </div>
            <div className="entrepreneur-investors-filters flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="entrepreneur-search-input-wrapper w-full sm:w-64">
                <Input
                  className="entrepreneur-search-input"
                  placeholder="Search investors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setAppliedSearchQuery(searchQuery);
                    }
                  }}
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
          <Link to={ROUTES.INVESTORS} className="entrepreneur-view-all-link text-sm font-medium text-primary-600 hover:text-primary-500 w-[max-content] mt-2 sm:mt-0">
                View all
              </Link>
          <CardBody className="entrepreneur-investors-list-body space-y-4">
          {isLoading ? (
            <div className="entrepreneur-investors-skeleton">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <SkeletonCard key={`skeleton-${index}`} />
              ))}
            </div>
          ) : paginatedInvestors.length > 0 ? (
            <div className="entrepreneur-investors-list">
              {paginatedInvestors.map(investor => (
                <Suspense key={investor.id} fallback={<SkeletonCard />}>
                  <InvestorCard
                    investor={investor}
                    showActions={false}
                  />
                </Suspense>
              ))}
            </div>
          ) : (
            <div className="entrepreneur-no-results text-center py-8">
              <div className="entrepreneur-no-results-icon inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Users size={24} className="text-gray-500" />
              </div>
              <p className="entrepreneur-no-results-text text-gray-600">No investors match your filters</p>
              <p className="entrepreneur-no-results-subtext text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </CardBody>

        {/* Pagination */}
        {!isLoading && (
          <Pagination
            className="entrepreneur-pagination pb-4"
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </Card>
      </Suspense>
      
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
    </main>
  );
};

export const EntrepreneurDashboard = React.memo(EntrepreneurDashboardComponent);
