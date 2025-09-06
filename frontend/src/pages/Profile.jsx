import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, partnerAPI, reelsAPI, orderAPI } from '../services/api';
import ReelCard from '../components/ReelCard';
import LoadingSpinner from '../components/LoadingSpinner';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { User, Heart, Bookmark, Grid, Film, LogOut, Upload, Edit3, TrendingUp, ShoppingBag, DollarSign, Eye, Plus, Settings, BarChart3, Home, Package, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

// Partner Profile Component
const PartnerProfile = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [partnerData, setPartnerData] = useState(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [myReels, setMyReels] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    brandName: '',
    description: ''
  });
  const [uploadForm, setUploadForm] = useState({
    video: null,
    caption: '',
    price: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');

  useEffect(() => {
    fetchPartnerData();
  }, []);

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      const [profileRes, reelsRes, ordersRes] = await Promise.all([
        partnerAPI.getProfile().catch(() => ({ data: user })),
        partnerAPI.getMyReels().catch(() => ({ data: [] })),
        partnerAPI.getOrders().catch(() => ({ data: [] }))
      ]);
      
      setPartnerData(profileRes.data);
      setMyReels(reelsRes.data);
      setOrders(ordersRes.data);
      setEditForm({
        name: profileRes.data.name || user?.name || '',
        brandName: profileRes.data.brandName || '',
        description: profileRes.data.description || ''
      });
    } catch (error) {
      console.error('Error fetching partner data:', error);
      toast.error('Failed to load partner data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await partnerAPI.updateProfile(editForm);
      setPartnerData(prev => ({ ...prev, ...editForm }));
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const validateVideo = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        const duration = video.duration;
        
        if (duration > 30) {
          reject(new Error(`Video duration is ${Math.round(duration)}s. Maximum allowed is 30 seconds.`));
        } else if (file.size > 25 * 1024 * 1024) { // 25MB limit
          reject(new Error('Video file is too large. Maximum size is 25MB.'));
        } else {
          resolve(duration);
        }
      };
      
      video.onerror = () => {
        reject(new Error('Invalid video file format.'));
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  const handleUploadReel = async () => {
    if (!uploadForm.video || !uploadForm.price) {
      toast.error('Please select a video and set a price');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setUploadStage('Validating video...');
      
      // Validate video first
      await validateVideo(uploadForm.video);
      setUploadProgress(15);
      
      // Show progress toast
      const uploadToast = toast.loading('Preparing video for upload...');
      setUploadStage('Reading video file...');
      setUploadProgress(20);
      
      const fileReader = new FileReader();
      
      fileReader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = Math.min(20 + (e.loaded / e.total) * 20, 40);
          setUploadProgress(progress);
        }
      };
      
      fileReader.onload = async (e) => {
        try {
          setUploadProgress(45);
          setUploadStage('Processing video...');
          toast.loading('Uploading your reel...', { id: uploadToast });
          
          const base64Video = e.target.result;
          
          // Simulate upload progress
          const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
              if (prev < 85) {
                return prev + 2;
              }
              clearInterval(progressInterval); // Prevent memory leak
              return prev;
            });
          }, 200);
          
          setUploadStage('Uploading to server...');
          
          // Create a timeout for the upload
          const uploadPromise = reelsAPI.uploadReel({
            video: base64Video,
            caption: uploadForm.caption,
            price: parseFloat(uploadForm.price)
          });
          
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Upload timeout - please try again with a smaller file')), 60000)
          );
          
          await Promise.race([uploadPromise, timeoutPromise]);
          
          clearInterval(progressInterval);
          setUploadProgress(95);
          setUploadStage('Finalizing...');
          
          // Small delay for finalization
          await new Promise(resolve => setTimeout(resolve, 500));
          
          setUploadProgress(100);
          setUploadStage('Upload complete!');
          
          toast.success('Reel uploaded successfully!', { id: uploadToast });
          setUploadForm({ video: null, caption: '', price: '' });
          
          // Reset file input
          const fileInput = document.querySelector('input[type="file"]');
          if (fileInput) fileInput.value = '';
          
          // Refresh data
          await fetchPartnerData();
          
        } catch (error) {
          console.error('Error uploading reel:', error);
          
          // Clear progress interval on error
          clearInterval(progressInterval);
          
          let message = 'Failed to upload reel';
          
          if (error.message.includes('timeout')) {
            message = 'Upload timed out. Please try again with a smaller file.';
          } else if (error.code === 'NETWORK_ERROR' || error.message.includes('aborted')) {
            message = 'Network error. Please check your connection and try again.';
          } else if (error.response?.status === 413) {
            message = 'File too large. Please use a smaller video file.';
          } else if (error.response?.status === 400) {
            message = error.response?.data?.message || 'Invalid video file. Please try a different format.';
          } else if (error.response?.data?.message) {
            message = error.response.data.message;
          }
          
          toast.error(message, { id: uploadToast });
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          setUploadStage('');
        }
      };
      
      fileReader.onerror = () => {
        toast.error('Failed to read video file. Please try again.');
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStage('');
      };
      
      fileReader.readAsDataURL(uploadForm.video);
      
    } catch (error) {
      console.error('Error processing video:', error);
      toast.error(error.message || 'Failed to process video');
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await partnerAPI.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(order => 
        order._id === orderId ? { ...order, status } : order
      ));
      toast.success('Order status updated');
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleDeleteReel = async (reelId) => {
    if (!window.confirm('Are you sure you want to delete this reel? This action cannot be undone.')) {
      return;
    }

    try {
      await partnerAPI.deleteReel(reelId);
      setMyReels(prev => prev.filter(reel => reel._id !== reelId));
      toast.success('Reel deleted successfully');
    } catch (error) {
      console.error('Error deleting reel:', error);
      toast.error('Failed to delete reel');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" text="Loading partner dashboard..." />
      </div>
    );
  }

  const stats = {
    totalReels: myReels.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, order) => sum + (order.reel?.price || 0), 0),
    pendingOrders: orders.filter(order => order.status === 'pending').length
  };

  return (
    <div className="min-h-screen bg-black">
      {/* App Header */}
      <AppHeader />



      {/* Profile Content with padding for header */}
      <div className="pt-20">
        {/* Partner Profile Header */}
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-6xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{backgroundColor: 'var(--vestira-gold)', opacity: 0.9}}>
                  <User className="h-8 w-8 text-black" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white font-heading">
                    {partnerData?.name || user?.name || 'Partner'}
                  </h1>
                  {partnerData?.brandName && (
                    <p className="font-medium font-body" style={{color: 'var(--vestira-gold)'}}>
                      {partnerData.brandName}
                    </p>
                  )}
                  <p className="text-gray-300 text-sm font-body">{user?.email}</p>
                </div>
              </div>
              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-body"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'reels', label: 'My Reels', icon: Film },
              { id: 'upload', label: 'Upload', icon: Upload },
              { id: 'orders', label: 'Orders', icon: ShoppingBag },
              { id: 'profile', label: 'Profile', icon: Settings }
            ].map(section => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors whitespace-nowrap ${
                    activeSection === section.id
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-sm sm:text-base">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeSection === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Dashboard Overview</h2>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Film className="h-5 w-5 text-purple-400" />
                  <span className="text-sm text-gray-400">Total Reels</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalReels}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="h-5 w-5 text-blue-400" />
                  <span className="text-sm text-gray-400">Total Orders</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.totalOrders}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5 text-green-400" />
                  <span className="text-sm text-gray-400">Revenue</span>
                </div>
                <p className="text-2xl font-bold text-white">₹{stats.totalRevenue}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-orange-400" />
                  <span className="text-sm text-gray-400">Pending</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.pendingOrders}</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Recent Orders</h3>
              {orders.slice(0, 5).length > 0 ? (
                <div className="space-y-3">
                  {orders.slice(0, 5).map(order => (
                    <div key={order._id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{order.user?.username}</p>
                        <p className="text-gray-400 text-sm">₹{order.reel?.price}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === 'completed' ? 'bg-green-900 text-green-300' :
                        order.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No orders yet</p>
              )}
            </div>
          </div>
        )}

        {activeSection === 'reels' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">My Reels ({myReels.length})</h2>
            {myReels.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {myReels.map((reel, index) => (
                  <motion.div
                    key={reel._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-purple-500 transition-all"
                  >
                    <div className="aspect-[9/16] bg-gray-800 relative">
                      <video
                        src={reel.videoUrl}
                        className="w-full h-full object-cover"
                        muted={true} // Start muted to prevent autoplay blocking
                        loop
                        playsInline
                        autoPlay={index < 3} // Autoplay first 3 reels
                        preload={index < 3 ? "auto" : "metadata"}
                        onLoadedData={(e) => {
                          if (index < 3) {
                            e.target.play().catch(() => {});
                          }
                        }}
                        onMouseEnter={(e) => e.target.play().catch(() => {})}
                        onMouseLeave={(e) => {
                          if (index >= 3) { // Don't pause auto-playing reels on hover
                            e.target.pause();
                            e.target.currentTime = 0;
                          }
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-60 rounded px-2 py-1">
                        <span className="text-white text-xs">₹{reel.price}</span>
                      </div>
                      {/* Delete button */}
                      <div className="absolute top-2 left-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteReel(reel._id)}
                          className="w-8 h-8 bg-red-600 bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center transition-all duration-200"
                          title="Delete reel"
                        >
                          <Trash2 className="w-4 h-4 text-white" />
                        </motion.button>
                      </div>
                      {/* Play indicator for non-autoplaying videos */}
                      {index >= 3 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                          <div className="w-12 h-12 bg-white bg-opacity-80 rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[8px] border-l-black border-y-[6px] border-y-transparent ml-1"></div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-white text-sm font-medium truncate" title={reel.caption}>
                        {reel.caption || 'No caption'}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                        <span>{reel.likes?.length || 0} likes</span>
                        <span>{reel.saves?.length || 0} saves</span>
                        <span className="text-purple-400">{index < 3 ? 'Playing' : 'Preview'}</span>
                      </div>
                      {/* Additional delete option in card footer */}
                      <div className="mt-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleDeleteReel(reel._id)}
                          className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 px-2 py-1 rounded transition-all duration-200 flex items-center justify-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Film className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No reels uploaded yet</p>
                <button
                  onClick={() => setActiveSection('upload')}
                  className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Upload Your First Reel
                </button>
              </div>
            )}
          </div>
        )}

        {activeSection === 'upload' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Upload New Reel</h2>
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Video File</label>
                  <input
                    type="file"
                    accept="video/mp4,video/mov,video/avi,video/webm"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        validateVideo(file)
                          .then(() => {
                            setUploadForm({...uploadForm, video: file});
                          })
                          .catch((error) => {
                            toast.error(error.message);
                            e.target.value = '';
                          });
                      }
                    }}
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Max duration: 30 seconds, Max size: 25MB. Supported formats: MP4, MOV, AVI, WebM
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Caption</label>
                  <textarea
                    value={uploadForm.caption}
                    onChange={(e) => setUploadForm({...uploadForm, caption: e.target.value})}
                    placeholder="Describe your reel..."
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price (₹)</label>
                  <input
                    type="number"
                    value={uploadForm.price}
                    onChange={(e) => setUploadForm({...uploadForm, price: e.target.value})}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
                {/* Upload Progress Bar */}
                {isUploading && (
                  <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-300">{uploadStage}</span>
                      <span className="text-sm text-purple-400 font-medium">{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                )}
                
                {/* Upload Button */}
                <button
                  onClick={handleUploadReel}
                  disabled={isUploading || !uploadForm.video || !uploadForm.price}
                  className={`w-full relative overflow-hidden rounded-xl transition-all duration-300 transform ${
                    isUploading || !uploadForm.video || !uploadForm.price
                      ? 'bg-gray-700 cursor-not-allowed opacity-60' 
                      : 'bg-gradient-to-r from-purple-600 via-purple-500 to-indigo-600 hover:from-purple-700 hover:via-purple-600 hover:to-indigo-700 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/25 active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-3 px-6 py-4">
                    {isUploading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="font-medium text-white">
                          {uploadStage || 'Processing...'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-5 w-5 text-white" />
                        <span className="font-semibold text-white text-lg">
                          Upload Reel
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      </>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'orders' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Orders ({orders.length})</h2>
            {orders.length > 0 ? (
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-800">
                  {orders.map(order => (
                    <div key={order._id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="text-white font-medium">{order.user?.username}</p>
                              <p className="text-gray-400 text-sm">{order.user?.email}</p>
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-gray-300 text-sm">{order.reel?.caption}</p>
                            <p className="text-green-400 font-bold">₹{order.reel?.price}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                            className="p-2 bg-gray-800 border border-gray-700 rounded text-white focus:border-purple-500 focus:outline-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <ShoppingBag className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No orders yet</p>
              </div>
            )}
          </div>
        )}

        {activeSection === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Profile Settings</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Edit3 className="h-4 w-4" />
                <span>{isEditing ? 'Cancel' : 'Edit'}</span>
              </button>
            </div>
            
            <div className="bg-gray-900 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  ) : (
                    <p className="text-white">{partnerData?.name || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Brand Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.brandName}
                      onChange={(e) => setEditForm({...editForm, brandName: e.target.value})}
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    />
                  ) : (
                    <p className="text-white">{partnerData?.brandName || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  {isEditing ? (
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      placeholder="Tell us about your brand..."
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none resize-none"
                      rows={4}
                    />
                  ) : (
                    <p className="text-white">{partnerData?.description || 'No description provided'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <p className="text-gray-400">{user?.email}</p>
                </div>
                
                {isEditing && (
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleUpdateProfile}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, userType, logout } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('liked');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(4);
  const [userOrders, setUserOrders] = useState([]);

  // Reset visible count when switching tabs
  useEffect(() => {
    setVisibleCount(4);
  }, [activeTab]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const [profileResponse, ordersResponse] = await Promise.all([
          userAPI.getProfile(),
          orderAPI.getUserOrders().catch(() => ({ data: [] }))
        ]);
        setProfileData(profileResponse.data);
        setUserOrders(ordersResponse.data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (userType === 'user') {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [userType]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleReelUpdate = (updatedReel) => {
    if (!profileData) return;

    setProfileData(prev => ({
      ...prev,
      likedReels: prev.likedReels.map(reel => 
        reel._id === updatedReel._id ? updatedReel : reel
      ),
      savedReels: prev.savedReels.map(reel => 
        reel._id === updatedReel._id ? updatedReel : reel
      ),
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" text="Loading your profile..." />
      </div>
    );
  }

  // Partner view (comprehensive)
  if (userType === 'partner') {
    return <PartnerProfile user={user} onLogout={handleLogout} />;
  }

  // User profile view
  const likedReels = profileData?.likedReels || [];
  const savedReels = profileData?.savedReels || [];

  const tabs = [
    { id: 'liked', label: 'Liked', icon: Heart, count: likedReels.length },
    { id: 'saved', label: 'Saved', icon: Bookmark, count: savedReels.length },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, count: userOrders.length },
  ];

  const currentReels = activeTab === 'liked' ? likedReels : activeTab === 'saved' ? savedReels : [];
  const displayedReels = currentReels.slice(0, visibleCount);
  const hasMoreReels = currentReels.length > visibleCount;

  const loadMoreReels = () => {
    setVisibleCount(prev => Math.min(prev + 4, currentReels.length));
  };

  const handleReelClick = (reel, reelIndex) => {
    // Store the selected reel data and navigate to feed
    localStorage.setItem('selectedReel', JSON.stringify({
      reel,
      source: activeTab,
      allReels: currentReels
    }));
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black">
      {/* App Header */}
      <AppHeader />



      {/* Profile Content with padding for header */}
      <div className="pt-20">
        {/* Profile Header */}
        <div className="bg-gray-900">
          <div className="max-w-sm mx-auto px-4 py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: 'var(--vestira-gold)', opacity: 0.9}}>
                <User className="h-10 w-10 text-black" />
              </div>
              
              <h1 className="text-2xl font-bold text-white mb-2 font-heading">
                {user?.username}
              </h1>
              <p className="text-gray-300 mb-4 font-body">{user?.email}</p>
            
            <div className="flex justify-center space-x-8 mb-6">
              {tabs.map(tab => (
                <div key={tab.id} className="text-center">
                  <p className="text-xl font-bold text-white">{tab.count}</p>
                  <p className="text-sm text-gray-300 capitalize">{tab.label}</p>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 p-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-body"
            >
              <LogOut className="h-5 w-5" />
              <span>Log out</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-sm mx-auto px-4">
          <div className="flex space-x-4">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 border-b-2 transition-colors flex-1 justify-center font-body
                    ${activeTab === tab.id
                      ? 'text-white' 
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                    }
                  `}
                  style={activeTab === tab.id ? {borderColor: 'var(--vestira-gold)', color: 'var(--vestira-gold)'} : {}}
                >
                  <Icon className={`h-5 w-5 ${activeTab === tab.id ? 'fill-current' : ''}`} />
                  <span className="font-medium">{tab.label}</span>
                  <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-sm mx-auto px-4 py-6">
        {/* Orders Tab Content */}
        {activeTab === 'orders' && (
          <>
            {userOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="mb-4">
                  <Package className="h-16 w-16 text-gray-600 mx-auto" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  No orders yet
                </h2>
                <p className="text-gray-300 mb-6">
                  Start shopping and your orders will appear here!
                </p>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {userOrders.map((order, index) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-800"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-white font-medium text-sm mb-1">
                          {order.reel?.caption || 'Order'}
                        </h3>
                        <p className="text-gray-400 text-xs">
                          Order #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-400 font-bold text-sm">₹{order.totalAmount}</p>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                          order.status === 'completed' ? 'bg-green-900 text-green-300' :
                          order.status === 'pending' ? 'bg-yellow-900 text-yellow-300' :
                          order.status === 'processing' ? 'bg-blue-900 text-blue-300' :
                          order.status === 'shipped' ? 'bg-purple-900 text-purple-300' :
                          order.status === 'delivered' ? 'bg-green-900 text-green-300' :
                          order.status === 'cancelled' ? 'bg-red-900 text-red-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                          {order.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-800 pt-3">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Quantity: {order.quantity}</span>
                        <span>By: {order.reel?.partner?.brandName || order.reel?.partner?.name}</span>
                      </div>
                      {order.customerInfo?.name && (
                        <div className="mt-2 text-xs text-gray-400">
                          <p>Delivery to: {order.customerInfo.name}</p>
                          {order.customerInfo.phone && (
                            <p>Phone: {order.customerInfo.phone}</p>
                          )}
                        </div>
                      )}
                      {order.notes && (
                        <div className="mt-2 text-xs text-gray-300">
                          <p>Notes: {order.notes}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Reels Content (Liked/Saved) */}
        {activeTab !== 'orders' && (
          <>
            {/* Empty State */}
            {currentReels.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <div className="mb-4">
                  {activeTab === 'liked' ? (
                    <Heart className="h-16 w-16 text-gray-600 mx-auto" />
                  ) : (
                    <Bookmark className="h-16 w-16 text-gray-600 mx-auto" />
                  )}
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  No {activeTab} reels yet
                </h2>
                <p className="text-gray-300 mb-6">
                  {activeTab === 'liked' 
                    ? 'Start exploring and like reels you enjoy!' 
                    : 'Save reels to watch them later!'
                  }
                </p>
              </motion.div>
            )}

        {/* Reels Grid */}
        {currentReels.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-2">
              {displayedReels.map((reel, index) => (
                <motion.div
                  key={`${activeTab}-${reel._id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="aspect-[9/16] rounded-lg overflow-hidden bg-gray-800 relative group cursor-pointer"
                  onClick={() => handleReelClick(reel, index)}
                >
                  <video
                    src={reel.videoUrl}
                    className="w-full h-full object-cover"
                    loop
                    muted
                    autoPlay
                    playsInline
                    webkit-playsinline="true"
                    x5-playsinline="true"
                    x5-video-player-type="h5"
                    preload="auto"
                    poster=""
                    style={{
                      WebkitTransform: 'translateZ(0)',
                      backfaceVisibility: 'hidden'
                    }}
                    onLoadedData={(e) => {
                      // Ensure video plays to be visible
                      e.target.play().catch(() => {});
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200"></div>
                  
                  {/* Play indicator */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Overlay Info */}
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Heart className={`h-4 w-4 ${reel.likes?.includes(user?.id) ? 'fill-red-500 text-red-500' : 'text-white'}`} />
                        <span className="text-white text-xs">{reel.likes?.length || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Bookmark className={`h-4 w-4 ${reel.saves?.includes(user?.id) ? 'fill-blue-500 text-blue-500' : 'text-white'}`} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            {/* Load More Button */}
            {hasMoreReels && (
              <div className="flex justify-center mt-6">
                <motion.button
                  onClick={loadMoreReels}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                >
                  Load More ({currentReels.length - visibleCount} remaining)
                </motion.button>
              </div>
            )}
          </>
        )}
          </>
        )}
      </div>
      </div>
    </div>
  );
};

export default Profile;