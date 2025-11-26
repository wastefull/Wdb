import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from "../ui/button";
import { useNavigationContext } from '../../contexts/NavigationContext';

interface PageTemplateProps {
  /** Page title - displayed at the top */
  title: string;
  
  /** Optional description shown below title */
  description?: string;
  
  /** Main content of the page */
  children: React.ReactNode;
  
  /** Optional: Custom back button label. Defaults to "Back" */
  backButtonLabel?: string;
  
  /** Optional: Custom back handler. If not provided, navigates to materials view */
  onBack?: () => void;
  
  /** Optional: Hide the back button entirely */
  hideBackButton?: boolean;
  
  /** Optional: Additional CSS classes for the container */
  className?: string;
  
  /** Optional: Maximum width constraint. Defaults to '4xl' (896px) */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
}

/**
 * Standardized page template for informational pages in WasteDB
 * 
 * Features:
 * - Consistent back navigation
 * - Responsive layout
 * - Default fonts (Sniglet for body, Fredoka One for headers)
 * - Proper spacing and padding
 * - Accessibility support
 * 
 * Usage:
 * ```tsx
 * <PageTemplate title="My Page" description="Page description">
 *   <div>Your content here</div>
 * </PageTemplate>
 * ```
 */
export function PageTemplate({
  title,
  description,
  children,
  backButtonLabel = 'Back',
  onBack,
  hideBackButton = false,
  className = '',
  maxWidth = '4xl',
}: PageTemplateProps) {
  const { navigateToMaterials } = useNavigationContext();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigateToMaterials();
    }
  };

  const maxWidthClass = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    'full': 'max-w-full',
  }[maxWidth];

  return (
    <div className={`min-h-screen bg-[#f5f3ed] dark:bg-[#1a1817] p-4 md:p-6 ${className}`}>
      <div className={`${maxWidthClass} mx-auto`}>
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-6">
          {/* Back Button */}
          {!hideBackButton && (
            <button
              onClick={handleBack}
              className="card-interactive"
              aria-label={backButtonLabel}
            >
              <ArrowLeft size={16} className="text-black" />
            </button>
          )}

          {/* Title and Description */}
          <div className="flex-1">
            <h1 className="text-[20px] md:text-[24px] text-black dark:text-white mb-1">
              {title}
            </h1>
            {description && (
              <p className="text-[11px] md:text-[12px] text-black/60 dark:text-white/60">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="">
          {children}
        </div>
      </div>
    </div>
  );
}