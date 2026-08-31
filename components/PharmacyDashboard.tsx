
import React, { useState, useMemo, FC } from 'react';
import { User, PatientRecord, PharmacyInventoryItem, Prescription, ADRReport } from '../types.ts';
import { MedicationIcon, ClipboardListIcon, CheckCircleIcon, XIcon, PharmacyIcon, InteractionIcon, FoodIcon, InfoIcon, ReportIcon, SparklesIcon } from './Icons.tsx';
import { checkDrugInteractions, checkFoodDrugIncompatibility, getDrugInformation, getADRAnalysis } from '../services/geminiService.ts';
import { SoundControl } from './SoundControl.tsx';

interface PharmacyDashboardProps {
  user: User;
  patients: PatientRecord[];
  inventory: PharmacyInventoryItem[];
  adrReports: ADRReport[];
  onDispenseMedication: (patientId: string, drug: string, quantity: number, costPerUnit: number) => void;
  onRestockInventory: (drugId: string, quantity: number) => void;
  onAddADRReport: (reportData: Omit<ADRReport, 'id'>) => void;
}

interface EPrescription {
  patientId: string;
  patientName: string;
  prescription: Prescription;
}

type PharmacyTab = 'queue' | 'inventory' | 'interactions' | 'food' | 'info' | 'adr' | 'adr-analysis';

