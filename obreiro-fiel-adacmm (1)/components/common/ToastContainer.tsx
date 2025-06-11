
import React from 'react';
import { ToastMessage, ToastType } from '../../types';
import { CheckCircleIcon, XIcon } from './IconCatalog'; // Assuming XIcon for close, CheckCircle for success

interface ToastItemProps {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const baseClasses = "flex items-center p-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ease-in-out";
  const typeClasses = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-sky-500 text-white",
    warning: "bg-yellow-500 text-black",
  };

  const IconComponent = toast.type === 'success' ? CheckCircleIcon : null; // Add more icons for other types if needed

  return (
    <div className={`${baseClasses} ${typeClasses[toast.type]}`}>
      {IconComponent && <IconComponent className="w-5 h-5 mr-2 shrink-0" />}
      <span className="flex-grow">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="ml-3 p-1 rounded-full hover:bg-black/10 shrink-0">
        <XIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  setToasts: React.Dispatch<React.SetStateAction<ToastMessage[]>>;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, setToasts }) => {
  const dismissToast = (id: string) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-5 right-5 space-y-3 z-50 w-auto max-w-xs sm:max-w-sm">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
};

export default ToastContainer;