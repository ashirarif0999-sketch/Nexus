import React, { useState } from 'react';
import { Search, Filter, DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';

const deals = [
  {
    id: 1,
    startup: {
      name: 'TechWave AI',
      logo: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
      industry: 'FinTech'
    },
    amount: '$1.5M',
    equity: '15%',
    status: 'Due Diligence',
    stage: 'Series A',
    lastActivity: '2024-02-15'
  },
  {
    id: 2,
    startup: {
      name: 'GreenLife Solutions',
      logo: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
      industry: 'CleanTech'
    },
    amount: '$2M',
    equity: '20%',
    status: 'Term Sheet',
    stage: 'Seed',
    lastActivity: '2024-02-10'
  },
  {
    id: 3,
    startup: {
      name: 'HealthPulse',
      logo: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
      industry: 'HealthTech'
    },
    amount: '$800K',
    equity: '12%',
    status: 'Negotiation',
    stage: 'Pre-seed',
    lastActivity: '2024-02-05'
  }
];

export const DealsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  
  const statuses = ['Due Diligence', 'Term Sheet', 'Negotiation', 'Closed', 'Passed'];
  
  const toggleStatus = (status: string) => {
    setSelectedStatus(prev => 
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Due Diligence':
        return 'primary';
      case 'Term Sheet':
        return 'secondary';
      case 'Negotiation':
        return 'accent';
      case 'Closed':
        return 'success';
      case 'Passed':
        return 'error';
      default:
        return 'gray';
    }
  };
  
  return (
    <div className="deals-page page-main-content space-y-6 animate-fade-in">
      <div className="deals-header page-header flex justify-between items-center">
        <div className="deals-title-section">
          <h1 className="deals-title text-2xl font-bold text-gray-900">Investment Deals</h1>
          <p className="deals-subtitle text-gray-600">Track and manage your investment pipeline</p>
        </div>
        
        <Button className="deals-add-btn">
          Add Deal
        </Button>
      </div>
      
      {/* Stats */}
      <div className="deals-stats page-stats grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="deals-total-investment-card">
          <CardBody className="deals-total-investment-body">
            <div className="deals-total-investment-content flex items-center">
              <div className="deals-total-investment-icon p-3 bg-primary-100 rounded-lg mr-3">
                <DollarSign size={20} className="text-primary-600" />
              </div>
              <div className="deals-total-investment-text">
                <p className="deals-total-investment-label text-sm text-gray-600">Total Investment</p>
                <p className="deals-total-investment-value text-lg font-semibold text-gray-900">$4.3M</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="deals-active-deals-card">
          <CardBody className="deals-active-deals-body">
            <div className="deals-active-deals-content flex items-center">
              <div className="deals-active-deals-icon p-3 bg-secondary-100 rounded-lg mr-3">
                <TrendingUp size={20} className="text-secondary-600" />
              </div>
              <div className="deals-active-deals-text">
                <p className="deals-active-deals-label text-sm text-gray-600">Active Deals</p>
                <p className="deals-active-deals-value text-lg font-semibold text-gray-900">8</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="deals-portfolio-card">
          <CardBody className="deals-portfolio-body">
            <div className="deals-portfolio-content flex items-center">
              <div className="deals-portfolio-icon p-3 bg-accent-100 rounded-lg mr-3">
                <Users size={20} className="text-accent-600" />
              </div>
              <div className="deals-portfolio-text">
                <p className="deals-portfolio-label text-sm text-gray-600">Portfolio Companies</p>
                <p className="deals-portfolio-value text-lg font-semibold text-gray-900">12</p>
              </div>
            </div>
          </CardBody>
        </Card>
        
        <Card className="deals-closed-card">
          <CardBody className="deals-closed-body">
            <div className="deals-closed-content flex items-center">
              <div className="deals-closed-icon p-3 bg-success-100 rounded-lg mr-3">
                <Calendar size={20} className="text-success-600" />
              </div>
              <div className="deals-closed-text">
                <p className="deals-closed-label text-sm text-gray-600">Closed This Month</p>
                <p className="deals-closed-value text-lg font-semibold text-gray-900">2</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
      
      {/* Filters */}
      <div className="deals-filters page-filters flex flex-col md:flex-row gap-4">
        <div className="deals-search-wrapper w-full md:w-2/3">
          <Input
            className="deals-search-input"
            placeholder="Search deals by startup name or industry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setAppliedSearchQuery(searchQuery);
              }
            }}
            startAdornment={<Search size={18} />}
            fullWidth
          />
        </div>
        
        <div className="deals-status-filters w-full md:w-1/3">
          <div className="deals-filter-section flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <div className="deals-status-badges flex flex-wrap gap-2">
              {statuses.map(status => (
                <Badge
                  key={status}
                  variant={selectedStatus.includes(status) ? getStatusColor(status) : 'gray'}
                  className="deals-status-badge cursor-pointer"
                  onClick={() => toggleStatus(status)}
                >
                  {status}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Deals table */}
      <Card className="deals-table-card page-section dashboard-section">
        <CardHeader className="deals-table-header">
          <h2 className="deals-table-title text-lg font-medium text-gray-900">Active Deals</h2>
        </CardHeader>
        <CardBody className="deals-table-body">
          <div className="deals-table-wrapper overflow-x-auto">
            <table className="deals-table w-full">
              <thead>
                <tr className="deals-table-head-row border-b border-gray-200">
                  <th className="deals-table-head-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Startup
                  </th>
                  <th className="deals-table-head-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="deals-table-head-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equity
                  </th>
                  <th className="deals-table-head-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="deals-table-head-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="deals-table-head-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="deals-table-head-cell px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="deals-table-body-section divide-y divide-gray-200">
                {deals.map(deal => (
                  <tr key={deal.id} className="deals-table-row hover:bg-gray-50">
                    <td className="deals-table-cell px-6 py-4 whitespace-nowrap">
                      <div className="deals-startup-info flex items-center">
                        <Avatar
                          src={deal.startup.logo}
                          alt={deal.startup.name}
                          size="sm"
                          className="deals-startup-logo flex-shrink-0"
                        />
                        <div className="deals-startup-details ml-4">
                          <div className="deals-startup-name text-sm font-medium text-gray-900">
                            {deal.startup.name}
                          </div>
                          <div className="deals-startup-industry text-sm text-gray-500">
                            {deal.startup.industry}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="deals-amount-cell px-6 py-4 whitespace-nowrap">
                      <div className="deals-amount text-sm text-gray-900">{deal.amount}</div>
                    </td>
                    <td className="deals-equity-cell px-6 py-4 whitespace-nowrap">
                      <div className="deals-equity text-sm text-gray-900">{deal.equity}</div>
                    </td>
                    <td className="deals-status-cell px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusColor(deal.status)} className="deals-status">
                        {deal.status}
                      </Badge>
                    </td>
                    <td className="deals-stage-cell px-6 py-4 whitespace-nowrap">
                      <div className="deals-stage text-sm text-gray-900">{deal.stage}</div>
                    </td>
                    <td className="deals-activity-cell px-6 py-4 whitespace-nowrap">
                      <div className="deals-last-activity text-sm text-gray-500">
                        {new Date(deal.lastActivity).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="deals-actions-cell px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="outline" size="sm" className="deals-view-details-btn">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};