const TabButton: FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center whitespace-nowrap py-4 px-3 sm:px-4 border-b-2 font-medium text-sm transition-colors focus:outline-none ${
            active
            ? 'border-indigo-500 text-indigo-600'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`}
    >
        {icon} {label}
    </button>
);


const DispenseModal: FC<{
  item: EPrescription;
  inventoryItem?: PharmacyInventoryItem;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}> = ({ item, inventoryItem, onClose, onConfirm }) => {
    const remainingToDispense = item.prescription.prescribedQuantity - item.prescription.boughtQuantity;
    const maxDispensable = Math.min(remainingToDispense, inventoryItem?.stockQuantity || 0);
    const [quantity, setQuantity] = useState(maxDispensable);
    const [error, setError] = useState('');

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value, 10);
        if (isNaN(val) || val <= 0) {
            setQuantity(0);
            setError("Quantity must be a positive number.");
        } else if (val > maxDispensable) {
            setQuantity(maxDispensable);
            setError(`Cannot dispense more than available stock or prescription limit (${maxDispensable}).`);
        } else {
            setQuantity(val);
            setError('');
        }
    };
    
    const handleConfirm = () => {
        if (!error && quantity > 0) {
            onConfirm(quantity);
            onClose();
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md space-y-6">
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900">Dispense Medication</h3>
                    <p className="font-bold text-lg text-indigo-600">{item.prescription.drug}</p>
                </div>
                <div className="space-y-2 p-4 bg-slate-50 rounded-lg border text-sm text-gray-800">
                    <p><strong>Patient:</strong> {item.patientName} ({item.patientId})</p>
                    <p><strong>Dosage:</strong> {item.prescription.dosage}, {item.prescription.frequency}</p>
                    <p><strong>Prescribed:</strong> {item.prescription.prescribedQuantity} | <strong>Dispensed:</strong> {item.prescription.boughtQuantity}</p>
                    <p><strong>In Stock:</strong> {inventoryItem?.stockQuantity ?? 'N/A'}</p>
                </div>
                <div>
                    <label htmlFor="dispense_quantity" className="block text-sm font-medium text-gray-700">Quantity to Dispense</label>
                    <input 
                        type="number"
                        id="dispense_quantity"
                        value={quantity}
                        onChange={handleQuantityChange}
                        max={maxDispensable}
                        min="1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
                </div>
                <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button onClick={handleConfirm} disabled={!!error || quantity <= 0 || maxDispensable <= 0} className="px-4 py-2 bg-green-600 text-white rounded-md disabled:bg-green-300">
                        {maxDispensable > 0 ? `Dispense ${quantity} units` : 'Out of Stock'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const RestockModal: FC<{
    inventory: PharmacyInventoryItem[];
    onClose: () => void;
    onConfirm: (drugId: string, quantity: number) => void;
}> = ({ inventory, onClose, onConfirm }) => {
    const [selectedDrugId, setSelectedDrugId] = useState<string>(inventory[0]?.id || '');
    const [quantity, setQuantity] = useState<number>(50);

    const handleConfirm = () => {
        if(selectedDrugId && quantity > 0) {
            onConfirm(selectedDrugId, quantity);
            onClose();
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 text-center">Restock Inventory (GRN)</h3>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="drug_select" className="block text-sm font-medium text-gray-700">Medication</label>
                        <select 
                            id="drug_select"
                            value={selectedDrugId}
                            onChange={(e) => setSelectedDrugId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        >
                            {inventory.map(item => <option key={item.id} value={item.id}>{item.drugName}</option>)}
                        </select>
                     </div>
                     <div>
                        <label htmlFor="restock_quantity" className="block text-sm font-medium text-gray-700">Quantity to Add</label>
                        <input 
                            type="number"
                            id="restock_quantity"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                            min="1"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                     </div>
                </div>
                 <div className="flex justify-end space-x-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
                    <button onClick={handleConfirm} disabled={!selectedDrugId || quantity <= 0} className="px-4 py-2 bg-indigo-600 text-white rounded-md disabled:bg-indigo-300">
                        Add to Stock
                    </button>
                </div>
            </div>
        </div>
    )
}

const LoadingComponent: FC = () => (
    <div className="flex items-center justify-center p-4">
        <SparklesIcon className="h-5 w-5 mr-2 text-indigo-500 animate-pulse" />
        <span className="text-gray-600">AI is analyzing...</span>
    </div>
);

const ResultDisplay: FC<{ result: string }> = ({ result }) => (
    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg whitespace-pre-wrap text-sm text-gray-700">{result}</div>
);

const PharmacyDashboard: FC<PharmacyDashboardProps> = ({ user, patients, inventory, adrReports, onDispenseMedication, onRestockInventory, onAddADRReport }) => {
    const [activeTab, setActiveTab] = useState<PharmacyTab>('queue');
    const [dispenseModalItem, setDispenseModalItem] = useState<EPrescription | null>(null);
    const [showRestockModal, setShowRestockModal] = useState(false);
    const [showSuccessToast, setShowSuccessToast] = useState('');
    
    // State for new modules
    const [interactionDrugs, setInteractionDrugs] = useState('');
    const [interactionResult, setInteractionResult] = useState('');
    const [isCheckingInteractions, setIsCheckingInteractions] = useState(false);

    const [foodDrugName, setFoodDrugName] = useState('');
    const [foodDrugResult, setFoodDrugResult] = useState('');
    const [isCheckingFoodDrug, setIsCheckingFoodDrug] = useState(false);

    const [infoDrugName, setInfoDrugName] = useState('');
    const [drugInfoResult, setDrugInfoResult] = useState('');
    const [isFetchingDrugInfo, setIsFetchingDrugInfo] = useState(false);
    
    const [adrPatientId, setAdrPatientId] = useState('');
    const [adrDrug, setAdrDrug] = useState('');
    const [adrDescription, setAdrDescription] = useState('');
    
    const [isAnalyzingADR, setIsAnalyzingADR] = useState(false);
    const [adrAnalysisResult, setAdrAnalysisResult] = useState('');
    const [analyzedADR, setAnalyzedADR] = useState<ADRReport | null>(null);
    
    const tabs = [
        { key: 'queue', label: 'Queue', icon: <ClipboardListIcon className="h-5 w-5 mr-2" /> },
        { key: 'inventory', label: 'Inventory', icon: <PharmacyIcon className="h-5 w-5 mr-2" /> },
        { key: 'interactions', label: 'Interactions', icon: <InteractionIcon className="h-5 w-5 mr-2" /> },
        { key: 'food', label: 'Food', icon: <FoodIcon className="h-5 w-5 mr-2" /> },
        { key: 'info', label: 'Drug Info', icon: <InfoIcon className="h-5 w-5 mr-2" /> },
        { key: 'adr', label: 'ADR Reporting', icon: <ReportIcon className="h-5 w-5 mr-2" /> },
    ];

    const ePrescriptions = useMemo(() => {
        const prescriptions: EPrescription[] = [];
        patients.forEach(patient => {
            patient.prescriptions?.forEach(p => {
                if (p.boughtQuantity < p.prescribedQuantity) {
                    prescriptions.push({
                        patientId: patient.id,
                        patientName: patient.name,
                        prescription: p,
                    });
                }
            });
        });
        return prescriptions;
    }, [patients]);
    
    const handleDispenseConfirm = (quantity: number) => {
        if (!dispenseModalItem) return;
        const inventoryItem = inventory.find(i => i.drugName === dispenseModalItem.prescription.drug);
        if (!inventoryItem) return;
        
        onDispenseMedication(
            dispenseModalItem.patientId,
            dispenseModalItem.prescription.drug,
            quantity,
            inventoryItem.costPerUnit
        );
        
        setShowSuccessToast(`${quantity} units of ${dispenseModalItem.prescription.drug} dispensed.`);
        setTimeout(() => setShowSuccessToast(''), 3000);
    };

    const handleRestockConfirm = (drugId: string, quantity: number) => {
        onRestockInventory(drugId, quantity);
        const drug = inventory.find(i => i.id === drugId);
        setShowSuccessToast(`${quantity} units of ${drug?.drugName} added to stock.`);
        setTimeout(() => setShowSuccessToast(''), 3000);
    };
    
    const handleCheckInteractions = async () => {
        if (!interactionDrugs.trim()) return;
        setIsCheckingInteractions(true);
        setInteractionResult('');
        const drugs = interactionDrugs.split(',').map(d => d.trim());
        const result = await checkDrugInteractions(drugs);
        setInteractionResult(result);
        setIsCheckingInteractions(false);
    };

    const handleCheckFoodDrug = async () => {
        if (!foodDrugName.trim()) return;
        setIsCheckingFoodDrug(true);
        setFoodDrugResult('');
        const result = await checkFoodDrugIncompatibility(foodDrugName);
        setFoodDrugResult(result);
        setIsCheckingFoodDrug(false);
    };
    
    const handleGetDrugInfo = async () => {
        if (!infoDrugName.trim()) return;
        setIsFetchingDrugInfo(true);
        setDrugInfoResult('');
        const result = await getDrugInformation(infoDrugName);
        setDrugInfoResult(result);
        setIsFetchingDrugInfo(false);
    };

    const handleADRSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!adrPatientId || !adrDrug || !adrDescription) {
            alert("Please fill all fields.");
            return;
        }
        onAddADRReport({
            patientId: adrPatientId,
            drugInvolved: adrDrug,
            reactionDescription: adrDescription,
            reportedBy: user.name,
            reportedAt: new Date().toISOString(),
        });
        setAdrPatientId('');
        setAdrDrug('');
        setAdrDescription('');
        setShowSuccessToast('ADR reported successfully.');
        setTimeout(() => setShowSuccessToast(''), 3000);
    };

    const handleAnalyzeADR = async (report: ADRReport) => {
        if (!report) return;
        setAnalyzedADR(report);
        setIsAnalyzingADR(true);
        setAdrAnalysisResult('');
        const result = await getADRAnalysis(report.reactionDescription);
        setAdrAnalysisResult(result);
        setIsAnalyzingADR(false);
        setActiveTab('adr-analysis');
    };


    const renderContent = () => {
        switch(activeTab) {
            case 'queue': return (
                <div className="max-h-[65vh] overflow-y-auto pr-2">
                    {ePrescriptions.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medication</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Dispense</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {ePrescriptions.map((item, index) => (
                                    <tr key={`${item.patientId}-${item.prescription.drug}-${index}`}>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{item.patientName}</div>
                                            <div className="text-xs text-gray-500">{item.patientId}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{item.prescription.drug}</div>
                                            <div className="text-xs text-gray-500">{item.prescription.dosage}</div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 font-mono">
                                            {item.prescription.prescribedQuantity - item.prescription.boughtQuantity}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <button onClick={() => setDispenseModalItem(item)} className="px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-md hover:bg-indigo-700">Dispense</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center py-12 text-gray-500">No pending prescriptions.</p>
                    )}
                </div>
            );
            case 'inventory': return (
                 <div className="max-h-[65vh] overflow-y-auto pr-2">
                    <table className="min-w-full divide-y divide-gray-200">
                       <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drug</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {inventory.map(item => {
                                const isLowStock = item.stockQuantity <= item.reorderLevel;
                                return (
                                    <tr key={item.id} className={isLowStock ? 'bg-red-50' : ''}>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.drugName}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-mono">
                                            <span className={isLowStock ? 'text-red-600 font-bold' : 'text-gray-800'}>{item.stockQuantity}</span>
                                            <span className="text-xs text-gray-500"> / {item.reorderLevel}</span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                 </div>
            );
            case 'interactions': return (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Enter multiple drug names, separated by commas, to check for potential interactions.</p>
                    <textarea value={interactionDrugs} onChange={e => setInteractionDrugs(e.target.value)} rows={3} className="w-full p-2 border rounded-md" placeholder="e.g., Aspirin, Warfarin, Ciprofloxacin"></textarea>
                    <button onClick={handleCheckInteractions} disabled={isCheckingInteractions} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">Check Interactions</button>
                    {isCheckingInteractions && <LoadingComponent />}
                    {interactionResult && <ResultDisplay result={interactionResult} />}
                </div>
            );
            case 'food': return (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Enter a drug name to check for common food and beverage incompatibilities.</p>
                    <input type="text" value={foodDrugName} onChange={e => setFoodDrugName(e.target.value)} className="w-full p-2 border rounded-md" placeholder="e.g., Atorvastatin" />
                    <button onClick={handleCheckFoodDrug} disabled={isCheckingFoodDrug} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">Check Food Incompatibility</button>
                    {isCheckingFoodDrug && <LoadingComponent />}
                    {foodDrugResult && <ResultDisplay result={foodDrugResult} />}
                </div>
            );
            case 'info': return (
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Enter a drug name to get a detailed information monograph.</p>
                    <input type="text" value={infoDrugName} onChange={e => setInfoDrugName(e.target.value)} className="w-full p-2 border rounded-md" placeholder="e.g., Metformin" />
                    <button onClick={handleGetDrugInfo} disabled={isFetchingDrugInfo} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">Get Drug Information</button>
                    {isFetchingDrugInfo && <LoadingComponent />}
                    {drugInfoResult && <ResultDisplay result={drugInfoResult} />}
                </div>
            );
            case 'adr': return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <form onSubmit={handleADRSubmit} className="space-y-4">
                        <h4 className="font-semibold text-gray-800">Report New ADR</h4>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Patient ID</label>
                            <input type="text" value={adrPatientId} onChange={e => setAdrPatientId(e.target.value)} className="w-full p-2 border rounded-md" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Drug(s) Involved</label>
                            <input type="text" value={adrDrug} onChange={e => setAdrDrug(e.target.value)} className="w-full p-2 border rounded-md" required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Reaction Description</label>
                            <textarea value={adrDescription} onChange={e => setAdrDescription(e.target.value)} rows={4} className="w-full p-2 border rounded-md" required></textarea>
                        </div>
                        <button type="submit" className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Submit Report</button>
                    </form>
                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                        <h4 className="font-semibold text-gray-800 mb-2">Submitted Reports</h4>
                        {adrReports.map(report => (
                            <div key={report.id} className="p-3 mb-2 bg-slate-50 border rounded-lg text-sm">
                                <p className="text-xs text-gray-500">{new Date(report.reportedAt).toLocaleString()}</p>
                                <p className="text-gray-800"><strong>Patient:</strong> {report.patientId}</p>
                                <p className="text-gray-800"><strong>Drug:</strong> {report.drugInvolved}</p>
                                <p className="text-gray-700 mt-1">{report.reactionDescription}</p>
                                <div className="mt-2 pt-2 border-t flex justify-end">
                                    <button
                                        onClick={() => handleAnalyzeADR(report)}
                                        className="flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                                        disabled={isAnalyzingADR && analyzedADR?.id === report.id}
                                    >
                                        <SparklesIcon className="h-4 w-4 mr-1" />
                                        {isAnalyzingADR && analyzedADR?.id === report.id ? 'Analyzing...' : 'Analyze with AI'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 'adr-analysis':
                return (
                    <div className="animate-fade-in">
                        <button onClick={() => setActiveTab('adr')} className="text-sm text-indigo-600 hover:underline mb-4">
                            &larr; Back to ADR Reporting
                        </button>
                        <h3 className="text-xl font-semibold text-gray-800">
                            ADR Analysis for report on <span className="font-bold text-indigo-600">{analyzedADR?.drugInvolved}</span>
                        </h3>
                        <div className="mt-2 p-4 bg-slate-100 rounded-lg border">
                            <p className="font-semibold text-sm text-gray-800">Original Report:</p>
                            <p className="text-sm text-gray-700 mt-1">{analyzedADR?.reactionDescription}</p>
                        </div>
                        {isAnalyzingADR && <LoadingComponent />}
                        {adrAnalysisResult && <ResultDisplay result={adrAnalysisResult} />}
                    </div>
                );
            default: return null;
        }
    }

    return (
        <div className="container mx-auto">
            {showSuccessToast && (
                <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-fade-in z-50">
                    <CheckCircleIcon className="h-6 w-6 mr-3" />
                    <span>{showSuccessToast}</span>
                     <button onClick={() => setShowSuccessToast('')} className="ml-4 text-white opacity-80 hover:opacity-100">
                        <XIcon className="h-5 w-5" />
                    </button>
                </div>
            )}
            {dispenseModalItem && <DispenseModal item={dispenseModalItem} inventoryItem={inventory.find(i => i.drugName === dispenseModalItem.prescription.drug)} onClose={() => setDispenseModalItem(null)} onConfirm={handleDispenseConfirm} />}
            {showRestockModal && <RestockModal inventory={inventory} onClose={() => setShowRestockModal(false)} onConfirm={handleRestockConfirm} />}
            
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pharmacy Information System</h2>
                    <p className="text-sm text-gray-500 font-semibold mt-0.5">Welcome, {user.name} • E-Prescriptions, Inventory & Pharmacovigilance</p>
                </div>
                <div className="flex items-center gap-3">
                    <SoundControl dashboardName="Pharmacy Station" variant="pill" />
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md">
                <div className="border-b border-gray-200">
                     <nav className="-mb-px flex space-x-2 sm:space-x-4 overflow-x-auto" aria-label="Tabs">
                         {tabs.map(tab => (
                             <TabButton key={tab.key} active={activeTab === tab.key} onClick={() => setActiveTab(tab.key as PharmacyTab)} icon={tab.icon} label={tab.label} />
                         ))}
                         {activeTab === 'inventory' && (
                             <div className="flex-grow flex justify-end items-center pr-4">
                                <button onClick={() => setShowRestockModal(true)} className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-md hover:bg-green-200">Restock</button>
                             </div>
                         )}
                     </nav>
                </div>
                 <div className="p-6">
                    {renderContent()}
                 </div>
            </div>

        </div>
    );
};

export default PharmacyDashboard;
