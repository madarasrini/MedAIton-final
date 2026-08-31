import React, { useState, useRef, FC, useMemo } from 'react';
import { Bed, BedStatus, QueueItem, TriagePriority } from '../types.ts';
import { BedIcon, SparklesIcon, SirenIcon, CheckCircleIcon, FileTextIcon } from './Icons.tsx';
import { parseCSVToBeds, generateTemplateCSV, exportBedsToCSV } from '../utils/csvBedParser.ts';
import { BedRiskTrendChart } from './BedRiskTrendChart.tsx';

interface BedManagementProps {
  beds: Bed[];
  erQueue: QueueItem[];
  onUpdateBed?: (updatedBed: Bed) => void;
  onDischargeBedPatient?: (bedId: string) => void;
  onCompleteBedCleaning?: (bedId: string) => void;
  onMarkBedCleaning?: (bedId: string) => void;
  onSmartAssignBed?: (bedId: string, queueItemId: number) => boolean;
  onImportBeds?: (beds: Bed[]) => void;
  onTriggerSimulationTick?: () => void;
  onResetBedsToDefault?: () => void;
}

export const BedManagement: FC<BedManagementProps> = ({
  beds,
  erQueue,
  onDischargeBedPatient,
  onCompleteBedCleaning,
  onMarkBedCleaning,
  onSmartAssignBed,
  onImportBeds,
  onTriggerSimulationTick,
  onResetBedsToDefault,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'chart' | 'split'>('grid');
  const [selectedWard, setSelectedWard] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSmartAssignModalOpen, setIsSmartAssignModalOpen] = useState<boolean>(false);
  const [targetBedForAssign, setTargetBedForAssign] = useState<Bed | null>(null);
  const [mlNotification, setMlNotification] = useState<string | null>(null);

  // CSV Import Modal & Text State
  const [isCSVModalOpen, setIsCSVModalOpen] = useState<boolean>(false);
  const [csvInputText, setCsvInputText] = useState<string>('');
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvPreviewBeds, setCsvPreviewBeds] = useState<Bed[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wards = useMemo(() => {
    const list = Array.from(new Set(beds.map(b => b.ward)));
    return ['All', ...list];
  }, [beds]);

  const filteredBeds = useMemo(() => {
    return beds.filter(bed => {
      if (selectedWard !== 'All' && bed.ward !== selectedWard) return false;
      if (statusFilter !== 'All' && bed.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesBed = `bed ${bed.bedNumber}`.toLowerCase().includes(q);
        const matchesPatient = bed.patientName?.toLowerCase().includes(q) || bed.patientId?.toLowerCase().includes(q);
        const matchesWard = bed.ward.toLowerCase().includes(q);
        if (!matchesBed && !matchesPatient && !matchesWard) return false;
      }
      return true;
    });
  }, [beds, selectedWard, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = beds.length;
    const available = beds.filter(b => b.status === BedStatus.Available).length;
    const occupied = beds.filter(b => b.status === BedStatus.Occupied).length;
    const cleaning = beds.filter(b => b.status === BedStatus.Cleaning).length;
    const criticalPatients = beds.filter(b => b.status === BedStatus.Occupied && (b.acuityLevel === 'Critical' || (b.mlRiskScore ?? 0) >= 75)).length;
    const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
    return { total, available, occupied, cleaning, criticalPatients, occupancyRate };
  }, [beds]);

  const handleOpenAssignModal = (bed: Bed) => {
    setTargetBedForAssign(bed);
    setIsSmartAssignModalOpen(true);
  };

  const handleExecuteAssign = (queueItemId: number) => {
    if (!targetBedForAssign || !onSmartAssignBed) return;
    const success = onSmartAssignBed(targetBedForAssign.id, queueItemId);
    if (success) {
      setMlNotification(`Assigned ER Patient to Bed ${targetBedForAssign.bedNumber} in ${targetBedForAssign.ward}.`);
      setTimeout(() => setMlNotification(null), 4000);
      setIsSmartAssignModalOpen(false);
      setTargetBedForAssign(null);
    }
  };

  const handleTriggerForecast = () => {
    setMlNotification("ML Engine: Re-evaluated real-time recovery metrics & discharge trajectory across all units.");
    setTimeout(() => setMlNotification(null), 4000);
  };

  const handleManualTick = () => {
    if (onTriggerSimulationTick) {
      onTriggerSimulationTick();
      setMlNotification("Simulation advanced by 1 step: Live ML risk scores, discharge counters, and sanitization updated.");
      setTimeout(() => setMlNotification(null), 3500);
    }
  };

  const handleExportCSV = () => {
    const csvData = exportBedsToCSV(beds);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `mediflow_beds_dataset_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMlNotification(`Exported ${beds.length} active bed records to CSV.`);
    setTimeout(() => setMlNotification(null), 3500);
  };

  const handleResetDefaults = () => {
    if (onResetBedsToDefault) {
      onResetBedsToDefault();
      setMlNotification("Reset bed database to default hospital dataset.");
      setTimeout(() => setMlNotification(null), 3500);
    }
  };

  // CSV File & Text Handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvInputText(content);
      const parsed = parseCSVToBeds(content);
      setCsvPreviewBeds(parsed.beds);
      setCsvErrors(parsed.errors);
    };
    reader.readAsText(file);
  };

  const handleParseRawText = (text: string) => {
    setCsvInputText(text);
    if (!text.trim()) {
      setCsvPreviewBeds(null);
      setCsvErrors([]);
      return;
    }
    const parsed = parseCSVToBeds(text);
    setCsvPreviewBeds(parsed.beds);
    setCsvErrors(parsed.errors);
  };

  const handleLoadTemplate = () => {
    const template = generateTemplateCSV();
    setCsvInputText(template);
    const parsed = parseCSVToBeds(template);
    setCsvPreviewBeds(parsed.beds);
    setCsvErrors(parsed.errors);
  };

  const handleApplyImportedBeds = (mode: 'replace' | 'append') => {
    if (!csvPreviewBeds || csvPreviewBeds.length === 0 || !onImportBeds) return;

    if (mode === 'replace') {
      onImportBeds(csvPreviewBeds);
      setMlNotification(`Successfully imported and replaced inventory with ${csvPreviewBeds.length} bed records.`);
    } else {
      // Append mode: ensure unique IDs
      const existingIds = new Set(beds.map(b => b.id));
      const newBeds = csvPreviewBeds.map((b, i) => {
        if (existingIds.has(b.id)) {
          return { ...b, id: `${b.id}-imported-${i + 1}` };
        }
        return b;
      });
      onImportBeds([...beds, ...newBeds]);
      setMlNotification(`Successfully appended ${csvPreviewBeds.length} new bed records to active inventory.`);
    }

    setTimeout(() => setMlNotification(null), 4500);
    setIsCSVModalOpen(false);
    setCsvInputText('');
    setCsvPreviewBeds(null);
    setCsvErrors([]);
  };

  const getAcuityBadge = (acuity?: string, score?: number) => {
    if (acuity === 'Critical' || (score && score >= 75)) {
      return <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-red-100 text-red-800 border border-red-200">Critical ({score ?? 80}%)</span>;
    }
    if (acuity === 'High' || (score && score >= 50)) {
      return <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-amber-100 text-amber-800 border border-amber-200">High Risk ({score ?? 60}%)</span>;
    }
    if (acuity === 'Moderate' || (score && score >= 30)) {
      return <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-blue-100 text-blue-800 border border-blue-200">Moderate ({score ?? 40}%)</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">Stable ({score ?? 20}%)</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ML Live Telemetry Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-black uppercase tracking-widest text-indigo-300">Live ML Bed Telemetry</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/10 text-indigo-200 font-mono">
                Dynamic Cycle: 7s Interval
              </span>
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">Dynamic Smart Bed Management</h3>
            <p className="text-sm text-slate-300">Predictive occupancy, ML discharge forecasting & 24h risk trend surveillance.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Switcher */}
            <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/15">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                Bed Grid
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'chart' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                24h Trends
              </button>
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'split' ? 'bg-indigo-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}
              >
                Split View
              </button>
            </div>

            <button
              onClick={() => setIsCSVModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-bold rounded-xl border border-indigo-400/40 transition-all shadow-md"
            >
              <FileTextIcon className="w-4 h-4 text-indigo-300" />
              Import CSV
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-xl border border-white/20 transition-all"
            >
              Export CSV
            </button>
            {onTriggerSimulationTick && (
              <button
                onClick={handleManualTick}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
                title="Advance simulation 1 step to see dynamic changes immediately"
              >
                <SparklesIcon className="w-4 h-4 text-emerald-200" />
                Step ML (+1 Tick)
              </button>
            )}
            {onResetBedsToDefault && (
              <button
                onClick={handleResetDefaults}
                className="px-2.5 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-bold rounded-xl border border-rose-400/30 transition-all"
                title="Reset to default dataset"
              >
                Reset
              </button>
            )}
            {erQueue.length > 0 && stats.available > 0 && (
              <button
                onClick={() => {
                  const firstAvail = beds.find(b => b.status === BedStatus.Available);
                  if (firstAvail) handleOpenAssignModal(firstAvail);
                }}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
              >
                <SirenIcon className="w-4 h-4" />
                Smart Allocator ({erQueue.length} in ER)
              </button>
            )}
          </div>
        </div>

        {/* Live Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-5 border-t border-slate-800 text-center">
          <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Capacity</p>
            <p className="text-xl font-bold text-white mt-0.5">{stats.total} Beds</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Available</p>
            <p className="text-xl font-bold text-emerald-300 mt-0.5">{stats.available}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-wider text-indigo-400">Occupancy</p>
            <p className="text-xl font-bold text-indigo-300 mt-0.5">{stats.occupancyRate}%</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-400">Sanitizing</p>
            <p className="text-xl font-bold text-amber-300 mt-0.5">{stats.cleaning}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-400">High Acuity</p>
            <p className="text-xl font-bold text-rose-300 mt-0.5">{stats.criticalPatients}</p>
          </div>
        </div>

        {mlNotification && (
          <div className="mt-4 p-3 bg-indigo-900/90 border border-indigo-400/40 rounded-xl text-xs font-semibold text-indigo-100 flex items-center gap-2 animate-fade-in">
            <SparklesIcon className="w-4 h-4 text-indigo-300 flex-shrink-0" />
            <span>{mlNotification}</span>
          </div>
        )}
      </div>

      {/* D3 24-Hour ML Risk Trend Chart View */}
      {(viewMode === 'chart' || viewMode === 'split') && (
        <div className="animate-fade-in">
          <BedRiskTrendChart beds={beds} />
        </div>
      )}

      {/* Filter and Search Bar */}
      {(viewMode === 'grid' || viewMode === 'split') && (
        <>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        {/* Ward Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-gray-400 mr-1">Ward:</span>
          {wards.map(w => (
            <button
              key={w}
              onClick={() => setSelectedWard(w)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedWard === w
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {w}
            </button>
          ))}
        </div>

        {/* Status Filter & Search */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 bg-white"
          >
            <option value="All">All Statuses</option>
            <option value={BedStatus.Available}>Available ({stats.available})</option>
            <option value={BedStatus.Occupied}>Occupied ({stats.occupied})</option>
            <option value={BedStatus.Cleaning}>Cleaning ({stats.cleaning})</option>
          </select>

          <input
            type="text"
            placeholder="Search bed or patient..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="p-2 border border-gray-200 rounded-xl text-xs font-semibold placeholder:text-gray-400 w-48"
          />
        </div>
      </div>

      {/* Beds Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredBeds.map(bed => {
          const isOccupied = bed.status === BedStatus.Occupied;
          const isCleaning = bed.status === BedStatus.Cleaning;
          const isAvailable = bed.status === BedStatus.Available;

          let cardBorder = 'border-emerald-200 bg-emerald-50/30';
          let statusPill = 'bg-emerald-100 text-emerald-800 border-emerald-200';
          if (isOccupied) {
            cardBorder = bed.acuityLevel === 'Critical' ? 'border-red-300 bg-red-50/30 ring-2 ring-red-100' : 'border-indigo-200 bg-indigo-50/20';
            statusPill = bed.acuityLevel === 'Critical' ? 'bg-red-100 text-red-800 border-red-200' : 'bg-indigo-100 text-indigo-800 border-indigo-200';
          } else if (isCleaning) {
            cardBorder = 'border-amber-200 bg-amber-50/30';
            statusPill = 'bg-amber-100 text-amber-800 border-amber-200';
          }

          return (
            <div
              key={bed.id}
              className={`rounded-2xl p-5 border-2 ${cardBorder} shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4`}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-100">
                      <BedIcon className="w-5 h-5 text-gray-700" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-gray-900 leading-tight">Bed {bed.bedNumber}</h4>
                      <p className="text-[11px] font-semibold text-gray-500">{bed.ward} Ward</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg border ${statusPill}`}>
                    {bed.status}
                  </span>
                </div>

                {/* Body Content based on Status */}
                <div className="mt-4 space-y-2">
                  {isOccupied && (
                    <>
                      <div className="bg-white/80 rounded-xl p-2.5 border border-gray-100 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Patient</span>
                          {getAcuityBadge(bed.acuityLevel, bed.mlRiskScore)}
                        </div>
                        <p className="font-bold text-gray-800 truncate">{bed.patientName || `Patient ${bed.patientId}`}</p>
                        <p className="text-[10px] text-gray-400">ID: {bed.patientId}</p>
                      </div>

                      {/* ML Discharge Prediction */}
                      <div className="bg-white/80 rounded-xl p-2.5 border border-indigo-100 text-xs space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-indigo-600 flex items-center gap-1">
                            <SparklesIcon className="w-3 h-3" /> ML Est. Discharge
                          </span>
                          <span className="text-gray-700">~{bed.predictedDischargeMinutes ?? 45} mins</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(10, Math.min(100, 100 - (bed.predictedDischargeMinutes ?? 45)))}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                          <span>Conf: {bed.mlConfidence ?? 92}%</span>
                          <span>LOS: {bed.mlPredictedLOSHours ?? 12}h</span>
                        </div>
                      </div>
                    </>
                  )}

                  {isCleaning && (
                    <div className="bg-amber-100/50 rounded-xl p-3 border border-amber-200 text-xs space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                        <p className="font-bold text-amber-900">Sanitization Cycle</p>
                      </div>
                      <p className="text-amber-800 text-[11px]">
                        Sterilization in progress. Ready in <span className="font-bold">~{bed.cleaningTimeRemainingMinutes ?? 5} mins</span>.
                      </p>
                      <div className="w-full bg-amber-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-amber-500 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(20, Math.min(100, (6 - (bed.cleaningTimeRemainingMinutes ?? 5)) * 20))}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {isAvailable && (
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200 text-xs space-y-1 text-emerald-800">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                        <span>Ready for Intake</span>
                      </div>
                      <p className="text-[11px] text-emerald-700">Sterilized & telemetry linked. Suitable for {bed.ward} cases.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                {isOccupied && onDischargeBedPatient && (
                  <button
                    onClick={() => onDischargeBedPatient(bed.id)}
                    className="w-full py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Discharge to Cleaning
                  </button>
                )}

                {isCleaning && onCompleteBedCleaning && (
                  <button
                    onClick={() => onCompleteBedCleaning(bed.id)}
                    className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    Complete Sterilization
                  </button>
                )}

                {isAvailable && (
                  <div className="flex items-center gap-2 w-full">
                    {erQueue.length > 0 && onSmartAssignBed ? (
                      <button
                        onClick={() => handleOpenAssignModal(bed)}
                        className="flex-1 py-1.5 px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all truncate"
                      >
                        Admit ER Patient
                      </button>
                    ) : null}
                    {onMarkBedCleaning && (
                      <button
                        onClick={() => onMarkBedCleaning(bed.id)}
                        className="py-1.5 px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all"
                        title="Mark for Sanitation"
                      >
                        Sanitize
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      </>
      )}

      {/* CSV Import Modal */}
      {isCSVModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto space-y-5 animate-fade-in border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileTextIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Dataset Ingestion</span>
                  <h3 className="text-xl font-bold text-gray-900">Import Bed Inventory & ML Telemetry</h3>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsCSVModalOpen(false);
                  setCsvPreviewBeds(null);
                  setCsvErrors([]);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
              >
                ✕
              </button>
            </div>

            {/* Methods: File upload or Direct Paste */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <p className="text-xs font-bold text-gray-800">Option 1: Upload a CSV File directly from your computer</p>
                  <p className="text-[11px] text-gray-500">Supports .csv, .txt, or exported EHR dataset tables.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                  >
                    Select CSV File
                  </button>
                  <button
                    onClick={handleLoadTemplate}
                    className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 text-xs font-semibold rounded-xl transition-all"
                  >
                    Load Sample Template
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Option 2: Paste Raw CSV Text
                </label>
                <textarea
                  rows={6}
                  value={csvInputText}
                  onChange={e => handleParseRawText(e.target.value)}
                  placeholder={`id,ward,bedNumber,status,patientId,patientName,mlRiskScore,mlPredictedLOSHours,predictedDischargeMinutes,mlConfidence,acuityLevel,specialtyRequired\nbed-101,Cardiology,101,Occupied,pat-001,John Smith,78,4.5,38,94,High,Cardiology\nbed-102,Cardiology,102,Available,,,,,,98,,Cardiology`}
                  className="w-full font-mono text-xs p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-900 text-emerald-400 placeholder:text-gray-600"
                />
              </div>

              {/* Errors Display */}
              {csvErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 space-y-1">
                  <p className="font-bold">Validation Warnings:</p>
                  {csvErrors.map((err, idx) => (
                    <p key={idx} className="text-[11px]">• {err}</p>
                  ))}
                </div>
              )}

              {/* Preview Table */}
              {csvPreviewBeds && csvPreviewBeds.length > 0 && (
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-800">
                      Parsed Preview: <span className="text-indigo-600">{csvPreviewBeds.length} Beds Detected</span>
                    </p>
                  </div>
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50 text-gray-600 font-bold sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Ward</th>
                          <th className="px-3 py-2 text-left">Bed #</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Patient</th>
                          <th className="px-3 py-2 text-left">ML Risk</th>
                          <th className="px-3 py-2 text-left">LOS (hrs)</th>
                          <th className="px-3 py-2 text-left">Acuity</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {csvPreviewBeds.map((b, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-semibold text-gray-800">{b.ward}</td>
                            <td className="px-3 py-2 font-bold text-indigo-600">{b.bedNumber}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                b.status === BedStatus.Available ? 'bg-emerald-100 text-emerald-800' :
                                b.status === BedStatus.Occupied ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-gray-700">{b.patientName || b.patientId || '-'}</td>
                            <td className="px-3 py-2 text-gray-700">{b.mlRiskScore !== undefined ? `${b.mlRiskScore}%` : '-'}</td>
                            <td className="px-3 py-2 text-gray-700">{b.mlPredictedLOSHours !== undefined ? `${b.mlPredictedLOSHours}h` : '-'}</td>
                            <td className="px-3 py-2 font-semibold">{b.acuityLevel || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3">
                    <button
                      onClick={() => handleApplyImportedBeds('append')}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition-all"
                    >
                      Append to Existing Beds
                    </button>
                    <button
                      onClick={() => handleApplyImportedBeds('replace')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                    >
                      Replace All Beds ({csvPreviewBeds.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Smart Allocation Modal */}
      {isSmartAssignModalOpen && targetBedForAssign && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-5 animate-fade-in border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">ML Bed Matcher</span>
                <h3 className="text-xl font-bold text-gray-900">
                  Assign Bed {targetBedForAssign.bedNumber} ({targetBedForAssign.ward} Ward)
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsSmartAssignModalOpen(false);
                  setTargetBedForAssign(null);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase text-gray-500">Waiting ER Patients ({erQueue.length})</p>
              {erQueue.length === 0 ? (
                <div className="text-center p-8 bg-gray-50 rounded-2xl text-sm text-gray-500 font-medium">
                  No patients currently waiting in the ER Queue.
                </div>
              ) : (
                erQueue.map(item => {
                  const isCritical = item.result.priority === TriagePriority.CRITICAL;
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-4 transition-all ${
                        isCritical ? 'border-red-200 bg-red-50/50' : 'border-gray-100 bg-gray-50/50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg">
                            ER Bay {item.bayNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-lg ${
                              isCritical ? 'bg-red-500 text-white' : 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.result.priority}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-gray-800">{item.complaint}</p>
                        <p className="text-[11px] text-gray-500">
                          HR: {item.vitals?.heartRate ?? '--'} bpm | SpO2: {item.vitals?.oxygenSaturation ?? '--'}% | BP: {item.vitals?.bloodPressure ?? '--'}
                        </p>
                      </div>

                      <button
                        onClick={() => handleExecuteAssign(item.id)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-all whitespace-nowrap"
                      >
                        Assign to Bed {targetBedForAssign.bedNumber}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
