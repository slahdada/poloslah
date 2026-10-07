import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      {/* Backdrop sombre avec flou moderne */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog : Bottom-sheet natif sur mobile, fenêtre centrée sur tablette/desktop */}
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${widthClasses} sm:my-auto rounded-t-3xl sm:rounded-2xl border-t sm:border border-slate-800 bg-slate-900 shadow-2xl transition-all z-10 flex flex-col max-h-[92dvh] sm:max-h-[88vh] overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200`}
      >
        {/* Poignée tactile mobile (Drag pill indicator) */}
        <div className="sm:hidden pt-2.5 pb-0.5 flex justify-center shrink-0 bg-slate-900">
          <div className="w-12 h-1.5 rounded-full bg-slate-700/80" />
        </div>

        {/* Header fixe */}
        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 sm:px-6 py-3 sm:py-4 bg-slate-900/95 backdrop-blur sticky top-0 z-20 shrink-0">
          <div className="min-w-0 pr-2">
            <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight truncate">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5 truncate leading-normal">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition active:scale-95 min-h-[44px] min-w-[44px] cursor-pointer"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contenu défilable adapté au tactile */}
        <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain flex-1 space-y-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
};
