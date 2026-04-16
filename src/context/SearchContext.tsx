import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { recentSearchDB, RecentSearch } from '../utils/recentSearchDB';
import { entrepreneurs, investors } from '../data/users';
import { messages } from '../data/messages';
import { collaborationRequests } from '../data/collaborationRequests';
import { posts } from '../data/posts';
import { ROUTES } from '../config/routes';
import { useAuth } from './AuthContext';

export interface SearchResult {
  id: string;
  type: 'people' | 'message' | 'opportunity' | 'document' | 'navigation' | 'post';
  title: string;
  subtitle: string;
  metadata?: string;
  matchScore?: number;
  timestamp?: string;
  path?: string;
  avatarUrl?: string;
}

interface SuggestionData {
  text: string;
  type: string;
  context: string;
  description: string;
  score: number;
}

interface SearchContextType {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  recentSearches: RecentSearch[];
  isSearching: boolean;
  suggestion: SuggestionData | null;
  openSearch: () => void;
  closeSearch: () => void;
  setSearchQuery: (query: string) => void;
  addToRecent: (query: string) => void;
  clearRecent: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

// Module-level caches for expensive function results
const levenshteinCache = new Map<string, number>();
const soundexCache = new Map<string, string>();

// Fuzzy string matching score (0-100)
const calculateMatchScore = (text: string, query: string): number => {
  const t = text.toLowerCase();
  const q = query.toLowerCase();

  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  if (t.includes(q)) return 70;

  // Very basic fuzzy matching
  const words = q.split(' ');
  let matches = 0;
  words.forEach(word => {
    if (t.includes(word)) matches++;
  });

  return Math.round((matches / words.length) * 50);
};

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user: currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestionData | null>(null);

  // Memoize expensive keyword arrays
  const allKeywords = useMemo(() => [
    // People names
    ...entrepreneurs.map(e => ({ text: e.name, type: 'person', context: e.startupName, description: `${e.startupName} • ${e.industry}` })),
    ...investors.map(i => ({ text: i.name, type: 'person', context: i.vcsFirm || 'Investor', description: `${i.vcsFirm || 'Investor'} • ${i.investmentInterests?.[0] || 'Multiple industries'}` })),
    // Company/startup names
    ...entrepreneurs.map(e => ({ text: e.startupName, type: 'company', context: e.name, description: `Founded by ${e.name} • ${e.industry}` })),
    // Industry terms and navigation
    { text: 'fintech', type: 'industry', context: 'Financial Technology', description: 'Financial technology startups' },
    { text: 'healthtech', type: 'industry', context: 'Healthcare Technology', description: 'Healthcare and medical technology' },
    { text: 'cleantech', type: 'industry', context: 'Clean Technology', description: 'Environmental and sustainability' },
    { text: 'dashboard', type: 'navigation', context: 'Main dashboard', description: 'Overview of your activities' },
    { text: 'messages', type: 'navigation', context: 'Communications', description: 'Your chats and conversations' },
    { text: 'investors', type: 'navigation', context: 'Find investors', description: 'Browse investment partners' },
    { text: 'entrepreneurs', type: 'navigation', context: 'Browse startups', description: 'Meet innovative founders' },
    { text: 'settings', type: 'navigation', context: 'Account settings', description: 'Configure your profile' },
    { text: 'calendar', type: 'navigation', context: 'Schedule meetings', description: 'Manage your schedule' },
    { text: 'help & faq', type: 'navigation', context: 'Support center', description: 'Get help and answers' },
  ], []);

