import { useCallback, useRef, useEffect } from 'react';

// Sound utility hook for creating and managing audio effects
const useSound = () => {
  const audioContextRef = useRef(null);
  const gainNodeRef = useRef(null);

  useEffect(() => {
    // Initialize audio context only when needed
    const initAudioContext = () => {
      if (!audioContextRef.current) {
        try {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
          gainNodeRef.current = audioContextRef.current.createGain();
          gainNodeRef.current.connect(audioContextRef.current.destination);
          gainNodeRef.current.gain.value = 0.3; // Set volume to 30%
        } catch (error) {
          console.warn('Audio context not supported:', error);
        }
      }
    };

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playLikeSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.value = 0.3;
      }

      const audioContext = audioContextRef.current;
      const gainNode = gainNodeRef.current;

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Create a pleasant "like" sound with multiple harmonics
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      const gainNode2 = audioContext.createGain();

      // First tone - main frequency
      oscillator1.connect(gainNode1);
      gainNode1.connect(gainNode);
      oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator1.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
      oscillator1.type = 'sine';

      // Second tone - harmony
      oscillator2.connect(gainNode2);
      gainNode2.connect(gainNode);
      oscillator2.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator2.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator2.type = 'triangle';

      // Volume envelope for smooth sound
      gainNode1.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode1.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + 0.02);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      gainNode2.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode2.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      // Play the sound
      oscillator1.start(audioContext.currentTime);
      oscillator2.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.3);
      oscillator2.stop(audioContext.currentTime + 0.3);

    } catch (error) {
      console.warn('Could not play like sound:', error);
    }
  }, []);

  const playSuccessSound = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
        gainNodeRef.current.gain.value = 0.3;
      }

      const audioContext = audioContextRef.current;
      const gainNode = gainNodeRef.current;

      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }

      // Success sound with ascending notes
      const frequencies = [523.25, 659.25, 783.99]; // C, E, G notes
      
      frequencies.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const noteGain = audioContext.createGain();
        
        oscillator.connect(noteGain);
        noteGain.connect(gainNode);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
        oscillator.type = 'triangle';
        
        noteGain.gain.setValueAtTime(0, audioContext.currentTime + index * 0.1);
        noteGain.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + index * 0.1 + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.1 + 0.3);
        
        oscillator.start(audioContext.currentTime + index * 0.1);
        oscillator.stop(audioContext.currentTime + index * 0.1 + 0.3);
      });

    } catch (error) {
      console.warn('Could not play success sound:', error);
    }
  }, []);

  return { playLikeSound, playSuccessSound };
};

export default useSound;