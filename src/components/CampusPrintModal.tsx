import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Printer,
  X,
  FileText,
  Palette,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Edit2,
  Sparkles,
  ChevronRight,
  Shield,
  Zap,
} from 'lucide-react';

interface CampusPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToastMessage?: (msg: string) => void;
}

export const CampusPrintModal: React.FC<CampusPrintModalProps> = ({
  isOpen,
  onClose,
  onToastMessage,
}) => {
  const [docType, setDocType] = useState<'bw' | 'color'>('bw');
  const [copies, setCopies] = useState<number>(1);
  const [adminNumber, setAdminNumber] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('infinity_print_whatsapp_number') ||
        import.meta.env.VITE_ADMIN_WHATSAPP_NUMBER ||
        '919332727610'
      );
    } catch {
      return '919332727610';
    }
  });
  const [isEditingNumber, setIsEditingNumber] = useState(false);
  const [tempNumber, setTempNumber] = useState(adminNumber);

  useEffect(() => {
    if (isOpen) {
      setTempNumber(adminNumber);
    }
  }, [isOpen, adminNumber]);

  const saveAdminNumber = () => {
    const cleaned = tempNumber.replace(/[^\d+]/g, '');
    const finalNumber = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
    setAdminNumber(finalNumber || '91XXXXXXXXXX');
    try {
      localStorage.setItem('infinity_print_whatsapp_number', finalNumber);
    } catch {}
    setIsEditingNumber(false);
    onToastMessage?.('WhatsApp printing number updated!');
  };

  /**
   * Dispatches the print order directly to the Campus Print & Xerox desk on WhatsApp
   */
  const handlePrintOrderWhatsApp = (type: 'bw' | 'color', count: number) => {
    // If the number is the default placeholder, prompt to customize or fallback
    let targetWhatsAppNumber = adminNumber;
    if (targetWhatsAppNumber.includes('X')) {
      const promptNum = window.prompt(
        'Please enter the Campus Print Desk WhatsApp Number (with country code, e.g., 919876543210):',
        '919876543210'
      );
      if (promptNum) {
        targetWhatsAppNumber = promptNum.replace(/\D/g, '');
        setAdminNumber(targetWhatsAppNumber);
        try {
          localStorage.setItem('infinity_print_whatsapp_number', targetWhatsAppNumber);
        } catch {}
      } else {
        return;
      }
    }

    const ratePerPage = type === 'bw' ? 10 : 20;
    const printTotal = ratePerPage * count;

    const message =
      `*NEW PRINTING ORDER REQUEST*\n` +
      `• Type: ${type === 'bw' ? 'Black & White' : 'Color'}\n` +
      `• Number of Pages/Copies: ${count}\n` +
      `• Rate: ₹${ratePerPage}/page\n` +
      `• Total Print Cost: ₹${printTotal}\n\n` +
      `*Please attach your PDF/document directly below this message to proceed with printing.*`;

    const url = `https://wa.me/${targetWhatsAppNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    
    try {
      const opened = window.open(url, '_blank');
      if (!opened) {
        window.location.href = url;
      }
    } catch {
      window.location.href = url;
    }

    onToastMessage?.('Opening WhatsApp to send document...');
    onClose();
  };

  if (!isOpen) return null;

  const ratePerPage = docType === 'bw' ? 10 : 20;
  const printTotal = ratePerPage * copies;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-lg rounded-3xl bg-white text-gray-900 shadow-2xl border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#111111] via-[#1c1c1e] to-[#2c2c2e] text-white p-5 sm:p-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#0A84FF]/20 blur-2xl pointer-events-none" />
            <div className="relative z-10 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0A84FF] to-[#30D158] flex items-center justify-center text-white shadow-lg">
                  <Printer className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full text-white">
                      Instant Campus Service
                    </span>
                    <span className="text-[10px] font-bold text-[#30D158] flex items-center gap-1">
                      <Zap className="w-3 h-3 fill-[#30D158]" /> 10-Min Ready
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black font-display text-white mt-1">
                    Print & Xerox Station
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Step 1: Select Type */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-600 mb-2">
                1. Select Document Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Black & White Option */}
                <button
                  type="button"
                  onClick={() => setDocType('bw')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                    docType === 'bw'
                      ? 'border-[#111111] bg-gray-50 shadow-md ring-2 ring-black/5'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  {docType === 'bw' && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#111111] text-white flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 fill-current" />
                    </div>
                  )}
                  <div className="w-8 h-8 rounded-xl bg-gray-200 flex items-center justify-center text-gray-800 mb-2">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-gray-900">Black & White</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Notes, assignments, forms</div>
                  <div className="text-sm font-extrabold text-[#111111] mt-2">
                    ₹10 <span className="text-[10px] font-normal text-gray-500">/ page</span>
                  </div>
                </button>

                {/* Color Option */}
                <button
                  type="button"
                  onClick={() => setDocType('color')}
                  className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                    docType === 'color'
                      ? 'border-[#0A84FF] bg-blue-50/40 shadow-md ring-2 ring-blue-500/10'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                  }`}
                >
                  {docType === 'color' && (
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-[#0A84FF] text-white flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 fill-current" />
                    </div>
                  )}
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-blue-500 flex items-center justify-center text-white mb-2 shadow-xs">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-black text-gray-900">Color Print</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">Presentations, lab graphs, diagrams</div>
                  <div className="text-sm font-extrabold text-[#0A84FF] mt-2">
                    ₹20 <span className="text-[10px] font-normal text-gray-500">/ page</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Number of Pages / Copies */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black uppercase tracking-wider text-gray-600">
                  2. Number of Pages / Copies
                </label>
                <span className="text-xs text-gray-500">Estimate is fine</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-2xl border-2 border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setCopies((prev) => Math.max(1, prev - 1))}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-gray-200 text-gray-800 font-bold text-base flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={copies}
                    onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center text-base font-black text-gray-900 bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCopies((prev) => prev + 1)}
                    className="w-10 h-10 rounded-xl bg-white hover:bg-gray-200 text-gray-800 font-bold text-base flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[1, 5, 10, 20, 50].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCopies(preset)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        copies === preset
                          ? 'bg-[#111111] text-white shadow-xs'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Total Cost Breakdown Card */}
            <div className="rounded-2xl bg-gray-50 border border-gray-200 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Print Type:</span>
                <span className="font-bold text-gray-900">
                  {docType === 'bw' ? 'Black & White (₹10/page)' : 'Color (₹20/page)'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Number of Pages/Copies:</span>
                <span className="font-bold text-gray-900">{copies}</span>
              </div>
              <div className="pt-2 border-t border-gray-200 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-900">
                  Total Print Cost:
                </span>
                <span className="text-xl font-black text-[#30D158]">
                  ₹{printTotal}
                </span>
              </div>
            </div>

            {/* WhatsApp Instruction Notice */}
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-950 space-y-1">
                <div className="font-bold text-emerald-900">How WhatsApp Printing Works:</div>
                <div className="text-[11px] leading-relaxed text-emerald-800">
                  1. Tapping below opens WhatsApp with your pre-filled request.
                  <br />
                  2. <strong>Attach your PDF or document</strong> right in the chat.
                  <br />
                  3. Collect from the campus station or get it runner-delivered to your hostel!
                </div>
              </div>
            </div>

            {/* WhatsApp Number Config (Expandable) */}
            <div className="pt-1 text-[11px] text-gray-500 flex items-center justify-between">
              <span>
                Campus Print WhatsApp:{' '}
                <strong className="text-gray-700">
                  {adminNumber.includes('X') ? '91XXXXXXXXXX (Click Edit to configure)' : adminNumber}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setIsEditingNumber((prev) => !prev)}
                className="text-[#0A84FF] font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>{isEditingNumber ? 'Cancel' : 'Edit'}</span>
              </button>
            </div>

            {isEditingNumber && (
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-200 animate-fade-in">
                <input
                  type="text"
                  value={tempNumber}
                  onChange={(e) => setTempNumber(e.target.value)}
                  placeholder="e.g. 919876543210"
                  className="flex-1 px-3 py-1.5 rounded-xl border border-gray-300 text-xs font-semibold focus:outline-none focus:border-[#0A84FF]"
                />
                <button
                  type="button"
                  onClick={saveAdminNumber}
                  className="px-3 py-1.5 rounded-xl bg-[#111111] text-white text-xs font-bold hover:bg-[#0A84FF] transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            )}
          </div>

          {/* Footer Action Button */}
          <div className="p-5 sm:p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handlePrintOrderWhatsApp(docType, copies)}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-sm shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Send Order on WhatsApp (₹{printTotal})</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
