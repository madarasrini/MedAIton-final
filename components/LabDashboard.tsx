import React, { useState, useMemo, FC, useEffect } from 'react';
import { User, LabTest, LabTestStatus, LabResult } from '../types';
import { MicroscopeIcon, CheckCircleIcon, XIcon } from './Icons';

interface LabDashboardProps {
  user: User;
  labTests: LabTest[];
  onUpdateLabTest: (updatedTest: LabTest) => void;
}

const getStatusStyles = (status: LabTestStatus) => {
    switch (status) {
        case LabTestStatus.ORDERED: return { border: 'border-gray-400', bg: 'bg-gray-50', text: 'text-gray-700' };
        case LabTestStatus.SAMPLE_COLLECTED: return { border: 'border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700' };
        case LabTestStatus.IN_PROGRESS: return { border: 'border-yellow-400', bg: 'bg-yellow-50', text: 'text-yellow-700' };
        case LabTestStatus.COMPLETED: return { border: 'border-green-400', bg: 'bg-green-50', text: 'text-green-700' };
        case LabTestStatus.CANCELLED: return { border: 'border-red-400', bg: 'bg-red-50', text: 'text-red-700' };
    }
};

const AnimatedSampleTracker: FC = () => {
    const stages = ['Centrifuge', 'Analysis', 'QC', 'Verification'];
    const [currentStage, setCurrentStage] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentStage(prev => (prev + 1) % (stages.length + 1));
        }, 2000);
        return () => clearInterval(interval);
    }, [stages.length]);
    
    return (
        <div>
            <h4 className="font-semibold text-gray-800 mb-4">Live Sample Progress</h4>
            <div className="relative h-12 bg-slate-100 rounded-full border border-slate-200">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-200 to-cyan-200 rounded-full transition-all duration-1000" style={{ width: `${(currentStage / stages.length) * 100}%` }}></div>
                <div className="absolute inset-0 flex items-center justify-around">
                    {stages.map((stage, index) => (
                        <div key={stage} className={`text-xs font-semibold z-10 transition-colors duration-500 ${currentStage > index ? 'text-white' : 'text-slate-500'}`}>{stage}</div>
                    ))}
                </div>
            </div>
        </div>
    );
};


