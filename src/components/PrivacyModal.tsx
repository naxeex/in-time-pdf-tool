import React from 'react';
import { ShieldCheck, X, Lock, Cpu, Trash2, CheckCircle2 } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left"
        role="dialog"
        aria-modal="true"
        aria-label="Privacy & Security Guarantee"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Privacy & Architecture Guarantee
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                How IN TIME PDF Tools protects your confidential documents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-h-[70vh] overflow-y-auto">
          <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-900 dark:text-blue-200">
            <p className="font-semibold text-xs uppercase tracking-wider mb-1 text-blue-700 dark:text-blue-300">
              Zero Server Uploads Policy
            </p>
            Unlike traditional PDF SaaS websites that transmit your confidential contracts, invoices, and IDs to remote cloud servers, <strong>IN TIME PDF Tools runs directly inside your browser</strong> using WebAssembly and pure client-side libraries.
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start gap-3">
              <Cpu className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Client-Side WebAssembly Processing
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Your PDF files are parsed, modified, compressed, and generated strictly using local CPU and memory resources via standard browser File APIs.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  No Registration & No Logging
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  We require no account creation, no email address, and no API keys. We never log document names, contents, or passwords.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Trash2 className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">
                  Immediate Memory Revocation
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Temporary Object URLs and array buffers are purged as soon as processing completes or when you navigate away.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            Note: While client-side execution prevents cloud transit interception, always ensure your local workstation and web browser extensions are trusted when handling highly sensitive legal or medical records.
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
