
import React, { useState, useMemo, FC } from 'react';
import { User, PatientRecord, Appointment, Prescription, DoctorSpecialty, UserRole, NotificationItem, ComplaintTicket, ComplaintStatus, LabTest, LabResult, AppointmentStatus } from '../types.ts';
import { BillingIcon, CheckCircleIcon, CreditCardIcon, PaypalIcon, CalendarIcon, UserIcon, DiagnosisIcon, TreatmentPlanIcon, MedicationIcon, SunIcon, SunsetIcon, MoonIcon, BriefcaseIcon, UsersIcon, ClipboardListIcon, SparklesIcon, BellIcon, XIcon, ComplaintIcon, MicroscopeIcon, FileTextIcon } from './Icons.tsx';
import { translations } from './translations.ts';
import { SoundControl } from './SoundControl.tsx';

interface PatientDashboardProps {
  user: User;
  patientRecords: PatientRecord[];
  activePatientRecord: PatientRecord | undefined;
  onSelectPatient: (patientId: string) => void;
  onPayment: (patientId: string) => void;
  onMedicationPurchase: (patientId: string, drug: string, quantity: number, costPerUnit: number) => void;
  onScheduleAppointment: (data: Omit<Appointment, 'id' | 'status'>) => boolean;
  appointments: Appointment[];
  language: string;
  notifications: NotificationItem[];
  onDismissNotification: (id: number) => void;
  complaintTickets: ComplaintTicket[];
  onAddComplaint: (patient: PatientRecord, complaintText: string) => Promise<void>;
  labTests: LabTest[];
}

type JourneyStepKey = 'REGISTRATION' | 'CONSULTATION' | 'DIAGNOSIS' | 'TREATMENT' | 'MEDICATION' | 'BILLING';
type ActiveTab = 'journey' | 'complaints' | 'lab_reports';

const SectionWrapper: FC<{title: string, onNext?: () => void, nextLabel?: string, children: React.ReactNode}> = ({ title, onNext, nextLabel, children }) => (
    <div className="space-y-6 fade-slide-up">
        <h3 className="text-2xl font-bold text-gray-800 border-b border-gray-100 pb-3">{title}</h3>
        <div>{children}</div>
        {onNext && nextLabel && (
            <div className="flex justify-end pt-4">
                <button onClick={onNext} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-100 active:scale-95">
                    {nextLabel} &rarr;
                </button>
            </div>
        )}
    </div>
);

const RegistrationSection: FC<{t: Function, patientRecord: PatientRecord, onNext: () => void}> = ({ t, patientRecord, onNext }) => (
    <SectionWrapper title={t('confirmDetails')} onNext={onNext} nextLabel={t('proceedToConsultation')}>
      <div className="glass-panel rounded-3xl p-8 hover-lift">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('nameLabel')}</label>
                <p className="text-xl font-bold text-gray-800">{patientRecord.name}</p>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('ageLabel')}</label>
                <p className="text-xl font-bold text-gray-800">{patientRecord.age}</p>
            </div>
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('genderLabel')}</label>
                <p className="text-xl font-bold text-gray-800">{patientRecord.gender}</p>
            </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('patientIdLabel')}</label>
                <p className="text-xl font-bold text-indigo-600">#{patientRecord.id}</p>
            </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('chiefComplaintLabel')}</label>
            <p className="text-gray-700 mt-2 italic font-medium">"{patientRecord.chiefComplaint}"</p>
        </div>
      </div>
    </SectionWrapper>
);

const ConsultationSection: FC<{t: Function, appointments: Appointment[], onNext: () => void}> = ({ t, appointments, onNext }) => {
    const upcoming = appointments.filter(a => a.status === AppointmentStatus.Scheduled);
    return (
        <SectionWrapper title={t('consultation')} onNext={onNext} nextLabel={t('proceedToDiagnosis')}>
            <div className="space-y-4">
                {upcoming.length > 0 ? upcoming.map(appt => (
                    <div key={appt.id} className="glass-panel rounded-2xl p-6 flex items-center justify-between hover-lift">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                <CalendarIcon className="h-6 w-6" />
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-800">{appt.doctorName}</h4>
                                <p className="text-xs text-gray-500 font-medium">{appt.specialty} • {appt.date} at {appt.time}</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-lg">Scheduled</span>
                    </div>
                )) : (
                    <div className="p-12 text-center glass-panel rounded-3xl border-dashed border-2">
                        <p className="text-gray-400 font-bold">{t('noUpcomingAppointments')}</p>
                    </div>
                )}
            </div>
        </SectionWrapper>
    );
};