const LabTestDetailModal: FC<{
    test: LabTest;
    onClose: () => void;
    onUpdate: (updatedTest: LabTest) => void;
}> = ({ test, onClose, onUpdate }) => {
    const [status, setStatus] = useState(test.status);
    const [sampleId, setSampleId] = useState(test.sampleId || '');
    const [results, setResults] = useState<LabResult[]>(test.results || [{ parameter: '', value: '', referenceRange: '', isAbnormal: false }]);

    const handleResultChange = (index: number, field: keyof LabResult, value: string | boolean) => {
        const newResults = [...results];
        // @ts-ignore
        newResults[index][field] = value;
        setResults(newResults);
    };

    const addResultRow = () => {
        setResults([...results, { parameter: '', value: '', referenceRange: '', isAbnormal: false }]);
    };
    
    const removeResultRow = (index: number) => {
        setResults(results.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        const updatedTest: LabTest = { ...test, status };

        if (status === LabTestStatus.SAMPLE_COLLECTED || status === LabTestStatus.IN_PROGRESS) {
            updatedTest.sampleId = sampleId;
        }

        if (status === LabTestStatus.COMPLETED) {
            updatedTest.results = results.filter(r => r.parameter && r.value);
            updatedTest.completedAt = new Date().toISOString();
        }

        onUpdate(updatedTest);
        onClose();
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Lab Test: {test.testName}</h3>
                    <button onClick={onClose}><XIcon className="h-6 w-6 text-gray-500" /></button>
                </div>
                <div className="space-y-4">
                    <p className="text-gray-800"><strong>Patient:</strong> {test.patientName} ({test.patientId})</p>
                    <p className="text-gray-800"><strong>Ordered By:</strong> {test.orderedBy} on {new Date(test.orderedAt).toLocaleString()}</p>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Test Status</label>
                        <select value={status} onChange={e => setStatus(e.target.value as LabTestStatus)} className="w-full p-2 border rounded-md">
                            {Object.values(LabTestStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {(status === LabTestStatus.SAMPLE_COLLECTED || status === LabTestStatus.IN_PROGRESS || status === LabTestStatus.COMPLETED) && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Sample ID</label>
                            <input type="text" value={sampleId} onChange={e => setSampleId(e.target.value)} className="w-full p-2 border rounded-md" placeholder="e.g., SMP-001-A" />
                        </div>
                    )}
                    
                    {status === LabTestStatus.IN_PROGRESS && <AnimatedSampleTracker />}

                    {status === LabTestStatus.COMPLETED && (
                        <div>
                            <h4 className="font-semibold text-gray-800 mb-2">Enter Results</h4>
                            {results.map((res, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-center">
                                    <input type="text" placeholder="Parameter" value={res.parameter} onChange={e => handleResultChange(index, 'parameter', e.target.value)} className="col-span-4 p-2 border rounded-md" />
                                    <input type="text" placeholder="Value" value={res.value} onChange={e => handleResultChange(index, 'value', e.target.value)} className="col-span-2 p-2 border rounded-md" />
                                    <input type="text" placeholder="Reference Range" value={res.referenceRange} onChange={e => handleResultChange(index, 'referenceRange', e.target.value)} className="col-span-4 p-2 border rounded-md" />
                                    <label className="col-span-1 flex items-center text-xs"><input type="checkbox" checked={res.isAbnormal} onChange={e => handleResultChange(index, 'isAbnormal', e.target.checked)} className="mr-1" /> Abn?</label>
                                    <button onClick={() => removeResultRow(index)} className="col-span-1 text-red-500">Remove</button>
                                </div>
                            ))}
                            <button onClick={addResultRow} className="text-sm text-indigo-600">+ Add Row</button>
                        </div>
                    )}
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded">Save Changes</button>
                </div>
            </div>
        </div>
    );
};


const LabDashboard: FC<LabDashboardProps> = ({ user, labTests, onUpdateLabTest }) => {
    const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);

    const testsByStatus = useMemo(() => {
        const categorized: Record<LabTestStatus, LabTest[]> = {
            [LabTestStatus.ORDERED]: [],
            [LabTestStatus.SAMPLE_COLLECTED]: [],
            [LabTestStatus.IN_PROGRESS]: [],
            [LabTestStatus.COMPLETED]: [],
            [LabTestStatus.CANCELLED]: [],
        };
        labTests.forEach(test => {
            if (categorized[test.status]) {
                categorized[test.status].push(test);
            }
        });
        return categorized;
    }, [labTests]);

    const workflowColumns: { title: string, status: LabTestStatus }[] = [
        { title: 'Ordered', status: LabTestStatus.ORDERED },
        { title: 'Sample Collected', status: LabTestStatus.SAMPLE_COLLECTED },
        { title: 'In Progress', status: LabTestStatus.IN_PROGRESS },
        { title: 'Completed', status: LabTestStatus.COMPLETED },
    ];

    return (
        <div className="container mx-auto">
            {selectedTest && <LabTestDetailModal test={selectedTest} onClose={() => setSelectedTest(null)} onUpdate={onUpdateLabTest} />}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-800">Laboratory Dashboard</h2>
                <p className="text-lg text-gray-600">Welcome, {user.name}</p>
            </div>
            
            <div className="flex space-x-4 overflow-x-auto min-h-[70vh] p-2">
                {workflowColumns.map(({ title, status }) => {
                    const tests = testsByStatus[status];
                    const styles = getStatusStyles(status);
                    return (
                        <div key={status} className={`w-72 flex-shrink-0 bg-slate-100 rounded-lg`}>
                            <h3 className={`font-semibold p-3 sticky top-0 rounded-t-lg ${styles.bg} ${styles.text}`}>{title} ({tests.length})</h3>
                            <div className="p-2 space-y-2 overflow-y-auto h-[calc(70vh-3rem)]">
                                {tests.map(test => (
                                    <div key={test.id} onClick={() => setSelectedTest(test)} className={`p-3 bg-white rounded-md shadow-sm border-l-4 cursor-pointer hover:shadow-md ${styles.border}`}>
                                        <p className="font-semibold text-sm text-gray-800">{test.testName}</p>
                                        <p className="text-xs text-gray-600">{test.patientName}</p>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(test.orderedAt).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};

export default LabDashboard;