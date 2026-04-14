import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import Sticky from 'react-stickynode';
import { Input } from '../../components/ui/Input';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { FilterModal, FilterButton } from '../../components/ui/FilterModal';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { investors } from '../../data/users';

const ITEMS_PER_PAGE = 6;

export const InvestorsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth < 950);

  // Modal states
  const [showStageModal, setShowStageModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);

  // Pending filter states for modal
  const [pendingStages, setPendingStages] = useState<string[]>([]);
  const [pendingInterests, setPendingInterests] = useState<string[]>([]);

  // Ref to store loading timeout
  const loadingTimeoutRef = useRef<number | null>(null);
  
  // Get unique investment stages and interests
  const allStages = useMemo(() => Array.from(new Set(investors.flatMap(i => i.investmentStage))), []);
  const allInterests = useMemo(() => Array.from(new Set(investors.flatMap(i => i.investmentInterests))), []);
  
  // Filter investors based on search and filters
  const filteredInvestors = useMemo(() => {
    return investors.filter(investor => {
      const matchesSearch = appliedSearchQuery === '' ||
        investor.name.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
        investor.bio.toLowerCase().includes(appliedSearchQuery.toLowerCase()) ||
        investor.investmentInterests.some(interest =>
          interest.toLowerCase().includes(appliedSearchQuery.toLowerCase())
        );

      const matchesStages = selectedStages.length === 0 ||
        investor.investmentStage.some(stage => selectedStages.includes(stage));

      const matchesInterests = selectedInterests.length === 0 ||
        investor.investmentInterests.some(interest => selectedInterests.includes(interest));

      return matchesSearch && matchesStages && matchesInterests;
    });
  }, [appliedSearchQuery, selectedStages, selectedInterests]);

  // Pagination calculations
  const totalPages = useMemo(() => Math.ceil(filteredInvestors.length / ITEMS_PER_PAGE), [filteredInvestors.length]);
  const paginatedInvestors = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvestors.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredInvestors, currentPage]);

  // Simulate loading when page changes
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      // Clear any existing timeout
      if (loadingTimeoutRef.current !== null) {
        clearTimeout(loadingTimeoutRef.current);
      }
      setIsLoading(true);
      setCurrentPage(page);
      // Simulate network delay for loading skeletons
      loadingTimeoutRef.current = window.setTimeout(() => {
        setIsLoading(false);
        loadingTimeoutRef.current = null;
      }, 500);
    }
  }, [totalPages]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [appliedSearchQuery, selectedStages, selectedInterests]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current !== null) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Handle screen size changes with debouncing
  useEffect(() => {
    let timeoutId: number;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setIsSmallScreen(window.innerWidth < 950);
      }, 100); // Debounce by 100ms
    };
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle opening modals with pending state
  const openStageModal = useCallback(() => {
    setPendingStages([...selectedStages]);
    setShowStageModal(true);
  }, [selectedStages]);

  const openInterestModal = useCallback(() => {
    setPendingInterests([...selectedInterests]);
    setShowInterestModal(true);
  }, [selectedInterests]);

  // Toggle pending filters
  const togglePendingStage = useCallback((stage: string) => {
    setPendingStages(prev =>
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  }, []);

  const togglePendingInterest = useCallback((interest: string) => {
    setPendingInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  }, []);

  // Apply filters with loading
  const applyStageFilters = useCallback(() => {
    if (loadingTimeoutRef.current !== null) {
      clearTimeout(loadingTimeoutRef.current);
    }
    setIsLoading(true);
    setSelectedStages(pendingStages);
    loadingTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
      loadingTimeoutRef.current = null;
    }, 300);
    setShowStageModal(false);
  }, [pendingStages]);

  const applyInterestFilters = useCallback(() => {
    if (loadingTimeoutRef.current !== null) {
      clearTimeout(loadingTimeoutRef.current);
    }
    setIsLoading(true);
    setSelectedInterests(pendingInterests);
    loadingTimeoutRef.current = window.setTimeout(() => {
      setIsLoading(false);
      loadingTimeoutRef.current = null;
    }, 300);
    setShowInterestModal(false);
  }, [pendingInterests]);

  // Memoize options for modals to prevent unnecessary re-renders
  const stageOptions = useMemo(() =>
    allStages.map(stage => ({ id: stage, label: stage })), [allStages]
  );
  const interestOptions = useMemo(() =>
    allInterests.map(interest => ({ id: interest, label: interest })), [allInterests]
  );

  return (
    <div className="investors-page page-main-content space-y-6 animate-fade-in">
      <div className="investors-header page-header">
        <h1 className="investors-title text-2xl font-bold text-gray-900">Find Investors</h1>
        <p className="investors-subtitle text-gray-600">Connect with investors who match your startup's needs</p>
      </div>
      
      <div className="investors-content page-content space-y-6">
        {/* Filter Buttons */}
        <div className="investors-filters page-filters flex flex-wrap gap-3">
          <FilterButton
            label="Investment Stage"
            count={allStages.length}
            selectedCount={selectedStages.length}
            onClick={openStageModal}
          />
          <FilterButton
            label="Investment Interests"
            count={allInterests.length}
            selectedCount={selectedInterests.length}
            onClick={openInterestModal}
          />
        </div>
        
        {/* Main content */}
        <div className="investors-main page-main">
          <Sticky top={isSmallScreen ? 63 :0} innerZ={1}>
            <div className="investors-search-section page-search flex items-center gap-4 mb-6">
            <Input
              className="investors-search-input flex-1"
              placeholder="Search investors by name, interests, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setAppliedSearchQuery(searchQuery);
                }
              }}
              startAdornment={<Search size={18} />}
            />
            
            
            <div className="investors-results-count flex items-center gap-2 whitespace-nowrap">
              <Filter size={18} className="text-gray-500" />
              <span className="investors-results-text text-sm text-gray-600">
                {filteredInvestors.length} results
              </span>
            </div>
            </div>
          </Sticky>

          <div className="investors-grid page-grid grid grid-cols-1 md:grid-cols-2 gap-6">
            {isLoading ? (
              // Show skeleton cards while loading
              Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <SkeletonCard key={`skeleton-${index}`} />
              ))
            ) : (
              paginatedInvestors.map(investor => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="investors-pagination page-pagination flex justify-center items-center gap-2 py-6">
              <button
                className="investors-pagination-prev p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={20} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={clsx(
                    'investors-pagination-page w-10 h-10 rounded-md font-medium',
                    currentPage === page
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  )}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
              
              <button
                className="investors-pagination-next p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modals */}
      <FilterModal
        isOpen={showStageModal}
        onClose={() => setShowStageModal(false)}
        onApply={applyStageFilters}
        title="Investment Stage"
        options={stageOptions}
        selectedOptions={pendingStages}
        onToggle={togglePendingStage}
        type="checkbox"
      />

      <FilterModal
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        onApply={applyInterestFilters}
        title="Investment Interests"
        options={interestOptions}
        selectedOptions={pendingInterests}
        onToggle={togglePendingInterest}
        type="badge"
      />
    </div>
  );
};