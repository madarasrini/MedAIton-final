
import React, { useState } from 'react';
import { IncidentReport, IncidentStatus, IncidentType, IncidentSeverity } from '../types';
import { MOCK_INCIDENT_REPORTS } from '../constants';
import { analyzeIncidentReport } from '../services/geminiService';
import { translations } from './translations';
import { SparklesIcon, CheckCircleIcon } from './Icons';

const getStatusStyles = (status: IncidentStatus) => {
    switch (status) {
        case IncidentStatus.Pending: return 'bg-yellow-100 text-yellow-800';
        case IncidentStatus.Analyzed: return 'bg-blue-100 text-blue-800';
        case IncidentStatus.Resolved: return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

const getSeverityStyles = (severity: IncidentSeverity) => {
    switch(severity) {
        case IncidentSeverity.Critical: return 'bg-red-500 text-white';
        case IncidentSeverity.Severe: return 'bg-red-200 text-red-900';
        case IncidentSeverity.Moderate: return 'bg-yellow-200 text-yellow-900';
        case IncidentSeverity.Mild: return 'bg-green-200 text-green-900';
    }
};

const PharmacovigilanceModule: React.FC = () => {
    const [incidents, setIncidents] = useState<IncidentReport[]>(MOCK_INCIDENT_REPORTS);
    const [selectedIncident, setSelectedIncident] = useState<IncidentReport | null>(incidents[0] || null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    // Fix: Update translation function to handle dynamic parameters.
    const t = (key: string, params?: { [key: string]: string | number }) => {
        let text = translations.en[key] || key;
        if (params) {
            Object.keys(params).forEach(pKey => {
                text = text.replace(`{${pKey}}`, String(params[pKey]));
            });
        }
        return text;
    };

    const handleAnalyze = async () => {
        if (!selectedIncident || selectedIncident.status !== IncidentStatus.Pending) return;

        setIsAnalyzing(true);
        const analysisResult = await analyzeIncidentReport(selectedIncident.description);
        
        const updatedIncident = { ...selectedIncident, status: IncidentStatus.Analyzed, analysis: analysisResult };
        
        setIncidents(prev => prev.map(i => i.id === selectedIncident.id ? updatedIncident : i));
        setSelectedIncident(updatedIncident);
        setIsAnalyzing(false);
    };

    const handleMarkAsResolved = () => {
        if (!selectedIncident) return;
        const updatedIncident = { ...selectedIncident, status: IncidentStatus.Resolved };
        setIncidents(prev => prev.map(i => i.id === selectedIncident.id ? updatedIncident : i));
        setSelectedIncident(updatedIncident);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[75vh]">
            {/* Incident Log */}
            <div className="md:col-span-1 bg-slate-50 rounded-lg border p-4 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('incidentLog')}</h3>
                <div className="space-y-3">
                    {incidents.map(incident => (
                        <button
                            key={incident.id}
                            onClick={() => setSelectedIncident(incident)}
                            className={`w-full text-left p-3 rounded-lg border-l-4 transition-colors ${selectedIncident?.id === incident.id ? 'bg-white border-indigo-500 shadow' : 'bg-white border-transparent hover:bg-gray-50'}`}
                        >
                            <div className="flex justify-between items-center text-xs mb-1">
                                <p className="font-semibold text-gray-800">{incident.type}</p>
                                <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusStyles(incident.status)}`}>{incident.status}</span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">Patient: {incident.patientId}</p>
                            <p className="text-xs text-gray-400 mt-1">{new Date(incident.dateReported).toLocaleDateString()}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Incident Details & Analysis */}
            <div className="md:col-span-2 bg-white rounded-lg border p-6 overflow-y-auto">
                {selectedIncident ? (
                    <div className="space-y-5">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{t('detailsFor', { id: selectedIncident.id.split('-')[1] })}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                <span>{t('reportedBy')}: <span className="font-medium text-gray-700">{selectedIncident.reportedBy}</span></span>
                                <span>{t('dateReported')}: <span className="font-medium text-gray-700">{new Date(selectedIncident.dateReported).toLocaleString()}</span></span>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-lg">
                            <h4 className="font-semibold text-gray-800">{t('descriptionOfIncident')}</h4>
                            <p className="text-gray-700 mt-1 text-sm">{selectedIncident.description}</p>
                            {selectedIncident.medicationInvolved && <p className="text-sm mt-2 text-gray-800"><strong>{t('medicationInvolved')}:</strong> {selectedIncident.medicationInvolved}</p>}
                        </div>

                        {selectedIncident.status === IncidentStatus.Pending && (
                            <button onClick={handleAnalyze} disabled={isAnalyzing} className="flex items-center px-5 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                {isAnalyzing ? t('analyzingIncident') : t('analyzeWithAi')}
                            </button>
                        )}
                        
                        {selectedIncident.analysis && (
                            <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-gray-900 border-t pt-5">{t('aiAnalysis')}</h4>
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <label className="text-sm font-semibold text-blue-800">{t('severity')}</label>
                                    <p className={`inline-block px-3 py-1 text-sm font-medium rounded-full mt-1 ${getSeverityStyles(selectedIncident.analysis.severity)}`}>
                                        {selectedIncident.analysis.severity}
                                    </p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <label className="text-sm font-semibold text-blue-800">{t('rootCause')}</label>
                                    <p className="text-gray-700 mt-1 text-sm">{selectedIncident.analysis.rootCause}</p>
                                </div>
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <label className="text-sm font-semibold text-blue-800">{t('correctivePlan')}</label>
                                    <div className="text-gray-700 mt-1 text-sm whitespace-pre-wrap">{selectedIncident.analysis.correctivePlan}</div>
                                </div>
                            </div>
                        )}

                        {selectedIncident.status === IncidentStatus.Analyzed && (
                             <button onClick={handleMarkAsResolved} className="flex items-center px-5 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700">
                                <CheckCircleIcon className="w-5 h-5 mr-2" />
                                {t('markAsResolved')}
                            </button>
                        )}

                        {selectedIncident.status === IncidentStatus.Resolved && (
                             <div className="flex items-center px-5 py-2 bg-green-100 text-green-800 font-semibold rounded-md">
                                <CheckCircleIcon className="w-5 h-5 mr-2" />
                                This incident has been resolved.
                            </div>
                        )}
                        
                    </div>
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">{t('noIncidentSelected')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PharmacovigilanceModule;
