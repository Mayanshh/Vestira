import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, Bookmark, Share, Play, Pause, MoreVertical, User, ShoppingCart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { reelsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import OrderPage from './OrderPage';
import useSound from '../hooks/useSound';

const ReelCard = ({ reel, onUpdate, isActive = false }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const { user, userType, isAuthenticated } = useAuth();
  const { playLikeSound } = useSound();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [savesCount, setSavesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const [showOrderPage, setShowOrderPage] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);

  useEffect(() => {
    if (reel && user) {
      setIsLiked(reel.likes?.includes(user.id) || false);
      setIsSaved(reel.saves?.includes(user.id) || false);
      setLikesCount(reel.likes?.length || 0);
      setSavesCount(reel.saves?.length || 0);
    }
  }, [reel, user]);

  // Auto-play when reel becomes active (visible)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      // Start muted to avoid browser autoplay restrictions
      video.muted = true;
      video.volume = 1.0;
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            // After successful autoplay, unmute after a brief delay
            setTimeout(() => {
              if (video && !video.paused && isActive) {
                video.muted = false;
              }
            }, 200);
          })
          .catch(() => {
            // Autoplay blocked - this is normal browser behavior
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      // Ensure audio is unmuted when user explicitly plays
      video.muted = false;
      video.volume = 1.0;
      
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch((error) => {
            console.log('Play failed:', error);
            // Fallback: try with muted if unmuted fails
            video.muted = true;
            video.play().then(() => {
              setIsPlaying(true);
            }).catch(() => {
              setIsPlaying(false);
            });
          });
      }
    }
  };

  const handleLike = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('Please login to like reels');
      return;
    }

    try {
      // Optimistic update for better UX
      const previousLiked = isLiked;
      const previousCount = likesCount;
      
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      
      // Trigger animation and sound only when liking (not unliking)
      if (!isLiked) {
        setLikeAnimation(true);
        playLikeSound();
        setTimeout(() => setLikeAnimation(false), 600);
      }

      const response = await reelsAPI.toggleLike(reel._id);
      const updatedReel = response.data.reel;
      
      const actualIsLiked = updatedReel.likes.includes(user.id);
      const actualCount = updatedReel.likes.length;
      
      // Update with actual server response
      setIsLiked(actualIsLiked);
      setLikesCount(actualCount);
      
      if (onUpdate) onUpdate(updatedReel);
    } catch (error) {
      // Revert optimistic update on error
      setIsLiked(isLiked);
      setLikesCount(likesCount);
      console.error('Error toggling like:', error);
      toast.error('Failed to update like. Please try again.');
    }
  }, [isAuthenticated, isLiked, likesCount, user?.id, reel._id, playLikeSound, onUpdate]);

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to save reels');
      return;
    }

    try {
      const response = await reelsAPI.toggleSave(reel._id);
      const updatedReel = response.data.reel;
      
      const newIsSaved = updatedReel.saves.includes(user.id);
      setIsSaved(newIsSaved);
      setSavesCount(updatedReel.saves.length);
      
      if (onUpdate) onUpdate(updatedReel);
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const response = await reelsAPI.addComment(reel._id, newComment.trim());
      const updatedReel = response.data.reel;
      
      setNewComment('');
      if (onUpdate) onUpdate(updatedReel);
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Swipe gesture handlers for order functionality
  const handleTouchStart = (e) => {
    if (!isAuthenticated || userType !== 'user') return;
    setIsDragging(true);
    const touch = e.touches[0];
    containerRef.current.startX = touch.clientX;
    containerRef.current.startY = touch.clientY;
    // Store initial scroll position to restore if needed
    containerRef.current.initialScrollTop = window.scrollY;
    // Store the parent container to prevent scrolling
    if (containerRef.current.parentElement) {
      containerRef.current.parentElement.style.touchAction = 'none';
      containerRef.current.parentElement.style.overflow = 'hidden';
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !containerRef.current.startX) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - containerRef.current.startX;
    const deltaY = touch.clientY - containerRef.current.startY;
    
    // Only allow right swipe (positive deltaX) and prevent vertical scrolling during horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 0) {
      e.preventDefault(); // Prevent vertical scrolling
      setSwipeOffset(Math.min(deltaX, 150)); // Limit swipe distance
    }
  };

  const handleTouchEnd = (e) => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Restore scrolling behavior
    if (containerRef.current.parentElement) {
      containerRef.current.parentElement.style.touchAction = 'auto';
      containerRef.current.parentElement.style.overflow = 'visible';
    }
    
    // If swiped more than 100px to the right, open order page
    if (swipeOffset > 100) {
      e.preventDefault();
      e.stopPropagation();
      // Ensure scroll position stays the same
      window.scrollTo(0, containerRef.current.initialScrollTop);
      // Prevent body scroll when modal opens
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${containerRef.current.initialScrollTop}px`;
      document.body.style.width = '100%';
      setShowOrderPage(true);
    }
    
    // Reset swipe offset
    setSwipeOffset(0);
    
    if (containerRef.current) {
      containerRef.current.startX = null;
      containerRef.current.startY = null;
    }
  };

  const handleOrderComplete = () => {
    // Order success is already handled by OrderPage component
    // This avoids duplicate success notifications
    setShowOrderPage(false);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: reel.caption || 'Check out this reel!',
        text: reel.caption || 'Check out this amazing reel!',
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying to clipboard
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  if (!reel) return null;

  return (
    <motion.div 
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden"
      style={{ 
        transform: `translateX(${swipeOffset}px)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        touchAction: isDragging ? 'none' : 'auto'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe Indicator */}
      {isAuthenticated && userType === 'user' && swipeOffset > 20 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: Math.min(swipeOffset / 100, 1) }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 bg-blue-600 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg"
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-sm font-medium">
            {swipeOffset > 100 ? 'Release to Order' : 'Swipe to Order'}
          </span>
        </motion.div>
      )}

      {/* Order Page Modal */}
      {showOrderPage && (
        <OrderPage
          reel={reel}
          onClose={() => setShowOrderPage(false)}
          onOrderComplete={handleOrderComplete}
        />
      )}
      {/* Fullscreen Video */}
      <video
        ref={videoRef}
        src={reel.videoUrl}
        className="absolute inset-0 w-full h-full object-cover"
        loop
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5"
        x5-video-player-fullscreen="true"
        preload="metadata"
        controlsList="nodownload nofullscreen noremoteplaybook"
        disablePictureInPicture
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onCanPlay={() => {
          // Ensure video is ready for cross-browser compatibility
          if (videoRef.current && isActive) {
            videoRef.current.muted = true; // Start muted for autoplay
            videoRef.current.play().catch(() => {});
          }
        }}
        onLoadedData={() => {
          // Additional compatibility for Safari and other browsers
          if (videoRef.current) {
            videoRef.current.volume = 1.0;
          }
        }}
        style={{
          objectFit: 'cover',
          width: '100vw',
          height: '100vh',
          WebkitTransform: 'translateZ(0)',
          backfaceVisibility: 'hidden'
        }}
      />
      
      {/* Play/Pause Overlay - Center */}
      <motion.button
        onClick={togglePlay}
        whileTap={{ scale: 0.9 }}
        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200"
      >
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm"
            >
              <Play className="h-8 w-8 text-white ml-1" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Right Side Actions - Instagram Style */}
      <div className="absolute right-3 bottom-32 flex flex-col items-center space-y-4">
        {/* Like Button */}
        <motion.button
          onClick={handleLike}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.8 }}
          className="flex flex-col items-center space-y-1 group relative"
        >
          <motion.div
            animate={{
              scale: likeAnimation ? [1, 1.3, 1] : 1,
              rotate: likeAnimation ? [0, -10, 10, -5, 0] : 0,
            }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="relative"
          >
            <Heart className={`h-7 w-7 transition-colors duration-200 ${isLiked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
            
            {/* Floating hearts animation */}
            <AnimatePresence>
              {likeAnimation && (
                <>
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        scale: 0, 
                        x: 0, 
                        y: 0, 
                        opacity: 1,
                        rotate: 0
                      }}
                      animate={{ 
                        scale: [0, 1, 0],
                        x: (Math.random() - 0.5) * 40,
                        y: -30 - Math.random() * 20,
                        opacity: [1, 1, 0],
                        rotate: (Math.random() - 0.5) * 60
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ 
                        duration: 0.8,
                        delay: i * 0.1,
                        ease: "easeOut"
                      }}
                      className="absolute top-0 left-0 pointer-events-none"
                    >
                      <Heart className="w-3 h-3 fill-red-400 text-red-400" />
                    </motion.div>
                  ))}
                </>
              )}
            </AnimatePresence>
          </motion.div>
          <motion.span 
            animate={{ 
              scale: likeAnimation ? [1, 1.2, 1] : 1,
              color: isLiked ? '#ef4444' : '#ffffff'
            }}
            transition={{ duration: 0.3 }}
            className="text-xs font-medium"
          >
            {likesCount}
          </motion.span>
        </motion.button>

        {/* Comment Button */}
        <motion.button
          onClick={() => setShowComments(!showComments)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center space-y-1 group"
        >
          <MessageCircle className="h-7 w-7 text-white" />
          <span className="text-white text-xs font-medium">{reel.comments?.length || 0}</span>
        </motion.button>

        {/* Share Button */}
        <motion.button
          onClick={handleShare}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center space-y-1 group"
        >
          <Share className="h-7 w-7 text-white" />
        </motion.button>

        {/* Save Button */}
        <motion.button
          onClick={handleSave}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center space-y-1 group"
        >
          <Bookmark className={`h-7 w-7 ${isSaved ? 'fill-blue-500 text-blue-500' : 'text-white'}`} />
        </motion.button>
      </div>

      {/* Bottom Left Info */}
      <div className="absolute bottom-8 left-4 right-20 text-white">
        {/* Partner Info */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {reel.partner?.name?.charAt(0) || reel.partner?.brandName?.charAt(0) || 'P'}
            </span>
          </div>
          <span className="font-semibold text-base">
            {reel.partner?.name || reel.partner?.brandName || 'Partner'}
          </span>
          <span className="bg-green-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
            ₹{reel.price}
          </span>
        </div>
        
        {/* Caption */}
        {reel.caption && (
          <div className="max-w-[85%]">
            <div className="text-sm text-white leading-relaxed">
              {isTextExpanded ? (
                <>
                  <p className="break-words">{reel.caption}</p>
                  {reel.caption.length > 100 && (
                    <button
                      onClick={() => setIsTextExpanded(false)}
                      className="text-gray-400 text-sm mt-1 hover:text-white transition-colors font-medium"
                    >
                      Show less
                    </button>
                  )}
                </>
              ) : (
                <p className="break-words">
                  {reel.caption.length > 100 ? (
                    <>
                      {reel.caption.substring(0, 100).trim()}
                      <span className="text-gray-400">... </span>
                      <button
                        onClick={() => setIsTextExpanded(true)}
                        className="text-gray-400 hover:text-white transition-colors font-medium"
                      >
                        more
                      </button>
                    </>
                  ) : (
                    reel.caption
                  )}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Comments Overlay */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute inset-x-0 bottom-4 bg-black bg-opacity-80 backdrop-blur-lg text-white p-4 max-h-96 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Comments</h3>
              <button
                onClick={() => setShowComments(false)}
                className="text-gray-300 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Comments List */}
            <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
              {reel.comments?.map((comment, index) => (
                <div key={index} className="flex space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-white">
                      {comment.user?.username?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-semibold text-white">
                        {comment.user?.username || 'User'}
                      </span>{' '}
                      <span className="text-gray-300">{comment.text}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Comment */}
            {isAuthenticated && (
              <form onSubmit={handleComment} className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 text-sm bg-white bg-opacity-20 border border-white border-opacity-30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-300"
                  disabled={isSubmittingComment}
                />
                <motion.button
                  type="submit"
                  disabled={!newComment.trim() || isSubmittingComment}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600"
                >
                  {isSubmittingComment ? '...' : 'Post'}
                </motion.button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ReelCard;