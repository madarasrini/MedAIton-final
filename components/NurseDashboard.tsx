
import React, { useState, useEffect, FC, useMemo } from 'react';
import { User, TriagePriority, QueueItem, PatientRecord, ComplaintTicket } from '../types.ts';
// Fix: Added UserIcon to the imported components from Icons.tsx
import { AlertIcon, HeartbeatIcon, BloodPressureIcon, OxygenIcon, ThermometerIcon, VitalsIcons, SirenIcon, ComplaintIcon, UserIcon } from './Icons.tsx';
import { SoundControl } from './SoundControl.tsx';

interface NurseDashboardProps {
  user: User;
  erQueue: QueueItem[];
  complaintTickets: ComplaintTicket[];
  onAdmitPatient: (queueItemId: number) => boolean;
  onUpdateVitals: (queueItemId: number, newVitals: Partial<PatientRecord['vitals']>) => void;
  onSilenceAlarm: (queueItemId: number) => void;
}

const VitalCard: FC<{
    icon: React.ReactNode;
    title: string;
    value: string;
    unit: string;
    colorClass: string;
    isAlarming?: boolean;
}> = ({ icon, title, value, unit, colorClass, isAlarming = false }) => (
    <div className={`glass-panel rounded-[2rem] p-6 hover-lift border-2 transition-all ${isAlarming ? 'border-red-500 animate-pulse ring-4 ring-red-100' : 'border-transparent'}`}>
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-2xl ${colorClass.replace('text-', 'bg-').replace('500', '100')} ${colorClass}`}>
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{title}</span>
        </div>
        <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black ${colorClass}`}>{value}</span>
            <span className="text-sm font-bold text-gray-400">{unit}</span>
        </div>
    </div>
);

const NurseDashboard: React.FC<NurseDashboardProps> = ({ user, erQueue, onAdmitPatient, onUpdateVitals, onSilenceAlarm, complaintTickets }) => {
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(erQueue[0]?.id || null);

  const selectedPatient = useMemo(() => erQueue.find(p => p.id === selectedPatientId), [erQueue, selectedPatientId]);

  return (
    <div className="container mx-auto space-y-8 pb-20">
      <VitalsIcons />
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">ER Pulse Center</h2>
          <p className="text-gray-500 font-medium">Real-time triage and vital surveillance.</p>
        </div>
        <div className="flex items-center gap-3">
          <SoundControl dashboardName="ER Nursing Station" variant="pill" />
          <div className="glass-panel px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
            <span className="text-xs font-bold text-gray-700 uppercase tracking-widest">Live Feed</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Patient Queue List */}
        <div className="lg:col-span-4 space-y-4">
            <div className="glass-panel rounded-[2.5rem] p-6 max-h-[70vh] overflow-y-auto">
                <h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.2em] mb-6">Waiting Queue ({erQueue.length})</h3>
                <div className="space-y-3">
                    {erQueue.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedPatientId(item.id)}
                            className={`w-full text-left p-5 rounded-3xl transition-all duration-300 border-2 ${
                                selectedPatientId === item.id 
                                ? 'bg-indigo-600 text-white border-indigo-200 shadow-xl shadow-indigo-100 scale-[1.02]' 
                                : 'bg-white/50 border-transparent hover:border-indigo-100'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${selectedPatientId === item.id ? 'bg-indigo-500' : 'bg-indigo-100 text-indigo-600'}`}>
                                    Bay {item.bayNumber}
                                </span>
                                <span className={`text-[10px] font-black uppercase ${item.result.priority === TriagePriority.CRITICAL ? 'text-red-400' : 'text-blue-300'}`}>
                                    {item.result.priority}
                                </span>
                            </div>
                            <p className="font-bold truncate">{item.complaint}</p>
                            {item.isAlarming && (
                                <div className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase bg-red-500 text-white p-2 rounded-xl animate-pulse">
                                    <SirenIcon className="h-3 w-3" /> Vitals Alert
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Vital Surveillance Area */}
        <div className="lg:col-span-8 space-y-8">
            {selectedPatient ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <VitalCard 
                            icon={<HeartbeatIcon className="h-6 w-6" />}
                            title="Heart Rate"
                            value={String(selectedPatient.vitals.heartRate || '--')}
                            unit="BPM"
                            colorClass="text-rose-500"
                        />
                        <VitalCard 
                            icon={<BloodPressureIcon className="h-6 w-6" />}
                            title="Blood Pressure"
                            value={selectedPatient.vitals.bloodPressure || '--/--'}
                            unit="mmHg"
                            colorClass="text-cyan-500"
                        />
                        <VitalCard 
                            icon={<OxygenIcon className="h-6 w-6" />}
                            title="SpO2"
                            value={String(selectedPatient.vitals.oxygenSaturation || '--')}
                            unit="%"
                            colorClass="text-indigo-500"
                            isAlarming={selectedPatient.isAlarming}
                        />
                        <VitalCard 
                            icon={<ThermometerIcon className="h-6 w-6" />}
                            title="Temperature"
                            value={String(selectedPatient.vitals.temperature || '--')}
                            unit="°C"
                            colorClass="text-amber-500"
                        />
                    </div>
                    
                    <div className="glass-panel rounded-[3rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <h4 className="text-2xl font-extrabold text-gray-900">Clinical Triage Analysis</h4>
                            <p className="text-gray-500 mt-2 max-w-md">{selectedPatient.result.rationale}</p>
                        </div>
                        <div className="flex gap-4">
                            {selectedPatient.isAlarming && (
                                <button onClick={() => onSilenceAlarm(selectedPatient.id)} className="px-8 py-4 bg-red-100 text-red-600 font-bold rounded-2xl hover:bg-red-200 transition-all active:scale-95">
                                    Silence Alarm
                                </button>
                            )}
                            <button onClick={() => onAdmitPatient(selectedPatient.id)} className="px-8 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 shadow-xl shadow-green-100 transition-all active:scale-95">
                                Admit to Ward
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="inline-flex p-8 rounded-full bg-gray-100 text-gray-300">
                            <UserIcon className="h-20 w-20" />
                        </div>
                        <p className="text-gray-400 font-bold uppercase tracking-widest">Select patient to monitor</p>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default NurseDashboard;
