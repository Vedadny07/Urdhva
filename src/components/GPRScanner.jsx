import React from 'react';
import useStore from '../store';
import { useTranslation } from '../utils/i18n';
import { ScanLine, AlertTriangle, Info, Database, AlertCircle } from 'lucide-react';

const GPRScanner = () => {
  const { t } = useTranslation();
  const { corporatorMode, startGPRScan, gprScanActive, gprScanResults } = useStore();

  if (corporatorMode !== 'gprScan') return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
          <Database className="w-4 h-4 text-purple-600" /> {t('gpr.title')}
        </h3>
      </div>

      <div className="mb-4 flex-shrink-0">
        <button 
          onClick={startGPRScan}
          disabled={gprScanActive}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-purple-500/20 cursor-pointer"
        >
          <ScanLine className={`w-5 h-5 ${gprScanActive ? 'animate-pulse' : ''}`} />
          {gprScanActive ? t('gpr.scanning') : t('gpr.startScan')}
        </button>
      </div>

      {gprScanActive && (
        <div className="relative h-32 w-full bg-slate-100 rounded-xl border border-slate-300 overflow-hidden flex-shrink-0 mb-4 flex items-center justify-center shadow-inner">
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(168,85,247,0.1)_50%)] bg-[length:100%_4px]"></div>
          <div className="absolute top-0 w-full h-1 bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,1)] animate-[scan_2s_linear_infinite]"></div>
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes scan {
              0% { top: -10px; }
              100% { top: 100%; }
            }
          `}} />
          <span className="text-purple-700 font-mono font-bold text-sm tracking-widest relative z-10 animate-pulse">{t('gpr.analyzingDepth')}</span>
        </div>
      )}

      {gprScanResults && gprScanResults.length > 0 && !gprScanActive && (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 sticky top-0 bg-white/97 backdrop-blur-sm py-1">{t('gpr.scanResults')}</h3>
          {gprScanResults.map((res, idx) => {
            let icon, colorClass, borderClass;
            
            if (res.severity === 'critical') {
              icon = <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />;
              colorClass = "text-red-700";
              borderClass = "border-red-200 bg-red-50";
            } else if (res.severity === 'high') {
              icon = <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />;
              colorClass = "text-orange-700";
              borderClass = "border-orange-200 bg-orange-50";
            } else {
              icon = <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />;
              colorClass = "text-blue-700";
              borderClass = "border-blue-200 bg-blue-50";
            }

            return (
              <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${borderClass} shadow-2xs`}>
                {icon}
                <div className="min-w-0">
                  <div className={`text-sm font-bold ${colorClass} capitalize`}>
                    {res.type.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-slate-800 font-medium mt-0.5">{res.label}</div>
                  <div className="text-xs text-slate-500 font-mono mt-1">{t('gpr.depth')}: {res.depth}m</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GPRScanner;
