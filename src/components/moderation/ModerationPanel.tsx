import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAvailableBadges, assignBadgeToUser, getUserBadges, removeBadgeFromUser, setDefaultBadge } from '../../services/badgeService';
import type { Badge as BadgeType, UserBadgeWithDetails } from '../../types/badge';
import Badge from '../user/Badge';

interface ModerationPanelProps {
  targetUserId: string;
  targetUsername: string;
  isOpen: boolean;
  onClose: () => void;
}

const ModerationPanel: FC<ModerationPanelProps> = ({ targetUserId, targetUsername, isOpen, onClose }) => {
  const { user } = useAuth();
  const [availableBadges, setAvailableBadges] = useState<BadgeType[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadgeWithDetails[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isModerator = user?.email === 'dogitomb2022@gmail.com';

  useEffect(() => {
    if (isOpen) {
      setAvailableBadges(getAvailableBadges());
      fetchUserBadges();
    }
  }, [isOpen, targetUserId]);

  const fetchUserBadges = async () => {
    try {
      const badges = await getUserBadges(targetUserId);
      setUserBadges(badges);
    } catch (error) {
      console.error('Error fetching user badges:', error);
    }
  };

  const handleAssignBadge = async () => {
    if (!selectedBadge || !user) return;

    setLoading(true);
    setError('');

    try {
      await assignBadgeToUser(targetUserId, selectedBadge, user.uid);
      await fetchUserBadges();
      setSelectedBadge(null);
    } catch (error: any) {
      setError(error.message || 'Error al asignar el badge');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBadge = async (badgeId: string) => {
    setLoading(true);
    setError('');

    try {
      await removeBadgeFromUser(targetUserId, badgeId);
      await setDefaultBadge(targetUserId, null);
      await fetchUserBadges();
    } catch (error: any) {
      setError(error.message || 'Error al remover el badge');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !isModerator) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Panel de Moderación</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-400 text-sm mt-1">Usuario: @{targetUsername}</p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-900/50 border border-red-500 rounded-md text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <h3 className="text-white font-medium mb-3">Badges actuales:</h3>
            {userBadges.length > 0 ? (
              <div className="space-y-2">
                {userBadges.map((userBadge) => (
                  <div key={userBadge.badgeId} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge badge={userBadge.badge} size="sm" />
                      <span className="text-white text-sm">{userBadge.badge.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveBadge(userBadge.badgeId)}
                      disabled={loading}
                      className="text-red-400 hover:text-red-300 text-sm transition-colors duration-200"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No tiene badges asignados</p>
            )}
          </div>

          <div>
            <h3 className="text-white font-medium mb-3">Asignar badge:</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {availableBadges.map((badge) => {
                  const hasBadge = userBadges.some(ub => ub.badgeId === badge.id);
                  return (
                    <button
                      key={badge.id}
                      onClick={() => setSelectedBadge(badge.id)}
                      disabled={hasBadge}
                      className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors duration-200 ${
                        selectedBadge === badge.id 
                          ? 'border-blue-500 bg-blue-900/30' 
                          : hasBadge
                          ? 'border-gray-600 bg-gray-800/50 opacity-50 cursor-not-allowed'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <Badge badge={badge} size="sm" showTooltip={false} />
                      <div className="flex-1 text-left">
                        <div className="text-white text-sm">{badge.name}</div>
                        <div className="text-gray-400 text-xs">{badge.description}</div>
                      </div>
                      {hasBadge && (
                        <span className="text-xs text-gray-500">Asignado</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedBadge && (
                <button
                  onClick={handleAssignBadge}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  {loading ? 'Asignando...' : 'Confirmar Asignación'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModerationPanel;