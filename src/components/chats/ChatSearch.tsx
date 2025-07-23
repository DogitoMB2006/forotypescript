import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { createChat } from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import Avatar from '../ui/Avatar';

interface UserSearchResult {
  id: string;
  username: string;
  displayName: string;
  profileImageUrl?: string;
}

interface ChatSearchProps {
  onSearchToggle: (isOpen: boolean) => void;
}

const ChatSearch: FC<ChatSearchProps> = ({ onSearchToggle }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user, userProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    onSearchToggle(isOpen);
  }, [isOpen, onSearchToggle]);

  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim() || searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        console.log('ChatSearch: Searching for:', searchTerm);
        
        // Buscar en la colección 'users' por username y displayName
        const usernameQuery = query(
          collection(db, 'users'),
          where('username', '>=', searchTerm.toLowerCase()),
          where('username', '<=', searchTerm.toLowerCase() + '\uf8ff'),
          limit(10)
        );

        const displayNameQuery = query(
          collection(db, 'users'),
          where('displayName', '>=', searchTerm),
          where('displayName', '<=', searchTerm + '\uf8ff'),
          limit(10)
        );

        console.log('ChatSearch: Executing queries...');
        const [usernameSnapshot, displayNameSnapshot] = await Promise.all([
          getDocs(usernameQuery),
          getDocs(displayNameQuery)
        ]);

        console.log('ChatSearch: Username results:', usernameSnapshot.size);
        console.log('ChatSearch: DisplayName results:', displayNameSnapshot.size);

        const results = new Map<string, UserSearchResult>();

        usernameSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log('ChatSearch: User found by username:', data);
          if (doc.id !== user?.uid) {
            results.set(doc.id, {
              id: doc.id,
              username: data.username,
              displayName: data.displayName,
              profileImageUrl: data.profileImageUrl
            });
          }
        });

        displayNameSnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log('ChatSearch: User found by displayName:', data);
          if (doc.id !== user?.uid) {
            results.set(doc.id, {
              id: doc.id,
              username: data.username,
              displayName: data.displayName,
              profileImageUrl: data.profileImageUrl
            });
          }
        });

        const finalResults = Array.from(results.values());
        console.log('ChatSearch: Final results:', finalResults);
        setSearchResults(finalResults);
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, user?.uid]);

  const handleUserSelect = async (selectedUser: UserSearchResult) => {
    if (!user?.uid || !userProfile) return;

    console.log('ChatSearch: User selected:', selectedUser);
    console.log('ChatSearch: Current user profile:', userProfile);

    try {
      setLoading(true);
      const chatId = await createChat(user.uid, selectedUser.id, userProfile, selectedUser);
      console.log('ChatSearch: Chat created/found:', chatId);
      navigate(`/chats/${chatId}`);
      setIsOpen(false);
      setSearchTerm('');
      setSearchResults([]);
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Error al crear el chat. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <>
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center space-x-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-left"
        >
          <Search className="w-5 h-5 text-gray-400" />
          <span className="text-gray-400">Buscar usuarios para chatear...</span>
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <div className="bg-gray-900 rounded-lg w-full max-w-md mx-4 max-h-[70vh] overflow-hidden">
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center space-x-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por usuario o nombre..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full flex items-center space-x-3 p-4 hover:bg-gray-800/50 transition-colors text-left"
                    >
                      <Avatar
                        src={user.profileImageUrl}
                        alt={user.displayName}
                        name={user.displayName}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {user.displayName}
                        </p>
                        <p className="text-gray-400 text-sm truncate">
                          @{user.username}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : searchTerm.trim() && !loading ? (
                <div className="p-8 text-center text-gray-400">
                  <p>No se encontraron usuarios</p>
                </div>
              ) : (
                <div className="p-8 text-center text-gray-400">
                  <p>Escribe para buscar usuarios</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatSearch;