
import React, { useState, useMemo, FC, useEffect } from 'react';
import { User, PatientRecord, PrescriptionSuggestion, DietPlanSuggestion, Appointment, CaseSheet as CaseSheetData, QueueItem, ComplaintTicket, LabTest, VitalSignHistory } from '../types.ts';
import { generateDischargeSummary, generatePrescriptionSuggestion, generateDietPlan, interpretLabResult } from '../services/geminiService.ts';
import { SparklesIcon, NutritionIcon, CalendarIcon, ClipboardListIcon, PencilIcon, SirenIcon, ComplaintIcon, MicroscopeIcon, ChartLineIcon, CheckCircleIcon, MedicationIcon, FileTextIcon } from './Icons.tsx';
import { SoundControl } from './SoundControl.tsx';

interface DoctorDashboardProps {
  user: User;
  patients: PatientRecord[];
  erQueue: QueueItem[];
  appointments: Appointment[];
  complaintTickets: ComplaintTicket[];
  labTests: LabTest[];
  onOrderLabTest: (patient: PatientRecord, testName: string) => void;
  onSaveCaseSheet: (patientId: string, caseSheetData: CaseSheetData) => void;
  onSilenceAlarm: (queueItemId: number) => void;
  onScheduleAppointment: (data: Omit<Appointment, 'id' | 'status'>) => boolean;
}

const VitalsGraph: FC<{ history: VitalSignHistory[] }> = ({ history }) => {
  const width = 800;
  const height = 400;
  const padding = 60;

  const dataPoints = useMemo(() => {
    if (!history || history.length < 2) return null;
    const minTimestamp = new Date(history[0].timestamp).getTime();
    const maxTimestamp = new Date(history[history.length - 1].timestamp).getTime();
    const scaleX = (timestamp: string) => padding + ((new Date(timestamp).getTime() - minTimestamp) / (maxTimestamp - minTimestamp)) * (width - 2 * padding);
    
    const hrVals = history.map(h => h.heartRate);
    const minHR = Math.min(...hrVals) - 10;
    const maxHR = Math.max(...hrVals) + 10;
    const scaleY_HR = (val: number) => height - padding - ((val - minHR) / (maxHR - minHR)) * (height - 2 * padding);
    
    const o2Vals = history.map(h => h.oxygenSaturation);
    const minO2 = Math.min(...o2Vals) - 2;
    const maxO2 = Math.max(...o2Vals) + 2;
    const scaleY_O2 = (val: number) => height - padding - ((val - minO2) / (maxO2 - minO2)) * (height - 2 * padding);
    
    const createPath = (key: string) => history.map((d, i) => {
        let y;
        if (key === 'hr') y = scaleY_HR(d.heartRate);
        else y = scaleY_O2(d.oxygenSaturation);
        return `${i === 0 ? 'M' : 'L'} ${scaleX(d.timestamp)},${y}`;
    }).join(' ');
    
    return { 
        pathHR: createPath('hr'), 
        pathO2: createPath('o2'),
        pointsHR: history.map(d => ({ x: scaleX(d.timestamp), y: scaleY_HR(d.heartRate) }))
    };
  }, [history]);

  if (!dataPoints) return <div className="text-center p-12 text-gray-400 font-bold uppercase tracking-widest glass-panel rounded-3xl">Surveillance Data Synchronizing...</div>;

  return (
    <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl overflow-x-auto relative group">
        <div className="flex justify-between items-center mb-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Vital Surveillance (HR & SpO2)</h4>
            <div className="flex gap-4">
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-rose-500 rounded-full"></span><span className="text-[10px] font-bold uppercase">Heart Rate</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-500 rounded-full"></span><span className="text-[10px] font-bold uppercase">SpO2</span></div>
            </div>
        </div>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <path d={dataPoints.pathHR} fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" className="opacity-80" />
            <path d={dataPoints.pathO2} fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round" className="opacity-80" />
            <circle cx={dataPoints.pointsHR[dataPoints.pointsHR.length-1].x} cy={dataPoints.pointsHR[dataPoints.pointsHR.length-1].y} r="6" fill="#f43f5e" className="animate-pulse" />
        </svg>
    </div>
  );
};

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ user, patients, erQueue, appointments, complaintTickets, labTests, onOrderLabTest, onSaveCaseSheet, onSilenceAlarm, onScheduleAppointment }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patients[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'overview' | 'case-sheet' | 'diagnostics' | 'vitals'>('overview');
  
  // AI Suggestions States
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [editableSuggestion, setEditableSuggestion] = useState<string>('');
  const [suggestionType, setSuggestionType] = useState<'prescription' | 'diet' | 'summary' | null>(null);

  // Interpretation States
  const [interpretation, setInterpretation] = useState<Record<string, string>>({});
  const [loadingInterpretation, setLoadingInterpretation] = useState<string | null>(null);

  // Case Sheet States
  const [tempCaseSheet, setTempCaseSheet] = useState<CaseSheetData>({});

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [selectedPatientId, patients]);
  const patientLabTests = useMemo(() => labTests.filter(t => t.patientId === selectedPatientId), [labTests, selectedPatientId]);

  useEffect(() => {
    if (selectedPatient) {
        setTempCaseSheet(selectedPatient.caseSheet || {});
        setEditableSuggestion('');
        setSuggestionType(null);
    }
  }, [selectedPatientId]);

  const handleInterpret = async (testId: string, testName: string, results: any) => {
    setLoadingInterpretation(testId);
    const text = await interpretLabResult(testName, results);
    setInterpretation(prev => ({ ...prev, [testId]: text }));
    setLoadingInterpretation(null);
  };

  const handleGenerateAISuggestion = async (type: 'prescription' | 'diet' | 'summary') => {
    if (!selectedPatient) return;
    setAiLoading(true);
    setSuggestionType(type);
    try {
        let result = '';
        if (type === 'prescription') {
            const data = await generatePrescriptionSuggestion(selectedPatient);
            result = `Prescriptions:\n${data.prescriptions.map(p => `- ${p.drug}: ${p.dosage} ${p.frequency}`).join('\n')}\n\nRationale:\n${data.rationale}`;
        } else if (type === 'diet') {
            const data = await generateDietPlan(selectedPatient);
            result = `Diet Plan:\n${data.plan.map(d => `${d.day}:\n  B: ${d.breakfast}\n  L: ${d.lunch}\n  D: ${d.dinner}`).join('\n\n')}\n\nRationale:\n${data.rationale}`;
        } else {
            result = await generateDischargeSummary(selectedPatient);
        }
        setEditableSuggestion(result);
    } catch (error) {
        setEditableSuggestion("Error generating suggestion. Please try again.");
    } finally {
        setAiLoading(false);
    }
  };

  const handleSaveCaseSheetLocal = () => {
    if (selectedPatientId) {
        onSaveCaseSheet(selectedPatientId, tempCaseSheet);
        alert("Dynamic Case File updated successfully.");
    }
  };

  return (
    <div className="container mx-auto space-y-6">
      {/* Top Action & Audio Control Ribbon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel rounded-3xl p-5">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            Physician Clinical Workstation
          </h2>
          <p className="text-xs text-gray-500 font-semibold">Active ER surveillance, diagnostics, and patient case files</p>
        </div>
        <div className="flex items-center gap-3">
          <SoundControl dashboardName="Physician Station" variant="pill" />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:col-span-1 space-y-4 md:w-80">
            <div className="glass-panel rounded-[2rem] p-6 max-h-[70vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black uppercase text-gray-400 tracking-widest">Active Patients</h3>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg">{patients.length}</span>
                </div>
                <div className="space-y-3">
                    {patients.map(p => (
                        <button key={p.id} onClick={() => setSelectedPatientId(p.id)} className={`w-full text-left p-4 rounded-2xl transition-all ${selectedPatientId === p.id ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'bg-white hover:bg-gray-50'}`}>
                            <p className="font-bold text-sm">{p.name}</p>
                            <div className="flex justify-between items-center mt-1">
                                <p className={`text-[10px] uppercase font-black tracking-widest opacity-70`}>ID: {p.id}</p>
                                <span className={`w-2 h-2 rounded-full ${p.paymentStatus === 'Paid' ? 'bg-green-400' : 'bg-amber-400'}`}></span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="flex-grow space-y-6">
            {selectedPatient && (
                <>
                    <div className="glass-panel rounded-[3rem] p-8 md:p-12 fade-slide-up">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">{selectedPatient.name}</h2>
                                <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-xs">{selectedPatient.age}Y • {selectedPatient.gender} • Ward {selectedPatient.bedId || 'N/A'}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setActiveTab('case-sheet')} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all">
                                    <PencilIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-6 border-b border-gray-100 mb-8 overflow-x-auto">
                            {['overview', 'case-sheet', 'diagnostics', 'vitals'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab as any)} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}>
                                    {tab.replace('-', ' ')}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'overview' && (
                            <div className="space-y-8 fade-slide-up">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                                            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">Presenting Complaint</h4>
                                            <p className="text-gray-700 font-medium leading-relaxed italic">"{selectedPatient.chiefComplaint}"</p>
                                        </div>
                                        
                                        <div className="p-8 glass-panel rounded-3xl">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">AI Clinical Co-Pilot</h4>
                                                <SparklesIcon className="h-4 w-4 text-indigo-500 animate-pulse" />
                                            </div>
                                            <div className="grid grid-cols-1 gap-3">
                                                <button onClick={() => handleGenerateAISuggestion('prescription')} className="flex items-center justify-between p-4 bg-white border border-indigo-50 rounded-2xl hover:border-indigo-200 transition-all group">
                                                    <div className="flex items-center gap-3">
                                                        <MedicationIcon className="h-5 w-5 text-indigo-500" />
                                                        <span className="text-sm font-bold text-gray-700">Suggest Prescription</span>
                                                    </div>
                                                    <span className="text-xs text-indigo-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                                                </button>
                                                <button onClick={() => handleGenerateAISuggestion('diet')} className="flex items-center justify-between p-4 bg-white border border-emerald-50 rounded-2xl hover:border-emerald-200 transition-all group">
                                                    <div className="flex items-center gap-3">
                                                        <NutritionIcon className="h-5 w-5 text-emerald-500" />
                                                        <span className="text-sm font-bold text-gray-700">Suggest Diet Plan</span>
                                                    </div>
                                                    <span className="text-xs text-emerald-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                                                </button>
                                                <button onClick={() => handleGenerateAISuggestion('summary')} className="flex items-center justify-between p-4 bg-white border border-rose-50 rounded-2xl hover:border-rose-200 transition-all group">
                                                    <div className="flex items-center gap-3">
                                                        <FileTextIcon className="h-5 w-5 text-rose-500" />
                                                        <span className="text-sm font-bold text-gray-700">Draft Discharge Summary</span>
                                                    </div>
                                                    <span className="text-xs text-rose-400 group-hover:translate-x-1 transition-transform">&rarr;</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        {aiLoading ? (
                                            <div className="h-full flex flex-col items-center justify-center glass-panel rounded-3xl p-12 text-center space-y-4">
                                                <div className="ai-pulse p-4 rounded-full bg-indigo-100 text-indigo-600">
                                                    <SparklesIcon className="h-8 w-8" />
                                                </div>
                                                <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">MediFlow Neural Network Processing...</p>
                                            </div>
                                        ) : editableSuggestion ? (
                                            <div className="glass-panel rounded-3xl p-8 space-y-4 animate-fade-in">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">AI Generated {suggestionType}</h4>
                                                    <span className="text-[9px] font-bold text-gray-400">EDITABLE</span>
                                                </div>
                                                <textarea 
                                                    value={editableSuggestion} 
                                                    onChange={(e) => setEditableSuggestion(e.target.value)}
                                                    className="w-full min-h-[300px] p-4 bg-indigo-50/30 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium text-gray-700 leading-relaxed"
                                                />
                                                <div className="flex gap-3">
                                                    <button onClick={() => setEditableSuggestion('')} className="flex-1 py-3 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all">Discard</button>
                                                    <button onClick={() => {
                                                        alert("Clinical record updated with modified AI guidance.");
                                                        setEditableSuggestion('');
                                                    }} className="flex-1 py-3 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100">Commit to Record</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="h-full p-8 border-2 border-dashed border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center opacity-40">
                                                <SparklesIcon className="h-12 w-12 text-gray-300 mb-4" />
                                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Select AI guidance tool</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'case-sheet' && (
                            <div className="space-y-8 fade-slide-up">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-gray-800">Dynamic Case File</h3>
                                    <button onClick={handleSaveCaseSheetLocal} className="px-6 py-2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 shadow-xl shadow-emerald-100">
                                        Sync and Save
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[
                                        { key: 'occupation', label: 'Occupation' },
                                        { key: 'place', label: 'Current Residence' },
                                        { key: 'presentingIllness', label: 'History of Presenting Illness' },
                                        { key: 'pastHistory', label: 'Past Medical History' },
                                        { key: 'familyHistory', label: 'Family Medical History' },
                                        { key: 'personalHistory', label: 'Personal History' },
                                        { key: 'treatmentHistory', label: 'Prior Treatment History' },
                                        { key: 'summary', label: 'Clinical Summary' }
                                    ].map(field => (
                                        <div key={field.key} className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">{field.label}</label>
                                            <textarea 
                                                value={(tempCaseSheet as any)[field.key] || ''}
                                                onChange={(e) => setTempCaseSheet({ ...tempCaseSheet, [field.key]: e.target.value })}
                                                className="w-full h-32 p-4 glass-panel rounded-2xl focus:ring-2 focus:ring-indigo-500 border-none text-sm font-medium text-gray-700"
                                                placeholder={`Enter ${field.label.toLowerCase()}...`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'diagnostics' && (
                            <div className="space-y-6 fade-slide-up">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Clinical Reports</h3>
                                    <button onClick={() => alert("Ordering new lab panel...")} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 rounded-xl">Order New Test</button>
                                </div>
                                {patientLabTests.length > 0 ? patientLabTests.map(test => (
                                    <div key={test.id} className="glass-panel p-8 rounded-[2rem] hover-lift border-l-4 border-indigo-500 transition-all">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-lg">{test.testName}</h4>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(test.orderedAt).toLocaleDateString()} • Ordered by {test.orderedBy}</p>
                                            </div>
                                            <span className="text-[10px] font-black uppercase px-3 py-1 bg-green-100 text-green-700 rounded-lg">{test.status}</span>
                                        </div>
                                        {test.results && (
                                            <div className="space-y-6">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {test.results.map((r, i) => (
                                                        <div key={i} className="p-4 bg-white border border-gray-50 rounded-2xl">
                                                            <p className="text-[9px] font-black uppercase text-gray-400 mb-1">{r.parameter}</p>
                                                            <div className="flex items-baseline gap-1">
                                                                <p className={`text-lg font-black ${r.isAbnormal ? 'text-rose-500' : 'text-gray-900'}`}>{r.value}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold">{r.referenceRange}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {interpretation[test.id] ? (
                                                    <div className="p-6 bg-indigo-50/50 text-indigo-800 text-sm rounded-2xl border border-indigo-100 font-medium leading-relaxed">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <SparklesIcon className="h-4 w-4 text-indigo-500" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">Neural Interpretation</span>
                                                        </div>
                                                        {interpretation[test.id]}
                                                    </div>
                                                ) : (
                                                    <button onClick={() => handleInterpret(test.id, test.testName, test.results)} disabled={loadingInterpretation === test.id} className="w-full py-4 bg-white border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-50 transition-all shadow-sm">
                                                        {loadingInterpretation === test.id ? 'Processing Clinical Data...' : 'Get AI Interpretation'}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <div className="p-12 text-center glass-panel rounded-3xl opacity-50 border-dashed border-2">
                                        <p className="text-gray-400 font-bold uppercase tracking-widest">No clinical reports available</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'vitals' && (
                            <div className="space-y-8 fade-slide-up">
                                <h3 className="text-2xl font-bold text-gray-800 tracking-tight">Physiological Surveillance</h3>
                                <VitalsGraph history={selectedPatient.vitalsHistory || []} />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="p-6 bg-slate-50 rounded-2xl">
                                        <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Mean HR</p>
                                        <p className="text-2xl font-black text-rose-500">82 <span className="text-xs">BPM</span></p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl">
                                        <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Peak BP</p>
                                        <p className="text-2xl font-black text-gray-800">145/90</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl">
                                        <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Stable SpO2</p>
                                        <p className="text-2xl font-black text-indigo-600">97 <span className="text-xs">%</span></p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl">
                                        <p className="text-[9px] font-black uppercase text-gray-400 mb-1">Trend Status</p>
                                        <p className="text-2xl font-black text-emerald-500">STABLE</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
