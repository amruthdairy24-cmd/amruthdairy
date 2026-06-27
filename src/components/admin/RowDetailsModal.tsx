import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'

interface RowDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
}

export function RowDetailsModal({ isOpen, onClose, title, data }: RowDetailsModalProps) {
  if (!isOpen || !data) return null;

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-slate-400 italic">N/A</span>;
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return (
          <ul className="list-disc pl-4 space-y-1">
            {value.map((v, i) => <li key={i}>{renderValue(v)}</li>)}
          </ul>
        );
      }
      return (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-2 border border-slate-100 dark:border-slate-800">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="grid grid-cols-3 gap-2 text-xs">
              <span className="font-semibold text-slate-500 capitalize">{k.replace(/_/g, ' ')}:</span>
              <span className="col-span-2 text-slate-900 dark:text-slate-100">{renderValue(v)}</span>
            </div>
          ))}
        </div>
      );
    }
    
    // Check if it's a date string
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
      try {
        return format(new Date(value), 'PPP p');
      } catch (e) {
        return value;
      }
    }
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      try {
        return format(new Date(value), 'PPP');
      } catch (e) {
        return value;
      }
    }

    return String(value);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-800"
        >
          <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-5 sm:p-6 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(data).map(([key, value]) => {
                // Skip rendering empty objects/arrays unless necessary, or internal ids if desired, but we render all
                return (
                  <div key={key} className="flex flex-col gap-1.5 p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800/60">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {renderValue(value)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-sm rounded-xl hover:bg-slate-800 dark:hover:bg-white active:scale-[0.98] transition-all"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
