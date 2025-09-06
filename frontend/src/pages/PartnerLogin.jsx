import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

const PartnerLogin = () => {
  const navigate = useNavigate();
  const { loginPartner, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await loginPartner(formData);
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="auth-card p-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <h1 className="font-heading text-4xl font-bold text-gray-900 mb-2">Vestira</h1>
              <p className="brand-tagline text-gray-500 mb-4">Runway to Your Wardrobe</p>
            </motion.div>
            <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: 'var(--vestira-gold)', opacity: 0.1}}>
              <Briefcase className="h-8 w-8" style={{color: 'var(--vestira-gold)'}} />
            </div>
            <h2 className="font-heading text-2xl font-semibold text-gray-900 mb-2">Partner Portal</h2>
            <p className="text-gray-600 font-body">Access your creator dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2 font-body">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="Enter your partner email"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2 font-body">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="loading-spinner mx-auto"></div>
              ) : (
                'Sign In as Partner'
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-gray-600 font-body">
              New partner?{' '}
              <Link to="/partner/register" className="font-medium" style={{color: 'var(--vestira-gold)'}}>
                Register here
              </Link>
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="text-gray-500 text-sm font-body">or</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>
            <Link 
              to="/login" 
              className="font-medium text-sm font-body" style={{color: 'var(--vestira-gold)'}}
            >
              ← Back to User Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PartnerLogin;