import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilitySettings {
  fontSize: 'normal' | 'large' | 'xlarge';
  highContrast: boolean;
  noPastel: boolean;
  reduceMotion: boolean;
  darkMode: boolean;
  adminMode: boolean;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  setFontSize: (size: 'normal' | 'large' | 'xlarge') => void;
  toggleHighContrast: () => void;
  toggleNoPastel: () => void;
  toggleReduceMotion: () => void;
  toggleDarkMode: () => void;
  toggleAdminMode: () => void;
  resetSettings: () => void;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 'normal',
  highContrast: false,
  noPastel: false,
  reduceMotion: false,
  darkMode: false,
  adminMode: false,
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('wastedb-accessibility');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Check system preferences on mount
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updates: Partial<AccessibilitySettings> = {};
    
    if (motionQuery.matches && !settings.reduceMotion) {
      updates.reduceMotion = true;
    }
    
    // Only apply dark mode preference if not already set in localStorage
    const saved = localStorage.getItem('wastedb-accessibility');
    if (!saved && darkQuery.matches) {
      updates.darkMode = true;
    }
    
    if (Object.keys(updates).length > 0) {
      setSettings(prev => ({ ...prev, ...updates }));
    }
  }, []);

  // Save to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('wastedb-accessibility', JSON.stringify(settings));
    
    // Apply settings to document
    const root = document.documentElement;
    
    // Font size
    root.style.setProperty('--a11y-font-scale', 
      settings.fontSize === 'large' ? '1.15' : 
      settings.fontSize === 'xlarge' ? '1.3' : '1'
    );
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // No pastel
    if (settings.noPastel) {
      root.classList.add('no-pastel');
    } else {
      root.classList.remove('no-pastel');
    }
    
    // Reduced motion
    if (settings.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
    
    // Dark mode
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings]);

  const setFontSize = (size: 'normal' | 'large' | 'xlarge') => {
    setSettings(prev => ({ ...prev, fontSize: size }));
  };

  const toggleHighContrast = () => {
    setSettings(prev => ({ 
      ...prev, 
      highContrast: !prev.highContrast,
      // Auto-enable noPastel when enabling high contrast
      // Auto-disable noPastel when disabling high contrast
      noPastel: !prev.highContrast ? true : false
    }));
  };

  const toggleNoPastel = () => {
    setSettings(prev => ({ ...prev, noPastel: !prev.noPastel }));
  };

  const toggleReduceMotion = () => {
    setSettings(prev => ({ ...prev, reduceMotion: !prev.reduceMotion }));
  };

  const toggleDarkMode = () => {
    setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const toggleAdminMode = () => {
    setSettings(prev => ({ ...prev, adminMode: !prev.adminMode }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        settings,
        setFontSize,
        toggleHighContrast,
        toggleNoPastel,
        toggleReduceMotion,
        toggleDarkMode,
        toggleAdminMode,
        resetSettings,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}