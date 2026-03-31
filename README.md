# Nexus - Business Networking Platform

<p align="center">
  <img src="public/logo.svg" alt="Nexus Logo" width="120" />
</p>

Nexus is a comprehensive business networking platform designed to bridge the gap between entrepreneurs seeking funding and investors looking for promising opportunities. Built with modern web technologies, Nexus provides a seamless, feature-rich environment for startups and investors to connect, collaborate, and close deals.

---

## Table of Contents

- [What is Nexus?](#what-is-nexus)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [How Nexus Competes with Existing Platforms](#how-nexus-competes-with-existing-platforms)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## What is Nexus?

Nexus is a **business relationship management platform** that transforms how entrepreneurs and investors connect. Unlike traditional networking events or generic social platforms, Nexus is purpose-built for the startup investment ecosystem.

### The Problem We Solve

The startup investment process is fragmented and inefficient:

- **For Entrepreneurs**: Finding the right investors is like finding a needle in a haystack. Cold emails go unanswered, networking events yield few meaningful connections, and the fundraising process remains opaque.

- **For Investors**: Sifting through countless pitch decks, attending low-quality meetings, and manually tracking investment opportunities across multiple tools is time-consuming and error-prone.

### Our Solution

Nexus creates a **centralized hub** where:

- Entrepreneurs can showcase their startups with rich profiles, pitch decks, and business metrics
- Investors can discover vetted opportunities, filter by industry/stage/investment size, and build meaningful relationships
- Both parties can communicate, collaborate, and track deals in one unified platform

---

## Key Features

### 🔐 Authentication & Security

- **Role-based authentication** supporting both Entrepreneur and Investor accounts
- **Multi-account management** - switch between multiple roles seamlessly
- **Two-factor authentication** (2FA) for enhanced security
- **Demo accounts** for exploring the platform without registration (dont include in landing page)

### 👤 Profile Management

**For Entrepreneurs:**
- Startup profile with company details, industry, founded year, team size
- Pitch summary, problem statement, solution description
- Market opportunity and competitive advantage
- Funding needs, valuation, and funding timeline
- Team members and document uploads

**For Investors:**
- Investment philosophy and background
- Investment stages (Pre-seed, Seed, Series A, etc.)
- Investment interests and focus industries
- Minimum and maximum investment ranges
- Portfolio companies showcase

### 🔍 Discovery & Matching

- **Smart filtering** by industry, investment stage, funding range
- **Search functionality** across startups and investors
- **Recommended matches** based on compatibility
- **Pagination** for handling large datasets efficiently

### 💬 Communication

- **Real-time messaging** system with conversation threads
- **Chat interface** with user lists and message history
- **Online status indicators** for active users
- **Emoji support** for expressive communication

### 📹 Video Meetings

- **Integrated video calling** powered by WebRTC
- **Meeting scheduling** with calendar integration
- **Video room functionality** for face-to-face pitches
- **Screen sharing capabilities**

### 📅 Calendar & Scheduling

- **FullCalendar integration** for event management
- **Meeting scheduling** with investor availability
- **Funding deadline tracking**
- **Event categorization** (meetings, deadlines, milestones)

### 📄 Document Management

- **Secure document vault** for pitch decks and financial documents
- **Selective sharing** with connected investors
- **Access control** and encryption for sensitive data
- **Document categorization** (contracts, pitches, financials)

### 🤝 Collaboration System

- **Formal collaboration requests** from investors
- **Request management** with accept/decline functionality
- **Status tracking** (pending, accepted, rejected)
- **Connection history** and relationship management

### 💼 Deal Pipeline

- **Investment deal tracking** with stage management
- **Deal metrics** (total investment, active deals, portfolio size)
- **Status filtering** (Initial Review, Due Diligence, Term Sheet, Closed)
- **Startup information** with equity and amount tracking

### 🔔 Notifications

- **Real-time notifications** for important events
- **Collaboration request alerts**
- **Meeting reminders**
- **Profile view notifications**
- **Message notifications**

### 🎯 Dashboard & Analytics

**Entrepreneur Dashboard:**
- Pending collaboration requests
- Total connections
- Upcoming meetings
- Profile views analytics

**Investor Dashboard:**
- Total startups discovery
- Industry distribution
- Connection requests sent
- Portfolio tracking

---

## Technology Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with hooks and functional components |
| **TypeScript** | Type-safe development |
| **React Router v6** | Client-side routing |
| **Tailwind CSS** | Utility-first CSS framework |
| **Vite** | Build tool and development server |
| **Axios** | HTTP client for API requests |
| **Lucide React** | Icon library |
| **date-fns** | Date manipulation |
| **FullCalendar** | Calendar component |
| **react-joyride** | Guided tours |
| **react-dropzone** | File uploads |
| **gsap** | Animations |

### Architecture

```
src/
├── components/          # Reusable UI components
│   ├── ui/            # Basic UI elements (Button, Card, Input, etc.)
│   ├── layout/        # Layout components (Navbar, Sidebar, DashboardLayout)
│   ├── entrepreneur/  # Entrepreneur-specific components
│   ├── investor/      # Investor-specific components
│   ├── collaboration/ # Collaboration request components
│   └── chat/          # Chat-related components
├── pages/             # Page components
│   ├── auth/          # Authentication pages
│   ├── dashboard/    # Dashboard pages
│   ├── profile/      # Profile pages
│   ├── investors/    # Investor discovery
│   ├── entrepreneurs/ # Startup discovery
│   ├── chat/         # Chat functionality
│   ├── messages/     # Messages overview
│   ├── deals/        # Deal pipeline
│   ├── documents/    # Document management
│   ├── calendar/     # Calendar/scheduling
│   ├── video/        # Video meetings
│   ├── notifications/# Notifications
│   ├── settings/     # User settings
│   └── help/         # Help center
├── context/           # React context providers
├── hooks/             # Custom React hooks
├── data/              # Mock data and utilities
├── types/             # TypeScript type definitions
├── config/            # Configuration files
└── styles/            # Global styles
```

---

## How Nexus Competes with Existing Platforms

### Market Landscape

The startup investment ecosystem includes several established platforms:

| Platform | Focus Area | Strengths | Weaknesses |
|----------|------------|-----------|------------|
| **AngelList** | Startup hiring + investing | Large user base, established brand | Complex interface, crowded inbox |
| **Crunchbase** | Data + news | Comprehensive data | Limited networking features |
| **Gust** | Accelerator management | Strong for accelerators | Not designed for direct matching |
| **LinkedIn** | General networking | Massive user base | Not purpose-built for startups |
| **Twitter/X** | Informal networking | Viral potential | Unstructured, noisy |

### Nexus Competitive Advantages

#### 1. Purpose-Built for Investment Relationships

Unlike generic social networks or job platforms, Nexus is designed specifically for the entrepreneur-investor relationship lifecycle:

- **Structured profiles** capture investment-relevant information (valuation, funding stage, team size)
- **Collaboration requests** formalize the connection process
- **Deal pipeline** tracks opportunities from first contact to closing

#### 2. All-in-One Platform

While other platforms focus on one aspect of the ecosystem, Nexus provides a complete solution:

| Feature | Nexus | AngelList | Crunchbase | LinkedIn |
|---------|-------|-----------|------------|----------|
| Profile management | ✅ | Partial | ❌ | ✅ |
| Messaging | ✅ | ✅ | ❌ | ✅ |
| Video calls | ✅ | ❌ | ❌ | Partial |
| Calendar | ✅ | ❌ | ❌ | ❌ |
| Document vault | ✅ | ❌ | ❌ | ❌ |
| Deal tracking | ✅ | ❌ | ❌ | ❌ |
| Collaboration workflow | ✅ | ❌ | ❌ | ❌ |

#### 3. Modern User Experience

- **Clean, intuitive interface** built with Tailwind CSS
- **Responsive design** works on desktop, tablet, and mobile
- **Real-time features** (messaging, notifications, online status)
- **Guided tours** help new users navigate the platform
- **Smart filtering** helps users find exactly what they're looking for

#### 4. Role-Specific Dashboards

Both entrepreneurs and investors get dedicated experiences:

- **Entrepreneurs** see collaboration requests, investor recommendations, and startup metrics
- **Investors** see startup discovery, investment pipeline, and portfolio tracking
- **Custom navigation** adapts to each user's needs

#### 5. Built-in Communication Tools

- **No external dependencies** - everything happens within Nexus
- **Video calling** for face-to-face meetings without leaving the platform
- **Document sharing** with access control
- **Meeting scheduling** integrated with calendar

#### 6. Scalable Architecture

- **Component-based design** for easy feature additions
- **TypeScript** for maintainable code
- **Mock data structure** allows quick prototyping
- **Vite** for fast development and building

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/nexus.git
   cd nexus
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=your_api_url
VITE_APP_NAME=Nexus
```

### Demo Accounts

The platform includes demo credentials for testing:

| Role | Email | Password |
|------|-------|----------|
| Entrepreneur | sarah@techwave.io | demo123 |
| Investor | michael@venture.vc | demo123 |

---

## Project Structure

```
nexus/
├── public/                  # Static assets
│   └── logo.svg            # Application logo
├── src/                    # Source code
│   ├── components/        # React components
│   ├── pages/            # Page components
│   ├── context/          # React context
│   ├── hooks/            # Custom hooks
│   ├── data/             # Mock data
│   ├── types/            # TypeScript types
│   ├── config/           # Configuration
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── index.html            # HTML entry point
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
└── eslint.config.js     # ESLint configuration
```

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- 📖 **Documentation**: Visit our [docs](https://docs.nexus.app)
- 💬 **Discord**: Join our [community](https://discord.gg/nexus)
- 📧 **Email**: Contact us at support@nexus.app

---

<p align="center">
  <strong>Built with ❤️ by the Nexus Team</strong>
</p>