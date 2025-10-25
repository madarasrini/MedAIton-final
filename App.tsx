
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, PatientRecord, QueueItem, TriagePriority, Bed, BedStatus, Appointment, AppointmentStatus, BillingItem, CaseSheet, MortuaryRecord, MortuaryStatus, ChainOfCustodyEntry, NotificationItem, MedicationTiming, ComplaintTicket, ComplaintStatus, PharmacyInventoryItem, ADRReport, LabTest, LabTestStatus } from './types';
import LoginScreen from './components/LoginScreen';
import PatientDashboard from './components/PatientDashboard';
// Fix: Changed to a named import for DoctorDashboard to resolve the module export error.
import { DoctorDashboard } from './components/DoctorDashboard';
import NurseDashboard from './components/NurseDashboard';
import AdminDashboard from './components/AdminDashboard';
import EngineeringDashboard from './components/EngineeringDashboard';
import PharmacyDashboard from './components/PharmacyDashboard';
import LabDashboard from './components/LabDashboard';
import Header from './components/Header';
import NotificationHelpModal from './components/NotificationHelpModal';
import { MOCK_PATIENTS, MOCK_BEDS, MOCK_APPOINTMENTS, MOCK_ER_QUEUE, MOCK_MORTUARY_RECORDS, MOCK_COMPLAINTS, MOCK_PHARMACY_INVENTORY, MOCK_ADR_REPORTS, MOCK_LAB_TESTS } from './constants';
import { analyzeComplaint } from './services/geminiService';
import { MOCK_USERS } from './users';

