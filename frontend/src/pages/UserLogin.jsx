import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const UserLogin = () => {
  const navigate = useNavigate();
  const { loginUser, isLoading } = useAuth();
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
    const result = await loginUser(formData);
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
            <h2 className="font-heading text-2xl font-semibold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600 font-body">Sign in to continue your fashion journey</p>
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
                  placeholder="Enter your email"
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
                'Sign In'
              )}
            </motion.button>
          </form>

          <div className="mt-8 text-center space-y-4">
            <p className="text-gray-600 font-body">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium" style={{color: 'var(--vestira-gold)'}}>
                Sign up here
              </Link>
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="h-px bg-gray-300 flex-1"></div>
              <span className="text-gray-500 text-sm font-body">or</span>
              <div className="h-px bg-gray-300 flex-1"></div>
            </div>
            <Link 
              to="/partner/login" 
              className="font-medium text-sm font-body" style={{color: 'var(--vestira-gold)'}}
            >
              Continue as Partner →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UserLogin;