// src/components/call/IncomingCallNotification.tsx
import type { FC } from 'react';
import { Phone, PhoneOff } from 'lucide-react';
import Avatar from '../ui/Avatar';
import type { CallerInfo } from '../../services/callService';

interface IncomingCallNotificationProps {
  callData: {
    id: string;
    type: 'voice' | 'video';
  };
  callerInfo: CallerInfo;
  onAccept: () => void;
  onDecline: () => void;
}

const IncomingCallNotification: FC<IncomingCallNotificationProps> = ({
  callerInfo,
  onAccept,
  onDecline
}) => {
  const handleAccept = () => {
    console.log('IncomingCallNotification: User clicked accept');
    onAccept();
  };

  const handleDecline = () => {
    console.log('IncomingCallNotification: User clicked decline');
    onDecline();
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-4 min-w-80 animate-in slide-in-from-right-full">
      <div className="flex items-center space-x-3 mb-4">
        <div className="relative">
          <Avatar
            src={callerInfo.profileImageUrl}
            alt={callerInfo.displayName}
            name={callerInfo.displayName}
            size="lg"
          />
          <div className="absolute inset-0 rounded-full border-2 border-blue-500 animate-pulse"></div>
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium truncate">
            {callerInfo.displayName}
          </h3>
          <p className="text-gray-400 text-sm">
            Llamada de voz entrante
          </p>
        </div>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          onClick={handleDecline}
          className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
          title="Rechazar"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
        
        <button
          onClick={handleAccept}
          className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors"
          title="Aceptar"
        >
          <Phone className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export default IncomingCallNotification;