  // Load recent searches on mount
  useEffect(() => {
    const loadRecent = async () => {
      const recent = await recentSearchDB.getAll();
      setRecentSearches(recent);
    };
    loadRecent();
  }, []);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setSuggestion(null);
  }, []);

  const addToRecent = useCallback(async (q: string) => {
    if (!q.trim()) return;
    await recentSearchDB.add(q);
    const recent = await recentSearchDB.getAll();
    setRecentSearches(recent);
  }, []);

  const clearRecent = useCallback(async () => {
    await recentSearchDB.clear();
    setRecentSearches([]);
  }, []);

  // "Did you mean" logic
  // Levenshtein distance for edit distance calculation with caching
  const levenshteinDistance = useCallback((str1: string, str2: string): number => {
    const cacheKey = `${str1}|${str2}`;
    if (levenshteinCache.has(cacheKey)) {
      return levenshteinCache.get(cacheKey)!;
    }

    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const result = matrix[str2.length][str1.length];
    levenshteinCache.set(cacheKey, result);
    return result;
  }, []);

  // Soundex algorithm for phonetic matching with caching
  const soundex = useCallback((word: string): string => {
    if (!word) return '';
    if (soundexCache.has(word)) {
      return soundexCache.get(word)!;
    }

    const firstLetter = word[0].toUpperCase();
    const map = {
      'B': '1', 'F': '1', 'P': '1', 'V': '1',
      'C': '2', 'G': '2', 'J': '2', 'K': '2', 'Q': '2', 'S': '2', 'X': '2', 'Z': '2',
      'D': '3', 'T': '3',
      'L': '4',
      'M': '5', 'N': '5',
      'R': '6'
    };

    let code = firstLetter;
    let previousCode = '';

    for (let i = 1; i < word.length && code.length < 4; i++) {
      const letter = word[i].toUpperCase();
      const currentCode = map[letter as keyof typeof map] || '';

      if (currentCode && currentCode !== previousCode) {
        code += currentCode;
        previousCode = currentCode;
      }
    }

    // Pad with zeros if needed
    while (code.length < 4) code += '0';

    soundexCache.set(word, code);
    return code;
  }, []);

  // Calculate similarity score between query and keyword
  const calculateSimilarityScore = useCallback((query: string, keyword: string): number => {
    const cacheKey = `${query}|${keyword}`;
    const cacheKeyReverse = `${keyword}|${query}`;

    // Check cache for this pair (order doesn't matter for similarity)
    if (levenshteinCache.has(`similarity-${cacheKey}`)) {
      return levenshteinCache.get(`similarity-${cacheKey}`)!;
    }
    if (levenshteinCache.has(`similarity-${cacheKeyReverse}`)) {
      return levenshteinCache.get(`similarity-${cacheKeyReverse}`)!;
    }

    const q = query.toLowerCase().trim();
    const k = keyword.toLowerCase().trim();

    if (q === k) return 100; // Exact match
    if (k.includes(q)) return 90; // Query is substring
    if (q.includes(k)) return 85; // Keyword is substring

    // Levenshtein distance score (lower distance = higher score)
    const maxLen = Math.max(q.length, k.length);
    const distance = levenshteinDistance(q, k);
    const distanceScore = Math.max(0, 100 - (distance / maxLen) * 100);

    // Soundex phonetic matching
    const qSoundex = soundex(q);
    const kSoundex = soundex(k);
    const phoneticBonus = qSoundex === kSoundex ? 20 : 0;

    // N-gram similarity (2-grams)
    const qGrams = new Set();
    const kGrams = new Set();

    for (let i = 0; i < q.length - 1; i++) qGrams.add(q.slice(i, i + 2));
    for (let i = 0; i < k.length - 1; i++) kGrams.add(k.slice(i, i + 2));

    const intersection = new Set([...qGrams].filter(x => kGrams.has(x)));
    const union = new Set([...qGrams, ...kGrams]);
    const ngramSimilarity = union.size > 0 ? (intersection.size / union.size) * 40 : 0;

    // Additional bonuses for common typos
    let typoBonus = 0;

    // First letter match bonus (helps with "saea" -> "Sarah")
    if (q[0] === k[0]) typoBonus += 10;

    // Length similarity bonus
    const lengthDiff = Math.abs(q.length - k.length);
    if (lengthDiff <= 2) typoBonus += 5;

    // Common substitution bonuses
    const substitutions = [
      ['a', 'e'], ['e', 'a'], ['i', 'e'], ['e', 'i'],
      ['o', 'a'], ['a', 'o'], ['u', 'o'], ['o', 'u'],
      ['c', 'k'], ['k', 'c'], ['s', 'z'], ['z', 's']
    ];

    let substitutionCount = 0;
    for (let i = 0; i < Math.min(q.length, k.length); i++) {
      if (q[i] !== k[i]) {
        const pair = [q[i], k[i]].sort();
        if (substitutions.some(sub => sub[0] === pair[0] && sub[1] === pair[1])) {
          substitutionCount++;
        }
      }
    }

    if (substitutionCount > 0) typoBonus += substitutionCount * 3;

    const result = Math.min(100, distanceScore + phoneticBonus + ngramSimilarity + typoBonus);

    // Cache the result
    levenshteinCache.set(`similarity-${cacheKey}`, result);
    return result;
  }, [levenshteinDistance, soundex]);

  const findRelatableSuggestion = useCallback((q: string) => {
    if (!q || q.length < 2) return null;

    const allKeywords = [
      // People names
      ...entrepreneurs.map(e => ({ text: e.name, type: 'person', context: e.startupName, description: `${e.startupName} • ${e.industry}` })),
      ...investors.map(i => ({ text: i.name, type: 'person', context: i.vcsFirm || 'Investor', description: `${i.vcsFirm || 'Investor'} • ${i.investmentInterests?.[0] || 'Multiple industries'}` })),
      // Company/startup names
      ...entrepreneurs.map(e => ({ text: e.startupName, type: 'company', context: e.name, description: `Founded by ${e.name} • ${e.industry}` })),
      // Industry terms and navigation
      { text: 'fintech', type: 'industry', context: 'Financial Technology', description: 'Financial technology startups' },
      { text: 'healthtech', type: 'industry', context: 'Healthcare Technology', description: 'Healthcare and medical technology' },
      { text: 'cleantech', type: 'industry', context: 'Clean Technology', description: 'Environmental and sustainability' },
      { text: 'dashboard', type: 'navigation', context: 'Main dashboard', description: 'Overview of your activities' },
      { text: 'messages', type: 'navigation', context: 'Communications', description: 'Your chats and conversations' },
      { text: 'investors', type: 'navigation', context: 'Find investors', description: 'Browse investment partners' },
      { text: 'entrepreneurs', type: 'navigation', context: 'Browse startups', description: 'Meet innovative founders' },
      { text: 'settings', type: 'navigation', context: 'Account settings', description: 'Configure your profile' },
      { text: 'calendar', type: 'navigation', context: 'Schedule meetings', description: 'Manage your schedule' },
    ];

    // Calculate scores for all keywords
    const scoredKeywords = allKeywords
      .map(keyword => {
        const score = calculateSimilarityScore(q, keyword.text);
        return {
          keyword: keyword.text,
          score,
          type: keyword.type,
          context: keyword.context,
          description: keyword.description
        };
      })
      .filter(item => item.score > 50 && item.keyword.toLowerCase() !== q.toLowerCase()) // Must be similar but not exact
      .sort((a, b) => b.score - a.score);

    // Return the best match with rich context
    // Always try to provide a suggestion, even if not perfect
    if (scoredKeywords.length > 0) {
      const best = scoredKeywords[0];
      // For very low scores, add a disclaimer in the description
      const description = best.score < 40
        ? `${best.description} (possible match)`
        : best.description;

      return {
        text: best.keyword,
        type: best.type,
        context: best.context,
        description: description,
        score: best.score
      };
    }

    return null;
  }, [calculateSimilarityScore, allKeywords]);

  const setSearchQuery = useCallback((q: string) => {
    setQuery(q);
    
    if (!q.trim()) {
      setResults([]);
      setSuggestion(null);
      return;
    }

    setIsSearching(true);
    setSuggestion(null);

    // Dynamic search logic
    setTimeout(() => {
      const searchResults: SearchResult[] = [];

      // 1. Navigation Search (Role-Aware)
      const userRole = currentUser?.role || 'entrepreneur';
      const navigationItems = [
        { title: 'Dashboard', path: userRole === 'entrepreneur' ? '/dashboard/entrepreneur' : '/dashboard/investor', keywords: ['home', 'overview', 'main'] },
        { title: 'Investors', path: ROUTES.INVESTORS, keywords: ['find investors', 'funding'] },
        { title: 'Entrepreneurs', path: ROUTES.ENTREPRENEURS, keywords: ['startups', 'founders'] },
        { title: 'Messages', path: ROUTES.MESSAGES, keywords: ['chat', 'inbox'] },
        { title: 'Calendar', path: ROUTES.CALENDAR, keywords: ['meetings', 'schedule'] },
        { title: 'Documents', path: ROUTES.DOCUMENTS, keywords: ['files', 'pitch deck'] },
        { title: 'Settings', path: ROUTES.SETTINGS, keywords: ['profile', 'account'] },
        { title: 'Help & FAQ', path: ROUTES.HELP, keywords: ['support', 'guide'] },
      ];

      navigationItems.forEach(item => {
        const score = Math.max(
          calculateMatchScore(item.title, q),
          ...item.keywords.map(k => calculateMatchScore(k, q))
        );
        if (score > 40) {
          searchResults.push({
            id: `nav-${item.path}`,
            type: 'navigation',
            title: item.title,
            subtitle: `Go to ${item.title} page`,
            path: item.path,
            matchScore: score
          });
        }
      });

      // 2. People Search (Entrepreneurs & Investors)
      const allUsers = [...entrepreneurs, ...investors];
      allUsers.forEach(u => {
        const nameScore = calculateMatchScore(u.name, q);
        const bioScore = calculateMatchScore(u.bio || '', q);
        const startupScore = 'startupName' in u ? calculateMatchScore(u.startupName, q) : 0;
        const industryScore = 'industry' in u ? calculateMatchScore(u.industry, q) : 0;
        
        const maxScore = Math.max(nameScore, bioScore, startupScore, industryScore);
        
        if (maxScore > 30) {
          searchResults.push({
            id: `user-${u.id}`,
            type: 'people',
            title: u.name,
            subtitle: 'startupName' in u ? `${u.role.charAt(0).toUpperCase() + u.role.slice(1)} @ ${u.startupName}` : (u as any).vcsFirm || 'Investor',
            metadata: u.location,
            path: `/profile/${u.role}/${u.id}`,
            matchScore: maxScore,
            avatarUrl: u.avatarUrl
          });
        }
      });

      // 3. Message Search
      messages.forEach(m => {
        const score = calculateMatchScore(m.content, q);
        if (score > 40) {
          const sender = allUsers.find(u => u.id === m.senderId);
          searchResults.push({
            id: `msg-${m.id}`,
            type: 'message',
            title: `Message from ${sender?.name || 'User'}`,
            subtitle: m.content.length > 60 ? m.content.substring(0, 60) + '...' : m.content,
            timestamp: m.timestamp,
            path: `/messages/${m.senderId === currentUser?.id ? m.receiverId : m.senderId}`,
            matchScore: score
          });
        }
      });

       // 4. Opportunity Search (Collaboration Requests)
       collaborationRequests.forEach(req => {
         const score = calculateMatchScore(req.message, q);
         if (score > 30) {
           const investor = investors.find(i => i.id === req.investorId);
           const entrepreneur = entrepreneurs.find(e => e.id === req.entrepreneurId);

           searchResults.push({
             id: `opp-${req.id}`,
             type: 'opportunity',
             title: `Opportunity: ${investor?.name} & ${entrepreneur?.startupName}`,
             subtitle: req.message.length > 60 ? req.message.substring(0, 60) + '...' : req.message,
             metadata: `Status: ${req.status}`,
             path: '/deals',
             matchScore: score
           });
         }
       });

       // 5. Post Search
       posts.forEach(p => {
         const titleScore = calculateMatchScore(p.title, q);
         const contentScore = calculateMatchScore(p.content, q);
         const tagScore = p.tags.reduce((acc, tag) => acc + calculateMatchScore(tag, q), 0);
         const score = Math.max(titleScore, contentScore, tagScore);

         if (score > 30) {
           searchResults.push({
             id: `post-${p.id}`,
             type: 'post',
             title: p.title,
             subtitle: p.content.length > 80 ? p.content.substring(0, 80) + '...' : p.content,
             metadata: `By ${p.author}`,
             timestamp: p.date,
             path: `/blog/${p.id}`,
             matchScore: score
           });
         }
       });

      // Sort results by score
      const sortedResults = searchResults.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

      // Check if we have meaningful results (score > 40)
      const hasGoodResults = sortedResults.some(r => (r.matchScore || 0) > 40);

      // Always try to find a suggestion for better UX
      const suggestionData = findRelatableSuggestion(q);

      // Show suggestion prominently if:
      // 1. No results at all - ALWAYS try to suggest something
      // 2. Very few results (< 3) and no good results
      // 3. Results exist but all have low scores (< 50)
      const shouldShowSuggestion = sortedResults.length === 0 ||
                                   (sortedResults.length < 3 && !hasGoodResults) ||
                                   (sortedResults.length > 0 && suggestionData && sortedResults.every(r => (r.matchScore || 0) < 50));

      // When there are no results, try harder to find ANY suggestion
      let finalSuggestion = suggestionData;
      if (sortedResults.length === 0 && !suggestionData) {
        // Try with a lower threshold or different logic - focus on people for no results case
        const peopleKeywords = allKeywords.filter(k => k.type === 'person');

        const scoredKeywords = peopleKeywords
          .map(keyword => ({
            keyword: keyword.text,
            score: calculateSimilarityScore(q, keyword.text),
            type: keyword.type,
            context: keyword.context,
            description: keyword.description
          }))
          .filter(item => item.score > 20) // Even lower threshold for no results
          .sort((a, b) => b.score - a.score);

        // Debug logging for no results cases
        if (scoredKeywords.length > 0) {
          console.log(`Search "${q}" - Best suggestion: ${scoredKeywords[0].keyword} (score: ${scoredKeywords[0].score})`);
        }

        if (scoredKeywords.length > 0) {
          const best = scoredKeywords[0];
          finalSuggestion = {
            text: best.keyword,
            type: best.type,
            context: best.context,
            description: best.description,
            score: best.score
          };
        }
      }

      setSuggestion(shouldShowSuggestion ? finalSuggestion : null);

      setResults(sortedResults);
      
      setIsSearching(false);
    }, 300);
  }, [currentUser, findRelatableSuggestion, allKeywords]);

  // Keyboard shortcut listener (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearch();
      }
      if (e.key === 'Escape' && isOpen) {
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSearch, closeSearch, isOpen]);

  return (
    <SearchContext.Provider
      value={{
        isOpen,
        query,
        results,
        recentSearches,
        isSearching,
        suggestion,
        openSearch,
        closeSearch,
        setSearchQuery,
        addToRecent,
        clearRecent,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
