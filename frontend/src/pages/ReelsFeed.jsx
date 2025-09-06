import React, { useState, useEffect, useCallback, useRef } from 'react';
import { reelsAPI } from '../services/api';
import ReelCard from '../components/ReelCard';
import LoadingSpinner from '../components/LoadingSpinner';
import AppHeader from '../components/AppHeader';
import { useInView } from 'react-intersection-observer';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Video } from 'lucide-react';
import toast from 'react-hot-toast';

const ReelsFeed = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const containerRef = useRef(null);

  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false,
  });

  const loadReels = useCallback(async (pageNum = 1, append = false) => {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await reelsAPI.getReels(pageNum, 10);
      const { reels: newReels, totalPages, currentPage } = response.data;

      if (append) {
        setReels(prev => {
          // Remove duplicates
          const existingIds = new Set(prev.map(reel => reel._id));
          const uniqueNewReels = newReels.filter(reel => !existingIds.has(reel._id));
          return [...prev, ...uniqueNewReels];
        });
      } else {
        setReels(newReels);
      }

      setHasMore(currentPage < totalPages);
      setPage(currentPage);
    } catch (error) {
      console.error('Error loading reels:', error);
      setError('Failed to load reels. Please try again.');
      toast.error('Failed to load reels');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Initial load and handle selected reel from profile
  useEffect(() => {
    const selectedReelData = localStorage.getItem('selectedReel');
    if (selectedReelData) {
      try {
        const { reel, source, allReels } = JSON.parse(selectedReelData);
        setReels(allReels);
        const reelIndex = allReels.findIndex(r => r._id === reel._id);
        if (reelIndex >= 0) {
          setCurrentReelIndex(reelIndex);
          // Scroll to the selected reel
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = reelIndex * window.innerHeight;
            }
          }, 100);
        }
        localStorage.removeItem('selectedReel');
      } catch (error) {
        console.error('Error loading selected reel:', error);
        loadReels(1, false);
      }
    } else {
      loadReels(1, false);
    }
  }, []);

  // Load more when scrolling to bottom with throttling
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inView && hasMore && !loading) {
        loadReels(page + 1, true);
      }
    }, 100); // Throttle to prevent excessive API calls

    return () => clearTimeout(timer);
  }, [inView, hasMore, loading, page, loadReels]);

  const handleReelUpdate = useCallback((updatedReel) => {
    setReels(prev => 
      prev.map(reel => 
        reel._id === updatedReel._id ? updatedReel : reel
      )
    );
  }, []);

  const refreshFeed = () => {
    setPage(1);
    setHasMore(true);
    loadReels(1, false);
  };

  if (error && reels.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        {/* App Header */}
        <AppHeader />
        
        {/* Error State Content */}
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center text-white px-6">
            <div className="mb-4">
              <AlertCircle className="h-16 w-16 text-gray-600 mx-auto" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <button
              onClick={refreshFeed}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }


  // Handle scroll for current index tracking
  const handleScroll = (e) => {
    const container = containerRef.current;
    if (!container) return;
    
    const containerHeight = container.clientHeight;
    const scrollTop = container.scrollTop;
    const newIndex = Math.round(scrollTop / containerHeight);
    
    if (newIndex !== currentReelIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentReelIndex(newIndex);
      
      // Load more reels when approaching the end
      if (newIndex >= reels.length - 2 && hasMore && !loading) {
        loadReels(page + 1, true);
      }
    }
  };

  if (loading && reels.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading reels..." />
      </div>
    );
  }

  if (!loading && reels.length === 0) {
    return (
      <div className="min-h-screen bg-black">
        {/* App Header */}
        <AppHeader />
        
        {/* Empty State Content */}
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white px-6"
          >
            <div className="mb-6">
              <h1 className="brand-title text-5xl mb-4">Vestira</h1>
              <p className="brand-tagline mb-8">Runway to Your Wardrobe</p>
            </div>
            <div className="mb-4">
              <Video className="h-16 w-16 text-gray-600 mx-auto" />
            </div>
            <h2 className="text-2xl font-semibold mb-2 font-heading">
              No reels yet
            </h2>
            <p className="text-gray-300 mb-4 font-body">
              Check back later for amazing fashion content!
            </p>
            <button
              onClick={refreshFeed}
              className="btn-primary"
            >
              Refresh
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* App Header with Vestira Branding */}
      <AppHeader />

      {/* Fullscreen Reels Container */}
      <div
        ref={containerRef}
        className="overflow-y-auto snap-y snap-mandatory scrollbar-hide h-screen"
        onScroll={handleScroll}
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {reels.map((reel, index) => (
          <div
            key={reel._id}
            className="h-full snap-start relative"
          >
            <ReelCard
              reel={reel}
              onUpdate={handleReelUpdate}
              isActive={index === currentReelIndex}
            />
          </div>
        ))}
        
        {/* Loading indicator at bottom */}
        {loading && reels.length > 0 && (
          <div className="h-full flex items-center justify-center bg-black">
            <LoadingSpinner text="Loading more reels..." />
          </div>
        )}
        
        {/* Invisible trigger for loading more */}
        <div ref={loadMoreRef} className="h-1" />
      </div>
    </div>
  );
};

export default ReelsFeed;