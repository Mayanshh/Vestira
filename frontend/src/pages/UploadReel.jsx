import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reelsAPI, uploadFile } from '../services/api';
import { Upload, Video, DollarSign, Type, X, ArrowLeft } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import AppFooter from '../components/AppFooter';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const UploadReel = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    video: null,
    caption: '',
    price: '',
  });
  const [videoPreview, setVideoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('Preparing upload...');

  const handleVideoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file');
      return;
    }

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Video file must be less than 50MB');
      return;
    }

    try {
      const base64Video = await uploadFile(file);
      setFormData(prev => ({ ...prev, video: base64Video }));
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setVideoPreview(previewUrl);
      
      toast.success('Video selected successfully!');
    } catch (error) {
      console.error('Error processing video:', error);
      toast.error('Error processing video file');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const removeVideo = () => {
    setFormData(prev => ({ ...prev, video: null }));
    setVideoPreview(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.video) {
      toast.error('Please select a video file');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Start progress immediately to show the bar
      setUploadMessage('Preparing video file...');
      setUploadProgress(5);
      
      // Give UI time to render the progress bar
      await new Promise(resolve => setTimeout(resolve, 200));

      // Realistic upload progress with better timing
      const progressSteps = [
        { progress: 15, message: 'Validating video format...', delay: 300 },
        { progress: 30, message: 'Encoding video data...', delay: 600 },
        { progress: 50, message: 'Uploading to cloud storage...', delay: 1000 },
        { progress: 70, message: 'Processing video...', delay: 700 },
        { progress: 85, message: 'Creating reel entry...', delay: 500 },
        { progress: 95, message: 'Finalizing upload...', delay: 400 }
      ];

      // Simulate progress steps with better timing
      for (const step of progressSteps) {
        setUploadMessage(step.message);
        setUploadProgress(step.progress);
        await new Promise(resolve => setTimeout(resolve, step.delay));
      }

      const uploadData = {
        video: formData.video,
        caption: formData.caption.trim(),
        price: parseFloat(formData.price),
      };
      
      const response = await reelsAPI.uploadReel(uploadData);
      
      setUploadMessage('Upload complete!');
      setUploadProgress(100);
      
      toast.success('Reel uploaded successfully!');
      
      // Clean up
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
      
      // Navigate to feed after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (error) {
      console.error('Error uploading reel:', error);
      const message = error.response?.data?.message || 'Failed to upload reel';
      toast.error(message);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen" style={{background: 'linear-gradient(135deg, var(--vestira-black) 0%, #1a1a1a 50%, var(--vestira-black) 100%)'}}>
      {/* App Header with Vestira Branding */}
      <AppHeader />
      
      {/* Content with padding for header */}
      <div className="pt-20 pb-8">
        <div className="max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="auth-card p-8"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{backgroundColor: 'var(--vestira-gold)', opacity: 0.1}}>
                <Video className="h-8 w-8" style={{color: 'var(--vestira-gold)'}} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 font-heading">Upload New Reel</h1>
              <p className="text-gray-600 font-body">Share your fashion content with the community</p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Video Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video File *
              </label>
              
              {!videoPreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-500 transition-colors">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                    id="video-upload"
                    disabled={isUploading}
                  />
                  <label
                    htmlFor="video-upload"
                    className="cursor-pointer flex flex-col items-center space-y-4"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Click to upload video
                      </p>
                      <p className="text-xs text-gray-500">
                        MP4, MOV, AVI up to 50MB
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <video
                    src={videoPreview}
                    controls
                    className="w-full max-h-64 rounded-lg bg-black"
                  />
                  <button
                    type="button"
                    onClick={removeVideo}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Caption */}
            <div>
              <label htmlFor="caption" className="block text-sm font-medium text-gray-700 mb-2">
                Caption
              </label>
              <div className="relative">
                <Type className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea
                  id="caption"
                  name="caption"
                  value={formData.caption}
                  onChange={handleChange}
                  rows={4}
                  className="input-field pl-10 resize-none"
                  placeholder="Write a captivating caption for your reel..."
                  disabled={isUploading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.caption.length}/500 characters
              </p>
            </div>

            {/* Price */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                Price *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0.01"
                  step="0.01"
                  className="input-field pl-10"
                  placeholder="9.99"
                  required
                  disabled={isUploading}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Set a price for your content in USD
              </p>
            </div>

            {/* Upload Progress */}
            <AnimatePresence>
              {isUploading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200 shadow-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-blue-900">
                      {uploadMessage}
                    </span>
                    <span className="text-lg font-bold text-blue-700 bg-white px-2 py-1 rounded">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4 shadow-inner">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full shadow-md flex items-center justify-end pr-2"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      {uploadProgress > 10 && (
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      )}
                    </motion.div>
                  </div>
                  <div className="mt-2 text-xs text-gray-600 flex justify-between">
                    <span>Uploading video content...</span>
                    <span>Please don't close this page</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                disabled={isUploading}
                className="flex-1 btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={isUploading || !formData.video || !formData.price}
                whileHover={{ scale: isUploading ? 1 : 1.02 }}
                whileTap={{ scale: isUploading ? 1 : 0.98 }}
                className="flex-1 bg-purple-500 hover:bg-purple-600 text-white font-medium py-2.5 px-6 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Upload Reel'}
              </motion.button>
            </div>
          </form>
          </motion.div>
        </div>
      </div>
      
      {/* App Footer */}
      <AppFooter variant="dark" />
    </div>
  );
};

export default UploadReel;