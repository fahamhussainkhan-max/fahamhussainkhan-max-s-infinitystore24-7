import React from 'react';
import { Printer, ArrowRight } from 'lucide-react';

interface CampusPrintWidgetProps {
  onOpenPrintModal?: () => void;
}

export const CampusPrintWidget: React.FC<CampusPrintWidgetProps> = ({ onOpenPrintModal }) => {
  const printWhatsAppNumber = '919332727610';

  const handleClick = () => {
    if (onOpenPrintModal) {
      onOpenPrintModal();
      return;
    }

    const message =
      `*CAMPUS PRINT DESK INQUIRY*\n` +
      `--------------------------------\n` +
      `Hi! I need document printouts delivered to my room (CCCT/SIST Campus).\n` +
      `Please let me know how to send my PDF/notes file!`;

    const url = `https://wa.me/${printWhatsAppNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      id="campus-print-card"
      onClick={handleClick}
      className="w-full bg-white border border-gray-200/90 hover:border-blue-300 rounded-2xl p-3 sm:p-3.5 shadow-2xs hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer group pointer-events-auto"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
          <Printer className="w-4 h-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
              Campus Xerox & Print Desk
            </h4>
          </div>
          <p className="text-[11px] text-gray-500 truncate">
            Doorstep notes photocopying & assignment prints (45m - 1h).
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="bg-blue-100 text-blue-700 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap group-hover:bg-blue-200 transition-colors">
          Print Desk
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all hidden sm:block" />
      </div>
    </div>
  );
};
