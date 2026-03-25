import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { FilterModal, FilterButton } from '../../components/ui/FilterModal';
import { InvestorCard } from '../../components/investor/InvestorCard';
import { investors } from '../../data/users';

const ITEMS_PER_PAGE = 6;

export const InvestorsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [showStageModal, setShowStageModal] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);
  
  // Get unique investment stages and interests
  const allStages = Array.from(new Set(investors.flatMap(i => i.investmentStage)));
  const allInterests = Array.from(new Set(investors.flatMap(i => i.investmentInterests)));
  
  // Filter investors based on search and filters
  const filteredInvestors = investors.filter(investor => {
    const matchesSearch = searchQuery === '' || 
      investor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investor.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      investor.investmentInterests.some(interest => 
        interest.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStages = selectedStages.length === 0 ||
      investor.investmentStage.some(stage => selectedStages.includes(stage));
    
    const matchesInterests = selectedInterests.length === 0 ||
      investor.investmentInterests.some(interest => selectedInterests.includes(interest));
    
    return matchesSearch && matchesStages && matchesInterests;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredInvestors.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInvestors = filteredInvestors.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Simulate loading when page changes
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setIsLoading(true);
      setCurrentPage(page);
      // Simulate network delay for loading skeletons
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStages, selectedInterests]);

  const toggleStage = (stage: string) => {
    setSelectedStages(prev => 
      prev.includes(stage)
        ? prev.filter(s => s !== stage)
        : [...prev, stage]
    );
  };
  
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Investors</h1>
        <p className="text-gray-600">Connect with investors who match your startup's needs</p>
      </div>
      
      <div className="space-y-6">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          <FilterButton
            label="Investment Stage"
            count={allStages.length}
            selectedCount={selectedStages.length}
            onClick={() => setShowStageModal(true)}
          />
          <FilterButton
            label="Investment Interests"
            count={allInterests.length}
            selectedCount={selectedInterests.length}
            onClick={() => setShowInterestModal(true)}
          />
        </div>
        
        {/* Main content */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <Input
              placeholder="Search investors by name, interests, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {filteredInvestors.length} results
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <div className="flex justify-center items-center gap-2 py-6">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={clsx(
                    'w-10 h-10 rounded-md font-medium',
                    currentPage === page
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  )}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
        title="Investment Stage"
        options={allStages.map(stage => ({ id: stage, label: stage }))}
        selectedOptions={selectedStages}
        onToggle={toggleStage}
        type="checkbox"
      />
      
      <FilterModal
        isOpen={showInterestModal}
        onClose={() => setShowInterestModal(false)}
        title="Investment Interests"
        options={allInterests.map(interest => ({ id: interest, label: interest }))}
        selectedOptions={selectedInterests}
        onToggle={toggleInterest}
        type="badge"
      />
    </div>
  );
};