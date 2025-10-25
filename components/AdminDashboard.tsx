import React, { useState, useMemo, FC, useEffect } from 'react';
import { User, PatientRecord, Bed, BedStatus, QueueItem, TriageResult, TriagePriority, MortuaryRecord, MortuaryStatus, ChainOfCustodyEntry, ComplaintTicket, ComplaintStatus, UserRole, Ambulance, AmbulanceStatus } from '../types';
import { getER_TriagePriority } from '../services/geminiService';
import { UserIcon, BedIcon, ClipboardListIcon, SparklesIcon, ArchiveBoxIcon, PencilIcon, ComplaintIcon, UsersIcon, XIcon, SirenIcon, AmbulanceIcon, CheckCircleIcon } from './Icons';
import { MOCK_AMBULANCES } from '../constants';

interface AdminDashboardProps {
  user: User;
  patients: PatientRecord[];
  beds: Bed[];
  erQueue: QueueItem[];
  onAddToQueue: (item: QueueItem) => void;
  mortuaryRecords: MortuaryRecord[];
  onAddMortuaryRecord: (recordData: Omit<MortuaryRecord, 'id'>) => void;
  onUpdateMortuaryRecord: (updatedRecord: MortuaryRecord) => void;
  complaintTickets: ComplaintTicket[];
  onUpdateComplaint: (updatedTicket: ComplaintTicket, actorName: string) => void;
  allUsers: User[];
}

type AdminTab = 'overview' | 'er-triage' | 'beds' | 'mortuary' | 'complaints' | 'ambulance';

