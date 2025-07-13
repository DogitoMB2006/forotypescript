import { useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from './useAuth';

export const useRoleChangeListener = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    const rolesQuery = query(
      collection(db, 'userRoles'),
      where('userId', '==', user.uid)
    );

    let initialLoad = true;
    let previousRoles: string[] = [];

    const unsubscribe = onSnapshot(rolesQuery, (snapshot) => {
      const currentRoles = snapshot.docs.map(doc => doc.data().roleId);
      
      if (initialLoad) {
        previousRoles = currentRoles;
        initialLoad = false;
        return;
      }

      const rolesRemoved = previousRoles.filter(role => !currentRoles.includes(role));
      const rolesAdded = currentRoles.filter(role => !previousRoles.includes(role));

      if (rolesRemoved.length > 0 || rolesAdded.length > 0) {
        const messages = [];
        let forceRefresh = false;
        
        if (rolesRemoved.length > 0) {
          const removedRoleNames = rolesRemoved.map(roleId => {
            switch (roleId) {
              case 'moderator': return 'Moderador';
              case 'admin': return 'Administrador';
              default: return roleId;
            }
          });
          messages.push(`Se te ha removido el rol: ${removedRoleNames.join(', ')}`);
          forceRefresh = true;
        }

        if (rolesAdded.length > 0) {
          const addedRoleNames = rolesAdded.map(roleId => {
            switch (roleId) {
              case 'moderator': return 'Moderador';
              case 'admin': return 'Administrador';
              default: return roleId;
            }
          });
          messages.push(`Se te ha asignado el rol: ${addedRoleNames.join(', ')}`);
        }

        showRoleChangeNotification(messages.join('\n'), forceRefresh);
      }

      previousRoles = currentRoles;
    });

    return () => unsubscribe();
  }, [user?.uid]);
};

const showRoleChangeNotification = (message: string, forceRefresh: boolean = false) => {
  if (forceRefresh) {
    const notification = document.createElement('div');
    notification.className = 'fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999]';
    
    notification.innerHTML = `
      <div class="bg-gray-900 border border-red-500 rounded-xl shadow-2xl p-6 max-w-md mx-4">
        <div class="flex items-center space-x-3 mb-4">
          <div class="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-white">Permisos Removidos</h3>
            <p class="text-sm text-red-300">Actualizando página...</p>
          </div>
        </div>
        <p class="text-gray-300 text-sm mb-4 whitespace-pre-line">${message}</p>
        <p class="text-gray-400 text-xs mb-4">La página se refrescará automáticamente en <span id="countdown">3</span> segundos para aplicar los cambios.</p>
        <div class="w-full bg-gray-700 rounded-full h-2">
          <div id="progress-bar" class="bg-red-600 h-2 rounded-full transition-all duration-1000" style="width: 0%"></div>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    let countdown = 3;
    const countdownElement = notification.querySelector('#countdown');
    const progressBar = notification.querySelector('#progress-bar');

    const timer = setInterval(() => {
      countdown--;
      if (countdownElement) countdownElement.textContent = countdown.toString();
      if (progressBar) (progressBar as HTMLElement).style.width = `${((3 - countdown) / 3) * 100}%`;
      
      if (countdown <= 0) {
        clearInterval(timer);
        window.location.reload();
      }
    }, 1000);

    return;
  }

  const notification = document.createElement('div');
  notification.className = 'fixed top-4 right-4 z-[9999] bg-gray-900 border border-blue-500 rounded-xl shadow-2xl p-6 max-w-sm animate-in slide-in-from-right-full duration-500';
  
  notification.innerHTML = `
    <div class="flex items-start space-x-3">
      <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="text-lg font-semibold text-white mb-2">Nuevo Rol Asignado</h3>
        <p class="text-gray-300 text-sm mb-4 whitespace-pre-line">${message}</p>
        <p class="text-gray-400 text-xs mb-4">Tus permisos han sido actualizados. Se recomienda refrescar la página.</p>
        <div class="flex space-x-2">
          <button id="dismiss-role-change" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200">
            Continuar
          </button>
          <button id="refresh-role-change" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors duration-200">
            Refrescar
          </button>
        </div>
      </div>
      <button id="close-role-change" class="text-gray-400 hover:text-white p-1 rounded transition-colors duration-200 flex-shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  `;

  document.body.appendChild(notification);

  const dismissBtn = notification.querySelector('#dismiss-role-change');
  const refreshBtn = notification.querySelector('#refresh-role-change');
  const closeBtn = notification.querySelector('#close-role-change');

  const removeNotification = () => {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  };

  dismissBtn?.addEventListener('click', removeNotification);
  closeBtn?.addEventListener('click', removeNotification);
  refreshBtn?.addEventListener('click', () => {
    window.location.reload();
  });

  setTimeout(removeNotification, 10000);
};