import type { FC } from 'react';
import { useParams } from 'react-router-dom';
import Profile from '../components/profile/Profile';
import BackButton from '../components/ui/BackButton';

const ProfilePage: FC = () => {
  const { userId } = useParams<{ userId?: string }>();

  return (
    <div className="min-h-screen bg-gray-950 py-8">
      <BackButton />
      <div className="container mx-auto px-4">
        <Profile userId={userId} />
      </div>
    </div>
  );
};

export default ProfilePage;