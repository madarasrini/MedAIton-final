import React, { useState, useMemo, FC, useEffect } from 'react';
import { User, PatientRecord, PrescriptionSuggestion, DietPlanSuggestion, Appointment, CaseSheet as CaseSheetData, QueueItem, ComplaintTicket, LabTest, VitalSignHistory } from '../types';
import { generateDischargeSummary, generatePrescriptionSuggestion, generateDietPlan } from '../services/geminiService';
import { SparklesIcon, NutritionIcon, CalendarIcon, ClipboardListIcon, PencilIcon, SirenIcon, ComplaintIcon, MicroscopeIcon, ChartLineIcon } from './Icons';

// --- Vitals Graph Component ---
const VitalsGraph: FC<{ history: VitalSignHistory[] }> = ({ history }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; data: VitalSignHistory; vital: 'hr' | 'bp' | 'o2' } | null>(null);
  const width = 800;
  const height = 400;
  const padding = 60;

  const dataPoints = useMemo(() => {
    if (!history || history.length < 2) return null;

    const minTimestamp = new Date(history[0].timestamp).getTime();
    const maxTimestamp = new Date(history[history.length - 1].timestamp).getTime();
    
    const scaleX = (timestamp: string) => {
        const time = new Date(timestamp).getTime();
        if (maxTimestamp === minTimestamp) return padding;
        return padding + ((time - minTimestamp) / (maxTimestamp - minTimestamp)) * (width - 2 * padding);
    };

    const heartRateValues = history.map(h => h.heartRate);
    const minHR = Math.min(...heartRateValues) - 10;
    const maxHR = Math.max(...heartRateValues) + 10;
    const scaleY_HR = (val: number) => height - padding - ((val - minHR) / (maxHR - minHR)) * (height - 2 * padding);
    
    const bpValues = history.map(h => h.bloodPressure.split('/').map(Number)).flat();
    const minBP = Math.min(...bpValues) - 10;
    const maxBP = Math.max(...bpValues) + 10;
    const scaleY_BP = (val: number) => height - padding - ((val - minBP) / (maxBP - minBP)) * (height - 2 * padding);

    const o2Values = history.map(h => h.oxygenSaturation);
    const minO2 = Math.min(...o2Values) - 2;
    const maxO2 = Math.max(...o2Values) + 2;
    const scaleY_O2 = (val: number) => height - padding - ((val - minO2) / (maxO2 - minO2)) * (height - 2 * padding);

    const createPath = (key: 'heartRate' | 'systolic' | 'diastolic' | 'oxygenSaturation') => 
        history.map((d, i) => {
            let val;
            let y;
            if (key === 'heartRate') { val = d.heartRate; y = scaleY_HR(val); }
            else if (key === 'systolic') { val = Number(d.bloodPressure.split('/')[0]); y = scaleY_BP(val); }
            else if (key === 'diastolic') { val = Number(d.bloodPressure.split('/')[1]); y = scaleY_BP(val); }
            else { val = d.oxygenSaturation; y = scaleY_O2(val); }
            const x = scaleX(d.timestamp);
            return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
        }).join(' ');
        
    const createPoints = (key: 'hr' | 'bp' | 'o2') => 
        history.map(d => {
            let y;
            if (key === 'hr') y = scaleY_HR(d.heartRate);
            else if (key === 'bp') y = scaleY_BP(Number(d.bloodPressure.split('/')[0])); // Use systolic for BP tooltip
            else y = scaleY_O2(d.oxygenSaturation);
            return { x: scaleX(d.timestamp), y, data: d, vital: key };
        });

    return {
        scaleX, scaleY_HR, scaleY_BP, scaleY_O2,
        minHR, maxHR, minBP, maxBP, minO2, maxO2,
        pathHR: createPath('heartRate'),
        pathBPSys: createPath('systolic'),
        pathBPDia: createPath('diastolic'),
        pathO2: createPath('oxygenSaturation'),
        pointsHR: createPoints('hr'),
        pointsBP: createPoints('bp'),
        pointsO2: createPoints('o2'),
        timestamps: history.map(h => h.timestamp),
    };
  }, [history]);

  if (!dataPoints) {
    return <div className="text-center p-8 text-gray-500">Not enough data to display the vitals graph.</div>;
  }
  
  const { scaleX, scaleY_HR, pathHR, pathBPSys, pathBPDia, pathO2, pointsHR, pointsBP, pointsO2, timestamps } = dataPoints;
  const xAxisLabels = [timestamps[0], timestamps[Math.floor(timestamps.length/2)], timestamps[timestamps.length-1]];

  return (
    <div className="bg-slate-800 text-white p-4 rounded-xl shadow-2xl overflow-x-auto">
        <style>{`
            .graph-path {
                stroke-dasharray: 2000;
                stroke-dashoffset: 2000;
                animation: draw 2s ease-out forwards;
            }
            @keyframes draw {
                to { stroke-dashoffset: 0; }
            }
            .pulse-dot {
                animation: pulse 1.5s infinite;
            }
            @keyframes pulse {
                0% { r: 5; opacity: 1; }
                50% { r: 10; opacity: 0.5; }
                100% { r: 5; opacity: 1; }
            }
        `}</style>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Grid */}
            {Array.from({ length: 5 }).map((_, i) => (
                <line key={i} x1={padding} y1={padding + i * (height - 2*padding)/4} x2={width - padding} y2={padding + i * (height - 2*padding)/4} stroke="#475569" strokeWidth="0.5" />
            ))}
             {xAxisLabels.map((ts, i) => (
                 <line key={i} x1={scaleX(ts)} y1={padding} x2={scaleX(ts)} y2={height - padding} stroke="#475569" strokeWidth="0.5" />
            ))}

            {/* Axes and Labels */}
            {Array.from({ length: 5 }).map((_, i) => {
                const hrValue = Math.round(dataPoints.minHR + (i * (dataPoints.maxHR - dataPoints.minHR) / 4));
                const o2Value = Math.round(dataPoints.minO2 + (i * (dataPoints.maxO2 - dataPoints.minO2) / 4));
                const y = height - padding - (i * (height - 2*padding) / 4);
                return (
                    <g key={i}>
                        <text x={padding - 15} y={y} dy="0.3em" textAnchor="end" fill="#f472b6" fontSize="12">{hrValue}</text>
                        <text x={width - padding + 15} y={y} dy="0.3em" textAnchor="start" fill="#818cf8" fontSize="12">{o2Value}</text>
                    </g>
                );
            })}
             {xAxisLabels.map((ts, i) => (
                 <text key={i} x={scaleX(ts)} y={height - padding + 20} textAnchor="middle" fill="#cbd5e1" fontSize="12">{new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</text>
            ))}
            <text x={padding - 45} y={height/2} transform={`rotate(-90, ${padding-45}, ${height/2})`} textAnchor="middle" fill="#f472b6" fontSize="14">HR / BP</text>
            <text x={width - padding + 45} y={height/2} transform={`rotate(90, ${width-padding+45}, ${height/2})`} textAnchor="middle" fill="#818cf8" fontSize="14">SpO2 (%)</text>

            {/* Paths */}
            <path d={pathHR} fill="none" stroke="#f472b6" strokeWidth="2.5" className="graph-path" style={{ animationDelay: '0s' }}/>
            <path d={pathBPSys} fill="none" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="5,5" className="graph-path" style={{ animationDelay: '0.2s' }}/>
            <path d={pathBPDia} fill="none" stroke="#f472b6" strokeWidth="1.5" strokeDasharray="5,5" className="graph-path" style={{ animationDelay: '0.2s' }}/>
            <path d={pathO2} fill="none" stroke="#818cf8" strokeWidth="2.5" className="graph-path" style={{ animationDelay: '0.4s' }}/>
            <circle cx={pointsHR[pointsHR.length-1].x} cy={pointsHR[pointsHR.length-1].y} r="5" fill="#f472b6" className="pulse-dot" />
            <circle cx={pointsBP[pointsBP.length-1].x} cy={pointsBP[pointsBP.length-1].y} r="5" fill="#f472b6" className="pulse-dot" />
            <circle cx={pointsO2[pointsO2.length-1].x} cy={pointsO2[pointsO2.length-1].y} r="5" fill="#818cf8" className="pulse-dot" />

            <g>
                {[...pointsHR, ...pointsBP, ...pointsO2].map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="10" fill="transparent"
                        onMouseEnter={() => setTooltip(p)}
                        onMouseLeave={() => setTooltip(null)}
                    />
                ))}
            </g>

            {tooltip && (
                <g>
                    <line x1={tooltip.x} y1={padding} y2={height - padding} stroke="#94a3b8" strokeWidth="1" strokeDasharray="4,4" />
                    <rect x={tooltip.x + 10} y={tooltip.y - 30} width="120" height="55" fill="rgba(15, 23, 42, 0.8)" rx="5" stroke="#334155" />
                    <text x={tooltip.x + 15} y={tooltip.y - 12} fill="#e2e8f0" fontSize="12">{new Date(tooltip.data.timestamp).toLocaleTimeString()}</text>
                    <text x={tooltip.x + 15} y={tooltip.y + 5} fill="#f472b6" fontSize="12" fontWeight="bold">HR: {tooltip.data.heartRate}</text>
                    <text x={tooltip.x + 15} y={tooltip.y + 20} fill="#818cf8" fontSize="12" fontWeight="bold">SpO2: {tooltip.data.oxygenSaturation}%</text>
                </g>
            )}
        </svg>
    </div>
);

