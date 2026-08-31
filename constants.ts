
import { PatientRecord, Bed, BedStatus, BillingItem, Ambulance, AmbulanceStatus, BroughtDeadRecord, Appointment, AppointmentStatus, DoctorSpecialty, IncidentReport, IncidentType, IncidentStatus, IncidentSeverity, QueueItem, TriagePriority, MortuaryRecord, MortuaryStatus, ComplaintTicket, ComplaintStatus, ComplaintUrgency, ComplaintCategory, PharmacyInventoryItem, ADRReport, LabTest, LabTestStatus, VitalSignHistory } from './types.ts';
import { generate24HourRiskHistory } from './utils/riskHistoryHelper.ts';

export const MOCK_BEDS: Bed[] = [
  { id: 'bed-101', ward: 'Cardiology', bedNumber: 101, status: BedStatus.Occupied, patientId: 'pat-001', patientName: 'John Smith', predictedDischargeMinutes: 38, mlRiskScore: 78, mlPredictedLOSHours: 4.5, mlConfidence: 94, acuityLevel: 'High', specialtyRequired: 'Cardiology', riskHistory: generate24HourRiskHistory(78) },
  { id: 'bed-102', ward: 'Cardiology', bedNumber: 102, status: BedStatus.Available, specialtyRequired: 'Cardiology' },
  { id: 'bed-103', ward: 'Cardiology', bedNumber: 103, status: BedStatus.Cleaning, cleaningTimeRemainingMinutes: 6, specialtyRequired: 'Cardiology' },
  { id: 'bed-201', ward: 'Neurology', bedNumber: 201, status: BedStatus.Occupied, patientId: 'pat-002', patientName: 'Emily Johnson', predictedDischargeMinutes: 65, mlRiskScore: 35, mlPredictedLOSHours: 8.0, mlConfidence: 89, acuityLevel: 'Moderate', specialtyRequired: 'Neurology', riskHistory: generate24HourRiskHistory(35) },
  { id: 'bed-202', ward: 'Neurology', bedNumber: 202, status: BedStatus.Available, specialtyRequired: 'Neurology' },
  { id: 'bed-301', ward: 'General', bedNumber: 301, status: BedStatus.Occupied, patientId: 'pat-003', patientName: 'Michael Williams', predictedDischargeMinutes: 110, mlRiskScore: 42, mlPredictedLOSHours: 24.0, mlConfidence: 91, acuityLevel: 'Moderate', specialtyRequired: 'General', riskHistory: generate24HourRiskHistory(42) },
  { id: 'bed-302', ward: 'General', bedNumber: 302, status: BedStatus.Available, specialtyRequired: 'General' },
  { id: 'bed-303', ward: 'General', bedNumber: 303, status: BedStatus.Available, specialtyRequired: 'General' },
  { id: 'bed-401', ward: 'Pediatrics', bedNumber: 401, status: BedStatus.Occupied, patientId: 'pat-004', patientName: 'Sophia Brown', predictedDischargeMinutes: 25, mlRiskScore: 20, mlPredictedLOSHours: 3.5, mlConfidence: 96, acuityLevel: 'Low', specialtyRequired: 'Pediatrics', riskHistory: generate24HourRiskHistory(20) },
  { id: 'bed-402', ward: 'Pediatrics', bedNumber: 402, status: BedStatus.Cleaning, cleaningTimeRemainingMinutes: 4, specialtyRequired: 'Pediatrics' },
  { id: 'bed-403', ward: 'Pediatrics', bedNumber: 403, status: BedStatus.Available, specialtyRequired: 'Pediatrics' },
  { id: 'bed-501', ward: 'General', bedNumber: 501, status: BedStatus.Occupied, patientId: 'pat-005', patientName: 'Alex Ray', predictedDischargeMinutes: 45, mlRiskScore: 62, mlPredictedLOSHours: 12.0, mlConfidence: 88, acuityLevel: 'Moderate', specialtyRequired: 'General', riskHistory: generate24HourRiskHistory(62) },
];

