import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAvailableBadges, assignBadgeToUser, removeBadgeFromUser, getUserBadges, forceRemoveAllBadges } from '../../services/badgeService';
import type { Badge as BadgeType, UserBadgeWithDetails } from '../../types/badge';
import Badge from '../user/Badge';

interface SelfBadgeManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const SelfBadgeManager: React.FC<SelfBadgeManagerProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableBadges, setAvailableBadges] = useState<BadgeType[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadgeWithDetails[]>([]);

  useEffect(() => {
    if (isOpen) {
      console.log('Panel abierto, usuario:', user?.uid, user?.email);
      setAvailableBadges(getAvailableBadges());
      fetchUserBadges();
    }
  }, [isOpen, user]);

  const fetchUserBadges = async () => {
    if (!user) {
      console.log('No hay usuario, saltando fetchUserBadges');
      return;
    }
    console.log('Iniciando fetchUserBadges para usuario:', user.uid);
    try {
      console.log('Obteniendo badges del usuario:', user.uid);
      const badges = await getUserBadges(user.uid);
      console.log('Badges obtenidos:', badges.length, badges);
      console.log('Badge IDs:', badges.map(b => b.badgeId));
      setUserBadges(badges);
      console.log('Estado userBadges actualizado');
    } catch (error) {
      console.error('Error fetching user badges:', error);
    }
  };

  const handleRemoveAllBadges = async () => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      console.log('Iniciando eliminación de todos los badges...');
      await forceRemoveAllBadges(user.uid, user.email || '');
      console.log('Badges eliminados, actualizando lista...');
      await fetchUserBadges();
      console.log('Lista actualizada');
    } catch (error: any) {
      console.error('Error completo:', error);
      setError(error.message || 'Error al remover todos los badges');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBadge = async (badgeId: string) => {
    if (!user) return;

    setLoading(true);
    setError('');

    try {
      console.log('Toggle badge:', badgeId);
      const hasBadge = userBadges.some(ub => ub.badgeId === badgeId);
      console.log('Usuario tiene el badge:', hasBadge);
      
      if (hasBadge) {
        console.log('Removiendo badge...');
        await removeBadgeFromUser(user.uid, badgeId);
        console.log('Badge removido');
      } else {
        console.log('Asignando badge...');
        await assignBadgeToUser(user.uid, badgeId, 'self');
        console.log('Badge asignado');
      }
      
      console.log('Actualizando lista de badges...');
      await fetchUserBadges();
      console.log('Lista actualizada');
    } catch (error: any) {
      console.error('Error en toggle badge:', error);
      setError(error.message || 'Error al modificar badge');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndClose = () => {
    onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  if (user?.email !== 'dogitomb2022@gmail.com') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-purple-500 rounded-xl shadow-2xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Gestionar Mis Badges</h3>
              <p className="text-sm text-purple-300">Agregar o quitar badges</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors duration-200 hover:bg-gray-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <h4 className="text-white font-medium mb-3">Gestionar badges:</h4>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {availableBadges.map((badge) => {
                const hasBadge = userBadges.some(ub => ub.badgeId === badge.id);
                console.log(`Badge ${badge.id}: usuario tiene = ${hasBadge}`, userBadges.map(ub => ub.badgeId));
                return (
                  <button
                    key={badge.id}
                    onClick={() => handleToggleBadge(badge.id)}
                    disabled={loading}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg border transition-colors duration-200 ${
                      hasBadge
                        ? 'border-purple-500 bg-purple-600/20 text-purple-300'
                        : 'border-gray-700 bg-gray-800 hover:border-gray-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <Badge badge={badge} size="sm" showTooltip={false} />
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">{badge.name}</div>
                      <div className="text-xs opacity-70">{badge.description}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {hasBadge ? (
                        <>
                          <span className="text-xs text-purple-300">Asignado</span>
                          <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </>
                      ) : (
                        <>
                          <span className="text-xs text-gray-400">Agregar</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-purple-400 text-sm font-medium">Información</span>
            </div>
            <p className="text-purple-200 text-xs">
              Haz clic en cualquier badge para agregarlo o quitarlo de tu perfil.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              onClick={handleRemoveAllBadges}
              disabled={loading || userBadges.length === 0}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200"
            >
              {loading ? 'Quitando...' : 'Quitar Todos'}
            </button>
            <button
              onClick={handleSaveAndClose}
              disabled={loading}
              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Guardando...</span>
                </div>
              ) : (
                'Guardar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelfBadgeManager;