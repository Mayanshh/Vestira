import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, CreditCard, User, MapPin, Phone, Mail } from 'lucide-react';
import { orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ConfettiEffect from './ConfettiEffect';
import useSound from '../hooks/useSound';

const OrderPage = ({ reel, onClose, onOrderComplete }) => {
  const { user } = useAuth();
  const { playSuccessSound } = useSound();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [orderData, setOrderData] = useState({
    quantity: 1,
    customerInfo: {
      name: user?.username || '',
      email: user?.email || '',
      phone: '',
      address: '',
    },
    notes: '',
  });

  const handleClose = () => {
    // Restore body scroll when modal closes
    const scrollY = document.body.style.top;
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, parseInt(scrollY || '0') * -1);
    onClose();
  };

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setOrderData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setOrderData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const calculateTotal = () => {
    return (reel.price * orderData.quantity).toFixed(2);
  };

  const handlePlaceOrder = async () => {
    if (!orderData.customerInfo.name || !orderData.customerInfo.email || !orderData.customerInfo.phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await orderAPI.placeOrder({
        reelId: reel._id,
        quantity: orderData.quantity,
        customerInfo: orderData.customerInfo,
        notes: orderData.notes,
        totalAmount: parseFloat(calculateTotal()),
      });

      // Trigger success animations and sound
      setShowConfetti(true);
      playSuccessSound();
      toast.success('Order placed successfully!');
      
      onOrderComplete && onOrderComplete(response.data);
      
      // Close modal after celebrations
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <ConfettiEffect 
        isActive={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && !isLoading && handleClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className="bg-white/90 backdrop-blur-xl rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            touchAction: 'pan-y'
          }}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold flex items-center gap-3 text-gray-800"
            >
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl text-white">
                <ShoppingCart className="w-5 h-5" />
              </div>
              Order Details
            </motion.h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleClose}
              className="p-2 hover:bg-gray-800/20 rounded-xl transition-all duration-200 text-gray-800 hover:text-gray-900 bg-gray-200/30"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Reel Info */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/30 backdrop-blur-sm rounded-2xl p-4 border border-white/20 shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 bg-gray-200/50 rounded-2xl overflow-hidden flex-shrink-0 shadow-md border border-white/30">
                  <video 
                    src={reel.videoUrl} 
                    className="w-full h-full object-cover"
                    muted
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 line-clamp-2">{reel.caption}</p>
                  <p className="text-gray-600 text-xs mt-1 font-medium">
                    by {reel.partner?.brandName || reel.partner?.name}
                  </p>
                  <p className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-1">
                    ₹{reel.price}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quantity */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleInputChange('quantity', Math.max(1, orderData.quantity - 1))}
                  className="w-10 h-10 rounded-full bg-white/40 border border-white/30 flex items-center justify-center hover:bg-white/60 transition-all duration-200 text-gray-700 font-bold backdrop-blur-sm shadow-md"
                >
                  -
                </motion.button>
                <div className="w-16 h-10 bg-white/30 rounded-2xl border border-white/20 flex items-center justify-center backdrop-blur-sm shadow-md">
                  <span className="text-center font-bold text-gray-800">{orderData.quantity}</span>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleInputChange('quantity', orderData.quantity + 1)}
                  className="w-10 h-10 rounded-full bg-white/40 border border-white/30 flex items-center justify-center hover:bg-white/60 transition-all duration-200 text-gray-700 font-bold backdrop-blur-sm shadow-md"
                >
                  +
                </motion.button>
              </div>
            </motion.div>

            {/* Customer Information */}
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={orderData.customerInfo.name}
                  onChange={(e) => handleInputChange('customerInfo.name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={orderData.customerInfo.email}
                  onChange={(e) => handleInputChange('customerInfo.email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={orderData.customerInfo.phone}
                  onChange={(e) => handleInputChange('customerInfo.phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={orderData.customerInfo.address}
                  onChange={(e) => handleInputChange('customerInfo.address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Enter your address (optional)"
                />
              </div>
            </div>

            {/* Order Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions
              </label>
              <textarea
                value={orderData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Any special requests or instructions (optional)"
              />
            </div>

            {/* Order Total */}
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="flex justify-between items-center text-sm">
                <span>Price per item:</span>
                <span>₹{reel.price}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Quantity:</span>
                <span>{orderData.quantity}</span>
              </div>
              <div className="border-t border-blue-200 mt-2 pt-2 flex justify-between items-center font-bold text-lg">
                <span>Total:</span>
                <span className="text-blue-600">₹{calculateTotal()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <motion.button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isLoading}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-lg"
              >
                {isLoading ? (
                  <>
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" 
                    />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Place Order</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OrderPage;