const CaseSheet: FC<{
  patient: PatientRecord;
  onSave: (patientId: string, caseSheetData: CaseSheetData) => void;
}> = ({ patient, onSave }) => {
  const [caseSheet, setCaseSheet] = useState<CaseSheetData>(patient.caseSheet || {});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setCaseSheet(patient.caseSheet || {});
    setIsEditing(false);
  }, [patient]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCaseSheet(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(patient.id, caseSheet);
    setIsEditing(false);
  };
  
  const fields: { key: keyof CaseSheetData; label: string; type: 'text' | 'textarea' }[] = [
      { key: 'occupation', label: 'Occupation', type: 'text' },
      { key: 'place', label: 'Place', type: 'text' },
      { key: 'presentingIllness', label: 'History of Presenting Illness', type: 'textarea' },
      { key: 'pastHistory', label: 'Past History', type: 'textarea' },
      { key: 'familyHistory', label: 'Family History', type: 'textarea' },
      { key: 'personalHistory', label: 'Personal History', type: 'textarea' },
      { key: 'treatmentHistory', label: 'Treatment History', type: 'textarea' },
      { key: 'summary', label: 'Case Summary', type: 'textarea' },
  ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">Case Sheet</h3>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-md hover:bg-indigo-200">
            <PencilIcon className="h-4 w-4 mr-2" />
            Edit
          </button>
        )}
      </div>
       {fields.map(field => (
          <div key={field.key}>
            <label className="block text-sm font-semibold text-gray-600 mb-1">{field.label}</label>
            {isEditing ? (
              field.type === 'textarea' ?
              <textarea name={field.key} value={caseSheet[field.key] || ''} onChange={handleChange} rows={3} className="w-full p-2 border rounded-md" /> :
              <input type="text" name={field.key} value={caseSheet[field.key] || ''} onChange={handleChange} className="w-full p-2 border rounded-md" />
            ) : (
              <p className="text-gray-800 p-2 bg-gray-50 rounded-md min-h-[2.5rem] whitespace-pre-wrap">{caseSheet[field.key] || 'Not specified'}</p>
            )}
          </div>
        ))}
      {isEditing && (
        <div className="flex justify-end space-x-3 pt-4">
          <button onClick={() => { setIsEditing(false); setCaseSheet(patient.caseSheet || {}); }} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md">Save Changes</button>
        </div>
      )}
    </div>
  );
};

