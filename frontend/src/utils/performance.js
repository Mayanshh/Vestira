// Performance utilities for optimization

// Debounce function for API calls
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (callback, options = {}) => {
  const defaultOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...options
  };

  return (element) => {
    if (!element) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry);
          observer.unobserve(entry.target);
        }
      });
    }, defaultOptions);

    observer.observe(element);

    return () => observer.unobserve(element);
  };
};

// Memory management utilities
export const cleanupTimeouts = () => {
  // Clear all timeouts when component unmounts
  const highestTimeoutId = setTimeout(() => {});
  for (let i = 0; i < highestTimeoutId; i++) {
    clearTimeout(i);
  }
};

// Image/video preloader for better UX
export const preloadMedia = (urls) => {
  return Promise.allSettled(
    urls.map(url => {
      return new Promise((resolve, reject) => {
        if (url.includes('.mp4') || url.includes('.webm')) {
          // Video preloading
          const video = document.createElement('video');
          video.oncanplay = resolve;
          video.onerror = reject;
          video.src = url;
          video.load();
        } else {
          // Image preloading
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = url;
        }
      });
    })
  );
};

// Network status monitoring
export const useNetworkStatus = () => {
  if (typeof window === 'undefined') return { isOnline: true, isSlowConnection: false };

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isSlowConnection = connection && (
    connection.effectiveType === '2g' || 
    connection.effectiveType === 'slow-2g' ||
    (connection.downlink && connection.downlink < 1.5)
  );

  return {
    isOnline: navigator.onLine,
    isSlowConnection: Boolean(isSlowConnection),
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0
  };
};

// Error retry utility with exponential backoff
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Local storage with error handling
export const safeLocalStorage = {
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading from localStorage for key "${key}":`, error);
      return defaultValue;
    }
  },

  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Error writing to localStorage for key "${key}":`, error);
      return false;
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Error removing from localStorage for key "${key}":`, error);
      return false;
    }
  }
};