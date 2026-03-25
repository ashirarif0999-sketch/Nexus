import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { Entrepreneur } from '../../types';
import { Card, CardBody, CardFooter } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface EntrepreneurCardProps {
  entrepreneur: Entrepreneur;
  showActions?: boolean;
}

const EntrepreneurCardComponent: React.FC<EntrepreneurCardProps> = ({
  entrepreneur,
  showActions = true
}) => {
  const navigate = useNavigate();
  
  const handleViewProfile = () => {
    navigate(`/profile/entrepreneur/${entrepreneur.id}`);
  };
  
  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    navigate(`/chat/${entrepreneur.id}`);
  };
  
  return (
    <Card 
      hoverable 
      className="entrepreneur-card transition-all duration-300 h-full"
      onClick={handleViewProfile}
    >
      <CardBody className="entrepreneur-card-body flex flex-col">
        <div className="entrepreneur-card-header flex items-start">
          <Avatar
            src={entrepreneur.avatarUrl}
            alt={entrepreneur.name}
            size="lg"
            status={entrepreneur.isOnline ? 'online' : 'offline'}
            className="entrepreneur-card-avatar mr-4"
          />
          
          <div className="entrepreneur-card-info flex-1">
            <h3 className="entrepreneur-card-name text-lg font-semibold text-gray-900 mb-1">{entrepreneur.name}</h3>
            <p className="entrepreneur-card-startup text-sm text-gray-500 mb-2">{entrepreneur.startupName}</p>
            
            <div className="entrepreneur-card-badges flex flex-wrap gap-2 mb-3">
              <Badge variant="primary" size="sm">{entrepreneur.industry}</Badge>
              <Badge variant="gray" size="sm">{entrepreneur.location}</Badge>
              <Badge variant="accent" size="sm">Founded {entrepreneur.foundedYear}</Badge>
            </div>
          </div>
        </div>
        
        <div className="entrepreneur-card-pitch mt-3">
          <h4 className="entrepreneur-card-pitch-title text-sm font-medium text-gray-900 mb-1">Pitch Summary</h4>
          <p className="entrepreneur-card-pitch-text text-sm text-gray-600 line-clamp-3">{entrepreneur.pitchSummary}</p>
        </div>
        
        <div className="entrepreneur-card-stats mt-3 flex justify-between items-center">
          <div>
            <span className="entrepreneur-card-funding-label text-xs text-gray-500">Funding Need</span>
            <p className="entrepreneur-card-funding-value text-sm font-medium text-gray-900">{entrepreneur.fundingNeeded}</p>
          </div>
          
          <div>
            <span className="entrepreneur-card-team-label text-xs text-gray-500">Team Size</span>
            <p className="entrepreneur-card-team-value text-sm font-medium text-gray-900">{entrepreneur.teamSize} people</p>
          </div>
        </div>
      </CardBody>
      
      {showActions && (
        <CardFooter className="entrepreneur-card-footer border-t border-gray-100 bg-gray-50 card-buttons-parent">
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

export const EntrepreneurCard = React.memo(EntrepreneurCardComponent);