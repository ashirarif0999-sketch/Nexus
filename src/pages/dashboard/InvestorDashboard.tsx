import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Users, PieChart, Search, PlusCircle, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { FilterModal, FilterButton } from '../../components/ui/FilterModal';
import { Pagination } from '../../components/ui/Pagination';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { BlurFadeIn } from '../../components/ui/BlurFadeIn';
import TextType from '../../components/ui/TextType';
import { useAuth } from '../../context/AuthContext';
import { Entrepreneur } from '../../types';
import { getRequestsFromInvestor } from '../../data/collaborationRequests';
import { ROUTES } from '../../config/routes';

// Lazy load heavy components for better initial load performance
const Card = lazy(() => import('../../components/ui/Card').then(module => ({ default: module.Card })));
const CardBody = lazy(() => import('../../components/ui/Card').then(module => ({ default: module.CardBody })));
const CardHeader = lazy(() => import('../../components/ui/Card').then(module => ({ default: module.CardHeader })));
const EntrepreneurCard = lazy(() => import('../../components/entrepreneur/EntrepreneurCard').then(module => ({ default: module.EntrepreneurCard })));

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

const InvestorDashboardComponent: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [entrepreneurs, setEntrepreneurs] = useState<any[]>([]);

  // Filter modal state
  const [isIndustryModalOpen, setIsIndustryModalOpen] = useState(false);

  // Lazy load entrepreneurs data when component mounts
  React.useEffect(() => {
    import('../../data/users').then(module => {
      setEntrepreneurs(module.entrepreneurs);
    });
  }, []);

  if (!user) return null;

  // Get collaboration requests sent by this investor
  const sentRequests = useMemo(() => getRequestsFromInvestor(user.id), [user.id]);
  const requestedEntrepreneurIds = useMemo(() => sentRequests.map(req => req.entrepreneurId), [sentRequests]);

  // Filter entrepreneurs based on search and industry filters
  const filteredEntrepreneurs = useMemo(() => {
    return entrepreneurs.filter((entrepreneur: any) => {
      // Search filter
      const matchesSearch = appliedSearchQuery === '' ||
        entrepreneur.name.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
        entrepreneur.startupName.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
        entrepreneur.industry.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
        entrepreneur.pitchSummary.toLowerCase().includes(appliedSearchQuery.toLowerCase());

      // Industry filter
      const matchesIndustry = selectedIndustries.length === 0 ||
        selectedIndustries.includes(entrepreneur.industry);

      return matchesSearch && matchesIndustry;
    });
  }, [entrepreneurs, appliedSearchQuery, selectedIndustries]);

  // Get unique industries for filters
  const industries = useMemo(() => Array.from(new Set(entrepreneurs.map((e: any) => e.industry))), [entrepreneurs]);

  // Prepare filter options for modal
  const industryOptions = useMemo(() => industries.map(i => ({ id: i, label: i })), [industries]);

  // Pagination calculations
  const totalPages = useMemo(() => Math.ceil(filteredEntrepreneurs.length / ITEMS_PER_PAGE), [filteredEntrepreneurs.length]);
  const paginatedEntrepreneurs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntrepreneurs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEntrepreneurs, currentPage]);
  
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

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearchQuery, selectedIndustries]);

  // Toggle industry selection - memoized for performance
  const toggleIndustry = useCallback((industry: string) => {
    setSelectedIndustries(prevSelected =>
      prevSelected.includes(industry)
        ? prevSelected.filter(i => i !== industry)
        : [...prevSelected, industry]
    );
  }, []);
  

  
  return (
    <main className="nexus-investor-dashboard dashboard-main-content page-main-content space-y-6 animate-fade-in">
      <header className="nexus-investor-header dashboard-header page-header flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <section className="nexus-investor-welcome">
          <BlurFadeIn>
            <h1 className="nexus-investor-title text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          </BlurFadeIn>
          <TextType
            className="nexus-investor-subtitle"
            text={["Discover promising startups", "Find your next investment", "Connect with entrepreneurs"]}
            typingSpeed={75}
            pauseDuration={2000}
            deletingSpeed={50}
            showCursor={true}
            cursorCharacter="|"
          />
        </section>
        
        {/* Filters and search */}
        
        <div className="investor-filters flex flex-col md:flex-row gap-2">
          

          <div className="investor-search-wrapper w-full md:w-2/3">
          
            <Input
              className="investor-search-input"
              placeholder="Search startups, industries, or keywords..."
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
            <button
              onClick={() => setIsIndustryModalOpen(true)}
              className={clsx(
                'filter-button-icon flex items-center gap-2 px-2 py-1 border transition-colors rounded-[8px]',
                selectedIndustries.length > 0
                  ? 'bg-[#405CFF] text-white'
                  : 'border-gray-300 bg-white text-gray-700 '
              )}
            >
              <SlidersHorizontal size={18} />
              <span className={clsx(
                "filter-button-count text-xs px-2 py-0.5 rounded-full",
                selectedIndustries.length > 0
                  ? 'bg-[white] text-black'
                  : ' bg-white text-gray-700'
              )}>
                {selectedIndustries.length > 0 ? selectedIndustries.length : industries.length}
              </span>
            </button>
          </div>

          <div className="investor-filter-actions w-full md:w-1/3 flex gap-2 items-center">
            
            <Link to={ROUTES.ENTREPRENEURS} className="investor-view-all-link">
              <Button
                className="investor-view-all-btn"
                leftIcon={<PlusCircle size={18} />}
                size="sm"
              >
                View All Startups
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Industry Filter Modal */}
      <FilterModal
        isOpen={isIndustryModalOpen}
        onClose={() => setIsIndustryModalOpen(false)}
        title="Filter by Industry"
        options={industryOptions}
        selectedOptions={selectedIndustries}
        onToggle={toggleIndustry}
        type="checkbox"
      />
      
      {/* Stats summary */}
      <div className="investor-stats-summary dashboard-stats page-stats grid grid-cols-1 md:grid-cols-3 gap-4">
        <Suspense fallback={<SkeletonCard />}>
          <StatCard className="investor-total-startups-card border-primary-100">
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
            <StatBody className="investor-total-startups-body">
              <div className="investor-total-startups-content flex items-center">
                <div className="investor-total-startups-icon p-3 bg-primary-100 rounded-full mr-4">
                  <Users size={20} className="text-primary-700" />
                </div>
                <div className="investor-total-startups-text">
                  <p className="investor-total-startups-label text-sm font-medium text-primary-700">Total Startups</p>
                  <h3 className="investor-total-startups-count text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3>
                </div>
              </div>
            </StatBody>
          </StatCard>
        </Suspense>

        <Suspense fallback={<SkeletonCard />}>
          <StatCard className="investor-industries-card border-secondary-100">
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
                <path d="M0 486.7C-45.8 437.6 -91.6 388.5 -154.2 372.3C-216.9 356.1 -296.3 372.8 -344.2 344.2C-392.1 315.6 -408.3 241.7 -426.8 176.8C-445.3 111.9 -466 55.9 -486.7 0L0 0Z" fill="#3cfad2"></path>
              </g>
              <g transform="translate(0, 600)">
                <path d="M0 -486.7C54.2 -448.2 108.4 -409.6 157.7 -380.6C207 -351.7 251.3 -332.4 304.1 -304.1C356.8 -275.7 417.9 -238.4 449.7 -186.3C481.5 -134.1 484.1 -67 486.7 0L0 0Z" fill="#3cfad2"></path>
              </g>
            </svg>
            
            <StatBody className="investor-industries-body">
              <div className="investor-industries-content flex items-center">
                <div className="investor-industries-icon p-3 bg-secondary-100 rounded-full mr-4">
                  <PieChart size={20} className="text-secondary-700" />
                </div>
                <div className="investor-industries-text">
                  <p className="investor-industries-label text-sm font-medium text-secondary-700">Industries</p>
                  <h3 className="investor-industries-count text-xl font-semibold text-secondary-900">{industries.length}</h3>
                </div>
              </div>
            </StatBody>
          </StatCard>
        </Suspense>

        <Suspense fallback={<SkeletonCard />}>
          <StatCard className="investor-connections-card border-accent-100">
            <svg style={{ position: 'absolute', top: 0, left: 0, zIndex: -1, filter: 'blur(25px)', opacity: '30%', transform: 'scaleX(-1)' }} viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" version="1.1">
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
                <path d="M0 432.7C-32.7 374.6 -65.5 316.4 -126.7 305.8C-187.9 295.2 -277.6 332 -305.9 305.9C-334.3 279.9 -301.4 190.8 -312.3 129.3C-323.2 67.9 -377.9 33.9 -432.7 0L0 0Z" fill="#fabb3c"></path>
              </g>
              <g transform="translate(0, 600)">
                <path d="M0 -432.7C67.6 -438.6 135.3 -444.5 165.6 -399.7C195.9 -354.9 188.9 -259.4 211.4 -211.4C234 -163.5 286.2 -163.2 328 -135.9C369.8 -108.6 401.2 -54.3 432.7 0L0 0Z" fill="#fabb3c"></path>
              </g>
            </svg>
            <StatBody className="investor-connections-body">
              <div className="investor-connections-content flex items-center">
                <div className="investor-connections-icon p-3 bg-accent-100 rounded-full mr-4">
                  <Users size={20} className="text-accent-700" />
                </div>
                <div className="investor-connections-text">
                  <p className="investor-connections-label text-sm font-medium text-accent-700">Your Connections</p>
                  <h3 className="investor-connections-count text-xl font-semibold text-accent-900">
                    {sentRequests.filter(req => req.status === 'accepted').length}
                  </h3>
                </div>
              </div>
            </StatBody>
          </StatCard>
        </Suspense>
      </div>
      
      {/* Entrepreneurs grid */}
      <div className="investor-entrepreneurs-section dashboard-section page-section">
        <Suspense fallback={<SkeletonCard />}>
          <Card className="investor-featured-startups-card dashboard-section page-section">
            <CardHeader className="investor-featured-startups-header">
              <h2 className="investor-featured-startups-title text-lg font-medium text-gray-900">Featured Startups</h2>
            </CardHeader>

            <CardBody className="investor-featured-startups-body">
            {filteredEntrepreneurs.length > 0 ? (
              <>
                <div className="investor-entrepreneurs-grid grid grid-cols-1 lg:grid-cols-2 gap-4 scroll-performance-optimized" style={{ contain: 'layout style', willChange: 'transform' }}>
                  {isLoading ? (
                    Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                      <SkeletonCard key={`skeleton-${index}`} />
                    ))
                  ) : (
                    paginatedEntrepreneurs.map(entrepreneur => (
                      <Suspense key={entrepreneur.id} fallback={<SkeletonCard />}>
                        <EntrepreneurCard
                          entrepreneur={entrepreneur}
                        />
                      </Suspense>
                    ))
                  )}
                </div>
                
                {/* Pagination */}
                {!isLoading && (
                  <Pagination
                    className="investor-pagination pt-6"
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            ) : (
              <div className="investor-no-results text-center py-8">
                <p className="investor-no-results-text text-gray-600">No startups match your filters</p>
                <Button 
                  variant="outline" 
                  className="investor-clear-filters-btn mt-2"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedIndustries([]);
                  }}
                >
                  Clear filters
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
        </Suspense>
      </div>
    </main>
  );
};

export const InvestorDashboard = React.memo(InvestorDashboardComponent);
