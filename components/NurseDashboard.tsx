
import React, { useState, useEffect, FC, useMemo } from 'react';
import { User, TriagePriority, QueueItem, PatientRecord, ComplaintTicket } from '../types';
import { AlertIcon, HeartbeatIcon, BloodPressureIcon, OxygenIcon, ThermometerIcon, VitalsIcons, SirenIcon, ComplaintIcon } from './Icons';

interface NurseDashboardProps {
  user: User;
  erQueue: QueueItem[];
  complaintTickets: ComplaintTicket[];
  onAdmitPatient: (queueItemId: number) => boolean;
  onUpdateVitals: (queueItemId: number, newVitals: Partial<PatientRecord['vitals']>) => void;
  onSilenceAlarm: (queueItemId: number) => void;
}

const getPriorityStyles = (priority: TriagePriority) => {
    switch(priority) {
        case TriagePriority.CRITICAL: return { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-800', icon: <AlertIcon className="h-5 w-5 mr-2 text-red-500" level="critical" /> };
        case TriagePriority.URGENT: return { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-800', icon: <AlertIcon className="h-5 w-5 mr-2 text-yellow-500" level="urgent" /> };
        case TriagePriority.NON_URGENT: return { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-800', icon: <AlertIcon className="h-5 w-5 mr-2 text-blue-500" level="non-urgent" /> };
        default: return { bg: 'bg-gray-50', border: 'border-gray-400', text: 'text-gray-800', icon: null };
    }
};

// --- Live Vitals Monitor Components ---

const EcgWaveform: FC = () => {
    const wavePattern = "M0,30 H30 L35,10 L45,50 L50,30 H70 L72,35 L75,30 H100";
    const fullPath = Array.from({ length: 8 }).map((_, i) => wavePattern.replace(/(\d+)/g, (match) => String(parseInt(match, 10) + i * 100))).join(' ');

    return (
        <>
            <style>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .ecg-path {
                    animation: scroll 1.5s linear infinite;
                }
            `}</style>
            <div className="w-full h-20 overflow-hidden relative mt-2">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-transparent to-slate-900 opacity-30"></div>
                <svg className="absolute top-0 left-0 h-full" style={{ width: '200%' }} viewBox="0 0 800 60" preserveAspectRatio="none">
                    <path d={fullPath} fill="none" stroke="#06b6d4" strokeWidth="2" className="ecg-path" />
                </svg>
            </div>
        </>
    );
};

const VitalCard: FC<{
    icon: React.ReactNode;
    title: string;
    value: string;
    unit: string;
    colorClass: string;
    children?: React.ReactNode;
    isPulsing?: boolean;
}> = ({ icon, title, value, unit, colorClass, children, isPulsing = false }) => (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-slate-700 flex flex-col justify-between">
        <div>
            <div className="flex items-center text-slate-400 text-sm font-medium">
                <div className={`${isPulsing ? 'animate-pulse' : ''}`}>{icon}</div>
                <span className="ml-2">{title}</span>
            </div>
            <div className={`mt-2 text-4xl font-mono font-bold ${colorClass} flex items-end`}>
                <span className={`drop-shadow-[0_0_8px] ${isPulsing ? 'animate-pulse' : ''}`}>{value}</span>
                <span className={`text-lg ml-2 font-sans ${colorClass} opacity-70`}>{unit}</span>
            </div>
        </div>
        {children}
    </div>
);

const LiveVitalsMonitor: FC<{ vitalsData: Partial<PatientRecord['vitals']> | null; complaint: string | undefined; isAlarming?: boolean; }> = ({ vitalsData, complaint, isAlarming = false }) => {
    const [vitals, setVitals] = useState({
        heartRate: vitalsData?.heartRate ?? 70,
        systolic: parseInt(vitalsData?.bloodPressure?.split('/')[0] || '120', 10),
        diastolic: parseInt(vitalsData?.bloodPressure?.split('/')[1] || '80', 10),
        oxygenSaturation: vitalsData?.oxygenSaturation ?? 98,
        temperature: vitalsData?.temperature ?? 37.0
    });

    useEffect(() => {
        setVitals({
            heartRate: vitalsData?.heartRate ?? 70,
            systolic: parseInt(vitalsData?.bloodPressure?.split('/')[0] || '120', 10),
            diastolic: parseInt(vitalsData?.bloodPressure?.split('/')[1] || '80', 10),
            oxygenSaturation: vitalsData?.oxygenSaturation ?? 98,
            temperature: vitalsData?.temperature ?? 37.0
        });
    }, [vitalsData]);

    useEffect(() => {
        const interval = setInterval(() => {
            setVitals(prev => ({
                heartRate: prev.heartRate + Math.floor(Math.random() * 3) - 1,
                systolic: prev.systolic + Math.floor(Math.random() * 5) - 2,
                diastolic: prev.diastolic + Math.floor(Math.random() * 3) - 1,
                oxygenSaturation: Math.min(100, prev.oxygenSaturation + (Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0)),
                temperature: parseFloat((prev.temperature + (Math.random() * 0.2 - 0.1)).toFixed(1)),
            }));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className={`bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl shadow-2xl p-6 border transition-all duration-300 ${isAlarming ? 'border-red-500 animate-pulse ring-4 ring-red-500/50' : 'border-slate-700'}`}>
            <h3 className="text-xl font-semibold text-white mb-2">Live Vitals Monitor</h3>
            <p className="text-slate-400 mb-6">Monitoring ER Bay: <span className="font-bold text-slate-200">{complaint || 'N/A'}</span></p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <VitalCard
                    icon={<HeartbeatIcon className="h-6 w-6" />}
                    title="Heart Rate"
                    value={String(vitals.heartRate)}
                    unit="BPM"
                    colorClass={vitals.heartRate < 50 || vitals.heartRate > 130 ? 'text-red-500' : 'text-rose-400'}
                    isPulsing
                >
                    <EcgWaveform />
                </VitalCard>
                <VitalCard
                    icon={<BloodPressureIcon className="h-6 w-6" />}
                    title="Blood Pressure"
                    value={`${vitals.systolic}/${vitals.diastolic}`}
                    unit="mmHg"
                    colorClass={vitals.systolic < 90 || vitals.systolic > 180 ? 'text-red-500' : 'text-cyan-400'}
                />
                <VitalCard
                    icon={<OxygenIcon className="h-6 w-6" />}
                    title="SpO2"
                    value={String(vitals.oxygenSaturation)}
                    unit="%"
                    colorClass={vitals.oxygenSaturation < 90 ? 'text-red-500' : 'text-indigo-400'}
                />
                <VitalCard
                    icon={<ThermometerIcon className="h-6 w-6" />}
                    title="Temperature"
                    value={String(vitals.temperature)}
                    unit="°C"
                    colorClass="text-amber-400"
                />
            </div>
        </div>
    );
};

const SmartVitalsCheck: FC<{
    patient: QueueItem | null;
    erQueue: QueueItem[];
    selectedPatientId: number | null;
    onSelectPatient: (id: number) => void;
    onUpdate: (vitals: Partial<PatientRecord['vitals']>) => void;
}> = ({ patient, erQueue, selectedPatientId, onSelectPatient, onUpdate }) => {
    const [manualVitals, setManualVitals] = useState<Partial<PatientRecord['vitals']>>({});

    useEffect(() => {
        setManualVitals(patient?.vitals || {});
    }, [patient]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setManualVitals(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateClick = () => {
        const updatedVitals: Partial<PatientRecord['vitals']> = {
            bloodPressure: manualVitals.bloodPressure || patient?.vitals.bloodPressure,
            heartRate: manualVitals.heartRate ? Number(manualVitals.heartRate) : patient?.vitals.heartRate,
            respiratoryRate: manualVitals.respiratoryRate ? Number(manualVitals.respiratoryRate) : patient?.vitals.respiratoryRate,
            temperature: manualVitals.temperature ? Number(manualVitals.temperature) : patient?.vitals.temperature,
            oxygenSaturation: manualVitals.oxygenSaturation ? Number(manualVitals.oxygenSaturation) : patient?.vitals.oxygenSaturation,
        };
        onUpdate(updatedVitals);
    };

    return (
        <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Vitals Check</h3>
            
            <div className="mb-6">
                <label htmlFor="vitals-patient-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Select Patient for Vitals Entry
                </label>
                <select
                    id="vitals-patient-select"
                    value={selectedPatientId || ''}
                    onChange={(e) => onSelectPatient(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    disabled={erQueue.length === 0}
                    aria-label="Select patient for vitals entry"
                >
                    {erQueue.length > 0 ? (
                        erQueue.map((item, index) => (
                            <option key={item.id} value={item.id}>
                                ER Bay {item.bayNumber} - {item.complaint.substring(0, 30)}...
                            </option>
                        ))
                    ) : (
                        <option value="">No patients in queue</option>
                    )}
                </select>
            </div>
            
            <div className="space-y-4">
                <VitalsInput
                    name="bloodPressure"
                    label="Blood Pressure"
                    value={manualVitals.bloodPressure || ''}
                    onChange={handleChange}
                    icon={<BloodPressureIcon className="h-6 w-6" />}
                    placeholder="e.g., 120/80"
                    disabled={!patient}
                />
                <VitalsInput
                    name="heartRate"
                    label="Pulse (BPM)"
                    type="number"
                    value={manualVitals.heartRate || ''}
                    onChange={handleChange}
                    icon={<HeartbeatIcon className="h-6 w-6" />}
                    placeholder="e.g., 72"
                    disabled={!patient}
                />
                 <VitalsInput
                    name="respiratoryRate"
                    label="Respiratory Rate"
                    type="number"
                    value={manualVitals.respiratoryRate || ''}
                    onChange={handleChange}
                    icon={<OxygenIcon className="h-6 w-6 opacity-70" />}
                    placeholder="e.g., 16"
                    disabled={!patient}
                />
                <VitalsInput
                    name="temperature"
                    label="Temperature (°C)"
                    type="number"
                    step="0.1"
                    value={manualVitals.temperature || ''}
                    onChange={handleChange}
                    icon={<ThermometerIcon className="h-6 w-6" />}
                    placeholder="e.g., 37.0"
                    disabled={!patient}
                />
            </div>
            <button
                onClick={handleUpdateClick}
                disabled={!patient}
                className="w-full mt-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors"
            >
                Update Monitor
            </button>
        </div>
    );
};

const VitalsInput: FC<{
    name: keyof PatientRecord['vitals'];
    label: string;
    icon: React.ReactNode;
    value: string | number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder: string;
    type?: string;
    step?: string;
    disabled?: boolean;
}> = ({ name, label, icon, ...props }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {icon}
            </div>
            <input
                id={name}
                name={name}
                type={props.type || 'text'}
                {...props}
                className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100"
            />
        </div>
    </div>
);


const NurseDashboard: React.FC<NurseDashboardProps> = ({ user, erQueue, onAdmitPatient, onUpdateVitals, onSilenceAlarm, complaintTickets }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);

  useEffect(() => {
    const isSelectedPatientInQueue = erQueue.some(p => p.id === selectedPatientId);
    if (!isSelectedPatientInQueue) {
      setSelectedPatientId(erQueue.length > 0 ? erQueue[0].id : null);
    }
  }, [erQueue, selectedPatientId]);

  const selectedPatient = useMemo(() => {
      return erQueue.find(p => p.id === selectedPatientId) || null;
  }, [erQueue, selectedPatientId]);

  const handleAdmitPatient = (queueItemId: number) => {
      const success = onAdmitPatient(queueItemId);
      if (!success) {
          alert("Failed to admit patient: No available beds.");
      }
  };
  
  const handleVitalsUpdate = (newVitals: Partial<PatientRecord['vitals']>) => {
      if (selectedPatientId) {
          onUpdateVitals(selectedPatientId, newVitals);
      }
  };

  return (
    <div className="container mx-auto space-y-8">
      <VitalsIcons />
      <h2 className="text-3xl font-bold text-gray-800">Nurse's ER Dashboard</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: ER Queue & Vitals Input */}
        <div className="lg:col-span-1 space-y-8">
            <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4 sticky top-0 bg-white pb-2 -mt-6 pt-6 z-10">ER Waiting Queue</h3>
                {erQueue.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>The queue is currently empty.</p>
                    </div>
                ) : (
                    <div className="max-h-[50vh] flex flex-col">
                      <ul className="space-y-4 overflow-y-auto pr-2 flex-grow">
                          {erQueue.map((item) => {
                             const styles = getPriorityStyles(item.result.priority);
                             const isSelected = selectedPatientId === item.id;
                             const alarmClass = item.isAlarming ? 'border-red-500 ring-4 ring-red-500/50 animate-pulse' : styles.border;
                             return (
                             <li key={item.id} className="relative">
                                  <button 
                                      onClick={() => setSelectedPatientId(item.id)}
                                      className={`w-full text-left p-4 border-l-4 rounded-md transition-all duration-200 ${isSelected ? `${styles.bg} ${alarmClass} shadow-lg` : `${styles.bg} ${alarmClass} hover:shadow-md`}`}
                                  >
                                      <div className="flex justify-between items-start">
                                          <div>
                                              <div className={`flex items-center font-bold ${styles.text}`}>
                                                  {styles.icon}
                                                  <span>{item.result.priority}</span>
                                              </div>
                                              <span className="text-xs font-mono text-gray-500 pl-7">ER Bay #{item.bayNumber}</span>
                                          </div>
                                          <button onClick={(e) => { e.stopPropagation(); handleAdmitPatient(item.id); }} className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors z-10">Admit</button>
                                      </div>
                                      <div className="pl-7 mt-2">
                                          <p className="text-gray-800 font-semibold">{item.complaint}</p>
                                          <p className="text-sm text-gray-600 mt-2"><strong>AI Rationale:</strong> {item.result.rationale}</p>
                                      </div>
                                      {item.isAlarming && (
                                        <div className="mt-3 pt-3 border-t border-red-200">
                                            <button 
                                                onClick={(e) => {e.stopPropagation(); onSilenceAlarm(item.id)}}
                                                className="w-full flex items-center justify-center py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition-colors"
                                            >
                                                <SirenIcon className="h-5 w-5 mr-2" />
                                                Silence Alarm
                                            </button>
                                        </div>
                                      )}
                                  </button>
                             </li>
                             )
                          })}
                      </ul>
                    </div>
                )}
            </div>
            
            <SmartVitalsCheck
                patient={selectedPatient}
                erQueue={erQueue}
                selectedPatientId={selectedPatientId}
                onSelectPatient={setSelectedPatientId}
                onUpdate={handleVitalsUpdate}
            />
             {complaintTickets.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center"><ComplaintIcon className="h-6 w-6 mr-2 text-gray-500" />Assigned Complaints</h3>
                   <ul className="space-y-3">
                    {complaintTickets.map(ticket => (
                        <li key={ticket.id} className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                            <p className="font-semibold text-sm text-yellow-800">From: {ticket.patientName}</p>
                            <p className="text-xs text-gray-600 mt-1">{ticket.summary}</p>
                        </li>
                    ))}
                  </ul>
              </div>
            )}
        </div>
        
        {/* Right Column: Live Vitals Monitor */}
        <div className="lg:col-span-2">
           {selectedPatient ? (
                <LiveVitalsMonitor vitalsData={selectedPatient.vitals} complaint={`Bay ${selectedPatient.bayNumber}: ${selectedPatient.complaint}`} isAlarming={selectedPatient.isAlarming} />
           ) : (
               <div className="flex items-center justify-center h-96 bg-white rounded-xl shadow-md">
                   <p className="text-gray-500">Select a patient from the queue to start monitoring.</p>
               </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