interface DoctorDashboardProps {
  user: User;
  patients: PatientRecord[];
  erQueue: QueueItem[];
  appointments: Appointment[];
  complaintTickets: ComplaintTicket[];
  labTests: LabTest[];
  onScheduleAppointment: (data: Omit<Appointment, 'id' | 'status'>) => boolean;
  onSaveCaseSheet: (patientId: string, caseSheetData: CaseSheetData) => void;
  onSilenceAlarm: (queueItemId: number) => void;
  onOrderLabTest: (patient: PatientRecord, testName: string) => void;
}

type ActiveTab = 'overview' | 'case-sheet' | 'diagnostics' | 'vitals-graph';

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ user, patients, erQueue, appointments, complaintTickets, labTests, onScheduleAppointment, onSaveCaseSheet, onSilenceAlarm, onOrderLabTest }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(patients.length > 0 ? patients[0].id : null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [dischargeSummary, setDischargeSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [prescriptionSuggestion, setPrescriptionSuggestion] = useState<PrescriptionSuggestion | null>(null);
  const [isGeneratingPrescription, setIsGeneratingPrescription] = useState(false);
  const [dietPlan, setDietPlan] = useState<DietPlanSuggestion | null>(null);
  const [isGeneratingDiet, setIsGeneratingDiet] = useState(false);
  const [showOrderLabTest, setShowOrderLabTest] = useState(false);
  const [labTestName, setLabTestName] = useState('');

  const selectedPatient = useMemo(() => patients.find(p => p.id === selectedPatientId), [selectedPatientId, patients]);

  useEffect(() => {
    setDischargeSummary('');
    setPrescriptionSuggestion(null);
    setDietPlan(null);
    setShowOrderLabTest(false);
  }, [selectedPatientId]);
  
  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setActiveTab('overview');
  };

  const handleGenerateSummary = async () => {
    if (!selectedPatient) return;
    setIsGeneratingSummary(true);
    const summary = await generateDischargeSummary(selectedPatient);
    setDischargeSummary(summary);
    setIsGeneratingSummary(false);
  };

  const handleGeneratePrescription = async () => {
    if (!selectedPatient) return;
    setIsGeneratingPrescription(true);
    const suggestion = await generatePrescriptionSuggestion(selectedPatient);
    setPrescriptionSuggestion(suggestion);
    setIsGeneratingPrescription(false);
  };
  
  const handleGenerateDietPlan = async () => {
      if (!selectedPatient) return;
      setIsGeneratingDiet(true);
      const plan = await generateDietPlan(selectedPatient);
      setDietPlan(plan);
      setIsGeneratingDiet(false);
  };
  
  const handleOrderTest = () => {
    if(!selectedPatient || !labTestName.trim()) return;
    onOrderLabTest(selectedPatient, labTestName);
    setLabTestName('');
    setShowOrderLabTest(false);
  };
  
  const patientLabTests = useMemo(() => {
      if (!selectedPatient) return [];
      return labTests.filter(t => t.patientId === selectedPatient.id);
  }, [labTests, selectedPatient]);

  const renderActiveTabContent = () => {
    if (!selectedPatient) return <div className="text-center p-8">Please select a patient.</div>;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-white rounded-lg shadow-md">
                <h3 className="font-bold text-lg text-gray-800">Chief Complaint</h3>
                <p className="text-gray-600 mt-1">{selectedPatient.chiefComplaint}</p>
            </div>
             <div className="p-4 bg-white rounded-lg shadow-md">
                <h3 className="font-bold text-lg text-gray-800">Clinical Notes & Diagnosis</h3>
                <p className="text-gray-600 mt-1 whitespace-pre-wrap">{selectedPatient.notes}</p>
            </div>
             <div className="p-4 bg-white rounded-lg shadow-md">
                <h3 className="font-bold text-lg text-gray-800">AI-Powered Assistance</h3>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-gray-700 flex items-center"><SparklesIcon className="h-5 w-5 mr-2 text-indigo-500"/>Generate Discharge Summary</h4>
                        <button onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="mt-2 w-full px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                          {isGeneratingSummary ? 'Generating...' : 'Generate'}
                        </button>
                        {dischargeSummary && <p className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded whitespace-pre-wrap">{dischargeSummary}</p>}
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-gray-700 flex items-center"><ClipboardListIcon className="h-5 w-5 mr-2 text-blue-500"/>Suggest E-Prescription</h4>
                        <button onClick={handleGeneratePrescription} disabled={isGeneratingPrescription} className="mt-2 w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300">
                          {isGeneratingPrescription ? 'Generating...' : 'Suggest'}
                        </button>
                        {prescriptionSuggestion && (
                            <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                                <strong>Rationale:</strong> {prescriptionSuggestion.rationale}
                                <ul className="list-disc list-inside mt-1">
                                    {prescriptionSuggestion.prescriptions.map((p,i) => <li key={i}>{p.drug} {p.dosage} {p.frequency}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h4 className="font-semibold text-gray-700 flex items-center"><NutritionIcon className="h-5 w-5 mr-2 text-green-500"/>Suggest Diet Plan</h4>
                        <button onClick={handleGenerateDietPlan} disabled={isGeneratingDiet} className="mt-2 w-full px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300">
                          {isGeneratingDiet ? 'Generating...' : 'Suggest'}
                        </button>
                        {dietPlan && (
                            <div className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded">
                                <strong>Rationale:</strong> {dietPlan.rationale}
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>
        );
      case 'case-sheet':
        return <CaseSheet patient={selectedPatient} onSave={onSaveCaseSheet} />;
      case 'diagnostics':
        return (
            <div className="p-4 bg-white rounded-lg shadow-md">
                <h3 className="font-bold text-lg text-gray-800 mb-4">Diagnostic Tests</h3>
                <button onClick={() => setShowOrderLabTest(!showOrderLabTest)} className="mb-4 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    {showOrderLabTest ? 'Cancel Order' : 'Order New Lab Test'}
                </button>
                {showOrderLabTest && (
                    <div className="flex gap-2 mb-4">
                        <input type="text" value={labTestName} onChange={e => setLabTestName(e.target.value)} placeholder="Enter test name" className="p-2 border rounded-md flex-grow" />
                        <button onClick={handleOrderTest} className="px-4 py-2 text-sm bg-green-600 text-white rounded-md">Confirm</button>
                    </div>
                )}
                 <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Test Name</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Status</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Ordered On</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Results</th>
                        </tr>
                    </thead>
                    <tbody>
                        {patientLabTests.map(test => (
                            <tr key={test.id} className="border-b">
                                <td className="px-4 py-2 text-gray-800">{test.testName}</td>
                                <td className="px-4 py-2 text-gray-800">{test.status}</td>
                                <td className="px-4 py-2 text-gray-800">{new Date(test.orderedAt).toLocaleDateString()}</td>
                                <td className="px-4 py-2 text-gray-800">{test.results ? `${test.results.length} parameters` : 'Pending'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
      case 'vitals-graph':
        return <VitalsGraph history={selectedPatient.vitalsHistory || []} />;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-md">
              <h3 className="font-bold text-lg text-gray-800 mb-3">My Patients</h3>
              <ul className="space-y-2 h-[40vh] overflow-y-auto pr-2">
                {patients.map(p => (
                  <li key={p.id}>
                    <button
                      onClick={() => handleSelectPatient(p.id)}
                      className={`w-full text-left p-3 rounded-md transition-colors ${
                        selectedPatientId === p.id ? 'bg-indigo-500 text-white shadow' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <p className={`font-semibold ${selectedPatientId === p.id ? 'text-white' : 'text-gray-800'}`}>{p.name}</p>
                      <p className={`text-sm ${selectedPatientId === p.id ? 'text-indigo-200' : 'text-gray-600'}`}>{p.chiefComplaint.substring(0,30)}...</p>
                    </button>
                  </li>
                ))}
              </ul>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-md">
              <h3 className="font-bold text-lg text-gray-800 mb-3">ER Queue</h3>
              <ul className="space-y-2 h-[25vh] overflow-y-auto pr-2">
                {erQueue.map(item => (
                   <li key={item.id} className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                       <p className="font-semibold text-sm text-red-800">Bay {item.bayNumber}: {item.result.priority}</p>
                       <p className="text-xs text-gray-700 mt-1">{item.complaint}</p>
                       {item.isAlarming && (
                         <button onClick={() => onSilenceAlarm(item.id)} className="mt-2 text-xs w-full py-1 bg-red-500 text-white rounded">
                           <SirenIcon className="h-3 w-3 inline-block mr-1"/>
                           Silence Alarm
                         </button>
                       )}
                   </li>
                ))}
              </ul>
          </div>
          {complaintTickets.length > 0 && (
              <div className="bg-white p-4 rounded-xl shadow-md">
                  <h3 className="font-bold text-lg text-gray-800 mb-3 flex items-center"><ComplaintIcon className="h-5 w-5 mr-2 text-gray-500" /> Assigned Complaints</h3>
                   <ul className="space-y-2 h-[15vh] overflow-y-auto pr-2">
                    {complaintTickets.map(ticket => (
                        <li key={ticket.id} className="p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                            <p className="font-semibold text-xs text-yellow-800">From: {ticket.patientName}</p>
                            <p className="text-xs text-gray-700 mt-1">{ticket.summary}</p>
                        </li>
                    ))}
                  </ul>
              </div>
          )}
      </div>

      <div className="md:col-span-3">
        {selectedPatient ? (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h2>
                    <p className="text-gray-500">{selectedPatient.age}, {selectedPatient.gender}</p>
                  </div>
                  <div className="text-right">
                      <p className="text-sm text-gray-500">Bed:</p>
                      <p className="font-semibold text-gray-800">{selectedPatient.bedId || 'N/A'}</p>
                  </div>
              </div>
              <div className="mt-4 border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    <button onClick={() => setActiveTab('overview')} className={`py-3 px-1 border-b-2 text-sm font-medium ${activeTab==='overview' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Overview</button>
                    <button onClick={() => setActiveTab('case-sheet')} className={`py-3 px-1 border-b-2 text-sm font-medium ${activeTab==='case-sheet' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Case Sheet</button>
                    <button onClick={() => setActiveTab('vitals-graph')} className={`flex items-center py-3 px-1 border-b-2 text-sm font-medium ${activeTab==='vitals-graph' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><ChartLineIcon className="h-4 w-4 mr-1.5"/> Vitals Graph</button>
                    <button onClick={() => setActiveTab('diagnostics')} className={`flex items-center py-3 px-1 border-b-2 text-sm font-medium ${activeTab==='diagnostics' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}><MicroscopeIcon className="h-4 w-4 mr-1.5"/> Diagnostics</button>
                </nav>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl shadow-inner">
               {renderActiveTabContent()}
            </div>
          </div>
        ) : (
          <div className="text-center p-12 bg-white rounded-xl shadow-md">Select a patient to view their details.</div>
        )}
      </div>
    </div>
  );
};
