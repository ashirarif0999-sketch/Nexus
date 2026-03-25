import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { Input } from '../../components/ui/Input';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { SkeletonCard } from '../../components/ui/Skeleton';
import { FilterModal, FilterButton } from '../../components/ui/FilterModal';
import { EntrepreneurCard } from '../../components/entrepreneur/EntrepreneurCard';
import { entrepreneurs } from '../../data/users';

const ITEMS_PER_PAGE = 6;

export const EntrepreneursPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedFundingRange, setSelectedFundingRange] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [showIndustryModal, setShowIndustryModal] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  
  // Get unique industries and funding ranges
  const allIndustries = Array.from(new Set(entrepreneurs.map(e => e.industry)));
  const fundingRanges = ['< $500K', '$500K - $1M', '$1M - $5M', '> $5M'];
  
  // Filter entrepreneurs based on search and filters
  const filteredEntrepreneurs = entrepreneurs.filter(entrepreneur => {
    const matchesSearch = searchQuery === '' || 
      entrepreneur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.startupName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entrepreneur.pitchSummary.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesIndustry = selectedIndustries.length === 0 ||
      selectedIndustries.includes(entrepreneur.industry);
    
    // Simple funding range filter based on the amount string
    const matchesFunding = selectedFundingRange.length === 0 || 
      selectedFundingRange.some(range => {
        const amount = parseInt(entrepreneur.fundingNeeded.replace(/[^0-9]/g, ''));
        switch (range) {
          case '< $500K': return amount < 500;
          case '$500K - $1M': return amount >= 500 && amount <= 1000;
          case '$1M - $5M': return amount > 1000 && amount <= 5000;
          case '> $5M': return amount > 5000;
          default: return true;
        }
      });
    
    return matchesSearch && matchesIndustry && matchesFunding;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredEntrepreneurs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEntrepreneurs = filteredEntrepreneurs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

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
  }, [searchQuery, selectedIndustries, selectedFundingRange]);

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries(prev => 
      prev.includes(industry)
        ? prev.filter(i => i !== industry)
        : [...prev, industry]
    );
  };
  
  const toggleFundingRange = (range: string) => {
    setSelectedFundingRange(prev => 
      prev.includes(range)
        ? prev.filter(r => r !== range)
        : [...prev, range]
    );
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Find Startups</h1>
        <p className="text-gray-600">Discover promising startups looking for investment</p>
      </div>
      
      <div className="space-y-6">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3">
          <FilterButton
            label="Industry"
            count={allIndustries.length}
            selectedCount={selectedIndustries.length}
            onClick={() => setShowIndustryModal(true)}
          />
          <FilterButton
            label="Funding Range"
            count={fundingRanges.length}
            selectedCount={selectedFundingRange.length}
            onClick={() => setShowFundingModal(true)}
          />
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search startups by name, industry, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startAdornment={<Search size={18} />}
              fullWidth
            />
            
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                {filteredEntrepreneurs.length} results
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
              paginatedEntrepreneurs.map(entrepreneur => (
                <EntrepreneurCard
                  key={entrepreneur.id}
                  entrepreneur={entrepreneur}
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
        isOpen={showIndustryModal}
        onClose={() => setShowIndustryModal(false)}
        title="Industry"
        options={allIndustries.map(industry => ({ id: industry, label: industry }))}
        selectedOptions={selectedIndustries}
        onToggle={toggleIndustry}
        type="checkbox"
      />
      
      <FilterModal
        isOpen={showFundingModal}
        onClose={() => setShowFundingModal(false)}
        title="Funding Range"
        options={fundingRanges.map(range => ({ id: range, label: range }))}
        selectedOptions={selectedFundingRange}
        onToggle={toggleFundingRange}
        type="checkbox"
      />
    </div>
  );
};