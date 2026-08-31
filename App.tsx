
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, PatientRecord, QueueItem, TriagePriority, Bed, BedStatus, Appointment, AppointmentStatus, BillingItem, CaseSheet, MortuaryRecord, MortuaryStatus, NotificationItem, MedicationTiming, ComplaintTicket, ComplaintStatus, PharmacyInventoryItem, ADRReport, LabTest, LabTestStatus } from './types.ts';
import LoginScreen from './components/LoginScreen.tsx';
import PatientDashboard from './components/PatientDashboard.tsx';
import DoctorDashboard from './components/DoctorDashboard.tsx';
import NurseDashboard from './components/NurseDashboard.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';
import EngineeringDashboard from './components/EngineeringDashboard.tsx';
import PharmacyDashboard from './components/PharmacyDashboard.tsx';
import LabDashboard from './components/LabDashboard.tsx';
import Header from './components/Header.tsx';
import NotificationHelpModal from './components/NotificationHelpModal.tsx';
import AnimatedBackground from './components/AnimatedBackground.tsx';
import { MOCK_PATIENTS, MOCK_BEDS, MOCK_APPOINTMENTS, MOCK_ER_QUEUE, MOCK_MORTUARY_RECORDS, MOCK_COMPLAINTS, MOCK_PHARMACY_INVENTORY, MOCK_ADR_REPORTS, MOCK_LAB_TESTS } from './constants.ts';
import { analyzeComplaint } from './services/geminiService.ts';
import { MOCK_USERS } from './users.ts';
import { appendLiveRiskPoint, generate24HourRiskHistory } from './utils/riskHistoryHelper.ts';
import { soundService } from './services/soundService.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activePatientId, setActivePatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<PatientRecord[]>(MOCK_PATIENTS);
  const [beds, setBeds] = useState<Bed[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mediflow_beds');
        if (saved) {
          const parsed = JSON.parse(saved) as Bed[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn("Could not load beds from localStorage", e);
      }
    }
    return MOCK_BEDS;
  });
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
  
  useEffect(() => {
    const checkNotificationPermission = () => {
      if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined') {
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
        if (typeof window !== 'undefined' && 'Notification' in window && typeof Notification !== 'undefined' && Notification.permission === 'granted' && newNotifications.length > 0) {
            newNotifications.forEach(notification => {
                const patient = patients.find(p => p.id === notification.patientId);
                const title = `Medication Reminder for ${patient ? patient.name : 'Patient'}`;
                const body = `Time to take your ${notification.timing} dose of ${notification.drug}.`;
                try {
                  new Notification(title, { body, icon: '/vite.svg' });
                } catch (e) {
                  console.warn("Notification trigger error:", e);
                }
            });
        }
        if (newNotifications.length > 0) {
            setNotifications(currentNotifications => [...currentNotifications, ...newNotifications]);
        }
        timeOfDayIndex.current = (timeOfDayIndex.current + 1) % timesOfDay.length;
    }, 15000);
    return () => clearInterval(notificationInterval);
  }, [patients, notifications]);

  useEffect(() => {
    const simulationInterval = setInterval(() => {
        setErQueue(prevQueue => {
            if (prevQueue.length === 0 || Math.random() > 0.1) return prevQueue;
            const patientIndex = Math.floor(Math.random() * prevQueue.length);
            const patientToAlert = prevQueue[patientIndex];
            if (patientToAlert.isAlarming) return prevQueue;
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
    const isAlertRole = Boolean(user && (user.role === UserRole.Doctor || user.role === UserRole.Nurse || user.role === UserRole.Admin));
    const alarmingPatient = isAlertRole ? erQueue.find(p => p.isAlarming) : undefined;
    const hasSpeechSupport = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

    // Emergency audio chime synthesizer for medical staff (Doctor, Nurse, Admin)
    const playEmergencyBeep = () => {
      if (!isAlertRole || !soundService.isSoundAllowed()) return;
      try {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } catch (e) {
        // Audio policy ignore
      }
    };

    if (alarmingPatient && isAlertRole && speechIntervalRef.current === null) {
      const triggerAlarmSound = () => {
        if (!soundService.isSoundAllowed()) {
          if (hasSpeechSupport && window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
          }
          return;
        }
        playEmergencyBeep();
        if (hasSpeechSupport) {
          const utterance = new SpeechSynthesisUtterance(
            `Alert! Critical vitals in ER Bay ${alarmingPatient.bayNumber}. Attention needed in ER Bay ${alarmingPatient.bayNumber}.`
          );
          utterance.rate = 1.1;
          utterance.pitch = 1.2;
          if (window.speechSynthesis.speaking) window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utterance);
        }
      };

      triggerAlarmSound();
      speechIntervalRef.current = window.setInterval(triggerAlarmSound, 6000);
    } else if ((!alarmingPatient || !isAlertRole) && speechIntervalRef.current !== null) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
      if (hasSpeechSupport) {
        window.speechSynthesis.cancel();
      }
    }
    return () => {
        clearInterval(simulationInterval);
        if (speechIntervalRef.current) {
          clearInterval(speechIntervalRef.current);
          speechIntervalRef.current = null;
        }
        if (hasSpeechSupport) {
          window.speechSynthesis.cancel();
        }
    };
}, [erQueue, user]);

  // Persist beds state to localStorage whenever modified
  useEffect(() => {
    if (typeof window !== 'undefined' && beds.length > 0) {
      try {
        localStorage.setItem('mediflow_beds', JSON.stringify(beds));
      } catch (e) {
        console.warn("Failed to persist beds to localStorage", e);
      }
    }
  }, [beds]);

  // Simulation tick helper function
  const stepBedSimulation = (prevBeds: Bed[]): Bed[] => {
    return prevBeds.map(bed => {
      // 1. Sanitization progression for cleaning beds
      if (bed.status === BedStatus.Cleaning) {
        const currentCleaning = bed.cleaningTimeRemainingMinutes ?? 5;
        const updatedCleaning = Math.max(0, currentCleaning - 1);
        if (updatedCleaning === 0) {
          // ML confirms sterilization cycle complete -> bed becomes Available
          return {
            ...bed,
            status: BedStatus.Available,
            cleaningTimeRemainingMinutes: undefined,
            patientId: undefined,
            patientName: undefined,
            predictedDischargeMinutes: undefined,
            mlRiskScore: undefined,
            acuityLevel: undefined,
            mlConfidence: 98,
            lastUpdated: new Date().toISOString(),
          };
        }
        return {
          ...bed,
          cleaningTimeRemainingMinutes: updatedCleaning,
          lastUpdated: new Date().toISOString(),
        };
      }

      // 2. Length of Stay & ML recovery curve for occupied beds
      if (bed.status === BedStatus.Occupied) {
        const currentDischarge = bed.predictedDischargeMinutes ?? 45;
        const updatedDischarge = Math.max(0, currentDischarge - 1);

        // Dynamic ML Acuity & Risk score drift
        const currentRisk = bed.mlRiskScore ?? 40;
        const riskDrift = Math.floor((Math.random() - 0.52) * 4);
        const updatedRisk = Math.max(8, Math.min(95, currentRisk + riskDrift));
        
        let updatedAcuity: Bed['acuityLevel'] = 'Moderate';
        if (updatedRisk >= 75) updatedAcuity = 'Critical';
        else if (updatedRisk >= 50) updatedAcuity = 'High';
        else if (updatedRisk >= 30) updatedAcuity = 'Moderate';
        else updatedAcuity = 'Low';

        const updatedConfidence = Math.min(99, Math.max(82, (bed.mlConfidence ?? 90) + (Math.random() > 0.5 ? 1 : -1)));

        // Update 24-hour historical risk curve with the new live point
        const currentHistory = bed.riskHistory && bed.riskHistory.length > 0
          ? bed.riskHistory
          : generate24HourRiskHistory(currentRisk);
        const updatedRiskHistory = appendLiveRiskPoint(currentHistory, updatedRisk);

        // If predicted discharge countdown reached 0 and patient stable -> ML discharge to cleaning
        if (updatedDischarge === 0 && updatedRisk < 35 && Math.random() < 0.35) {
          return {
            ...bed,
            status: BedStatus.Cleaning,
            cleaningTimeRemainingMinutes: 5,
            patientId: undefined,
            patientName: undefined,
            predictedDischargeMinutes: undefined,
            mlRiskScore: undefined,
            acuityLevel: undefined,
            mlConfidence: 95,
            lastUpdated: new Date().toISOString(),
            riskHistory: undefined,
          };
        }

        return {
          ...bed,
          predictedDischargeMinutes: updatedDischarge,
          mlRiskScore: updatedRisk,
          acuityLevel: updatedAcuity,
          mlConfidence: updatedConfidence,
          lastUpdated: new Date().toISOString(),
          riskHistory: updatedRiskHistory,
        };
      }

      return bed;
    });
  };

  // Dynamic ML Bed Management Simulation Engine: updates beds time-to-time based on ML predictions
  useEffect(() => {
    const bedMlSimulationInterval = setInterval(() => {
      setBeds(prevBeds => stepBedSimulation(prevBeds));
    }, 7000);

    return () => clearInterval(bedMlSimulationInterval);
  }, []);

  const handleTriggerSimulationTick = () => {
    setBeds(prevBeds => stepBedSimulation(prevBeds));
  };

  const handleResetBedsToDefault = () => {
    localStorage.removeItem('mediflow_beds');
    setBeds(MOCK_BEDS);
  };

  const handleLogin = (loggedInUser: User, rememberMe: boolean) => {
    setUser(loggedInUser);
    if (loggedInUser.role === UserRole.Patient && loggedInUser.recordIds?.length) {
        setActivePatientId(loggedInUser.recordIds[0]);
    }
    if (rememberMe) localStorage.setItem('loggedInUser', JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    setActivePatientId(null);
    localStorage.removeItem('loggedInUser');
  };
  
  const handleLanguageChange = (lang: string) => setLanguage(lang);
  
  const handlePatientPayment = (patientId: string) => {
    setPatients(prevPatients =>
      prevPatients.map(p => p.id === patientId ? { ...p, paymentStatus: 'Paid' } : p)
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
            return { ...p, prescriptions: updatedPrescriptions, billing: [...p.billing, newBillingItem] };
          }
          return p;
        })
      );
      setPharmacyInventory(prevInv => 
        prevInv.map(item => item.drugName === drug ? { ...item, stockQuantity: item.stockQuantity - quantity } : item)
      );
  };

  const handleRestockInventory = (drugId: string, quantity: number) => {
    setPharmacyInventory(prevInv =>
      prevInv.map(item => item.id === drugId ? { ...item, stockQuantity: item.stockQuantity + quantity } : item)
    );
  };

  const handleAddToQueue = (item: QueueItem) => {
    setErQueue(prev => [...prev, item].sort((a, b) => {
        const priorityOrder = { [TriagePriority.CRITICAL]: 0, [TriagePriority.URGENT]: 1, [TriagePriority.NON_URGENT]: 2 };
        return priorityOrder[a.result.priority] - priorityOrder[b.result.priority];
    }));
  };

  const handleAdmitPatientFromQueue = (queueItemId: number): boolean => {
      const queueItem = erQueue.find(q => q.id === queueItemId);
      const availableBed = beds.find(b => b.status === BedStatus.Available);
      if (!availableBed) return false;
      const estMinutes = queueItem?.result.priority === TriagePriority.CRITICAL ? 90 : 45;
      const initRisk = queueItem?.result.priority === TriagePriority.CRITICAL ? 85 : 40;
      setBeds(prevBeds => prevBeds.map(bed =>
          bed.id === availableBed.id ? {
            ...bed,
            status: BedStatus.Occupied,
            patientId: `ER-${queueItemId}`,
            patientName: `ER Bay ${queueItem?.bayNumber ?? queueItemId}`,
            predictedDischargeMinutes: estMinutes,
            mlRiskScore: initRisk,
            acuityLevel: queueItem?.result.priority === TriagePriority.CRITICAL ? 'Critical' : 'Moderate',
            mlPredictedLOSHours: queueItem?.result.priority === TriagePriority.CRITICAL ? 18.0 : 6.0,
            mlConfidence: 92,
            lastUpdated: new Date().toISOString(),
          } : bed
      ));
      setErQueue(prev => prev.filter(p => p.id !== queueItemId));
      return true;
  };

  const handleUpdateBed = (updatedBed: Bed) => {
    setBeds(prev => prev.map(b => b.id === updatedBed.id ? updatedBed : b));
  };

  const handleDischargeBedPatient = (bedId: string) => {
    setBeds(prev => prev.map(b => {
      if (b.id === bedId) {
        return {
          ...b,
          status: BedStatus.Cleaning,
          cleaningTimeRemainingMinutes: 6,
          patientId: undefined,
          patientName: undefined,
          predictedDischargeMinutes: undefined,
          mlRiskScore: undefined,
          acuityLevel: undefined,
          mlConfidence: 95,
          lastUpdated: new Date().toISOString(),
        };
      }
      return b;
    }));
  };

  const handleCompleteBedCleaning = (bedId: string) => {
    setBeds(prev => prev.map(b => {
      if (b.id === bedId) {
        return {
          ...b,
          status: BedStatus.Available,
          cleaningTimeRemainingMinutes: undefined,
          patientId: undefined,
          patientName: undefined,
          predictedDischargeMinutes: undefined,
          mlRiskScore: undefined,
          acuityLevel: undefined,
          mlConfidence: 99,
          lastUpdated: new Date().toISOString(),
        };
      }
      return b;
    }));
  };

  const handleMarkBedCleaning = (bedId: string) => {
    setBeds(prev => prev.map(b => {
      if (b.id === bedId) {
        return {
          ...b,
          status: BedStatus.Cleaning,
          cleaningTimeRemainingMinutes: 6,
          patientId: undefined,
          patientName: undefined,
          predictedDischargeMinutes: undefined,
          mlRiskScore: undefined,
          acuityLevel: undefined,
          mlConfidence: 95,
          lastUpdated: new Date().toISOString(),
        };
      }
      return b;
    }));
  };

  const handleSmartAssignBed = (bedId: string, queueItemId: number) => {
    const queueItem = erQueue.find(q => q.id === queueItemId);
    if (!queueItem) return false;

    setBeds(prev => prev.map(b => {
      if (b.id === bedId) {
        const estMinutes = queueItem.result.priority === TriagePriority.CRITICAL ? 90 : 45;
        const initRisk = queueItem.result.priority === TriagePriority.CRITICAL ? 85 : 45;
        return {
          ...b,
          status: BedStatus.Occupied,
          patientId: `ER-${queueItem.bayNumber}`,
          patientName: `ER Patient (Bay ${queueItem.bayNumber})`,
          predictedDischargeMinutes: estMinutes,
          mlRiskScore: initRisk,
          acuityLevel: queueItem.result.priority === TriagePriority.CRITICAL ? 'Critical' : 'Moderate',
          mlPredictedLOSHours: queueItem.result.priority === TriagePriority.CRITICAL ? 18.0 : 6.0,
          mlConfidence: 94,
          lastUpdated: new Date().toISOString(),
        };
      }
      return b;
    }));

    setErQueue(prev => prev.filter(q => q.id !== queueItemId));
    return true;
  };
  
  const handleUpdateQueueVitals = (queueItemId: number, newVitals: Partial<PatientRecord['vitals']>) => {
      setErQueue(prevQueue =>
          prevQueue.map(item => item.id === queueItemId ? { ...item, vitals: { ...item.vitals, ...newVitals } } : item)
      );
  };
  
  const handleSilenceAlarm = (queueItemId: number) => {
    setErQueue(prevQueue =>
        prevQueue.map(item => {
            if (item.id === queueItemId) {
                const originalPatient = MOCK_ER_QUEUE.find(p => p.bayNumber === item.bayNumber);
                return { ...item, isAlarming: false, vitals: originalPatient ? originalPatient.vitals : item.vitals };
            }
            return item;
        })
    );
    if (speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current);
        speechIntervalRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleScheduleAppointment = (newAppointmentData: Omit<Appointment, 'id' | 'status'>): boolean => {
      const newAppointment: Appointment = { id: `appt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, status: AppointmentStatus.Scheduled, ...newAppointmentData };
      setAppointments(prev => [...prev, newAppointment].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
      return true;
  };

  const handleSaveCaseSheet = (patientId: string, caseSheetData: CaseSheet) => {
    setPatients(prevPatients =>
      prevPatients.map(p => p.id === patientId ? { ...p, caseSheet: { ...(p.caseSheet || {}), ...caseSheetData } } : p)
    );
  };
  
  const handleSetActivePatient = (patientId: string) => setActivePatientId(patientId);

  const handleAddMortuaryRecord = (recordData: Omit<MortuaryRecord, 'id'>) => {
      setMortuaryRecords(prev => [{ id: `mort-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...recordData }, ...prev]);
  };
  
  const handleUpdateMortuaryRecord = (updatedRecord: MortuaryRecord) => {
      setMortuaryRecords(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
  };

  const handleDismissNotification = (id: number) => setNotifications(prev => prev.filter(n => n.id !== id));

  const handleRequestNotificationPermission = () => {
    if (typeof window === 'undefined' || !('Notification' in window) || typeof Notification === 'undefined') {
      return alert("This browser does not support desktop notifications.");
    }
    if (Notification.permission === 'granted') {
         try {
           new Notification('MediFlow AI Reminders', { body: 'Desktop notifications are already enabled.', icon: '/vite.svg' });
         } catch (e) {
           console.warn("Notification error:", e);
         }
         return;
    }
    if (Notification.permission === 'denied') return setShowNotificationHelp(true);
    Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
        if (permission === 'granted') {
          try {
            new Notification('MediFlow AI Reminders Enabled', { body: 'You will now receive medication reminders on your desktop.', icon: '/vite.svg' });
          } catch (e) {
            console.warn("Notification error:", e);
          }
        }
    }).catch(err => {
        console.warn("Notification permission error:", err);
    });
  };

  const handleAddComplaint = async (patient: PatientRecord, complaintText: string): Promise<void> => {
    const analysis = await analyzeComplaint(complaintText);
    const now = new Date().toISOString();
    const newTicket: ComplaintTicket = {
      id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, patientId: patient.id, patientName: patient.name, submittedAt: now,
      complaintText, channel: 'Portal', status: ComplaintStatus.OPEN, category: analysis.category, urgency: analysis.urgency, summary: analysis.summary,
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
    setAdrReports(prev => [{ id: `adr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...reportData }, ...prev]);
  };

  const handleOrderLabTest = (patient: PatientRecord, testName: string) => {
    if (!user) return;
    setLabTests(prev => [{
        id: `lab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, patientId: patient.id, patientName: patient.name, testName, orderedBy: user.name, orderedAt: new Date().toISOString(), status: LabTestStatus.ORDERED,
    }, ...prev]);
  };

  const handleUpdateLabTest = (updatedTest: LabTest) => setLabTests(prev => prev.map(t => t.id === updatedTest.id ? updatedTest : t));

  const renderDashboard = () => {
    if (!user) return null;
    switch (user.role) {
      case UserRole.Patient:
        const patientRecordsForUser = patients.filter(p => user.recordIds?.includes(p.id));
        const activePatientRecord = patients.find(p => p.id === activePatientId);
        const patientComplaints = complaintTickets.filter(c => activePatientRecord && c.patientId === activePatientRecord.id);
        const patientLabTests = labTests.filter(t => activePatientRecord && t.patientId === activePatientRecord.id);
        return <PatientDashboard user={user} patientRecords={patientRecordsForUser} activePatientRecord={activePatientRecord} onSelectPatient={handleSetActivePatient} appointments={appointments} onPayment={handlePatientPayment} onMedicationPurchase={handleDispenseMedication} onScheduleAppointment={handleScheduleAppointment} language={language} notifications={notifications} onDismissNotification={handleDismissNotification} complaintTickets={patientComplaints} onAddComplaint={handleAddComplaint} labTests={patientLabTests} />;
      case UserRole.Doctor:
        const assignedComplaintsToDoc = complaintTickets.filter(c => c.assignedTo === user.id);
        return <DoctorDashboard user={user} patients={patients} erQueue={erQueue} appointments={appointments} onScheduleAppointment={handleScheduleAppointment} onSaveCaseSheet={handleSaveCaseSheet} onSilenceAlarm={handleSilenceAlarm} complaintTickets={assignedComplaintsToDoc} labTests={labTests} onOrderLabTest={handleOrderLabTest} />;
      case UserRole.Nurse:
        const assignedComplaintsToNurse = complaintTickets.filter(c => c.assignedTo === user.id);
        return <NurseDashboard user={user} erQueue={erQueue} onAdmitPatient={handleAdmitPatientFromQueue} onUpdateVitals={handleUpdateQueueVitals} onSilenceAlarm={handleSilenceAlarm} complaintTickets={assignedComplaintsToNurse} />;
      case UserRole.Admin:
        return (
          <AdminDashboard
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
            allUsers={MOCK_USERS}
            onUpdateBed={handleUpdateBed}
            onDischargeBedPatient={handleDischargeBedPatient}
            onCompleteBedCleaning={handleCompleteBedCleaning}
            onMarkBedCleaning={handleMarkBedCleaning}
            onSmartAssignBed={handleSmartAssignBed}
            onImportBeds={setBeds}
            onTriggerSimulationTick={handleTriggerSimulationTick}
            onResetBedsToDefault={handleResetBedsToDefault}
          />
        );
      case UserRole.Pharmacy:
        return <PharmacyDashboard user={user} patients={patients} inventory={pharmacyInventory} adrReports={adrReports} onDispenseMedication={handleDispenseMedication} onRestockInventory={handleRestockInventory} onAddADRReport={handleAddADRReport} />;
      case UserRole.LabTechnician:
        return <LabDashboard user={user} labTests={labTests} onUpdateLabTest={handleUpdateLabTest} />;
      case UserRole.Engineering:
        return <EngineeringDashboard user={user} />;
      default:
        return <div className="text-center p-8">Invalid user role.</div>;
    }
  };

  return (
    <div className="min-h-screen font-sans relative">
      <AnimatedBackground />
      {showNotificationHelp && <NotificationHelpModal onClose={() => setShowNotificationHelp(false)} />}
      {user && <Header user={user} onLogout={handleLogout} language={language} onLanguageChange={handleLanguageChange} notificationPermission={notificationPermission} onRequestNotificationPermission={handleRequestNotificationPermission} />}
      <main className="p-4 sm:p-6 lg:p-8 relative z-[1]">
        {!user ? <LoginScreen onLogin={handleLogin} /> : renderDashboard()}
      </main>
    </div>
  );
};

export default App;
