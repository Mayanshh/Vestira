import React from 'react';
import { motion } from 'framer-motion';
import { User, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AppHeader = ({ showBranding = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isProfilePage = location.pathname === '/profile';

  return (
    <motion.header 
      className="fixed top-0 left-0 right-0 z-40 px-4 py-3"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side - Brand Name Only */}
        <div className="flex items-center">
          {showBranding && (
            <motion.h1 
              className="font-heading text-xl md:text-2xl font-bold text-white cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/')}
            >
              Vestira
            </motion.h1>
          )}
        </div>

        {/* Right side - Navigation Icon */}
        <motion.button
          onClick={() => navigate(isProfilePage ? '/' : '/profile')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 rounded-full transition-colors text-white hover:bg-white hover:bg-opacity-20"
          title={isProfilePage ? "Home" : "Profile"}
        >
          {isProfilePage ? <Home className="w-5 h-5" /> : <User className="w-5 h-5" />}
        </motion.button>
      </div>
    </motion.header>
  );
};

export default AppHeader;