import React, { useState, useEffect, useMemo, memo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Users, Target, MessageCircle, FileText, ArrowRight, Grid, List as ListIcon, ChevronDown, SlidersHorizontal, Home, Briefcase, Calendar, Settings, HelpCircle } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import './SearchResultsPage.css';

const ResultsDisplay = memo<{
  filteredResults: any[];
  viewMode: 'grid' | 'list';
  openAccordions: Record<string, boolean>;
  toggleAccordion: (key: string) => void;
  navigate: (path: string) => void;
}>(({ filteredResults, viewMode, openAccordions, toggleAccordion, navigate }) => {
  const accordionTypes = [
    { key: 'navigation', label: 'Navigation', icon: FileText, typeKey: 'navigation' },
    { key: 'people', label: 'People', icon: Users, typeKey: 'people' },
    { key: 'messages', label: 'Messages', icon: MessageCircle, typeKey: 'message' },
  ];

  const getNavigationIcon = (title: string) => {
    switch (title) {
      case 'Dashboard': return <Home size={20} />;
      case 'Investors': return <Users size={20} />;
      case 'Entrepreneurs': return <Briefcase size={20} />;
      case 'Messages': return <MessageCircle size={20} />;
      case 'Calendar': return <Calendar size={20} />;
      case 'Documents': return <FileText size={20} />;
      case 'Settings': return <Settings size={20} />;
      case 'Help & FAQ': return <HelpCircle size={20} />;
      default: return <FileText size={20} />;
    }
  };

  return (
    <div>
      <div className="accordion-container-wrapped">
        {accordionTypes.map((type) => {
          const typeResults = filteredResults.filter(r => r.type === type.typeKey);
          if (typeResults.length === 0) return null;
          const Icon = type.icon;
          return (
            <div key={type.key} className="accordion">
              <div className="accordion-header" onClick={() => toggleAccordion(type.key)}>
                <div className="accordion-title">
                  <Icon size={20} />
                  <span>{type.label}</span>
                  <span className="count">({typeResults.length})</span>
                </div>
                <ChevronDown className={`accordion-chevron ${openAccordions[type.key] ? 'open' : ''}`} size={16} />
              </div>
              {openAccordions[type.key] && (
                <div className="accordion-content">
                  <div className={`results-grid ${viewMode}`}>
                    {typeResults.map((result) => (
                      <div key={result.id} className={`result-card result-card-${result.type}`} onClick={() => navigate(result.path || '#')}>
                        <div className="card-type-icon">
                          {result.type === 'people' ? (
                            result.avatarUrl ? (
                              <img src={result.avatarUrl} alt={result.title} className="avatar-img" />
                            ) : (
                              <div className="avatar-letter">{result.title.charAt(0).toUpperCase()}</div>
                            )
                          ) : result.type === 'opportunity' && <Target size={20} />}
                          {result.type === 'message' && <MessageCircle size={20} />}
                          {result.type === 'navigation' && getNavigationIcon(result.title)}
                        </div>
                        <div className="card-content">
                          <div className="card-header">
                            <span className="card-category">{result.type}</span>
                            {result.matchScore && <span className="card-match">{result.matchScore}% Match</span>}
                          </div>
                          <h2 className="card-title">{result.title}</h2>
                          <p className="card-subtitle">{result.subtitle}</p>
                          {result.metadata && <div className="card-meta">{result.metadata}</div>}
                          <div className="card-footer">
                            <button className="view-btn">View Details <ArrowRight size={14} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredResults.some(r => r.type === 'post') && (
        <div className="posts-section">
          <h3 className="section-title">
            <FileText size={20} />
            Posts <span className="count">({filteredResults.filter(r => r.type === 'post').length})</span>
          </h3>
          <div className={`results-grid ${viewMode}`}>
            {filteredResults.filter(r => r.type === 'post').map((result) => (
              <div key={result.id} className={`result-card result-card-${result.type}`} onClick={() => navigate(result.path || '#')}>
                <div className="card-type-icon">
                  <FileText size={20} />
                </div>
                <div className="card-content">
                  <div className="card-header">
                    <span className="card-category">Post</span>
                    {result.matchScore && <span className="card-match">{result.matchScore}% Match</span>}
                  </div>
                  <h2 className="card-title">{result.title}</h2>
                  <p className="card-subtitle">{result.subtitle}</p>
                  {result.metadata && <div className="card-meta">{result.metadata}</div>}
                  <div className="card-footer">
                    <button className="view-btn">View Details <ArrowRight size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || '';
  const { results, query, setSearchQuery, isSearching, suggestion } = useSearch();

  const [localQuery, setLocalQuery] = useState(initialQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({ navigation: false, people: false, messages: false });
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['all']);
  const [selectedSort, setSelectedSort] = useState('relevance');

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      setLocalQuery(initialQuery);
    }
  }, [initialQuery, setSearchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(localQuery);
    navigate(`/search?q=${localQuery}`);
  };

  const handleSuggestionClick = (suggested: string) => {
    setLocalQuery(suggested);
    setSearchQuery(suggested);
    navigate(`/search?q=${suggested}`);
  };

  const toggleAccordion = useCallback((key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories(prev => {
      if (category === 'all') {
        return ['all'];
      } else {
        let newSelected = prev.filter(c => c !== 'all');
        if (prev.includes(category)) {
          newSelected = newSelected.filter(c => c !== category);
          if (newSelected.length === 0) newSelected = ['all'];
        } else {
          newSelected.push(category);
        }
        return newSelected;
      }
    });
  }, []);

  // Sort and filter results with memoization
  const sortedResults = useMemo(() => {
    let sorted = [...results];
    if (selectedSort === 'date') {
      sorted = sorted.sort((a, b) => (b.timestamp ? new Date(b.timestamp).getTime() : 0) - (a.timestamp ? new Date(a.timestamp).getTime() : 0));
    } else if (selectedSort === 'name') {
      sorted = sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    // relevance is default order
    return sorted;
  }, [results, selectedSort]);

  const filteredResults = useMemo(() => {
    if (!selectedCategories.includes('all')) {
      return sortedResults.filter(r => selectedCategories.includes(r.type));
    }
    return sortedResults;
  }, [sortedResults, selectedCategories]);

  return (
    <div className="search-results-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Search Results</h1>
          <form className="main-search-bar" onSubmit={handleSearch}>
            <SearchIcon className="search-icon" size={20} />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Search anything..."
            />
            <button type="submit" className="search-submit">Search</button>
            <button type="button" className="filter-btn" onClick={() => setFilterModalOpen(true)}>
              <SlidersHorizontal size={20} />
            </button>
          </form>

        </div>
      </div>

      <div className="results-container">
        <main className="results-main">
          <div className="results-toolbar">
            <div className="toolbar-info">
              {filteredResults.length > 0 ? (
                <>Showing {filteredResults.length} results for <strong>"{query || localQuery}"</strong></>
              ) : (
                <>No exact results for <strong>"{query || localQuery}"</strong></>
              )}
            </div>
            <div className="toolbar-actions">
              <div className="view-toggle">
                <button
                  className={viewMode === 'list' ? 'active' : ''}
                  onClick={() => setViewMode('list')}
                >
                  <ListIcon size={18} />
                </button>
                <button
                  className={viewMode === 'grid' ? 'active' : ''}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid size={18} />
                </button>
              </div>
            </div>
          </div>

          {suggestion && filteredResults.length === 0 && (
            <div className="did-you-mean">
              Did you mean: <button className="suggestion-link" onClick={() => handleSuggestionClick(suggestion.text)}>{suggestion.text}</button>?
            </div>
          )}

          {isSearching ? (
            <div className="results-loading">
              <div className="spinner-large"></div>
              <p>Searching...</p>
            </div>
          ) : filteredResults.length > 0 ? (
            <ResultsDisplay
              filteredResults={filteredResults}
              viewMode={viewMode}
              openAccordions={openAccordions}
              toggleAccordion={toggleAccordion}
              navigate={navigate}
            />
          ) : (
            <div className="no-results-large">
              <div className="no-results-icon">
                <SearchIcon size={48} />
              </div>
              <h2>No results found</h2>
              <p>We couldn't find anything matching your search. Try different keywords or check your spelling.</p>
            </div>
          )}
        </main>
      </div>

      {filterModalOpen && (
        <div className="filter-modal-overlay" onClick={() => setFilterModalOpen(false)}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h3>Filter Search Results</h3>
              <button className="filter-modal-close" onClick={() => setFilterModalOpen(false)}>×</button>
            </div>
            <div className="filter-modal-body">
              <div className="filter-section">
                <h4>Categories</h4>
                {(['all', 'people', 'opportunity', 'message', 'navigation', 'post'] as const).map(type => (
                  <label key={type} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(type)}
                      onChange={() => toggleCategory(type)}
                    />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                ))}
              </div>
              <div className="filter-section">
                <h4>Sort by</h4>
                <select value={selectedSort} onChange={(e) => setSelectedSort(e.target.value)}>
                  <option value="relevance">Relevance Algorithm</option>
                  <option value="date">Date</option>
                  <option value="name">Name Keywords</option>
                </select>
              </div>
            </div>
            <div className="filter-modal-footer">
              <button className="apply-filter-btn" onClick={() => setFilterModalOpen(false)}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