const MedicationSection: FC<{t: Function, patientRecord: PatientRecord, onMedicationPurchase: any, onNext: () => void}> = ({ t, patientRecord, onMedicationPurchase, onNext }) => (
    <SectionWrapper title={t('medication')} onNext={onNext} nextLabel={t('proceedToBilling')}>
        <div className="space-y-4">
            {patientRecord.prescriptions?.length ? patientRecord.prescriptions.map(p => (
                <div key={p.drug} className="glass-panel rounded-2xl p-6 flex items-center justify-between hover-lift">
                    <div>
                        <h4 className="font-bold text-gray-800 text-lg">{p.drug}</h4>
                        <p className="text-xs text-gray-500">{p.dosage} • {p.frequency}</p>
                        <div className="flex gap-2 mt-2">
                            {p.timing?.map(time => (
                                <span key={time} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[9px] font-bold rounded uppercase">{time}</span>
                            ))}
                        </div>
                    </div>
                    <div className="text-right space-y-2">
                        <p className="text-xs font-bold text-gray-400">{p.boughtQuantity} / {p.prescribedQuantity} units</p>
                        {p.boughtQuantity < p.prescribedQuantity ? (
                            <button 
                                onClick={() => onMedicationPurchase(patientRecord.id, p.drug, p.prescribedQuantity - p.boughtQuantity, 15)}
                                className="px-4 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700"
                            >
                                Purchase All
                            </button>
                        ) : (
                            <span className="text-green-600 font-black text-[10px] uppercase">Purchased</span>
                        )}
                    </div>
                </div>
            )) : (
                <p className="text-center text-gray-400 font-bold py-10">{t('noPrescriptions')}</p>
            )}
        </div>
    </SectionWrapper>
);

const BillingSection: FC<{t: Function, patientRecord: PatientRecord, onPayment: any}> = ({ t, patientRecord, onPayment }) => {
    const total = patientRecord.billing.reduce((acc, item) => acc + item.cost, 0);
    return (
        <SectionWrapper title={t('billingSummary')}>
            <div className="glass-panel rounded-3xl p-8 space-y-6">
                <div className="space-y-3">
                    {patientRecord.billing.map(item => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-500 font-medium">{item.description}</span>
                            <span className="font-bold text-gray-800">₹{item.cost}</span>
                        </div>
                    ))}
                    <div className="pt-4 border-t flex justify-between items-center">
                        <span className="text-lg font-black text-gray-900">{t('total')}</span>
                        <span className="text-2xl font-black text-indigo-600">₹{total}</span>
                    </div>
                </div>
                {patientRecord.paymentStatus !== 'Paid' ? (
                    <button 
                        onClick={() => onPayment(patientRecord.id)}
                        className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        {t('payNow')}
                    </button>
                ) : (
                    <div className="bg-green-50 p-4 rounded-2xl flex items-center justify-center gap-3 text-green-700">
                        <CheckCircleIcon className="h-6 w-6" />
                        <span className="font-black uppercase tracking-widest">{t('paidInFull')}</span>
                    </div>
                )}
            </div>
        </SectionWrapper>
    );
};

