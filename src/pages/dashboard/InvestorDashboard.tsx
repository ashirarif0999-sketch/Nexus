import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Users, PieChart, Search, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
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
        <div className="investor-filters flex flex-col md:flex-row gap-4">
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
          </div>

          <div className="investor-filter-actions w-full md:w-1/3 flex gap-2 items-center">
            <FilterButton
              label="Industry"
              count={industries.length}
              selectedCount={selectedIndustries.length}
              onClick={() => setIsIndustryModalOpen(true)}
            />

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
          <Card className="investor-total-startups-card bg-primary-50 border border-primary-100">
            <CardBody className="investor-total-startups-body">
              <div className="investor-total-startups-content flex items-center">
                <div className="investor-total-startups-icon p-3 bg-primary-100 rounded-full mr-4">
                  <Users size={20} className="text-primary-700" />
                </div>
                <div className="investor-total-startups-text">
                  <p className="investor-total-startups-label text-sm font-medium text-primary-700">Total Startups</p>
                  <h3 className="investor-total-startups-count text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3>
                </div>
              </div>
            </CardBody>
          </Card>
        </Suspense>

        <Suspense fallback={<SkeletonCard />}>
          <Card className="investor-industries-card bg-secondary-50 border border-secondary-100">
            <CardBody className="investor-industries-body">
              <div className="investor-industries-content flex items-center">
                <div className="investor-industries-icon p-3 bg-secondary-100 rounded-full mr-4">
                  <PieChart size={20} className="text-secondary-700" />
                </div>
                <div className="investor-industries-text">
                  <p className="investor-industries-label text-sm font-medium text-secondary-700">Industries</p>
                  <h3 className="investor-industries-count text-xl font-semibold text-secondary-900">{industries.length}</h3>
                </div>
              </div>
            </CardBody>
          </Card>
        </Suspense>

        <Suspense fallback={<SkeletonCard />}>
          <Card className="investor-connections-card bg-accent-50 border border-accent-100">
            <CardBody className="investor-connections-body">
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
            </CardBody>
          </Card>
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
