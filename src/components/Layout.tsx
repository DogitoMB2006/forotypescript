import type { FC } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './ui/Navbar';
import ToastContainer from './ui/ToastContainer';

const Layout: FC = () => {
  return (
    <>
      <Navbar />
      <Outlet />
      <ToastContainer />
    </>
  );
};

export default Layout;