const patientBilling: { [key: string]: BillingItem[] } = {
    'pat-001': [
        { id: 'bill-01a', description: 'ER Consultation', category: 'Consultation', cost: 250 },
        { id: 'bill-01b', description: 'EKG Test', category: 'Procedure', cost: 150 },
        { id: 'bill-01c', description: 'Troponin Lab Test', category: 'Lab Test', cost: 75 },
        { id: 'bill-01d', description: 'Aspirin', category: 'Pharmacy', cost: 5 },
    ],
    'pat-002': [
        { id: 'bill-02a', description: 'Neurology Consultation', category: 'Consultation', cost: 200 },
        { id: 'bill-02b', description: 'Sumatriptan', category: 'Pharmacy', cost: 45 },
        { id: 'bill-02c', description: 'Antiemetic', category: 'Pharmacy', cost: 20 },
    ],
    'pat-003': [
        { id: 'bill-03a', description: 'General Consultation', category: 'Consultation', cost: 120 },
        { id: 'bill-03b', description: 'Chest X-ray', category: 'Procedure', cost: 180 },
        { id: 'bill-03c', description: 'Antibiotics Course', category: 'Pharmacy', cost: 85 },
    ],
    'pat-004': [
        { id: 'bill-04a', description: 'Pediatric Consultation', category: 'Consultation', cost: 150 },
        { id: 'bill-04b', description: 'Rapid Strep Test', category: 'Lab Test', cost: 35 },
        { id: 'bill-04c', description: 'Penicillin', category: 'Pharmacy', cost: 25 },
    ],
     'pat-005': [
        { id: 'bill-05a', description: 'ER Consultation', category: 'Consultation', cost: 250 },
        { id: 'bill-05b', description: 'Abdominal CT Scan', category: 'Procedure', cost: 450 },
        { id: 'bill-05c', description: 'Basic Metabolic Panel', category: 'Lab Test', cost: 60 },
        { id: 'bill-05d', description: 'Pharmacy Dispensing Fee', category: 'Pharmacy', cost: 15 },
    ],
};

const generateVitalsHistory = (
    baseVitals: PatientRecord['vitals'],
    durationHours: number = 12,
    points: number = 24
): VitalSignHistory[] => {
    const history: VitalSignHistory[] = [];
    const now = new Date();
    const intervalMinutes = (durationHours * 60) / points;

    let currentHR = baseVitals.heartRate;
    let [currentSys, currentDia] = baseVitals.bloodPressure.split('/').map(Number);
    let currentO2 = baseVitals.oxygenSaturation;

    for (let i = points; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * intervalMinutes * 60 * 1000).toISOString();
        
        currentHR += (Math.random() - 0.5) * 4;
        currentSys += (Math.random() - 0.5) * 6;
        currentDia += (Math.random() - 0.5) * 4;
        currentO2 += (Math.random() - 0.5) * 0.8;

        currentHR = Math.round(Math.max(40, Math.min(180, currentHR)));
        currentSys = Math.round(Math.max(70, Math.min(200, currentSys)));
        currentDia = Math.round(Math.max(40, Math.min(120, currentDia)));
        currentO2 = Math.round(Math.max(85, Math.min(100, currentO2)));

        history.push({
            timestamp,
            heartRate: currentHR,
            bloodPressure: `${currentSys}/${currentDia}`,
            oxygenSaturation: currentO2,
        });
    }
    return history;
};


export const MOCK_PATIENTS: PatientRecord[] = [
  {
    id: 'pat-001',
    name: 'John Smith',
    age: 65,
    gender: 'Male',
    chiefComplaint: 'Severe chest pain, shortness of breath, pain radiating to left arm.',
    vitals: { heartRate: 110, bloodPressure: '160/100', temperature: 37.0, oxygenSaturation: 92, respiratoryRate: 22 },
    notes: 'Patient presented with classic signs of myocardial infarction. EKG shows ST-segment elevation. Troponin levels are elevated. Administered aspirin and nitroglycerin. Preparing for cardiac catheterization. History of hypertension and high cholesterol.',
    billing: patientBilling['pat-001'],
    bedId: 'bed-101',
    paymentStatus: 'Unpaid',
    vitalsHistory: generateVitalsHistory({ heartRate: 110, bloodPressure: '160/100', oxygenSaturation: 92, temperature: 37.0 }),
  },
  {
    id: 'pat-002',
    name: 'Emily Johnson',
    age: 28,
    gender: 'Female',
    chiefComplaint: 'Migraine with aura, nausea, and photophobia for the last 12 hours.',
    vitals: { heartRate: 75, bloodPressure: '120/80', temperature: 37.2, oxygenSaturation: 99, respiratoryRate: 16 },
    notes: 'Patient has a history of chronic migraines. Current episode is severe and unresponsive to over-the-counter medication. Administered sumatriptan and an antiemetic. Advised rest in a dark, quiet room. Will re-evaluate in 2 hours.',
    billing: patientBilling['pat-002'],
    bedId: 'bed-201',
    paymentStatus: 'Unpaid',
    vitalsHistory: generateVitalsHistory({ heartRate: 75, bloodPressure: '120/80', oxygenSaturation: 99, temperature: 37.2 }),
  },
  {
    id: 'pat-003',
    name: 'Michael Williams',
    age: 45,
    gender: 'Male',
    chiefComplaint: 'Fever, persistent cough, and fatigue for three days.',
    vitals: { heartRate: 95, bloodPressure: '130/85', temperature: 38.9, oxygenSaturation: 95, respiratoryRate: 20 },
    notes: 'Patient presents with symptoms consistent with pneumonia. Chest X-ray confirms consolidation in the right lower lobe. Started on a course of broad-spectrum antibiotics. Advised to rest and hydrate. Follow-up scheduled in 3 days.',
    billing: patientBilling['pat-003'],
    bedId: 'bed-301',
    paymentStatus: 'Unpaid',
    vitalsHistory: generateVitalsHistory({ heartRate: 95, bloodPressure: '130/85', oxygenSaturation: 95, temperature: 38.9 }),
  },
   {
    id: 'pat-004',
    name: 'Sophia Brown',
    age: 7,
    gender: 'Female',
    chiefComplaint: 'Sore throat, difficulty swallowing, and a red rash on her chest.',
    vitals: { heartRate: 100, bloodPressure: '100/65', temperature: 38.5, oxygenSaturation: 98, respiratoryRate: 24 },
    notes: 'Rapid strep test is positive. Diagnosis of scarlet fever. Prescribed penicillin. Parents advised to monitor for complications and ensure she completes the full course of antibiotics. Should not return to school until 24 hours after starting treatment and fever-free.',
    billing: patientBilling['pat-004'],
    bedId: 'bed-401',
    paymentStatus: 'Unpaid',
    vitalsHistory: generateVitalsHistory({ heartRate: 100, bloodPressure: '100/65', oxygenSaturation: 98, temperature: 38.5 }),
  },
  {
    id: 'pat-005',
    name: 'Alex Ray',
    age: 35,
    gender: 'Male',
    email: 'alex.ray@example.com',
    chiefComplaint: 'Acute abdominal pain in the lower right quadrant, accompanied by mild fever.',
    vitals: { heartRate: 88, bloodPressure: '125/80', temperature: 38.1, oxygenSaturation: 98, respiratoryRate: 18 },
    notes: 'Patient presents with symptoms suggestive of appendicitis. Physical examination reveals rebound tenderness. Blood work shows elevated white blood cell count. Scheduled for an abdominal CT scan to confirm diagnosis. Prepped for possible appendectomy.',
    billing: patientBilling['pat-005'],
    prescriptions: [
        { drug: 'Ciprofloxacin', dosage: '500mg', frequency: 'Twice daily', timing: ['Morning', 'Evening'], notes: 'Finish entire course post-surgery.', prescribedQuantity: 14, boughtQuantity: 14 },
        { drug: 'Acetaminophen', dosage: '650mg', frequency: 'Every 6 hours as needed for pain', timing: ['Morning', 'Afternoon', 'Evening', 'Night'], notes: 'Do not exceed 4 doses in 24 hours.', prescribedQuantity: 30, boughtQuantity: 10 },
        { drug: 'Docusate Sodium', dosage: '100mg', frequency: 'Once daily', timing: ['Night'], notes: 'Stool softener to prevent straining.', prescribedQuantity: 20, boughtQuantity: 0 },
    ],
    paymentStatus: 'Unpaid',
    vitalsHistory: generateVitalsHistory({ heartRate: 88, bloodPressure: '125/80', oxygenSaturation: 98, temperature: 38.1 }),
  },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
    {
        id: 'appt-001',
        patientId: 'pat-002',
        doctorId: 'user-doc-03',
        doctorName: 'Dr. Chloe Davis',
        specialty: DoctorSpecialty.Neurologist,
        date: '2024-08-15',
        time: '10:30',
        reason: 'Follow-up for migraine management.',
        status: AppointmentStatus.Scheduled,
    },
    {
        id: 'appt-002',
        patientId: 'pat-001',
        doctorId: 'user-doc-01',
        doctorName: 'Dr. Evelyn Reed',
        specialty: DoctorSpecialty.Cardiologist,
        date: '2024-08-20',
        time: '14:00',
        reason: 'Post-catheterization check-up.',
        status: AppointmentStatus.Scheduled,
    },
    {
        id: 'appt-003',
        patientId: 'pat-005',
        doctorId: 'user-doc-06',
        doctorName: 'Dr. James Wilson',
        specialty: DoctorSpecialty.General,
        date: '2024-07-28',
        time: '11:00',
        reason: 'Post-operative checkup after appendectomy.',
        status: AppointmentStatus.Completed,
    },
];

