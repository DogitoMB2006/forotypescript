import { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CreatePost from '../components/posts/CreatePost';

const CreatePostPage: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <CreatePost 
        isOpen={true} 
        onClose={() => navigate('/')} 
      />
    </div>
  );
};

export default CreatePostPage;