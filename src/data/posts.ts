export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  tags: string[];
}

export const posts: Post[] = [
  {
    id: '1',
    title: 'How to Build a Successful Startup',
    content: 'Building a startup requires careful planning, market research, and a strong team. This comprehensive guide covers all the essential steps from ideation to launch.',
    author: 'Sarah Johnson',
    date: '2024-01-15T10:00:00Z',
    tags: ['startup', 'business', 'entrepreneurship']
  },
  {
    id: '2',
    title: 'The Future of AI in Healthcare',
    content: 'Artificial intelligence is revolutionizing healthcare with improved diagnostics, personalized treatment plans, and drug discovery. Learn about the latest developments.',
    author: 'Dr. Michael Chen',
    date: '2024-01-20T14:30:00Z',
    tags: ['AI', 'healthcare', 'technology']
  },
  {
    id: '3',
    title: 'Sustainable Investing Trends',
    content: 'Sustainable investing focuses on companies that prioritize environmental responsibility and social impact. Discover how to build an ESG portfolio.',
    author: 'Emma Rodriguez',
    date: '2024-01-25T09:15:00Z',
    tags: ['investing', 'sustainability', 'ESG']
  },
  {
    id: '4',
    title: 'Remote Work Best Practices',
    content: 'With the rise of remote work, companies need effective strategies for managing distributed teams. This article covers communication, productivity, and culture.',
    author: 'James Wilson',
    date: '2024-01-28T16:45:00Z',
    tags: ['remote work', 'productivity', 'management']
  },
  {
    id: '5',
    title: 'Blockchain Beyond Cryptocurrency',
    content: 'Blockchain technology has applications far beyond cryptocurrencies. Explore how it\'s transforming supply chains, voting systems, and digital identity.',
    author: 'Alex Thompson',
    date: '2024-02-01T11:20:00Z',
    tags: ['blockchain', 'technology', 'innovation']
  }
];