export const MOCK_AMBULANCES: Ambulance[] = [
  {
    id: 'amb-01',
    unitNumber: 'A-101',
    status: AmbulanceStatus.Available,
    vehicleType: 'ALS',
    bayNumber: 'ER Bay 01',
    driverName: 'EMT Marcus Hayes',
    paramedicName: 'Paramedic Sarah Jenkins',
    currentAddress: 'MediFlow Trauma Center - Bay 1',
    speedMph: 0,
    fuelLevelPercent: 96,
    gpsCoords: { x: 48, y: 52 },
    headingDeg: 90,
    routeProgressPercent: 0,
    lightsActive: false,
    turnInstruction: 'Standing by at Trauma Station Bay 1',
    equipmentStatus: {
      defibrillator: true,
      oxygenLevelPercent: 100,
      ventilator: true,
      suctionUnit: true,
    },
    timelineLogs: [
      { timestamp: '10:15 AM', status: AmbulanceStatus.AtHospital, note: 'Vehicle sanitized, disinfected & restocked.' },
      { timestamp: '10:20 AM', status: AmbulanceStatus.Available, note: 'Standing by at Trauma Station Bay 1 ready for 911 dispatch.' },
    ],
  },
  {
    id: 'amb-02',
    unitNumber: 'A-102',
    status: AmbulanceStatus.TransportingToHospital,
    etaMinutes: 4,
    etaSeconds: 228,
    distanceKmRemaining: 3.2,
    speedMph: 58,
    vehicleType: 'Critical Care',
    bayNumber: 'En Route to ER Bay 2',
    driverName: 'EMT David Ross',
    paramedicName: 'Lead Paramedic Elena Vance',
    currentAddress: 'Westside Expressway inbound at Exit 14',
    destinationAddress: 'MediFlow General Trauma ER, Receiving Bay 2',
    priorityCode: 'Code 3 (Emergency Hot)',
    dispatchedAt: '10:04 AM',
    fuelLevelPercent: 82,
    gpsCoords: { x: 34, y: 64 },
    headingDeg: 45,
    routeProgressPercent: 62,
    lightsActive: true,
    turnInstruction: 'Speeding East on Westside Expressway toward Trauma Base',
    equipmentStatus: {
      defibrillator: true,
      oxygenLevelPercent: 78,
      ventilator: true,
      suctionUnit: true,
    },
    patientInfo: {
      name: 'Arthur Pendelton',
      age: 58,
      gender: 'Male',
      complaint: 'Acute Sub-sternal Chest Pain radiating to left arm & diaphoresis',
      acuity: 'Critical',
      vitals: {
        heartRate: 118,
        bloodPressure: '162/98',
        oxygenSaturation: 93,
        respiratoryRate: 22,
        temperature: 36.9,
        ecgRhythm: 'STEMI / ST Elevation',
      },
      notes: '12-lead ECG confirmed anterolateral STEMI. 325mg Aspirin chewed, Sublingual Nitroglycerin given x2, 4L/min O2 via nasal cannula. Cath Lab pre-alerted.',
    },
    timelineLogs: [
      { timestamp: '10:04 AM', status: AmbulanceStatus.EnRouteToScene, note: 'Dispatched to 742 Evergreen Terrace for cardiac distress.' },
      { timestamp: '10:12 AM', status: AmbulanceStatus.AtScene, note: 'Arrived at scene. Patient conscious, pale, severe chest pain.' },
      { timestamp: '10:22 AM', status: AmbulanceStatus.TransportingToHospital, note: 'Patient loaded onto Stryker gurney. Transporting Code 3 to Cath Lab ER.' },
    ],
  },
  {
    id: 'amb-03',
    unitNumber: 'B-201',
    status: AmbulanceStatus.EnRouteToScene,
    etaMinutes: 3,
    etaSeconds: 180,
    distanceKmRemaining: 2.1,
    speedMph: 64,
    vehicleType: 'ALS',
    driverName: 'EMT Carlos Mendez',
    paramedicName: 'Paramedic Maya Lin',
    currentAddress: 'North Central Blvd crossing 12th Ave',
    destinationAddress: 'Grand Plaza Shopping Center, North Entrance',
    priorityCode: 'Code 3 (Emergency Hot)',
    dispatchedAt: '10:24 AM',
    fuelLevelPercent: 88,
    gpsCoords: { x: 68, y: 32 },
    headingDeg: 135,
    routeProgressPercent: 48,
    lightsActive: true,
    turnInstruction: 'Approaching Grand Plaza Mall perimeter',
    equipmentStatus: {
      defibrillator: true,
      oxygenLevelPercent: 95,
      ventilator: true,
      suctionUnit: true,
    },
    patientInfo: {
      name: 'Unidentified Female (~30s)',
      complaint: 'Multiple Vehicle Collision with Airbag Deployment & Extrication',
      acuity: 'Critical',
      vitals: {
        heartRate: 104,
        bloodPressure: '128/82',
        oxygenSaturation: 97,
      },
      notes: 'Caller reports 2-car collision, driver conscious with head contusion. Fire Dept rescue in progress.',
    },
    timelineLogs: [
      { timestamp: '10:24 AM', status: AmbulanceStatus.EnRouteToScene, note: 'Dispatched Code 3 with siren & strobe lights active.' },
    ],
  },
  {
    id: 'amb-04',
    unitNumber: 'C-301',
    status: AmbulanceStatus.AtScene,
    etaMinutes: 0,
    speedMph: 0,
    vehicleType: 'BLS',
    driverName: 'EMT James Walker',
    paramedicName: 'Paramedic Chloe Bennett',
    currentAddress: '418 Oakwood Ave, Apt 3B',
    destinationAddress: 'MediFlow Emergency Center',
    priorityCode: 'Code 2 (Urgent)',
    dispatchedAt: '10:14 AM',
    fuelLevelPercent: 74,
    gpsCoords: { x: 78, y: 68 },
    headingDeg: 180,
    routeProgressPercent: 100,
    onSceneTimerSeconds: 310,
    lightsActive: true,
    turnInstruction: 'Parked at residential scene - Paramedics administering Nebulizer',
    equipmentStatus: {
      defibrillator: true,
      oxygenLevelPercent: 84,
      ventilator: false,
      suctionUnit: true,
    },
    patientInfo: {
      name: 'Eleanor Vance',
      age: 72,
      gender: 'Female',
      complaint: 'Acute Exacerbation of COPD with severe wheezing & dyspnea',
      acuity: 'Urgent',
      vitals: {
        heartRate: 98,
        bloodPressure: '138/86',
        oxygenSaturation: 89,
        respiratoryRate: 26,
        temperature: 37.2,
        ecgRhythm: 'Sinus Tachycardia',
      },
      notes: 'Albuterol / Ipratropium nebulizer treatment initiated in living room. Patient responding favorably, preparing for stair-chair transfer.',
    },
    timelineLogs: [
      { timestamp: '10:14 AM', status: AmbulanceStatus.EnRouteToScene, note: 'Dispatched Code 2 to residential address.' },
      { timestamp: '10:21 AM', status: AmbulanceStatus.AtScene, note: 'Unit arrived on scene. Paramedics entered residence with trauma bag & nebulizer.' },
    ],
  },
  {
    id: 'amb-05',
    unitNumber: 'D-401',
    status: AmbulanceStatus.AtHospital,
    etaMinutes: 0,
    speedMph: 0,
    vehicleType: 'ALS',
    bayNumber: 'Trauma Bay 04',
    driverName: 'EMT Lucas Reed',
    paramedicName: 'Paramedic Rachel Adams',
    currentAddress: 'MediFlow Trauma Bay 04 (Ingress Ramp)',
    fuelLevelPercent: 91,
    gpsCoords: { x: 53, y: 47 },
    headingDeg: 270,
    routeProgressPercent: 0,
    lightsActive: false,
    turnInstruction: 'Trauma Bay 4 Ingress Ramp Handover',
    equipmentStatus: {
      defibrillator: true,
      oxygenLevelPercent: 90,
      ventilator: true,
      suctionUnit: true,
    },
    patientInfo: {
      name: 'Samuel Green',
      age: 44,
      gender: 'Male',
      complaint: 'Right Femur Fracture & Lacerations',
      acuity: 'Stable',
      vitals: {
        heartRate: 86,
        bloodPressure: '124/78',
        oxygenSaturation: 99,
      },
      notes: 'Handed over to Orthopedic Trauma Attending Dr. Chen in Bay 4. Traction splint in place.',
    },
    timelineLogs: [
      { timestamp: '09:50 AM', status: AmbulanceStatus.EnRouteToScene, note: 'Dispatched to construction site.' },
      { timestamp: '10:02 AM', status: AmbulanceStatus.AtScene, note: 'Leg splinted and immobilized.' },
      { timestamp: '10:14 AM', status: AmbulanceStatus.TransportingToHospital, note: 'En route to Trauma Center.' },
      { timestamp: '10:28 AM', status: AmbulanceStatus.AtHospital, note: 'Patient successfully delivered to ER Bay 4 trauma team.' },
    ],
  },
];

export const MOCK_BROUGHT_DEAD_RECORDS: BroughtDeadRecord[] = [
    { id: 'bd-001', name: 'Unknown', age: 50, gender: 'Male', dateTimeOfArrival: '2024-07-25T14:30:00Z', broughtInBy: 'Police', circumstances: 'Found unresponsive in a public park.', preliminaryCause: 'Suspected cardiac arrest.' }
];

export const MOCK_INCIDENT_REPORTS: IncidentReport[] = [
  {
    id: 'inc-001',
    type: IncidentType.MedicationError,
    patientId: 'pat-001',
    dateReported: '2024-07-26T10:00:00Z',
    reportedBy: 'Jackie Smith',
    description: 'Patient was administered 10mg of Warfarin instead of the prescribed 5mg due to a transcription error.',
    medicationInvolved: 'Warfarin',
    status: IncidentStatus.Pending,
  },
];

export const MOCK_ER_QUEUE: QueueItem[] = [
    {
        id: 1,
        bayNumber: 1,
        complaint: 'Difficulty breathing and chest tightness.',
        vitals: {
            heartRate: 115,
            bloodPressure: '150/90',
            oxygenSaturation: 91,
            temperature: 37.1
        },
        result: {
            priority: TriagePriority.CRITICAL,
            rationale: 'Low oxygen saturation and tachycardia require immediate attention.'
        }
    },
];


export const MOCK_MORTUARY_RECORDS: MortuaryRecord[] = [
    {
        id: 'mort-001',
        patientId: 'pat-001',
        name: 'John Smith',
        age: 65,
        gender: 'Male',
        dateOfDeath: '2024-07-28T14:30:00Z',
        causeOfDeath: 'Myocardial Infarction',
        storageLocation: 'Locker B-07',
        status: MortuaryStatus.Admitted,
        dateAdmitted: new Date().toISOString(),
        chainOfCustody: [
            { timestamp: new Date().toISOString(), person: 'Admin User', action: 'Case Registered.' }
        ]
    }
];

export const MOCK_COMPLAINTS: ComplaintTicket[] = [
  {
    id: 'comp-001',
    patientId: 'pat-005',
    patientName: 'Alex Ray',
    submittedAt: '2024-07-28T10:00:00Z',
    complaintText: 'Billing overcharge for CT scan.',
    channel: 'Portal',
    status: ComplaintStatus.OPEN,
    category: ComplaintCategory.BILLING,
    urgency: ComplaintUrgency.MEDIUM,
    summary: 'Charge dispute for CT scan.',
    assignedTo: 'user-adm-01',
    assignedToName: 'Admin User',
    history: [
      { timestamp: '2024-07-28T10:00:00Z', action: 'Complaint Submitted.', actor: 'Alex Ray' },
    ],
  },
];

