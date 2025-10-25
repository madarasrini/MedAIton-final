import React, { useState, useMemo, FC } from 'react';
import { User, PatientRecord, Appointment, Prescription, DoctorSpecialty, UserRole, NotificationItem, ComplaintTicket, ComplaintStatus, LabTest, LabResult } from '../types';
import { BillingIcon, CheckCircleIcon, CreditCardIcon, PaypalIcon, CalendarIcon, UserIcon, DiagnosisIcon, TreatmentPlanIcon, MedicationIcon, SunIcon, SunsetIcon, MoonIcon, BriefcaseIcon, UsersIcon, ClipboardListIcon, SparklesIcon, BellIcon, XIcon, ComplaintIcon, MicroscopeIcon, FileTextIcon } from './Icons';
import { translations } from './translations';
import { MOCK_USERS } from '../users';
import { getSpecialtySuggestion, interpretLabResult } from '../services/geminiService';

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

const PaymentModal: React.FC<{
  amount: number;
  onClose: () => void;
  onConfirm: () => void;
  t: (key: string, params?: any) => string;
}> = ({ amount, onClose, onConfirm, t }) => {
    const [selectedMethod, setSelectedMethod] = useState('card');
    const [isPaying, setIsPaying] = useState(false);

    const handleConfirm = () => {
        setIsPaying(true);
        setTimeout(() => {
            onConfirm();
            onClose();
        }, 1500); 
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm space-y-6">
                <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900">{t('completePayment')}</h3>
                    <p className="text-3xl font-bold text-indigo-600">₹{amount.toFixed(2)}</p>
                </div>
                <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">{t('selectPaymentMethod')}</p>
                    <button onClick={() => setSelectedMethod('card')} className={`w-full flex items-center p-3 rounded-lg border-2 transition-all ${selectedMethod === 'card' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                        <CreditCardIcon className="h-6 w-6 text-blue-600 mr-4" />
                        <span className="font-semibold text-gray-800">{t('creditDebitCard')}</span>
                    </button>
                    <button onClick={() => setSelectedMethod('paypal')} className={`w-full flex items-center p-3 rounded-lg border-2 transition-all ${selectedMethod === 'paypal' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 bg-white'}`}>
                        <PaypalIcon className="h-6 w-6 text-blue-800 mr-4" />
                        <span className="font-semibold text-gray-800">{t('paypal')}</span>
                    </button>
                </div>
                <div className="flex flex-col space-y-3">
                    <button onClick={handleConfirm} disabled={isPaying} className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-green-300 transition-colors">
                        {isPaying ? t('processing') : t('payAmount', { amount: amount.toFixed(2) })}
                    </button>
                    <button onClick={onClose} disabled={isPaying} className="w-full py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors">
                        {t('cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
}

const PurchaseMedicationModal: React.FC<{
  prescription: Prescription;
  onClose: () => void;
  onConfirm: (quantity: number, costPerUnit: number) => void;
  t: (key: string, params?: any) => string;
}> = ({ prescription, onClose, onConfirm, t }) => {
    const remaining = prescription.prescribedQuantity - prescription.boughtQuantity;
    const [quantity, setQuantity] = useState(remaining);
    const [error, setError] = useState('');
    
    const COST_PER_UNIT = 15; // Example cost, can be dynamic later
    const totalCost = quantity * COST_PER_UNIT;

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      if (isNaN(value) || value <= 0 || value > remaining) {
        setError(t('invalidQuantity'));
        setQuantity(0);
      } else {
        setError('');
        setQuantity(value);
      }
    };
    
    const handleConfirm = () => {
      if (quantity > 0 && quantity <= remaining && !isNaN(quantity)) {
        onConfirm(quantity, COST_PER_UNIT);
        onClose();
      } else {
         setError(t('invalidQuantity'));
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
        <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900">{t('purchaseMedication')}</h3>
                <p className="font-bold text-lg text-indigo-600">{prescription.drug}</p>
            </div>
            <div className="space-y-3">
                <label htmlFor="quantity" className="text-sm font-medium text-gray-700 block">{t('quantityToBuy')}</label>
                <input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={handleQuantityChange}
                    max={remaining}
                    min="1"
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                 <div className="flex justify-between text-xs text-gray-500">
                    <span>{t('maxQuantity', { quantity: remaining })}</span>
                    {error && <span className="text-red-500 font-semibold">{error}</span>}
                 </div>
            </div>

             <div className="border-t pt-4 flex justify-between items-center">
                <p className="text-gray-600 font-medium">{t('costLabel')}</p>
                <p className="text-2xl font-bold text-gray-800">₹{totalCost.toFixed(2)}</p>
             </div>

            <div className="flex flex-col space-y-3">
                <button onClick={handleConfirm} disabled={!!error || quantity <= 0} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors">
                    {t('confirmPurchase')}
                </button>
                <button onClick={onClose} className="w-full py-2 text-gray-600 font-medium rounded-lg hover:bg-gray-100 transition-colors">
                    {t('cancel')}
                </button>
            </div>
        </div>
      </div>
    );
};


const PatientDashboard: React.FC<PatientDashboardProps> = ({ user, patientRecords, activePatientRecord, onSelectPatient, onPayment, onMedicationPurchase, onScheduleAppointment, appointments, language, notifications, onDismissNotification, complaintTickets, onAddComplaint, labTests }) => {
  const [currentStep, setCurrentStep] = useState<JourneyStepKey>('REGISTRATION');
  const [completedSteps, setCompletedSteps] = useState<Set<JourneyStepKey>>(new Set());
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [purchaseModalInfo, setPurchaseModalInfo] = useState<{ prescription: Prescription } | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('journey');

  const t = (key: string, params?: { [key: string]: string | number }) => {
    let text = translations[language]?.[key] || translations['en'][key];
    if (params) {
        Object.keys(params).forEach(pKey => {
            text = text.replace(`{${pKey}}`, String(params[pKey]));
        });
    }
    return text;
  };
  
  const journeySteps: { key: JourneyStepKey; labelKey: string; tooltipKey: string; icon: FC<{className?: string}> }[] = [
    { key: 'REGISTRATION', labelKey: 'registration', tooltipKey: 'tooltipRegistration', icon: UserIcon },
    { key: 'CONSULTATION', labelKey: 'consultation', tooltipKey: 'tooltipConsultation', icon: CalendarIcon },
    { key: 'DIAGNOSIS', labelKey: 'diagnosis', tooltipKey: 'tooltipDiagnosis', icon: DiagnosisIcon },
    { key: 'TREATMENT', labelKey: 'treatmentPlan', tooltipKey: 'tooltipTreatment', icon: TreatmentPlanIcon },
    { key: 'MEDICATION', labelKey: 'medication', tooltipKey: 'tooltipMedication', icon: MedicationIcon },
    { key: 'BILLING', labelKey: 'billingDischarge', tooltipKey: 'tooltipBilling', icon: BillingIcon },
  ];

  const currentStepIndex = journeySteps.findIndex(step => step.key === currentStep);
  
  const activePatientNotifications = useMemo(() => {
    if (!activePatientRecord) return [];
    return notifications.filter(n => n.patientId === activePatientRecord.id);
  }, [notifications, activePatientRecord]);

  const handleNextStep = () => {
    setCompletedSteps(prev => new Set(prev).add(currentStep));
    const nextStepIndex = currentStepIndex + 1;
    if (nextStepIndex < journeySteps.length) {
      setCurrentStep(journeySteps[nextStepIndex].key);
    }
  };

  const handleStepClick = (stepKey: JourneyStepKey) => {
    if (completedSteps.has(stepKey) || journeySteps[currentStepIndex - 1]?.key === stepKey) {
        setCurrentStep(stepKey);
    }
  };
  
  const handlePurchaseClick = (prescription: Prescription) => {
      setPurchaseModalInfo({ prescription });
  };
  
  const renderCurrentStepContent = () => {
    if (!activePatientRecord) return null;
    switch (currentStep) {
        case 'REGISTRATION':
            return <RegistrationSection t={t} patientRecord={activePatientRecord} onNext={handleNextStep} />;
        case 'CONSULTATION':
            return <ConsultationSection t={t} appointments={appointments} patientRecord={activePatientRecord} onScheduleAppointment={onScheduleAppointment} language={language} onNext={handleNextStep} />;
        case 'DIAGNOSIS':
            return <DiagnosisSection t={t} patientRecord={activePatientRecord} onNext={handleNextStep} />;
        case 'TREATMENT':
            return <TreatmentSection t={t} onNext={handleNextStep} />;
        case 'MEDICATION':
            return <MedicationSection t={t} patientRecord={activePatientRecord} onNext={handleNextStep} onPurchaseClick={handlePurchaseClick} />;
        case 'BILLING':
            return <BillingSection t={t} patientRecord={activePatientRecord} onPayment={onPayment} setShowPaymentModal={setShowPaymentModal} />;
        default:
            return <div>{t('invalidStep')}</div>;
    }
  };
  
  const patientLabTests = useMemo(() => {
      if (!activePatientRecord) return [];
      return labTests.filter(t => t.patientId === activePatientRecord.id);
  }, [labTests, activePatientRecord]);


  if (!activePatientRecord) {
    return (
        <div className="container mx-auto text-center py-20">
            <h2 className="text-2xl font-bold text-gray-700">No patient profile selected.</h2>
            <p className="text-gray-500">Please select a profile to view the dashboard.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8">
      {/* Notification Toasts */}
      <div aria-live="polite" aria-atomic="true" className="fixed top-20 right-4 w-full max-w-sm z-50 space-y-3">
        {activePatientNotifications.map(notification => (
          <div key={notification.id} className="bg-white rounded-xl shadow-lg p-4 flex items-start ring-1 ring-black ring-opacity-5 animate-fade-in">
            <div className="flex-shrink-0">
                <BellIcon className="h-6 w-6 text-indigo-500" />
            </div>
            <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-gray-900">Medication Reminder</p>
                <p className="mt-1 text-sm text-gray-600">
                    Time to take your {notification.timing} dose of <strong>{notification.drug}</strong>.
                </p>
            </div>
            <div className="ml-4 flex-shrink-0">
                <button
                    onClick={() => onDismissNotification(notification.id)}
                    className="inline-flex text-gray-400 hover:text-gray-500 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    <span className="sr-only">Close</span>
                    <XIcon className="h-5 w-5" />
                </button>
            </div>
          </div>
        ))}
      </div>

      {showPaymentModal && (
        <PaymentModal 
            amount={activePatientRecord.billing.reduce((acc, item) => acc + item.cost, 0)}
            onClose={() => setShowPaymentModal(false)}
            onConfirm={() => onPayment(activePatientRecord.id)}
            t={t}
        />
      )}
      {purchaseModalInfo && (
        <PurchaseMedicationModal
            prescription={purchaseModalInfo.prescription}
            onClose={() => setPurchaseModalInfo(null)}
            onConfirm={(quantity, costPerUnit) => {
                onMedicationPurchase(activePatientRecord.id, purchaseModalInfo.prescription.drug, quantity, costPerUnit);
            }}
            t={t}
        />
       )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-3xl font-bold text-gray-800">{t('welcome', { name: user.name })}</h2>
        {patientRecords.length > 1 && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg shadow-sm border">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <label htmlFor="patient-selector" className="text-sm font-medium text-gray-700 whitespace-nowrap">Viewing profile:</label>
                <select
                    id="patient-selector"
                    value={activePatientRecord?.id || ''}
                    onChange={(e) => onSelectPatient(e.target.value)}
                    className="bg-gray-50 border-gray-300 text-gray-900 text-sm font-semibold rounded-md focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-auto p-2"
                >
                    {patientRecords.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.id === user.recordIds?.[0] ? 'Primary' : 'Dependent'})</option>
                    ))}
                </select>
            </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-2 sm:p-4">
        <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                    onClick={() => setActiveTab('journey')}
                    className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'journey'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    {t('yourJourney')}
                </button>
                <button
                    onClick={() => setActiveTab('lab_reports')}
                    className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'lab_reports'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <MicroscopeIcon className="h-5 w-5 mr-2" /> Lab Reports
                </button>
                <button
                    onClick={() => setActiveTab('complaints')}
                    className={`flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'complaints'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <ComplaintIcon className="h-5 w-5 mr-2" /> {t('supportTickets')}
                </button>
            </nav>
        </div>
        <div className="pt-6">
            {activeTab === 'journey' && (
                <div className="animate-fade-in">
                    {/* Interactive Stepper */}
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">{t('yourJourney')} for <span className="text-indigo-600">{activePatientRecord.name}</span></h3>
                        <div className="flex justify-between items-start">
                            {journeySteps.map((step, index) => {
                                const isCompleted = completedSteps.has(step.key);
                                const isCurrent = currentStep === step.key;
                                
                                let status: 'complete' | 'current' | 'upcoming' = 'upcoming';
                                if(isCompleted) status = 'complete';
                                if(isCurrent) status = 'current';
                                const isUpcoming = !isCompleted && !isCurrent;

                                const styles = {
                                    complete: { circle: 'bg-green-500 text-white', text: 'text-gray-600', line: 'bg-green-500' },
                                    current: { circle: 'bg-indigo-600 text-white animate-pulse', text: 'text-indigo-600 font-bold', line: 'bg-gray-200' },
                                    upcoming: { circle: 'bg-gray-200 text-gray-500', text: 'text-gray-500', line: 'bg-gray-200' }
                                }[status];
                                
                                return (
                                    <div key={step.key} className="flex-1 flex flex-col items-center relative group">
                                        <div className="relative">
                                          <button
                                            onClick={() => handleStepClick(step.key)}
                                            disabled={isUpcoming}
                                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg z-10 transition-transform duration-200 ${styles.circle} ${!isUpcoming ? 'cursor-pointer transform hover:scale-110' : 'cursor-default'}`}
                                            aria-label={t(step.labelKey)}
                                          >
                                            {isCompleted ? <CheckCircleIcon className="w-6 h-6"/> : <step.icon className="w-6 h-6"/>}
                                          </button>
                                          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20">
                                            {t(step.tooltipKey)}
                                          </div>
                                        </div>
                                        <p className={`mt-2 text-xs sm:text-sm text-center ${styles.text}`}>{t(step.labelKey)}</p>
                                        {index > 0 && <div className={`absolute top-6 left-0 w-1/2 h-1.5 ${completedSteps.has(journeySteps[index-1].key) ? 'bg-green-500' : 'bg-gray-200'}`} />}
                                        {index < journeySteps.length - 1 && <div className={`absolute top-6 right-0 w-1/2 h-1.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Current Step Content */}
                    <div className="bg-white rounded-xl pt-6 animate-fade-in">
                        {renderCurrentStepContent()}
                    </div>
                </div>
            )}
            {activeTab === 'lab_reports' && (
                <LabReportsSection
                    t={t}
                    labTests={patientLabTests}
                />
            )}
            {activeTab === 'complaints' && (
                <SupportTicketsSection 
                    t={t}
                    patient={activePatientRecord}
                    tickets={complaintTickets}
                    onAddComplaint={onAddComplaint}
                />
            )}
        </div>
      </div>
    </div>
  );
};

const SectionWrapper: FC<{title: string, onNext?: () => void, nextLabel?: string, children: React.ReactNode, nextDisabled?: boolean}> = ({ title, onNext, nextLabel, children, nextDisabled=false }) => (
    <div className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-800 border-b pb-3">{title}</h3>
        <div>{children}</div>
        {onNext && nextLabel && (
            <div className="flex justify-end pt-4 border-t">
                <button onClick={onNext} disabled={nextDisabled} className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors">
                    {nextLabel} &rarr;
                </button>
            </div>
        )}
    </div>
);

const RegistrationSection: FC<{t: Function, patientRecord: PatientRecord, onNext: () => void}> = ({ t, patientRecord, onNext }) => (
    <SectionWrapper title={t('confirmDetails')} onNext={onNext} nextLabel={t('proceedToConsultation')}>
      <p className="mb-4 text-gray-600">{t('confirmDetailsDescription')}</p>
      {patientRecord ? (
        <div className="space-y-4 p-4 bg-slate-50 rounded-lg border">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><strong className="text-gray-500">{t('nameLabel')}</strong><p className="text-gray-800">{patientRecord.name}</p></div>
            <div><strong className="text-gray-500">{t('ageLabel')}</strong><p className="text-gray-800">{patientRecord.age}</p></div>
            <div><strong className="text-gray-500">{t('genderLabel')}</strong><p className="text-gray-800">{patientRecord.gender}</p></div>
            <div><strong className="text-gray-500">{t('patientIdLabel')}</strong><p className="text-gray-800">{patientRecord.id}</p></div>
            {patientRecord.email && (
                <div className="sm:col-span-2"><strong className="text-gray-500">{t('emailLabel')}</strong><p className="text-gray-800">{patientRecord.email}</p></div>
            )}
          </div>
          <div className="pt-4 border-t"><strong className="text-gray-500">{t('chiefComplaintLabel')}</strong><p className="text-gray-800 mt-1">{patientRecord.chiefComplaint}</p></div>
        </div>
      ) : <p>{t('noPatientData')}</p>}
    </SectionWrapper>
);

const ConsultationSection: FC<{t: Function, appointments: Appointment[], patientRecord: PatientRecord, onScheduleAppointment: Function, language: string, onNext: () => void}> = ({ t, appointments, patientRecord, onScheduleAppointment, language, onNext }) => {
    const [showScheduler, setShowScheduler] = useState(false);
    const [bookingStatus, setBookingStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [selectedSpecialty, setSelectedSpecialty] = useState<DoctorSpecialty | ''>('');
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [appointmentTime, setAppointmentTime] = useState('');
    const [appointmentReason, setAppointmentReason] = useState('');
    const [isSuggestingSpecialty, setIsSuggestingSpecialty] = useState(false);

    const doctors = useMemo(() => MOCK_USERS.filter(u => u.role === UserRole.Doctor), []);

    const filteredDoctors = useMemo(() => {
        if (!selectedSpecialty) return [];
        return doctors.filter(doc => doc.specialty === selectedSpecialty);
    }, [selectedSpecialty, doctors]);

    const patientAppointments = useMemo(() => {
        if (!patientRecord) return [];
        return appointments.filter(a => a.patientId === patientRecord.id && a.status === 'Scheduled').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [appointments, patientRecord]);
    
    const handleOpenScheduler = async () => {
        if (!patientRecord) return;
        setIsSuggestingSpecialty(true);
        setShowScheduler(true);
        const suggestedSpecialty = await getSpecialtySuggestion(patientRecord.chiefComplaint);
        if (suggestedSpecialty) {
            setSelectedSpecialty(suggestedSpecialty);
        }
        setIsSuggestingSpecialty(false);
    };
    
    const handleBookAppointment = () => {
        const doctor = doctors.find(d => d.id === selectedDoctorId);
        if (!patientRecord || !doctor || !appointmentDate || !appointmentTime || !appointmentReason) {
            alert(t('fillAllFields'));
            return;
        }

        const success = onScheduleAppointment({
            patientId: patientRecord.id,
            doctorId: doctor.id,
            doctorName: doctor.name,
            specialty: doctor.specialty as DoctorSpecialty,
            date: appointmentDate,
            time: appointmentTime,
            reason: appointmentReason,
        });

        if (success) {
            setBookingStatus('success');
            setSelectedSpecialty('');
            setSelectedDoctorId('');
            setAppointmentDate('');
            setAppointmentTime('');
            setAppointmentReason('');
            setShowScheduler(false);
            setTimeout(() => setBookingStatus('idle'), 3000);
        } else {
            setBookingStatus('error');
            setTimeout(() => setBookingStatus('idle'), 3000);
        }
    };

    return (
        <SectionWrapper title={t('consultation')} onNext={onNext} nextLabel={t('proceedToDiagnosis')}>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('yourUpcomingAppointments')}</h4>
            {patientAppointments.length > 0 ? (
                <ul className="space-y-4">
                    {patientAppointments.map(appt => (
                        <li key={appt.id} className="p-4 bg-slate-50 border-l-4 border-indigo-400 rounded-r-lg">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-gray-800">{new Date(appt.date).toLocaleDateString(language, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    <p className="text-sm text-gray-600">at {appt.time}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-800">{appt.doctorName}</p>
                                    <p className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full mt-1">{appt.specialty}</p>
                                </div>
                            </div>
                            <p className="text-sm text-gray-700 mt-3 pt-3 border-t"><strong>{t('reason')}</strong> {appt.reason}</p>
                        </li>
                    ))}
                </ul>
            ) : <p className="text-gray-500 text-center py-4">{t('noUpcomingAppointments')}</p>}
            
            <div className="mt-6 border-t pt-6">
                 <h4 className="text-lg font-semibold text-gray-800 mb-3">{t('bookAppointment')}</h4>
                 {bookingStatus === 'success' && (
                  <div className="my-4 p-3 bg-green-100 text-green-800 rounded-lg flex items-center text-sm animate-fade-in">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    {t('appointmentSuccess')}
                  </div>
                )}
                 {!showScheduler ? (
                    <button onClick={handleOpenScheduler} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2" />
                        {t('bookNewAppointment')}
                    </button>
                 ) : (
                    <div className="p-4 border rounded-lg space-y-4 animate-fade-in">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">{t('selectSpecialty')}</label>
                            {isSuggestingSpecialty ? (
                                <div className="mt-1 flex items-center text-sm text-gray-500">
                                    <SparklesIcon className="h-4 w-4 mr-2 animate-pulse text-indigo-500" />
                                    AI is suggesting a specialty based on your complaint...
                                </div>
                            ) : (
                                <select value={selectedSpecialty} onChange={e => { setSelectedSpecialty(e.target.value as DoctorSpecialty); setSelectedDoctorId(''); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                                    <option value="">-- {t('selectSpecialty')} --</option>
                                    {Object.values(DoctorSpecialty).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            )}
                        </div>

                        {selectedSpecialty && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-700 mb-2">{t('selectDoctor')}</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {filteredDoctors.map(d => (
                                        <div key={d.id}>
                                            <input type="radio" name="doctorSelection" value={d.id} checked={selectedDoctorId === d.id} onChange={e => setSelectedDoctorId(e.target.value)} className="sr-only peer" id={`doc-${d.id}`} />
                                            <label htmlFor={`doc-${d.id}`} className="block p-4 border-2 rounded-xl cursor-pointer transition-all bg-white border-gray-200 peer-checked:border-indigo-500 peer-checked:ring-2 peer-checked:ring-indigo-300 hover:border-gray-400 peer-checked:shadow-lg">
                                                <div className="flex items-start space-x-4">
                                                    <img src={d.profilePhotoUrl} alt={d.name} className="w-20 h-20 rounded-full object-cover shadow-md border-2 border-slate-100" />
                                                    <div className="flex-1">
                                                        <p className="font-bold text-lg text-gray-900">{d.name}</p>
                                                        <p className="text-xs px-2 py-0.5 mt-1 inline-block bg-indigo-100 text-indigo-700 rounded-full font-semibold">{d.specialty}</p>
                                                        <div className="flex items-center text-xs text-gray-500 mt-2">
                                                           <BriefcaseIcon className="h-4 w-4 mr-1.5" />
                                                           <span>{d.experienceYears} years of experience</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2 text-center">
                                                    <div>
                                                        <UsersIcon className="h-5 w-5 mx-auto text-gray-500" />
                                                        <p className="font-bold text-sm text-gray-800 mt-1">{d.patientsTreated}+</p>
                                                        <p className="text-xs text-gray-500">Treated</p>
                                                    </div>
                                                    <div>
                                                        <CheckCircleIcon className="h-5 w-5 mx-auto text-green-500" />
                                                        <p className="font-bold text-sm text-gray-800 mt-1">{d.patientsCured}+</p>
                                                        <p className="text-xs text-gray-500">Cured</p>
                                                    </div>
                                                    <div>
                                                        <ClipboardListIcon className="h-5 w-5 mx-auto text-gray-500" />
                                                        <p className="font-bold text-sm text-gray-800 mt-1">{d.patientsUndergoingTreatment}</p>
                                                        <p className="text-xs text-gray-500">Ongoing</p>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <fieldset disabled={!selectedDoctorId} className="space-y-4 disabled:opacity-50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('date')}</label>
                                    <input type="date" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">{t('time')}</label>
                                    <input type="time" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">{t('reasonForVisit')}</label>
                                <textarea value={appointmentReason} onChange={e => setAppointmentReason(e.target.value)} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder={t('reasonPlaceholder')}></textarea>
                            </div>
                        </fieldset>

                        <div className="flex items-center justify-end space-x-3">
                            <button onClick={() => setShowScheduler(false)} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300">{t('cancel')}</button>
                            <button onClick={handleBookAppointment} disabled={!selectedDoctorId || !appointmentDate || !appointmentTime} className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 disabled:bg-green-300">{t('confirmBooking')}</button>
                        </div>
                    </div>
                 )}
            </div>
        </SectionWrapper>
    );
};

const DiagnosisSection: FC<{t: Function, patientRecord: PatientRecord, onNext: () => void}> = ({ t, patientRecord, onNext }) => (
    <SectionWrapper title={t('diagnosis')} onNext={onNext} nextLabel={t('proceedToTreatment')}>
        <p className="text-gray-600 mb-4">{t('diagnosisDescription')}</p>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-bold text-blue-800">{t('diagnosisFromNotes')}</h4>
            <p className="text-gray-800 mt-2">{patientRecord?.notes}</p>
        </div>
    </SectionWrapper>
);

const TreatmentSection: FC<any> = ({ t, onNext }) => (
    <SectionWrapper title={t('treatmentPlan')} onNext={onNext} nextLabel={t('proceedToMedication')}>
        <p className="text-gray-600 mb-4">{t('treatmentDescription')}</p>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-2">
            <h4 className="font-bold text-green-800">{t('recommendedPlan')}</h4>
            <ul className="list-disc list-inside text-gray-700">
                <li>{t('treatmentItem1')}</li>
                <li>{t('treatmentItem2')}</li>
                <li>{t('treatmentItem3')}</li>
            </ul>
        </div>
    </SectionWrapper>
);

const MedicationSection: FC<{t: Function, patientRecord: PatientRecord, onNext: () => void, onPurchaseClick: (p: Prescription) => void}> = ({ t, patientRecord, onNext, onPurchaseClick }) => {
    const prescriptions = patientRecord?.prescriptions || [];

    return (
        <SectionWrapper title={t('medication')} onNext={onNext} nextLabel={t('proceedToBilling')}>
            <p className="text-gray-600 mb-4">{t('medicationDescription')}</p>
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <h4 className="font-bold text-purple-800">{t('medicationHistory')}</h4>
                {prescriptions.length > 0 ? (
                    <div className="mt-2 space-y-3">
                        {prescriptions.map((med, index) => {
                             const percentage = med.prescribedQuantity > 0 ? (med.boughtQuantity / med.prescribedQuantity) * 100 : 0;
                             const isFullyBought = med.boughtQuantity >= med.prescribedQuantity;
                            return (
                                <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <p className="font-bold text-lg text-gray-800">{med.drug}</p>
                                            <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
                                        </div>
                                        {isFullyBought ? (
                                             <span className="flex-shrink-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                 <CheckCircleIcon className="w-4 h-4 mr-1.5"/>
                                                 {t('fullyPurchased')}
                                             </span>
                                         ) : (
                                             <button onClick={() => onPurchaseClick(med)} className="flex-shrink-0 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                                                 {med.boughtQuantity > 0 ? t('purchaseRemaining') : t('purchaseFullAmount')}
                                             </button>
                                         )}
                                    </div>
                                    {med.notes && <p className="text-xs text-gray-500 mt-2 italic">Notes: {med.notes}</p>}
                                    
                                     {med.timing && med.timing.length > 0 && (
                                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                                            <p className="text-xs font-semibold text-gray-500">{t('intakeTimes')}:</p>
                                            <div className="flex items-center gap-2">
                                                {med.timing.includes('Morning') && <div title={t('morning')}><SunIcon className="w-5 h-5 text-yellow-500" /></div>}
                                                {med.timing.includes('Afternoon') && <div title={t('afternoon')}><SunIcon className="w-5 h-5 text-orange-500" /></div>}
                                                {med.timing.includes('Evening') && <div title={t('evening')}><SunsetIcon className="w-5 h-5 text-purple-500" /></div>}
                                                {med.timing.includes('Night') && <div title={t('night')}><MoonIcon className="w-5 h-5 text-blue-500" /></div>}
                                            </div>
                                        </div>
                                     )}

                                    <div className="mt-3">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-gray-700">{t('purchaseStatus')}</span>
                                            <span className="text-sm font-semibold text-gray-800">{med.boughtQuantity} / {med.prescribedQuantity} {t('units')}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <p className="mt-4 text-center text-gray-500">{t('noPrescriptions')}</p>
                )}
            </div>
        </SectionWrapper>
    );
};

const BillingSection: FC<{t: Function, patientRecord: PatientRecord, onPayment: Function, setShowPaymentModal: Function}> = ({ t, patientRecord, onPayment, setShowPaymentModal }) => {
    const totalBill = patientRecord?.billing.reduce((acc, item) => acc + item.cost, 0) ?? 0;
    return (
        <SectionWrapper title={t('billingSummary')}>
             {patientRecord ? (
                    <div className="space-y-3">
                        <div className="space-y-2 text-sm text-gray-600 max-h-80 overflow-y-auto pr-2">
                           {patientRecord.billing.map(item => (
                               <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                                   <div>
                                       <p className="font-medium text-gray-800">{item.description}</p>
                                       <p className="text-xs text-gray-500">{item.category}</p>
                                   </div>
                                   <p className="font-semibold text-gray-800">₹{item.cost.toFixed(2)}</p>
                               </div>
                           ))}
                        </div>
                        <div className="border-t-2 border-dashed pt-3 mt-3 flex justify-between items-center">
                            <p className="text-lg font-bold text-gray-800">{t('total')}</p>
                            <p className="text-xl font-bold text-indigo-600">₹{totalBill.toFixed(2)}</p>
                        </div>
                        {patientRecord.paymentStatus === 'Unpaid' ? (
                            <button onClick={() => setShowPaymentModal(true)} className="w-full mt-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors">
                                {t('payNow')}
                            </button>
                        ) : (
                            <div className="w-full mt-4 py-3 bg-green-100 text-green-800 font-bold rounded-lg flex items-center justify-center">
                                <CheckCircleIcon className="h-6 w-6 mr-2"/>
                                {t('paidInFull')}
                            </div>
                        )}
                    </div>
                ) : (
                     <p className="text-gray-500">{t('noBillingInfo')}</p>
                )}
        </SectionWrapper>
    );
};

const LabReportsSection: FC<{ t: Function, labTests: LabTest[] }> = ({ t, labTests }) => {
    const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
    const [interpretation, setInterpretation] = useState('');
    const [isInterpreting, setIsInterpreting] = useState(false);
    
    const completedTests = useMemo(() => {
        return labTests.filter(t => t.status === 'Completed').sort((a,b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
    }, [labTests]);
    
    const handleInterpret = async () => {
        if (!selectedTest || !selectedTest.results) return;
        setIsInterpreting(true);
        setInterpretation('');
        const result = await interpretLabResult(selectedTest.testName, selectedTest.results);
        setInterpretation(result);
        setIsInterpreting(false);
    }
    
    return (
        <div className="animate-fade-in space-y-8">
            <h3 className="text-2xl font-bold text-gray-800">Your Lab Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 h-[60vh] overflow-y-auto pr-2">
                    {completedTests.map(test => (
                        <button key={test.id} onClick={() => { setSelectedTest(test); setInterpretation('');}} className={`w-full text-left p-3 mb-2 rounded-lg border ${selectedTest?.id === test.id ? 'bg-indigo-50 border-indigo-300' : 'bg-white hover:bg-gray-50'}`}>
                           <div className="flex items-start justify-between">
                                <p className="font-semibold text-gray-800">{test.testName}</p>
                                <FileTextIcon className="h-5 w-5 text-gray-400" />
                           </div>
                           <p className="text-xs text-gray-500 mt-1">Completed: {new Date(test.completedAt!).toLocaleDateString()}</p>
                        </button>
                    ))}
                    {completedTests.length === 0 && <p className="text-gray-500">No completed lab reports found.</p>}
                </div>
                <div className="md:col-span-2">
                    {selectedTest ? (
                        <div className="p-4 bg-slate-50 rounded-lg border space-y-4">
                            <h4 className="text-lg font-bold text-gray-800">{selectedTest.testName}</h4>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-200">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Parameter</th>
                                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Result</th>
                                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Reference Range</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedTest.results?.map(res => (
                                            <tr key={res.parameter} className={`border-b ${res.isAbnormal ? 'bg-red-50' : ''}`}>
                                                <td className="px-4 py-2 text-gray-800">{res.parameter}</td>
                                                <td className={`px-4 py-2 font-semibold ${res.isAbnormal ? 'text-red-600' : 'text-gray-900'}`}>{res.value}</td>
                                                <td className="px-4 py-2 text-gray-800">{res.referenceRange}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="pt-4 border-t">
                                <button onClick={handleInterpret} disabled={isInterpreting} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
                                    <SparklesIcon className="h-5 w-5 mr-2" />
                                    {isInterpreting ? 'Interpreting...' : 'Help Me Understand This'}
                                </button>
                                {isInterpreting && <div className="mt-2 text-sm text-gray-600">Generating a simplified explanation...</div>}
                                {interpretation && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg whitespace-pre-wrap text-sm text-gray-700">
                                        <h5 className="font-bold text-blue-800 mb-2">AI Interpretation:</h5>
                                        {interpretation}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : <p className="text-gray-600">Select a report to view details.</p>}
                </div>
            </div>
        </div>
    );
};

const SupportTicketsSection: FC<{t: Function, patient: PatientRecord, tickets: ComplaintTicket[], onAddComplaint: PatientDashboardProps['onAddComplaint']}> = ({ t, patient, tickets, onAddComplaint }) => {
    const [complaintText, setComplaintText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const getStatusStyles = (status: ComplaintStatus) => {
        switch (status) {
            case ComplaintStatus.OPEN: return 'bg-blue-100 text-blue-800';
            case ComplaintStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800';
            case ComplaintStatus.RESOLVED: return 'bg-green-100 text-green-800';
            case ComplaintStatus.CLOSED: return 'bg-gray-100 text-gray-800';
            case ComplaintStatus.ESCALATED: return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!complaintText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        await onAddComplaint(patient, complaintText);
        setComplaintText('');
        setIsSubmitting(false);
    };
    
    const sortedTickets = useMemo(() => {
        return [...tickets].sort((a,b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }, [tickets]);
    
    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{t('submitComplaint')}</h3>
                <p className="text-sm text-gray-600 mb-4">{t('complaintDescription')}</p>
                <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-lg border">
                    <textarea 
                        value={complaintText}
                        onChange={(e) => setComplaintText(e.target.value)}
                        placeholder={t('complaintPlaceholder')}
                        className="w-full h-28 p-3 border rounded-md focus:ring-2 focus:ring-indigo-500"
                        disabled={isSubmitting}
                        aria-label={t('complaintPlaceholder')}
                    />
                    <div className="flex justify-end mt-3">
                        <button type="submit" disabled={isSubmitting || !complaintText.trim()} className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors">
                            {isSubmitting ? t('submitting') : t('submit')}
                        </button>
                    </div>
                </form>
            </div>
            <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">{t('myTickets')}</h3>
                <div className="space-y-4">
                    {sortedTickets.length > 0 ? (
                        sortedTickets.map(ticket => (
                            <div key={ticket.id} className="bg-white p-4 rounded-lg border shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-gray-500">{t('ticketId')}: {ticket.id}</p>
                                        <p className="text-sm text-gray-500">{t('submittedOn')}: {new Date(ticket.submittedAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusStyles(ticket.status)}`}>{ticket.status}</span>
                                </div>
                                <p className="mt-3 pt-3 border-t text-gray-800">{ticket.complaintText}</p>
                                {ticket.resolutionNotes && (
                                    <div className="mt-3 pt-3 border-t bg-green-50 p-3 rounded-md">
                                        <p className="font-semibold text-sm text-green-800">{t('resolutionNotes')}</p>
                                        <p className="text-sm text-gray-700 mt-1">{ticket.resolutionNotes}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-center py-8 text-gray-500">{t('noTickets')}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientDashboard;