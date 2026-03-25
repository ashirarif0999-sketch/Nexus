import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { Investor } from '../../types';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface InvestorCardProps {
  investor: Investor;
  showActions?: boolean;
}

const InvestorCardComponent: React.FC<InvestorCardProps> = ({
  investor,
  showActions = true
}) => {
  const navigate = useNavigate();
  
  const handleViewProfile = () => {
    navigate(`/profile/investor/${investor.id}`);
  };
  
  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/chat/${investor.id}`);
  };
  
  return (
    <Card 
      hoverable 
      className="investor-card transition-all duration-300 h-full"
      onClick={handleViewProfile}
    >
      <CardBody className="investor-card-body flex flex-col">
        <div className="investor-card-header flex items-start">
          <Avatar
            src={investor.avatarUrl}
            alt={investor.name}
            size="lg"
            status={investor.isOnline ? 'online' : 'offline'}
            className="investor-card-avatar mr-4"
          />
          
          <div className="investor-card-info flex-1">
            <h3 className="investor-card-name text-lg font-semibold text-gray-900 mb-1">{investor.name}</h3>
            <p className="investor-card-title text-sm text-gray-500 mb-2">Investor • {investor.totalInvestments} investments</p>
            
            <div className="investor-card-stages flex flex-wrap gap-2 mb-3">
              {investor.investmentStage.map((stage, index) => (
                <Badge key={index} variant="secondary" size="sm">{stage}</Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="investor-card-interests mt-3">
          <h4 className="investor-card-interests-title text-sm font-medium text-gray-900 mb-1">Investment Interests</h4>
          <div className="investor-card-interests-list flex flex-wrap gap-2">
            {investor.investmentInterests.map((interest, index) => (
              <Badge key={index} variant="primary" size="sm">{interest}</Badge>
            ))}
          </div>
        </div>
        
        <div className="investor-card-bio mt-4">
          <p className="investor-card-bio-text text-sm text-gray-600 line-clamp-2">{investor.bio}</p>
        </div>
        
        <div className="investor-card-range mt-3 flex justify-between items-center">
          <div>
            <span className="investor-card-range-label text-xs text-gray-500">Investment Range</span>
            <p className="investor-card-range-value text-sm font-medium text-gray-900">{investor.minimumInvestment} - {investor.maximumInvestment}</p>
          </div>
        </div>
      </CardBody>
      
      {showActions && (
        <CardFooter className="investor-card-footer border-t border-gray-100 bg-gray-50 card-buttons-parent">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<MessageCircle size={16} />}
            onClick={handleMessage}
          >
            Message
          </Button>

          <Button
            variant="primary"
            size="sm"
            rightIcon={<ExternalLink size={16} />}
            onClick={handleViewProfile}
          >
            View Profile
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export const InvestorCard = React.memo(InvestorCardComponent);