export const MOCK_PHARMACY_INVENTORY: PharmacyInventoryItem[] = [
    { id: 'pharm-001', drugName: 'Ciprofloxacin', stockQuantity: 150, reorderLevel: 50, costPerUnit: 25 },
];

export const MOCK_ADR_REPORTS: ADRReport[] = [];

export const MOCK_LAB_TESTS: LabTest[] = [
  {
    id: 'lab-001',
    patientId: 'pat-001',
    patientName: 'John Smith',
    testName: 'Complete Blood Count (CBC)',
    orderedBy: 'Dr. Evelyn Reed',
    orderedAt: '2024-07-28T10:00:00Z',
    status: LabTestStatus.COMPLETED,
    sampleId: 'SMP-001-A',
    completedAt: '2024-07-28T14:00:00Z',
    results: [
      { parameter: 'Hemoglobin', value: '14.2', referenceRange: '13.5-17.5', isAbnormal: false },
      { parameter: 'WBC Count', value: '11.5', referenceRange: '4.5-11.0', isAbnormal: true },
      { parameter: 'Platelets', value: '210', referenceRange: '150-450', isAbnormal: false },
    ]
  },
  {
    id: 'lab-002',
    patientId: 'pat-005',
    patientName: 'Alex Ray',
    testName: 'Basic Metabolic Panel',
    orderedBy: 'Dr. James Wilson',
    orderedAt: '2024-07-27T10:00:00Z',
    status: LabTestStatus.COMPLETED,
    sampleId: 'SMP-005-B',
    completedAt: '2024-07-27T16:00:00Z',
    results: [
      { parameter: 'Glucose', value: '105', referenceRange: '70-99', isAbnormal: true },
      { parameter: 'Sodium', value: '138', referenceRange: '135-145', isAbnormal: false },
    ]
  }
];