const StatCard: FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4">
        <div className="bg-gray-100 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-gray-500 text-sm font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const TriageForm: FC<{ onAddToQueue: (item: QueueItem) => void; currentQueueLength: number }> = ({ onAddToQueue, currentQueueLength }) => {
    const [complaint, setComplaint] = useState('');
    const [vitals, setVitals] = useState<Partial<PatientRecord['vitals']>>({});
    const [triageResult, setTriageResult] = useState<TriageResult | null>(null);
    const [isTriaging, setIsTriaging] = useState(false);

    const handleTriage = async () => {
        if (!complaint) {
            alert("Please enter a chief complaint.");
            return;
        }
        setIsTriaging(true);
        const result = await getER_TriagePriority({ complaint, vitals });
        setTriageResult(result);
        setIsTriaging(false);
    };

    const handleAddToQueue = () => {
        if (!triageResult) return;
        const newQueueItem: QueueItem = {
            id: Date.now(),
            bayNumber: currentQueueLength + 1,
            complaint,
            vitals,
            result: triageResult,
        };
        onAddToQueue(newQueueItem);
        setComplaint('');
        setVitals({});
        setTriageResult(null);
    };
    
    const getPriorityStyles = (priority: TriagePriority | undefined) => {
      if (!priority) return { bg: 'bg-gray-100', text: 'text-gray-800' };
      switch (priority) {
        case TriagePriority.CRITICAL: return { bg: 'bg-red-100', text: 'text-red-800' };
        case TriagePriority.URGENT: return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
        case TriagePriority.NON_URGENT: return { bg: 'bg-blue-100', text: 'text-blue-800' };
      }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-800">New ER Patient Triage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">Chief Complaint</label>
                    <textarea value={complaint} onChange={e => setComplaint(e.target.value)} rows={4} className="w-full p-2 border rounded-md" placeholder="e.g., Severe chest pain..."></textarea>

                    <label className="block text-sm font-medium text-gray-700">Vitals (Optional)</label>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="BP (e.g., 120/80)" onChange={e => setVitals(v => ({...v, bloodPressure: e.target.value}))} className="p-2 border rounded-md" />
                        <input type="number" placeholder="Heart Rate" onChange={e => setVitals(v => ({...v, heartRate: Number(e.target.value)}))} className="p-2 border rounded-md" />
                        <input type="number" placeholder="SpO2 %" onChange={e => setVitals(v => ({...v, oxygenSaturation: Number(e.target.value)}))} className="p-2 border rounded-md" />
                        <input type="number" step="0.1" placeholder="Temp °C" onChange={e => setVitals(v => ({...v, temperature: Number(e.target.value)}))} className="p-2 border rounded-md" />
                    </div>
                    <button onClick={handleTriage} disabled={isTriaging} className="w-full flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        {isTriaging ? 'Triaging...' : 'Run AI Triage'}
                    </button>
                </div>
                {triageResult && (
                    <div className="p-4 bg-slate-50 rounded-lg border animate-fade-in space-y-4">
                        <h4 className="font-semibold text-lg text-gray-800">AI Triage Result</h4>
                        <div className={`p-3 rounded-md ${getPriorityStyles(triageResult?.priority).bg}`}>
                            <p className={`font-bold text-lg ${getPriorityStyles(triageResult?.priority).text}`}>{triageResult.priority}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-gray-800">Rationale:</p>
                            <p className="text-sm text-gray-600">{triageResult.rationale}</p>
                        </div>
                        <button onClick={handleAddToQueue} className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                            Add to ER Queue
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const MortuaryRecordModal: FC<{
    record: MortuaryRecord | null;
    onClose: () => void;
    onSave: (record: Omit<MortuaryRecord, 'id'> | MortuaryRecord) => void;
    user: User;
}> = ({ record, onClose, onSave, user }) => {
    const [formData, setFormData] = useState<Partial<MortuaryRecord>>(
        record || { status: MortuaryStatus.Admitted, chainOfCustody: [], gender: 'Unknown' }
    );
    const [cocEntry, setCocEntry] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAddCoc = () => {
        if (!cocEntry.trim()) return;
        const newEntry: ChainOfCustodyEntry = {
            timestamp: new Date().toISOString(),
            person: user.name,
            action: cocEntry,
        };
        setFormData(prev => ({ ...prev, chainOfCustody: [...(prev.chainOfCustody || []), newEntry]}));
        setCocEntry('');
    };

    const handleSave = () => {
        if (!formData.name || !formData.dateOfDeath || !formData.causeOfDeath || !formData.storageLocation) {
            alert('Please fill all required fields.');
            return;
        }
        
        const saveData = {
            ...formData,
            dateAdmitted: formData.dateAdmitted || new Date().toISOString(),
        } as Omit<MortuaryRecord, 'id'> | MortuaryRecord;

        onSave(saveData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold mb-4 text-gray-900">{record ? 'Edit' : 'Register New'} Mortuary Case</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input name="name" value={formData.name || ''} onChange={handleChange} placeholder="Full Name" className="p-2 border rounded" />
                    <input name="age" type="number" value={formData.age || ''} onChange={handleChange} placeholder="Age" className="p-2 border rounded" />
                    <select name="gender" value={formData.gender || 'Unknown'} onChange={handleChange} className="p-2 border rounded">
                        <option>Male</option><option>Female</option><option>Other</option><option>Unknown</option>
                    </select>
                    <div>
                        <label className="text-xs text-gray-700">Date of Death</label>
                        <input name="dateOfDeath" type="datetime-local" value={formData.dateOfDeath ? formData.dateOfDeath.substring(0, 16) : ''} onChange={handleChange} className="p-2 border rounded w-full" />
                    </div>
                    <input name="causeOfDeath" value={formData.causeOfDeath || ''} onChange={handleChange} placeholder="Cause of Death" className="p-2 border rounded md:col-span-2" />
                    <input name="storageLocation" value={formData.storageLocation || ''} onChange={handleChange} placeholder="Storage Location (e.g., Locker C-4)" className="p-2 border rounded" />
                     <select name="status" value={formData.status} onChange={handleChange} className="p-2 border rounded">
                        {Object.values(MortuaryStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                     {formData.status === MortuaryStatus.Released && (
                         <>
                            <div>
                               <label className="text-xs text-gray-700">Date Released</label>
                               <input name="dateReleased" type="datetime-local" value={formData.dateReleased ? formData.dateReleased.substring(0, 16) : ''} onChange={handleChange} className="p-2 border rounded w-full" />
                            </div>
                            <input name="releasedTo" value={formData.releasedTo || ''} onChange={handleChange} placeholder="Released To" className="p-2 border rounded" />
                         </>
                     )}
                </div>
                <div className="mt-4 pt-4 border-t">
                     <h4 className="font-semibold text-gray-800">Chain of Custody</h4>
                     <ul className="text-xs text-gray-600 mt-2 space-y-1">
                        {formData.chainOfCustody?.map((entry, i) => (
                           <li key={i}>{new Date(entry.timestamp).toLocaleString()}: {entry.action} ({entry.person})</li>
                        ))}
                     </ul>
                     <div className="flex mt-2">
                        <input value={cocEntry} onChange={e => setCocEntry(e.target.value)} placeholder="New custody entry..." className="p-2 border rounded-l flex-grow" />
                        <button onClick={handleAddCoc} className="px-4 bg-gray-200 rounded-r">Add</button>
                     </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Record</button>
                </div>
            </div>
        </div>
    );
};

const AmbulanceDispatch: FC = () => {
    const [ambulances, setAmbulances] = useState<Ambulance[]>(MOCK_AMBULANCES);

    useEffect(() => {
        const interval = setInterval(() => {
            setAmbulances(prevAmbulances => {
                return prevAmbulances.map(amb => {
                    let { status, etaMinutes } = amb;
                    switch (status) {
                        case AmbulanceStatus.Available:
                            if (Math.random() < 0.1) status = AmbulanceStatus.EnRouteToScene;
                            break;
                        case AmbulanceStatus.EnRouteToScene:
                            if (Math.random() < 0.3) status = AmbulanceStatus.AtScene;
                            break;
                        case AmbulanceStatus.AtScene:
                            if (Math.random() < 0.4) {
                                status = AmbulanceStatus.TransportingToHospital;
                                etaMinutes = Math.floor(Math.random() * 10) + 5;
                            }
                            break;
                        case AmbulanceStatus.TransportingToHospital:
                            etaMinutes = (etaMinutes ?? 1) - 1;
                            if (etaMinutes <= 0) {
                                status = AmbulanceStatus.AtHospital;
                                etaMinutes = undefined;
                            }
                            break;
                        case AmbulanceStatus.AtHospital:
                            status = AmbulanceStatus.Available;
                            break;
                    }
                    return { ...amb, status, etaMinutes };
                });
            });
        }, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const getStatusStyles = (status: AmbulanceStatus) => {
        switch (status) {
            case AmbulanceStatus.Available: return { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800' };
            case AmbulanceStatus.EnRouteToScene: return { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-800' };
            case AmbulanceStatus.AtScene: return { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-800' };
            case AmbulanceStatus.TransportingToHospital: return { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-800' };
            case AmbulanceStatus.AtHospital: return { bg: 'bg-purple-100', border: 'border-purple-500', text: 'text-purple-800' };
            default: return { bg: 'bg-gray-100', border: 'border-gray-500', text: 'text-gray-800' };
        }
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Live Ambulance Fleet Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ambulances.map(amb => {
                    const styles = getStatusStyles(amb.status);
                    return (
                        <div key={amb.id} className={`p-4 rounded-lg border-l-4 shadow-sm ${styles.bg} ${styles.border}`}>
                            <div className="flex justify-between items-center">
                                <h4 className="font-bold text-lg text-gray-800">Unit {amb.unitNumber}</h4>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${styles.text} ${styles.bg}`}>{amb.status}</span>
                            </div>
                            <div className="mt-4 text-sm text-gray-700">
                                {amb.status === AmbulanceStatus.TransportingToHospital && (
                                    <>
                                        <p><strong>ETA:</strong> {amb.etaMinutes} minutes</p>
                                        <p><strong>Patient:</strong> {amb.patientInfo?.complaint}</p>
                                    </>
                                )}
                                {amb.status === AmbulanceStatus.Available && <p>Standing by for dispatch.</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const AdminDashboard: FC<AdminDashboardProps> = ({
  user,
  patients,
  beds,
  erQueue,
  onAddToQueue,
  mortuaryRecords,
  onAddMortuaryRecord,
  onUpdateMortuaryRecord,
  complaintTickets,
  onUpdateComplaint,
  allUsers,
}) => {
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [isMortuaryModalOpen, setIsMortuaryModalOpen] = useState(false);
    const [selectedMortuaryRecord, setSelectedMortuaryRecord] = useState<MortuaryRecord | null>(null);

    const availableBeds = useMemo(() => beds.filter(b => b.status === BedStatus.Available).length, [beds]);
    const bedsByWard = useMemo(() => {
        return beds.reduce((acc, bed) => {
            if (!acc[bed.ward]) acc[bed.ward] = [];
            acc[bed.ward].push(bed);
            return acc;
        }, {} as Record<string, Bed[]>);
    }, [beds]);
    
    const staffUsers = useMemo(() => allUsers.filter(u => u.role !== UserRole.Patient), [allUsers]);
    const [selectedTicket, setSelectedTicket] = useState<ComplaintTicket | null>(null);
    const [ticketStatus, setTicketStatus] = useState<ComplaintStatus | undefined>(undefined);
    const [assignedTo, setAssignedTo] = useState<string | undefined>(undefined);

    const handleUpdateTicket = () => {
        if (!selectedTicket || !ticketStatus) return;
        
        const assignedUser = staffUsers.find(u => u.id === assignedTo);
        const updatedTicket: ComplaintTicket = {
            ...selectedTicket,
            status: ticketStatus,
            assignedTo: assignedTo,
            assignedToName: assignedUser?.name,
            history: [
                ...selectedTicket.history,
                {
                    timestamp: new Date().toISOString(),
                    action: `Status changed to ${ticketStatus}.${assignedUser ? ` Assigned to ${assignedUser.name}.` : ''}`,
                    actor: user.name,
                }
            ]
        };
        onUpdateComplaint(updatedTicket, user.name);
        setSelectedTicket(updatedTicket);
    };

    const handleSaveMortuaryRecord = (recordData: Omit<MortuaryRecord, 'id'> | MortuaryRecord) => {
        if ('id' in recordData) {
            onUpdateMortuaryRecord(recordData);
        } else {
            onAddMortuaryRecord(recordData);
        }
        setIsMortuaryModalOpen(false);
        setSelectedMortuaryRecord(null);
    };

    const handleOpenMortuaryModal = (record: MortuaryRecord | null) => {
        setSelectedMortuaryRecord(record);
        setIsMortuaryModalOpen(true);
    };

    const tabs: { key: AdminTab; label: string; icon: FC<{className?: string}> }[] = [
        { key: 'overview', label: 'Overview', icon: UserIcon },
        { key: 'er-triage', label: 'ER Triage', icon: SirenIcon },
        { key: 'beds', label: 'Bed Management', icon: BedIcon },
        { key: 'ambulance', label: 'Ambulance Dispatch', icon: AmbulanceIcon },
        { key: 'mortuary', label: 'Mortuary', icon: ArchiveBoxIcon },
        { key: 'complaints', label: 'Complaints', icon: ComplaintIcon },
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                        <StatCard title="Total Patients" value={patients.length} icon={<UsersIcon className="h-8 w-8 text-blue-500" />} />
                        <StatCard title="Available Beds" value={`${availableBeds} / ${beds.length}`} icon={<BedIcon className="h-8 w-8 text-green-500" />} />
                        <StatCard title="ER Queue" value={erQueue.length} icon={<SirenIcon className="h-8 w-8 text-red-500" />} />
                    </div>
                );
            case 'er-triage':
                return <TriageForm onAddToQueue={onAddToQueue} currentQueueLength={erQueue.length} />;
            case 'beds':
                return (
                    <div className="space-y-6 animate-fade-in">
                        {Object.entries(bedsByWard).map(([ward, wardBeds]) => (
                            <div key={ward}>
                                <h3 className="text-xl font-semibold text-gray-800 mb-3">{ward}</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                    {wardBeds.map(bed => {
                                        const statusStyles = {
                                            [BedStatus.Available]: 'bg-green-100 border-green-400 text-green-800',
                                            [BedStatus.Occupied]: 'bg-red-100 border-red-400 text-red-800',
                                            [BedStatus.Cleaning]: 'bg-yellow-100 border-yellow-400 text-yellow-800',
                                        }[bed.status];
                                        return (
                                            <div key={bed.id} className={`p-4 rounded-lg border-l-4 ${statusStyles}`}>
                                                <p className="font-bold">Bed {bed.bedNumber}</p>
                                                <p className="text-sm font-medium">{bed.status}</p>
                                                {bed.patientId && <p className="text-xs mt-1">Patient: {bed.patientId}</p>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'ambulance':
                return <AmbulanceDispatch />;
            case 'mortuary':
                 return (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-800">Mortuary Records</h3>
                            <button onClick={() => handleOpenMortuaryModal(null)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                Register New Case
                            </button>
                        </div>
                        <div className="bg-white shadow-md rounded-lg overflow-hidden">
                          <table className="min-w-full leading-normal">
                            <thead>
                              <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date of Death</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
                              </tr>
                            </thead>
                            <tbody>
                                {mortuaryRecords.map(record => (
                                     <tr key={record.id}>
                                         <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p className="text-gray-900 whitespace-no-wrap">{record.name}</p></td>
                                         <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                            <span className={`relative inline-block px-3 py-1 font-semibold leading-tight ${record.status === 'Released' ? 'text-green-900' : 'text-yellow-900'}`}>
                                                <span aria-hidden className={`absolute inset-0 ${record.status === 'Released' ? 'bg-green-200' : 'bg-yellow-200'} opacity-50 rounded-full`}></span>
                                                <span className="relative">{record.status}</span>
                                            </span>
                                         </td>
                                         <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p className="text-gray-900 whitespace-no-wrap">{new Date(record.dateOfDeath).toLocaleString()}</p></td>
                                         <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm"><p className="text-gray-900 whitespace-no-wrap">{record.storageLocation}</p></td>
                                         <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                                             <button onClick={() => handleOpenMortuaryModal(record)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                         </td>
                                     </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                    </div>
                );
            case 'complaints':
                return (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
                        <div className="md:col-span-1 h-[60vh] overflow-y-auto pr-2">
                             <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Tickets</h3>
                             {complaintTickets.map(ticket => (
                                 <button key={ticket.id} onClick={() => { setSelectedTicket(ticket); setTicketStatus(ticket.status); setAssignedTo(ticket.assignedTo); }} className={`w-full text-left p-3 mb-2 rounded-lg border ${selectedTicket?.id === ticket.id ? 'bg-indigo-50 border-indigo-300' : 'bg-white hover:bg-gray-50'}`}>
                                    <p className="font-semibold text-gray-800">{ticket.patientName}</p>
                                    <p className="text-sm text-gray-600 truncate">{ticket.summary}</p>
                                    <div className="text-xs mt-1 flex justify-between">
                                        <span className="text-gray-600">{ticket.category}</span>
                                        <span className={`px-2 py-0.5 text-xs rounded-full ${ {Open: 'bg-blue-100 text-blue-800', 'In Progress': 'bg-yellow-100 text-yellow-800', 'Resolved': 'bg-green-100 text-green-800'}[ticket.status] || 'bg-gray-200'}`}>{ticket.status}</span>
                                    </div>
                                 </button>
                             ))}
                        </div>
                        <div className="md:col-span-2">
                            {selectedTicket ? (
                                <div className="p-4 bg-slate-50 rounded-lg border space-y-4">
                                    <h4 className="font-semibold text-lg text-gray-800">Ticket Details ({selectedTicket.id})</h4>
                                    <p className="text-sm text-gray-800"><strong>Patient:</strong> {selectedTicket.patientName}</p>
                                    <p className="text-sm text-gray-800"><strong>Complaint:</strong> {selectedTicket.complaintText}</p>
                                    <p className="text-sm text-gray-800"><strong>AI Summary:</strong> {selectedTicket.summary}</p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Status</label>
                                        <select value={ticketStatus} onChange={e => setTicketStatus(e.target.value as ComplaintStatus)} className="w-full p-2 border rounded-md mt-1">
                                            {Object.values(ComplaintStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-gray-700">Assign To</label>
                                        <select value={assignedTo || ''} onChange={e => setAssignedTo(e.target.value)} className="w-full p-2 border rounded-md mt-1">
                                            <option value="">Unassigned</option>
                                            {staffUsers.map(su => <option key={su.id} value={su.id}>{su.name} ({su.role})</option>)}
                                        </select>
                                    </div>
                                    <button onClick={handleUpdateTicket} className="px-4 py-2 bg-indigo-600 text-white rounded-md">Update Ticket</button>
                                </div>
                            ) : <p className="text-gray-600">Select a ticket to view details.</p>}
                        </div>
                    </div>
                );
            default: return null;
        }
    };


  return (
    <div className="container mx-auto">
        {isMortuaryModalOpen && <MortuaryRecordModal record={selectedMortuaryRecord} onClose={() => setIsMortuaryModalOpen(false)} onSave={handleSaveMortuaryRecord} user={user} />}
        <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Administrator Dashboard</h2>
            <p className="text-lg text-gray-600">Welcome, {user.name}</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-2 sm:p-4">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                activeTab === tab.key
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <tab.icon className="h-5 w-5 mr-2" /> {tab.label}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="pt-6">
                {renderContent()}
            </div>
        </div>
    </div>
  );
};

export default AdminDashboard;