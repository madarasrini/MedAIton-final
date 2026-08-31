import React, { useState, useEffect, useRef, FC } from 'react';
import { soundService, SoundState } from '../services/soundService.ts';
import { Volume2Icon, VolumeXIcon, ClockIcon, SparklesIcon, XIcon, CheckCircleIcon, PauseIcon } from './Icons.tsx';

export const useSound = () => {
  const [state, setState] = useState<SoundState>(soundService.getState());

  useEffect(() => {
    return soundService.subscribe(setState);
  }, []);

  const formatRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    ...state,
    formattedTime: formatRemaining(state.snoozeRemainingSeconds),
    toggleMute: () => soundService.toggleMute(),
    setMuted: (muted: boolean) => soundService.setMuted(muted),
    snooze: (minutes: number) => soundService.snooze(minutes),
    cancelSnooze: () => soundService.cancelSnooze(),
    playTestChime: () => soundService.playTestChime(),
  };
};

interface SoundControlProps {
  variant?: 'compact' | 'full' | 'pill' | 'minimal';
  dashboardName?: string;
  className?: string;
}

export const SoundControl: FC<SoundControlProps> = ({
  variant = 'pill',
  dashboardName,
  className = '',
}) => {
  const {
    isMuted,
    isSnoozed,
    isSoundAllowed,
    formattedTime,
    snoozeRemainingSeconds,
    toggleMute,
    snooze,
    cancelSnooze,
    playTestChime,
  } = useSound();

  const [isOpen, setIsOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('10');
  const [testPlayed, setTestPlayed] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleQuickSnooze = (mins: number) => {
    snooze(mins);
    setIsOpen(false);
  };

  const handleCustomSnooze = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMinutes, 10);
    if (!isNaN(val) && val > 0) {
      snooze(val);
      setIsOpen(false);
    }
  };

  const handleTestSound = () => {
    playTestChime();
    setTestPlayed(true);
    setTimeout(() => setTestPlayed(false), 1500);
  };

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Primary Trigger Button */}
      {variant === 'minimal' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={isSnoozed ? `Sound Snoozed (${formattedTime} left)` : isMuted ? 'Sound Muted' : 'Sound Active'}
          className={`p-2 rounded-xl transition-all relative flex items-center justify-center ${
            isSnoozed
              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 ring-2 ring-amber-400'
              : isMuted
              ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 ring-1 ring-rose-300'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {isSnoozed ? (
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4 animate-pulse" />
              <span className="text-[10px] font-black">{formattedTime}</span>
            </div>
          ) : isMuted ? (
            <VolumeXIcon className="w-4 h-4" />
          ) : (
            <Volume2Icon className="w-4 h-4" />
          )}
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm border ${
            isSnoozed
              ? 'bg-amber-500/10 border-amber-300 text-amber-800 hover:bg-amber-500/20'
              : isMuted
              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {isSnoozed ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <ClockIcon className="w-3.5 h-3.5" />
              <span>Snoozed ({formattedTime})</span>
            </>
          ) : isMuted ? (
            <>
              <VolumeXIcon className="w-3.5 h-3.5 text-rose-600" />
              <span>Audio Muted</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <Volume2Icon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Audio ON</span>
            </>
          )}
        </button>
      ) : (
        /* Full / Pill variant */
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Sound & Snooze Controls"
          className={`group px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2.5 shadow-sm border backdrop-blur-md ${
            isSnoozed
              ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 ring-2 ring-amber-400/30'
              : isMuted
              ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              : 'bg-emerald-50/90 border-emerald-200 text-emerald-900 hover:bg-emerald-100'
          }`}
        >
          <div
            className={`p-1.5 rounded-lg flex items-center justify-center transition-colors ${
              isSnoozed
                ? 'bg-amber-500 text-white animate-pulse'
                : isMuted
                ? 'bg-slate-300 text-slate-700'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {isSnoozed ? (
              <ClockIcon className="w-3.5 h-3.5" />
            ) : isMuted ? (
              <VolumeXIcon className="w-3.5 h-3.5" />
            ) : (
              <Volume2Icon className="w-3.5 h-3.5" />
            )}
          </div>

          <div className="text-left flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[11px] uppercase tracking-wider">
                {isSnoozed ? 'Sound Snoozed' : isMuted ? 'Sound Muted' : 'Sound Active'}
              </span>
              {isSnoozed && (
                <span className="px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900 text-[10px] font-black">
                  {formattedTime}
                </span>
              )}
            </div>
            <span className="text-[9px] text-gray-500 font-semibold leading-none mt-0.5">
              {isSnoozed ? 'Click to manage snooze' : isMuted ? 'Click to unmute or snooze' : 'Click to mute / snooze'}
            </span>
          </div>
        </button>
      )}

      {/* Interactive Snooze & Sound Settings Popover */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-88 bg-white/95 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl p-5 z-50 animate-in fade-in zoom-in-95 duration-150 text-gray-800"
          style={{ minWidth: '19rem' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div
                className={`p-2 rounded-xl ${
                  isSnoozed ? 'bg-amber-100 text-amber-700' : isMuted ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {isSnoozed ? <ClockIcon className="w-4 h-4" /> : isMuted ? <VolumeXIcon className="w-4 h-4" /> : <Volume2Icon className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">Audio Alarm & Sound Control</h4>
                {dashboardName && (
                  <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{dashboardName}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Current Status Pill */}
          <div className="my-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isSnoozed ? 'bg-amber-500 animate-ping' : isMuted ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />
              <div>
                <p className="text-xs font-black text-gray-900">
                  {isSnoozed ? `Snoozed (${formattedTime} left)` : isMuted ? 'Muted (Silent Mode)' : 'Sound Enabled (Alerts Active)'}
                </p>
                <p className="text-[10px] text-gray-500 font-medium">
                  {isSnoozed
                    ? 'Emergency chimes and voice alerts paused'
                    : isMuted
                    ? 'All audio and siren synthesizers disabled'
                    : 'ER alarms, CAD sirens & voice alerts active'}
                </p>
              </div>
            </div>
          </div>

          {/* Active Snooze Actions (if currently snoozed) */}
          {isSnoozed && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-200 text-amber-900 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Countdown Remaining:</span>
                <span className="text-sm font-black font-mono bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-300">
                  {formattedTime}
                </span>
              </div>
              <button
                onClick={() => {
                  cancelSnooze();
                  setIsOpen(false);
                }}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow transition-colors flex items-center justify-center gap-2"
              >
                <Volume2Icon className="w-3.5 h-3.5" />
                <span>Cancel Snooze & Unmute Sound</span>
              </button>
            </div>
          )}

          {/* Toggle Mute Button */}
          <div className="mb-4">
            <button
              onClick={() => {
                toggleMute();
                if (isSnoozed) cancelSnooze();
              }}
              className={`w-full py-2.5 px-4 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-sm border ${
                isMuted
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
                  : 'bg-white hover:bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {isMuted ? (
                <>
                  <Volume2Icon className="w-4 h-4" />
                  <span>Unmute & Enable Sound</span>
                </>
              ) : (
                <>
                  <VolumeXIcon className="w-4 h-4" />
                  <span>Mute Sound Completely</span>
                </>
              )}
            </button>
          </div>

          {/* Snooze Presets */}
          <div className="space-y-2 mb-4">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <ClockIcon className="w-3 h-3 text-indigo-500" />
              <span>Snooze Sound Duration</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { mins: 5, label: '5m' },
                { mins: 15, label: '15m' },
                { mins: 30, label: '30m' },
                { mins: 60, label: '1h' },
              ].map(({ mins, label }) => (
                <button
                  key={mins}
                  onClick={() => handleQuickSnooze(mins)}
                  className="py-2 px-1 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 text-gray-800 text-xs font-black transition-all flex flex-col items-center justify-center"
                >
                  <span>{label}</span>
                  <span className="text-[9px] text-gray-400 font-normal">snooze</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Snooze Form */}
          <form onSubmit={handleCustomSnooze} className="mb-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  min="1"
                  max="480"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  placeholder="Minutes"
                  className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="absolute right-2.5 top-2 text-[10px] text-gray-400 font-bold">min</span>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-sm"
              >
                Snooze
              </button>
            </div>
          </form>

          {/* Test Audio & Bottom controls */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleTestSound}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-indigo-50"
            >
              {testPlayed ? (
                <>
                  <CheckCircleIcon className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-green-600 font-bold">Chime Played!</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Test Alert Chime</span>
                </>
              )}
            </button>
            <span className="text-[9px] text-gray-400 font-medium">Auto-unmutes after snooze</span>
          </div>
        </div>
      )}
    </div>
  );
};
