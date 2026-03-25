import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, PieChart, Search, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { FilterModal, FilterButton } from '../../components/ui/FilterModal';
import { Pagination } from '../../components/ui/Pagination';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { BlurFadeIn } from '../../components/ui/BlurFadeIn';
import TextType from '../../components/ui/TextType';
import { useAuth } from '../../context/AuthContext';
import { Entrepreneur } from '../../types';
import { entrepreneurs } from '../../data/users';
import { getRequestsFromInvestor } from '../../data/collaborationRequests';
import { useDebounce } from '../../hooks/useDebounce';

const ITEMS_PER_PAGE = 6;

const InvestorDashboardComponent: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter modal state
  const [isIndustryModalOpen, setIsIndustryModalOpen] = useState(false);

  // Debounced search for performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  if (!user) return null;
  
  // Get collaboration requests sent by this investor
  const sentRequests = useMemo(() => getRequestsFromInvestor(user.id), [user.id]);
  const requestedEntrepreneurIds = useMemo(() => sentRequests.map(req => req.entrepreneurId), [sentRequests]);
  
  // Filter entrepreneurs based on search and industry filters
  const filteredEntrepreneurs = useMemo(() => {
    return entrepreneurs.filter(entrepreneur => {
      // Search filter
      const matchesSearch = debouncedSearchQuery === '' ||
        entrepreneur.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        entrepreneur.startupName.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        entrepreneur.industry.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        entrepreneur.pitchSummary.toLowerCase().includes(debouncedSearchQuery.toLowerCase());

      // Industry filter
      const matchesIndustry = selectedIndustries.length === 0 ||
        selectedIndustries.includes(entrepreneur.industry);

      return matchesSearch && matchesIndustry;
    });
  }, [entrepreneurs, debouncedSearchQuery, selectedIndustries]);
  
  // Get unique industries for filters
  const industries = useMemo(() => Array.from(new Set(entrepreneurs.map(e => e.industry))), [entrepreneurs]);

  // Prepare filter options for modal
  const industryOptions = useMemo(() => industries.map(i => ({ id: i, label: i })), [industries]);

  // Pagination calculations
  const totalPages = useMemo(() => Math.ceil(filteredEntrepreneurs.length / ITEMS_PER_PAGE), [filteredEntrepreneurs.length]);
  const paginatedEntrepreneurs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEntrepreneurs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredEntrepreneurs, currentPage]);
  
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
  
  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery, selectedIndustries]);
  
  // Toggle industry selection
  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prevSelected => 
      prevSelected.includes(industry)
        ? prevSelected.filter(i => i !== industry)
        : [...prevSelected, industry]
    );
  };
  

  
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <BlurFadeIn>
            <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
          </BlurFadeIn>
          <TextType
            text={["Discover promising startups", "Find your next investment", "Connect with entrepreneurs"]}
            typingSpeed={75}
            pauseDuration={2000}
            deletingSpeed={50}
            showCursor={true}
            cursorCharacter="|"
          />
        </div>
        
        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-2/3">
            <Input
              placeholder="Search startups, industries, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
              startAdornment={<Search size={18} />}
            />
          </div>

          <div className="w-full md:w-1/3 flex gap-2 items-center">
            <FilterButton
              label="Industry"
              count={industries.length}
              selectedCount={selectedIndustries.length}
              onClick={() => setIsIndustryModalOpen(true)}
            />

            <Link to="/entrepreneurs">
              <Button
                leftIcon={<PlusCircle size={18} />}
                size="sm"
              >
                View All Startups
              </Button>
            </Link>
          </div>
        </div>
      </div>
      
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary-50 border border-primary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-primary-100 rounded-full mr-4">
                <Users size={20} className="text-primary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-primary-700">Total Startups</p>
                <h3 className="text-xl font-semibold text-primary-900">{entrepreneurs.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-secondary-50 border border-secondary-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-secondary-100 rounded-full mr-4">
                <PieChart size={20} className="text-secondary-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-700">Industries</p>
                <h3 className="text-xl font-semibold text-secondary-900">{industries.length}</h3>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="bg-accent-50 border border-accent-100">
          <CardBody>
            <div className="flex items-center">
              <div className="p-3 bg-accent-100 rounded-full mr-4">
                <Users size={20} className="text-accent-700" />
              </div>
              <div>
                <p className="text-sm font-medium text-accent-700">Your Connections</p>
                <h3 className="text-xl font-semibold text-accent-900">
                  {sentRequests.filter(req => req.status === 'accepted').length}
                </h3>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Entrepreneurs grid */}
      <div>
        <Card>
          <CardHeader>
            <h2 className="text-lg font-medium text-gray-900">Featured Startups</h2>
          </CardHeader>
          
          <CardBody>
            {filteredEntrepreneurs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 scroll-performance-optimized" style={{ contain: 'layout style', willChange: 'transform' }}>
                  {isLoading ? (
                    Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                      <SkeletonCard key={`skeleton-${index}`} />
                    ))
                  ) : (
                    paginatedEntrepreneurs.map(entrepreneur => (
                      <EntrepreneurCard
                        key={entrepreneur.id}
                        entrepreneur={entrepreneur}
                      />
                    ))
                  )}
                </div>
                
                {/* Pagination */}
                {!isLoading && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    className="pt-6"
                  />
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">No startups match your filters</p>
                <Button 
                  variant="outline" 
                  className="mt-2"
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
      </div>
    </div>
  );
};

export const InvestorDashboard = React.memo(InvestorDashboardComponent);