const PatientDashboard: React.FC<PatientDashboardProps> = ({ user, patientRecords, activePatientRecord, onSelectPatient, onPayment, onMedicationPurchase, onScheduleAppointment, appointments, language, notifications, onDismissNotification, complaintTickets, onAddComplaint, labTests }) => {
  const [currentStep, setCurrentStep] = useState<JourneyStepKey>('REGISTRATION');
  const [completedSteps, setCompletedSteps] = useState<Set<JourneyStepKey>>(new Set());
  const [activeTab, setActiveTab] = useState<ActiveTab>('journey');

  const t = (key: string, params?: { [key: string]: string | number }) => {
    let text = translations[language]?.[key] || translations['en'][key] || key;
    if (params) {
        Object.keys(params).forEach(pKey => {
            text = text.replace(`{${pKey}}`, String(params[pKey]));
        });
    }
    return text;
  };
  
  const journeySteps: { key: JourneyStepKey; labelKey: string; icon: FC<{className?: string}> }[] = [
    { key: 'REGISTRATION', labelKey: 'registration', icon: UserIcon },
    { key: 'CONSULTATION', labelKey: 'consultation', icon: CalendarIcon },
    { key: 'DIAGNOSIS', labelKey: 'diagnosis', icon: DiagnosisIcon },
    { key: 'TREATMENT', labelKey: 'treatmentPlan', icon: TreatmentPlanIcon },
    { key: 'MEDICATION', labelKey: 'medication', icon: MedicationIcon },
    { key: 'BILLING', labelKey: 'billingDischarge', icon: BillingIcon },
  ];

  const currentStepIndex = journeySteps.findIndex(step => step.key === currentStep);

  const handleNextStep = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < journeySteps.length) {
      setCurrentStep(journeySteps[nextStepIndex].key);
    }
  };

  const renderCurrentStepContent = () => {
    if (!activePatientRecord) return null;
    switch (currentStep) {
        case 'REGISTRATION': return <RegistrationSection t={t} patientRecord={activePatientRecord} onNext={handleNextStep} />;
        case 'CONSULTATION': return <ConsultationSection t={t} appointments={appointments} onNext={handleNextStep} />;
        case 'DIAGNOSIS': return (
            <SectionWrapper title={t('diagnosis')} onNext={handleNextStep} nextLabel={t('proceedToTreatment')}>
                <div className="glass-panel p-8 rounded-3xl">
                    <h4 className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4">{t('diagnosisFromNotes')}</h4>
                    <p className="text-gray-700 leading-relaxed font-medium">{activePatientRecord.notes}</p>
                </div>
            </SectionWrapper>
        );
        case 'TREATMENT': return (
            <SectionWrapper title={t('treatmentPlan')} onNext={handleNextStep} nextLabel={t('proceedToMedication')}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 glass-panel rounded-2xl border-l-4 border-indigo-500">
                        <p className="font-bold text-gray-800">{t('treatmentItem1')}</p>
                    </div>
                    <div className="p-6 glass-panel rounded-2xl border-l-4 border-indigo-500">
                        <p className="font-bold text-gray-800">{t('treatmentItem2')}</p>
                    </div>
                </div>
            </SectionWrapper>
        );
        case 'MEDICATION': return <MedicationSection t={t} patientRecord={activePatientRecord} onMedicationPurchase={onMedicationPurchase} onNext={handleNextStep} />;
        case 'BILLING': return <BillingSection t={t} patientRecord={activePatientRecord} onPayment={onPayment} />;
        default: return null;
    }
  };

  if (!activePatientRecord) return null;

  return (
    <div className="container mx-auto max-w-6xl space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 glass-panel rounded-3xl p-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{t('welcome', { name: user.name.split(' ')[0] })}</h2>
          <p className="text-gray-500 font-medium mt-1">Manage your health journey with MediFlow AI oversight.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <SoundControl dashboardName="Patient Portal" variant="pill" />
          {patientRecords.length > 1 && (
              <div className="glass-panel p-2 rounded-2xl flex items-center gap-3 bg-white/70">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-3">Profile</span>
                  <select
                      value={activePatientRecord?.id}
                      onChange={(e) => onSelectPatient(e.target.value)}
                      className="bg-indigo-50 border-none text-indigo-700 text-sm font-bold rounded-xl p-2 focus:ring-0 cursor-pointer"
                  >
                      {patientRecords.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                  </select>
              </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-4">
            <div className="glass-panel rounded-3xl p-4 sticky top-24">
                <nav className="flex flex-col gap-2">
                    <button onClick={() => setActiveTab('journey')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'journey' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-white/50'}`}>
                        <SparklesIcon className="h-5 w-5" /> Health Journey
                    </button>
                    <button onClick={() => setActiveTab('lab_reports')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'lab_reports' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-white/50'}`}>
                        <MicroscopeIcon className="h-5 w-5" /> Clinical Reports
                    </button>
                    <button onClick={() => setActiveTab('complaints')} className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${activeTab === 'complaints' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-white/50'}`}>
                        <ComplaintIcon className="h-5 w-5" /> Care Support
                    </button>
                </nav>
            </div>
        </div>

        <div className="lg:col-span-3 space-y-8">
            {activeTab === 'journey' && (
                <div className="space-y-12">
                    <div className="glass-panel rounded-[2.5rem] p-8 overflow-x-auto">
                        <div className="flex justify-between items-center min-w-[600px]">
                            {journeySteps.map((step, idx) => {
                                const isCurrent = currentStep === step.key;
                                const isDone = completedSteps.has(step.key);
                                return (
                                    <div key={step.key} className="flex flex-col items-center gap-3 relative group">
                                        {idx !== 0 && (
                                            <div className={`absolute top-6 -left-full w-full h-[2px] ${isDone || isCurrent ? 'bg-indigo-600' : 'bg-gray-100'}`} />
                                        )}
                                        <div 
                                            onClick={() => idx <= journeySteps.findIndex(s => s.key === currentStep) && setCurrentStep(step.key)}
                                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 cursor-pointer ${isCurrent ? 'bg-indigo-600 text-white scale-110 shadow-xl ai-pulse' : isDone ? 'bg-green-100 text-green-600' : 'bg-gray-50 text-gray-300'}`}
                                        >
                                            {isDone ? <CheckCircleIcon className="h-6 w-6" /> : <step.icon className="h-6 w-6" />}
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isCurrent ? 'text-indigo-600' : 'text-gray-400'}`}>
                                            {t(step.labelKey)}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="min-h-[400px]">
                        {renderCurrentStepContent()}
                    </div>
                </div>
            )}
            
            {activeTab !== 'journey' && (
                <div className="glass-panel rounded-[3rem] p-12 text-center fade-slide-up">
                    <div className="inline-flex p-6 rounded-full bg-indigo-50 text-indigo-400 mb-6">
                        <SparklesIcon className="h-12 w-12 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800">Advanced AI Module Loading</h3>
                    <p className="text-gray-500 mt-2">MediFlow AI is synchronizing your live clinical record from our neural data network...</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
