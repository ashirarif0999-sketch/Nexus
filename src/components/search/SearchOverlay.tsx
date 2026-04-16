import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Search, X, Users, MessageCircle, FileText, Target, Command, ArrowRight, Layout, Clock } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';
import { useNavigate } from 'react-router-dom';
import './SearchOverlay.css';

const getIcon = (type: string) => {
  switch (type) {
    case 'people': return <Users size={16} />;
    case 'message': return <MessageCircle size={16} />;
    case 'opportunity': return <Target size={16} />;
    case 'document': return <FileText size={16} />;
    case 'navigation': return <Layout size={16} />;
    default: return <Search size={16} />;
  }
};

export const SearchOverlay: React.FC = () => {
  const { 
    isOpen, 
    closeSearch, 
    query, 
    setSearchQuery, 
    isSearching, 
    results, 
    recentSearches, 
    addToRecent, 
    clearRecent,
    suggestion 
  } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<'all' | 'people' | 'message' | 'opportunity' | 'document' | 'navigation'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredResults = useMemo(() =>
    activeCategory === 'all'
      ? results
      : results.filter(r => r.type === activeCategory),
    [results, activeCategory]
  );

  const resultsCount = useMemo(() =>
    query ? filteredResults.length : 0,
    [query, filteredResults.length]
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
      setSelectedIndex(0);
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  const handleSelect = useCallback((item: any) => {
    if (query) {
      addToRecent(query);
    }

    closeSearch();

    if (item.path) {
      navigate(item.path);
    }
  }, [query, addToRecent, closeSearch, navigate]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (resultsCount > 0 ? (prev + 1) % resultsCount : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (resultsCount > 0 ? (prev - 1 + resultsCount) % resultsCount : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (resultsCount > 0) {
        handleSelect(filteredResults[selectedIndex]);
      }
    }
  }, [isOpen, resultsCount, selectedIndex, handleSelect, filteredResults]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="search-overlay" onClick={closeSearch}>
      <div className="search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-header">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={20} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search people, messages, opportunities..."
              value={query}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {query && (
              <button className="clear-search" onClick={() => setSearchQuery('')}>
                <X size={16} />
              </button>
            )}
            <div className="search-shortcut">ESC</div>
          </div>
        </div>

        <div className="search-body">
          {!query ? (
            <div className="search-empty">
              <div className="search-suggestions">
                <h3 className="section-title">SUGGESTIONS</h3>
                <div className="suggestion-list">
                  <button className="suggestion-item" onClick={() => setSearchQuery('investors in healthcare')}>
                    <Users size={16} />
                    <span>investors in healthcare</span>
                  </button>
                  <button className="suggestion-item" onClick={() => setSearchQuery('marketing experts')}>
                    <Target size={16} />
                    <span>marketing experts</span>
                  </button>
                  <button className="suggestion-item" onClick={() => setSearchQuery('sarah')}>
                    <MessageCircle size={16} />
                    <span>recent messages from Sarah</span>
                  </button>
                </div>
              </div>

              {recentSearches.length > 0 && (
                <div className="search-recent">
                  <div className="search-recent-header">
                    <h3 className="section-title">RECENT SEARCHES</h3>
                    <button className="clear-recent-btn" onClick={clearRecent}>Clear all</button>
                  </div>
                  <div className="recent-list">
                    {recentSearches.map(s => (
                      <div 
                        key={s.id} 
                        className="recent-item"
                        onClick={() => setSearchQuery(s.query)}
                      >
                        <Clock size={14} style={{ marginRight: '8px', opacity: 0.6 }} />
                        {s.query}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="search-results-container">
              <div className="search-tabs">
                {(['all', 'navigation', 'people', 'opportunity', 'message'] as const).map(tab => (
                  <button 
                    key={tab}
                    className={`search-tab ${activeCategory === tab ? 'active' : ''}`}
                    onClick={() => setActiveCategory(tab as any)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="search-results-scroll">
                {isSearching ? (
                  <div className="search-loading">
                    <div className="spinner"></div>
                    <span>Searching...</span>
                  </div>
                ) : resultsCount > 0 ? (
                  <div className="results-list">
                    {filteredResults.map((result, index) => (
                      <div 
                        key={result.id} 
                        className={`result-item ${selectedIndex === index ? 'selected' : ''}`}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className={`result-icon ${result.type.substring(0, 3)}`}>
                          {getIcon(result.type)}
                        </div>
                        <div className="result-info">
                          <div className="result-title">
                            {result.title}
                            {result.matchScore && <span className="match-badge">{result.matchScore}% match</span>}
                          </div>
                          <div className="result-subtitle">{result.subtitle}</div>
                        </div>
                        <ArrowRight className="result-arrow" size={16} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-results">
                    {suggestion && (
                      <div className="suggestion-primary">
                        <div className={`suggestion-icon ${suggestion.type}`}>
                          {suggestion.type === 'person' ? '👤' :
                           suggestion.type === 'company' ? '🏢' :
                           suggestion.type === 'industry' ? '🏷️' :
                           suggestion.type === 'navigation' ? '🧭' : '💡'}
                        </div>
                        <div className="suggestion-content">
                          <h4>Did you mean:</h4>
                          <button
                            className="suggestion-button"
                            onClick={() => setSearchQuery(suggestion.text)}
                          >
                            {suggestion.text}
                          </button>
                          <p className="suggestion-subtitle">{suggestion.description}</p>
                          {suggestion.score > 80 && (
                            <span className="suggestion-confidence">High confidence match</span>
                          )}
                        </div>
                      </div>
                    )}
                    {!suggestion && (
                      <>
                        <p>No results found for "{query}"</p>
                        <button className="search-button-large" onClick={() => navigate(`/search?q=${query}`)}>
                          View all results page
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="search-footer">
          <div className="footer-hint">
            <kbd><Command size={12} /></kbd> + <kbd>K</kbd> to search anywhere
          </div>
          <div className="footer-hint">
            <kbd>↑</kbd> <kbd>↓</kbd> to navigate
          </div>
          <div className="footer-hint">
            <kbd>↵</kbd> to select
          </div>
        </div>
      </div>
    </div>
  );
};
