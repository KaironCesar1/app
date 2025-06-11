
import React, { useState, useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'; // Added 2xl
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  const [startTransition, setStartTransition] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setStartTransition(true);
      }, 10); 
      return () => {
        clearTimeout(timer);
        setStartTransition(false); 
      };
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl', // Added 2xl
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 dark:bg-black/70 z-50 flex justify-center items-center p-4 backdrop-blur-sm" 
      aria-modal="true" 
      role="dialog"
      onClick={onClose} // Close on backdrop click
    >
      <div 
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal content
        className={`
          bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 w-full ${sizeClasses[size]}
          transform transition-all duration-300 ease-out
          ${startTransition ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-slate-100" id="modal-title">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors rounded-full p-1 -mr-2 -mt-2"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};