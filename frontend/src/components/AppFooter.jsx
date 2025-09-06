import React from 'react';
import { motion } from 'framer-motion';

const AppFooter = ({ variant = 'dark' }) => {
  const footerClass = variant === 'dark' 
    ? 'bg-black text-white border-t border-white border-opacity-10'
    : 'bg-white text-gray-600 border-t border-gray-200';

  return (
    <motion.footer 
      className={`${footerClass} py-4 px-6`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
          {/* Left side - Brand */}
          <div className="text-center md:text-left">
            <p className="font-heading text-lg font-semibold">Vestira</p>
            <p className="brand-tagline text-xs" style={{color: 'var(--vestira-gold)'}}>
              Runway to Your Wardrobe
            </p>
          </div>

          {/* Right side - Copyright */}
          <div className="text-center md:text-right">
            <p className="text-xs opacity-60 font-body">
              © 2025 Vestira. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default AppFooter;