const areVitalsAbnormal = (vitals: Partial<PatientRecord['vitals']>): boolean => {
    if (vitals.oxygenSaturation && vitals.oxygenSaturation < 90) return true;
    if (vitals.heartRate && (vitals.heartRate < 50 || vitals.heartRate > 130)) return true;
    const bp = vitals.bloodPressure?.split('/');
    if (bp && (parseInt(bp[0]) > 180 || parseInt(bp[0]) < 90)) return true;
    return false;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientRecord[]>(MOCK_PATIENTS);
  const [beds, setBeds] = useState<Bed[]>(MOCK_BEDS);
  const [erQueue, setErQueue] = useState<QueueItem[]>(() => {
    const priorityOrder = { [TriagePriority.CRITICAL]: 0, [TriagePriority.URGENT]: 1, [TriagePriority.NON_URGENT]: 2 };
    return [...MOCK_ER_QUEUE].sort((a, b) => priorityOrder[a.result.priority] - priorityOrder[b.result.priority]);
  });
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [mortuaryRecords, setMortuaryRecords] = useState<MortuaryRecord[]>(MOCK_MORTUARY_RECORDS);
  const [complaintTickets, setComplaintTickets] = useState<ComplaintTicket[]>(MOCK_COMPLAINTS);
  const [pharmacyInventory, setPharmacyInventory] = useState<PharmacyInventoryItem[]>(MOCK_PHARMACY_INVENTORY);
  const [adrReports, setAdrReports] = useState<ADRReport[]>(MOCK_ADR_REPORTS);
  const [labTests, setLabTests] = useState<LabTest[]>(MOCK_LAB_TESTS);
  const [language, setLanguage] = useState('en');
  const speechIntervalRef = useRef<number | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [showNotificationHelp, setShowNotificationHelp] = useState(false);
  const timeOfDayIndex = useRef(0);


  useEffect(() => {
    const savedUser = localStorage.getItem('loggedInUser');
    if (savedUser) {
      try {
        const userFromFile = JSON.parse(savedUser) as User;
        setUser(userFromFile);
        if (userFromFile.role === UserRole.Patient && userFromFile.recordIds?.length) {
            setActivePatientId(userFromFile.recordIds[0]);
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('loggedInUser');
      }
    }
  }, []);
  
  // Check Desktop Notification Permission status on Load and when tab becomes visible
  useEffect(() => {
    const checkNotificationPermission = () => {
      if ('Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    };

    checkNotificationPermission();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkNotificationPermission();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Medication Notification Simulation Effect
  useEffect(() => {
    const notificationInterval = setInterval(() => {
        const timesOfDay: MedicationTiming[] = ['Morning', 'Afternoon', 'Evening', 'Night'];
        const currentTimeOfDay = timesOfDay[timeOfDayIndex.current];
        
        let newNotifications: NotificationItem[] = [];

        patients.forEach(patient => {
            if (patient.email && patient.prescriptions) {
                patient.prescriptions.forEach(prescription => {
                    if (prescription.timing?.includes(currentTimeOfDay) && prescription.boughtQuantity < prescription.prescribedQuantity) {
                         const exists = notifications.some(n => 
                            n.patientId === patient.id && 
                            n.drug === prescription.drug &&
                            n.timing === currentTimeOfDay
                        );
                        if (!exists) {
                            newNotifications.push({
                                id: Date.now() + Math.random(),
                                patientId: patient.id,
                                drug: prescription.drug,
                                timing: currentTimeOfDay,
                            });
                        }
                    }
                });
            }
        });

        if (Notification.permission === 'granted' && newNotifications.length > 0) {
            newNotifications.forEach(notification => {
                const patient = patients.find(p => p.id === notification.patientId);
                const title = `Medication Reminder for ${patient ? patient.name : 'Patient'}`;
                const body = `Time to take your ${notification.timing} dose of ${notification.drug}.`;
                new Notification(title, { body, icon: '/vite.svg' });
            });
        }
        
        if (newNotifications.length > 0) {
            setNotifications(currentNotifications => [...currentNotifications, ...newNotifications]);
        }

        timeOfDayIndex.current = (timeOfDayIndex.current + 1) % timesOfDay.length;

    }, 15000);

    return () => clearInterval(notificationInterval);
  }, [patients, notifications]);

  // Vitals Alarm Simulation and Voice Synthesis
  useEffect(() => {
    const simulationInterval = setInterval(() => {
        setErQueue(prevQueue => {
            if (prevQueue.length === 0 || Math.random() > 0.1) {
                return prevQueue;
            }

            const patientIndex = Math.floor(Math.random() * prevQueue.length);
            const patientToAlert = prevQueue[patientIndex];

            if (patientToAlert.isAlarming) {
                return prevQueue;
            }

            const newVitals: Partial<PatientRecord['vitals']> = { 
                ...patientToAlert.vitals,
                oxygenSaturation: 88,
                heartRate: 135
            };

            return prevQueue.map((p, index) => 
                index === patientIndex ? { ...p, vitals: newVitals, isAlarming: true } : p
            );
        });
    }, 15000);

    const alarmingPatient = erQueue.find(p => p.isAlarming);

    if (alarmingPatient && speechIntervalRef.current === null) {
      const utterance = new SpeechSynthesisUtterance(
        `Alert! Critical vitals in ER Bay ${alarmingPatient.bayNumber}. Attention needed in ER Bay ${alarmingPatient.bayNumber}.`
      );
      utterance.rate = 1.1;
      utterance.pitch = 1.2;

      const speak = () => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
        }
        window.speechSynthesis.speak(utterance);
      };
      
      speak();
      speechIntervalRef.current = window.setInterval(speak, 6000);

    } else if (!alarmingPatient && speechIntervalRef.current !== null) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
      window.speechSynthesis.cancel();
    }

    return () => {
        clearInterval(simulationInterval);
        if (speechIntervalRef.current) {
            clearInterval(speechIntervalRef.current);
        }
        window.speechSynthesis.cancel();
    };
}, [erQueue]);


  const handleLogin = (loggedInUser: User, rememberMe: boolean) => {
    setUser(loggedInUser);
    if (loggedInUser.role === UserRole.Patient && loggedInUser.recordIds?.length) {
        setActivePatientId(loggedInUser.recordIds[0]);
    }
    if (rememberMe) {
      localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActivePatientId(null);
    localStorage.removeItem('loggedInUser');
  };
  
  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
  };
  
  const handlePatientPayment = (patientId: string) => {
    setPatients(prevPatients =>
      prevPatients.map(p =>
        p.id === patientId ? { ...p, paymentStatus: 'Paid' } : p
      )
    );
  };
  
  const handleDispenseMedication = (patientId: string, drug: string, quantity: number, costPerUnit: number) => {
      setPatients(prevPatients =>
        prevPatients.map(p => {
          if (p.id === patientId) {
            const updatedPrescriptions = p.prescriptions?.map(prescription =>
              prescription.drug === drug
                ? { ...prescription, boughtQuantity: prescription.boughtQuantity + quantity }
                : prescription
            );
            const newBillingItem: BillingItem = {
              id: `bill-${Date.now()}`,
              description: `${drug} (x${quantity})`,
              category: 'Pharmacy',
              cost: quantity * costPerUnit,
            };
            const updatedBilling = [...p.billing, newBillingItem];
    
            return { ...p, prescriptions: updatedPrescriptions, billing: updatedBilling };
          }
          return p;
        })
      );
      setPharmacyInventory(prevInv => 
        prevInv.map(item => 
          item.drugName === drug
            ? { ...item, stockQuantity: item.stockQuantity - quantity }
            : item
        )
      );
  };

  const handleRestockInventory = (drugId: string, quantity: number) => {
    setPharmacyInventory(prevInv =>
      prevInv.map(item =>
        item.id === drugId
          ? { ...item, stockQuantity: item.stockQuantity + quantity }
          : item
      )
    );
  };

  const handleAddToQueue = (item: QueueItem) => {
    setErQueue(prev => [...prev, item].sort((a, b) => {
        const priorityOrder = { [TriagePriority.CRITICAL]: 0, [TriagePriority.URGENT]: 1, [TriagePriority.NON_URGENT]: 2 };
        return priorityOrder[a.result.priority] - priorityOrder[b.result.priority];
    }));
  };

  const handleAdmitPatientFromQueue = (queueItemId: number): boolean => {
      const availableBed = beds.find(b => b.status === BedStatus.Available);
      if (!availableBed) {
          return false;
      }

      setBeds(prevBeds => prevBeds.map(bed =>
          bed.id === availableBed.id
          ? { ...bed, status: BedStatus.Occupied, patientId: `ER-${queueItemId}` }
          : bed
      ));

      setErQueue(prev => prev.filter(p => p.id !== queueItemId));
      return true;
  };
  
  const handleUpdateQueueVitals = (queueItemId: number, newVitals: Partial<PatientRecord['vitals']>) => {
      setErQueue(prevQueue =>
          prevQueue.map(item =>
              item.id === queueItemId ? { ...item, vitals: { ...item.vitals, ...newVitals } } : item
          )
      );
  };
  
  const handleSilenceAlarm = (queueItemId: number) => {
    setErQueue(prevQueue =>
        prevQueue.map(item => {
            if (item.id === queueItemId) {
                const originalPatient = MOCK_ER_QUEUE.find(p => p.bayNumber === item.bayNumber);
                return { 
                    ...item, 
                    isAlarming: false, 
                    vitals: originalPatient ? originalPatient.vitals : item.vitals 
                };
            }
            return item;
        })
    );
    if (speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current);
        speechIntervalRef.current = null;
    }
    window.speechSynthesis.cancel();
  };

  const handleScheduleAppointment = (newAppointmentData: Omit<Appointment, 'id' | 'status'>): boolean => {
      const newAppointment: Appointment = {
          id: `appt-${Date.now()}`,
          status: AppointmentStatus.Scheduled,
          ...newAppointmentData,
      };
      setAppointments(prev => [...prev, newAppointment].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      return true;
  };

  const handleSaveCaseSheet = (patientId: string, caseSheetData: CaseSheet) => {
    setPatients(prevPatients =>
      prevPatients.map(p => {
        if (p.id === patientId) {
          const updatedCaseSheet = { ...(p.caseSheet || {}), ...caseSheetData };
          return { ...p, caseSheet: updatedCaseSheet };
        }
        return p;
      })
    );
  };
  
  const handleSetActivePatient = (patientId: string) => {
      setActivePatientId(patientId);
  };

  const handleAddMortuaryRecord = (recordData: Omit<MortuaryRecord, 'id'>) => {
      const newRecord: MortuaryRecord = {
          id: `mort-${Date.now()}`,
          ...recordData,
      };
      setMortuaryRecords(prev => [newRecord, ...prev]);
  };
  
  const handleUpdateMortuaryRecord = (updatedRecord: MortuaryRecord) => {
      setMortuaryRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };

  const handleDismissNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleRequestNotificationPermission = () => {
    if (!('Notification' in window)) {
        alert("This browser does not support desktop notifications.");
        return;
    }
    if (Notification.permission === 'granted') {
         new Notification('MediFlow AI Reminders', {
            body: 'Desktop notifications are already enabled.',
            icon: '/vite.svg'
        });
        return;
    }
    if (Notification.permission === 'denied') {
        setShowNotificationHelp(true);
        return;
    }

    Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
            new Notification('MediFlow AI Reminders Enabled', {
                body: 'You will now receive medication reminders on your desktop.',
                icon: '/vite.svg'
            });
        }
    });
  };

  const handleAddComplaint = async (patient: PatientRecord, complaintText: string): Promise<void> => {
    const analysis = await analyzeComplaint(complaintText);
    const now = new Date().toISOString();
    
    const newTicket: ComplaintTicket = {
      id: `comp-${Date.now()}`,
      patientId: patient.id,
      patientName: patient.name,
      submittedAt: now,
      complaintText: complaintText,
      channel: 'Portal',
      status: ComplaintStatus.OPEN,
      category: analysis.category,
      urgency: analysis.urgency,
      summary: analysis.summary,
      history: [
        { timestamp: now, action: 'Complaint Submitted.', actor: patient.name },
        { timestamp: new Date().toISOString(), action: `AI Analysis Complete. Urgency: ${analysis.urgency}, Category: ${analysis.category}.`, actor: 'System (AI)' }
      ]
    };

    setComplaintTickets(prev => [newTicket, ...prev]);
  };

  const handleUpdateComplaint = (updatedTicket: ComplaintTicket, actorName: string) => {
    setComplaintTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
  };

  const handleAddADRReport = (reportData: Omit<ADRReport, 'id'>) => {
    const newReport: ADRReport = {
      id: `adr-${Date.now()}`,
      ...reportData,
    };
    setAdrReports(prev => [newReport, ...prev]);
  };

  const handleOrderLabTest = (patient: PatientRecord, testName: string) => {
    if (!user) return;
    const newTest: LabTest = {
        id: `lab-${Date.now()}`,
        patientId: patient.id,
        patientName: patient.name,
        testName: testName,
        orderedBy: user.name,
        orderedAt: new Date().toISOString(),
        status: LabTestStatus.ORDERED,
    };
    setLabTests(prev => [newTest, ...prev]);
  };

  const handleUpdateLabTest = (updatedTest: LabTest) => {
    setLabTests(prev => prev.map(t => t.id === updatedTest.id ? updatedTest : t));
  };


  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case UserRole.Patient:
        const patientRecordsForUser = patients.filter(p => user.recordIds?.includes(p.id));
        const activePatientRecord = patients.find(p => p.id === activePatientId);
        const patientComplaints = complaintTickets.filter(c => activePatientRecord && c.patientId === activePatientRecord.id);
        const patientLabTests = labTests.filter(t => activePatientRecord && t.patientId === activePatientRecord.id);
        return <PatientDashboard 
            user={user} 
            patientRecords={patientRecordsForUser}
            activePatientRecord={activePatientRecord}
            onSelectPatient={handleSetActivePatient}
            appointments={appointments} 
            onPayment={handlePatientPayment} 
            onMedicationPurchase={handleDispenseMedication} 
            onScheduleAppointment={handleScheduleAppointment} 
            language={language} 
            notifications={notifications}
            onDismissNotification={handleDismissNotification}
            complaintTickets={patientComplaints}
            onAddComplaint={handleAddComplaint}
            labTests={patientLabTests}
        />;
      case UserRole.Doctor:
        const assignedComplaintsToDoc = complaintTickets.filter(c => c.assignedTo === user.id);
        return <DoctorDashboard 
            user={user} 
            patients={patients} 
            erQueue={erQueue} 
            appointments={appointments} 
            onScheduleAppointment={handleScheduleAppointment} 
            onSaveCaseSheet={handleSaveCaseSheet} 
            onSilenceAlarm={handleSilenceAlarm} 
            complaintTickets={assignedComplaintsToDoc} 
            labTests={labTests}
            onOrderLabTest={handleOrderLabTest}
        />;
      case UserRole.Nurse:
        const assignedComplaintsToNurse = complaintTickets.filter(c => c.assignedTo === user.id);
        return <NurseDashboard user={user} erQueue={erQueue} onAdmitPatient={handleAdmitPatientFromQueue} onUpdateVitals={handleUpdateQueueVitals} onSilenceAlarm={handleSilenceAlarm} complaintTickets={assignedComplaintsToNurse} />;
      case UserRole.Admin:
        const allUsers = MOCK_USERS;
        return <AdminDashboard 
            user={user} 
            patients={patients} 
            beds={beds} 
            erQueue={erQueue} 
            onAddToQueue={handleAddToQueue}
            mortuaryRecords={mortuaryRecords}
            onAddMortuaryRecord={handleAddMortuaryRecord}
            onUpdateMortuaryRecord={handleUpdateMortuaryRecord}
            complaintTickets={complaintTickets}
            onUpdateComplaint={handleUpdateComplaint}
            allUsers={allUsers}
        />;
      case UserRole.Pharmacy:
        return <PharmacyDashboard 
            user={user}
            patients={patients}
            inventory={pharmacyInventory}
            adrReports={adrReports}
            onDispenseMedication={handleDispenseMedication}
            onRestockInventory={handleRestockInventory}
            onAddADRReport={handleAddADRReport}
        />;
      case UserRole.LabTechnician:
        return <LabDashboard 
            user={user}
            labTests={labTests}
            onUpdateLabTest={handleUpdateLabTest}
        />;
      case UserRole.Engineering:
        return <EngineeringDashboard user={user} />;
      default:
        return <div className="text-center p-8">Invalid user role.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {showNotificationHelp && <NotificationHelpModal onClose={() => setShowNotificationHelp(false)} />}
      {user && <Header 
        user={user} 
        onLogout={handleLogout} 
        language={language} 
        onLanguageChange={handleLanguageChange} 
        notificationPermission={notificationPermission}
        onRequestNotificationPermission={handleRequestNotificationPermission}
      />}
      <main className="p-4 sm:p-6 lg:p-8">
        {!user ? (
          <LoginScreen onLogin={handleLogin} />
        ) : (
          renderDashboard()
        )}
      </main>
    </div>
  );
};

export default App;
