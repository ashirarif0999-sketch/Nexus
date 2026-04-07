import { ReactNode } from 'react';

export type UserRole = 'entrepreneur' | 'investor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  bio: string;
  isOnline?: boolean;
  createdAt: string;
  company?: string;
  phone?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface FundingRound {
  name: string;
  amount?: string;
  year?: number;
  status: 'completed' | 'in-progress' | 'planned';
}

export interface StartupDocument {
  name: string;
  url?: string;
  lastUpdated?: string;
}

export interface EntrepreneurMetrics {
  monthlyRevenue?: string;
  totalUsers?: string;
  growthRate?: string;
  customerRetention?: string;
  churnRate?: string;
  cacPayback?: string;
}

export interface Entrepreneur extends User {
  role: 'entrepreneur';
  startupName: string;
  pitchSummary: string;
  fundingNeeded: string;
  industry: string;
  location: string;
  foundedYear: number;
  teamSize: number;
  // Additional fields
  problemStatement?: string;
  solution?: string;
  marketOpportunity?: string;
  competitiveAdvantage?: string;
  traction?: string;
  valuation?: string;
  teamMembers?: TeamMember[];
  fundingTimeline?: FundingRound[];
  documents?: StartupDocument[];
  metrics?: EntrepreneurMetrics;
}

export interface Investor extends User {
  role: 'investor';
  investmentInterests: string[];
  investmentStage: string[];
  portfolioCompanies: string[];
  totalInvestments: number;
  minimumInvestment: string;
  maximumInvestment: string;
  // Additional fields
  location?: string;
  investmentPhilosophy?: string;
  background?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isDelivered?: boolean;
  reactions?: MessageReaction[];
  isStarred?: boolean;
  isDeleted?: boolean;
  replyTo?: string; // ID of the message being replied to
  replyContent?: string; // Content of the replied message for display
}

export interface ChatConversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface CollaborationRequest {
  id: string;
  investorId: string;
  entrepreneurId: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  shared: boolean;
  url: string;
  ownerId: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}