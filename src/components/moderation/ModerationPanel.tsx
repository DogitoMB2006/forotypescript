import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAvailableBadges, assignBadgeToUser, getUserBadges, removeBadgeFromUser, setDefaultBadge } from '../../services/badgeService';
import { getAvailableRoles, assignRoleToUser, removeRoleFromUser, getUserRoles, isUserAdmin } from '../../services/roleService';
import type { Badge as BadgeType, UserBadgeWithDetails } from '../../types/badge';
import type { Role, UserRoleWithDetails } from '../../types/roles';
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
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadgeWithDetails[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleWithDetails[]>([]);
  const [selectedBadge, setSelectedBadge] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'badges' | 'roles'>('badges');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRefreshModal, setShowRefreshModal] = useState(false);

  const isModerator = user?.email === 'dogitomb2022@gmail.com';

  useEffect(() => {
    if (isOpen) {
      setAvailableBadges(getAvailableBadges());
      setAvailableRoles(getAvailableRoles());
      fetchUserData();
    }
  }, [isOpen, targetUserId]);

  const fetchUserData = async () => {
    try {
      const [badges, roles] = await Promise.all([
        getUserBadges(targetUserId),
        getUserRoles(targetUserId)
      ]);
      setUserBadges(badges);
      setUserRoles(roles);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleAssignBadge = async () => {
    if (!selectedBadge || !user) return;

    setLoading(true);
    setError('');

    try {
      await assignBadgeToUser(targetUserId, selectedBadge, user.uid);
      await fetchUserData();
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
      await fetchUserData();
    } catch (error: any) {
      setError(error.message || 'Error al remover el badge');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    if (!selectedRole || !user) return;

    setLoading(true);
    setError('');

    try {
      await assignRoleToUser(targetUserId, selectedRole, user.uid);
      await fetchUserData();
      setSelectedRole(null);
      setShowRefreshModal(true);
    } catch (error: any) {
      setError(error.message || 'Error al asignar el rol');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    setLoading(true);
    setError('');

    try {
      await removeRoleFromUser(targetUserId, roleId);
      await fetchUserData();
      setShowRefreshModal(true);
    } catch (error: any) {
      setError(error.message || 'Error al remover el rol');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  const getRoleColor = (roleId: string) => {
    switch (roleId) {
      case 'admin': return 'text-red-400 bg-red-900/30 border-red-500';
      case 'moderator': return 'text-blue-400 bg-blue-900/30 border-blue-500';
      case 'member': return 'text-gray-400 bg-gray-800 border-gray-600';
      default: return 'text-gray-400 bg-gray-800 border-gray-600';
    }
  };

  if (!isOpen || !isModerator) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
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

          <div className="border-b border-gray-800">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('badges')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'badges'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Badges
              </button>
              <button
                onClick={() => setActiveTab('roles')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
                  activeTab === 'roles'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                Roles
              </button>
            </nav>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {error && (
              <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-md text-red-300 text-sm">
                {error}
              </div>
            )}

            {activeTab === 'badges' && (
              <div className="space-y-6">
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
            )}

            {activeTab === 'roles' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-white font-medium mb-3">Roles actuales:</h3>
                  {userRoles.length > 0 ? (
                    <div className="space-y-2">
                      {userRoles.map((userRole) => (
                        <div key={userRole.roleId} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(userRole.roleId)}`}>
                              {userRole.role.displayName}
                            </div>
                            <span className="text-gray-400 text-xs">{userRole.role.description}</span>
                          </div>
                          {userRole.roleId !== 'admin' && (
                            <button
                              onClick={() => handleRemoveRole(userRole.roleId)}
                              disabled={loading}
                              className="text-red-400 hover:text-red-300 text-sm transition-colors duration-200"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="px-2 py-1 rounded-full text-xs font-medium border text-gray-400 bg-gray-800 border-gray-600">
                          Miembro
                        </div>
                        <span className="text-gray-400 text-xs">Usuario estándar del foro</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-white font-medium mb-3">Asignar rol:</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                      {availableRoles.filter(role => role.id !== 'admin').map((role) => {
                        const hasRole = userRoles.some(ur => ur.roleId === role.id);
                        return (
                          <button
                            key={role.id}
                            onClick={() => setSelectedRole(role.id)}
                            disabled={hasRole}
                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors duration-200 ${
                              selectedRole === role.id 
                                ? 'border-blue-500 bg-blue-900/30' 
                                : hasRole
                                ? 'border-gray-600 bg-gray-800/50 opacity-50 cursor-not-allowed'
                                : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                            }`}
                          >
                            <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(role.id)}`}>
                              {role.displayName}
                            </div>
                            <div className="flex-1 text-left">
                              <div className="text-gray-400 text-xs">{role.description}</div>
                              <div className="text-gray-500 text-xs mt-1">
                                Permisos: {role.permissions.map(p => `${p.action} ${p.resource}`).join(', ')}
                              </div>
                            </div>
                            {hasRole && (
                              <span className="text-xs text-gray-500">Asignado</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {selectedRole && (
                      <button
                        onClick={handleAssignRole}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-2 rounded-lg font-medium transition-colors duration-200"
                      >
                        {loading ? 'Asignando...' : 'Confirmar Asignación de Rol'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showRefreshModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-gray-900 border border-blue-500 rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Rol Actualizado</h3>
                <p className="text-sm text-blue-300">Los permisos han sido modificados</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6">
              Los cambios de rol han sido aplicados. Es recomendable refrescar la página para que todos los usuarios vean los cambios actualizados.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRefreshModal(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Continuar
              </button>
              <button
                onClick={handleRefreshPage}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Refrescar Página
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModerationPanel;