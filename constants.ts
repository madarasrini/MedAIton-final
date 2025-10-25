import { PatientRecord, Bed, BedStatus, BillingItem, Ambulance, AmbulanceStatus, BroughtDeadRecord, Appointment, AppointmentStatus, DoctorSpecialty, IncidentReport, IncidentType, IncidentStatus, IncidentSeverity, QueueItem, TriagePriority, MortuaryRecord, MortuaryStatus, ComplaintTicket, ComplaintStatus, ComplaintUrgency, ComplaintCategory, PharmacyInventoryItem, ADRReport, LabTest, LabTestStatus, VitalSignHistory } from './types';

export const MOCK_BEDS: Bed[] = [
  { id: 'bed-101', ward: 'Cardiology', bedNumber: 101, status: BedStatus.Occupied, patientId: 'pat-001' },
  { id: 'bed-102', ward: 'Cardiology', bedNumber: 102, status: BedStatus.Available },
  { id: 'bed-103', ward: 'Cardiology', bedNumber: 103, status: BedStatus.Cleaning },
  { id: 'bed-201', ward: 'Neurology', bedNumber: 201, status: BedStatus.Occupied, patientId: 'pat-002' },
  { id: 'bed-202', ward: 'Neurology', bedNumber: 202, status: BedStatus.Available },
  { id: 'bed-301', ward: 'General', bedNumber: 301, status: BedStatus.Occupied, patientId: 'pat-003' },
  { id: 'bed-302', ward: 'General', bedNumber: 302, status: BedStatus.Available },
  { id: 'bed-303', ward: 'General', bedNumber: 303, status: BedStatus.Available },
  { id: 'bed-401', ward: 'Pediatrics', bedNumber: 401, status: BedStatus.Occupied, patientId: 'pat-004' },
  { id: 'bed-402', ward: 'Pediatrics', bedNumber: 402, status: BedStatus.Cleaning },
  { id: 'bed-403', ward: 'Pediatrics', bedNumber: 403, status: BedStatus.Available },
  { id: 'bed-501', ward: 'General', bedNumber: 501, status: BedStatus.Occupied, patientId: 'pat-005' },
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
        
        currentHR += (Math.random() - 0.5) * 4; // small fluctuations
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
        patientId: 'pat-005', // Alex Ray
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
  { id: 'amb-01', unitNumber: 'A101', status: AmbulanceStatus.Available },
  { id: 'amb-02', unitNumber: 'A102', status: AmbulanceStatus.TransportingToHospital, etaMinutes: 8, patientInfo: { complaint: 'Chest pain', vitals: { heartRate: 120, bloodPressure: '150/95' } } },
  { id: 'amb-03', unitNumber: 'B201', status: AmbulanceStatus.EnRouteToScene },
  { id: 'amb-04', unitNumber: 'C301', status: AmbulanceStatus.AtScene },
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
    description: 'Patient was administered 10mg of Warfarin instead of the prescribed 5mg due to a transcription error from the doctor\'s notes to the medication chart.',
    medicationInvolved: 'Warfarin',
    status: IncidentStatus.Pending,
  },
  {
    id: 'inc-002',
    type: IncidentType.ADR,
    patientId: 'pat-003',
    dateReported: '2024-07-25T15:20:00Z',
    reportedBy: 'Jackie Smith',
    description: 'After the first dose of Penicillin, the patient developed a widespread urticarial rash and mild shortness of breath. The medication was immediately discontinued.',
    medicationInvolved: 'Penicillin',
    status: IncidentStatus.Analyzed,
    analysis: {
        severity: IncidentSeverity.Moderate,
        rootCause: "Patient had an undocumented allergy to penicillin. Pre-administration allergy checks were not sufficiently thorough.",
        correctivePlan: "1. Update patient record with penicillin allergy.\n2. Reinforce protocol for allergy verification before administering new medications.\n3. Monitor patient for any further reaction."
    }
  },
  {
    id: 'inc-003',
    type: IncidentType.Materiovigilance,
    patientId: 'pat-005',
    dateReported: '2024-07-24T09:00:00Z',
    reportedBy: 'Tech Officer',
    description: 'The infusion pump (Model XYZ-123) malfunctioned, delivering the IV fluids at a faster rate than programmed. The error was caught quickly by the attending nurse, and the patient was unharmed.',
    status: IncidentStatus.Resolved,
    analysis: {
        severity: IncidentSeverity.Mild,
        rootCause: "A software glitch in the infusion pump's firmware caused an incorrect dosage calculation.",
        correctivePlan: "1. All pumps of Model XYZ-123 have been recalled and sent for a firmware update.\n2. Nurses have been instructed to double-check infusion rates manually for the first 15 minutes."
    }
  }
];

export const MOCK_ER_QUEUE: QueueItem[] = [
    {
        id: Date.now() + 1,
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
            rationale: 'Symptoms are indicative of a potential cardiac or respiratory emergency. Low oxygen saturation and tachycardia require immediate attention.'
        }
    },
    {
        id: Date.now() + 2,
        bayNumber: 2,
        complaint: 'High fever (103°F) and persistent cough for two days.',
        vitals: {
            heartRate: 105,
            bloodPressure: '130/85',
            oxygenSaturation: 96,
            temperature: 39.4,
            respiratoryRate: 22
        },
        result: {
            priority: TriagePriority.URGENT,
            rationale: 'High fever and respiratory symptoms suggest a significant infection, such as pneumonia, requiring prompt evaluation.'
        }
    },
    {
        id: Date.now() + 3,
        bayNumber: 3,
        complaint: 'Twisted ankle during a run, mild swelling and pain.',
        vitals: {
            heartRate: 80,
            bloodPressure: '120/80',
            oxygenSaturation: 99,
            temperature: 37.0
        },
        result: {
            priority: TriagePriority.NON_URGENT,
            rationale: 'Localized injury with stable vitals. Patient can be seen after more critical cases are addressed.'
        }
    }
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
            { timestamp: new Date().toISOString(), person: 'Admin User', action: 'Case Registered.' },
            { timestamp: new Date().toISOString(), person: 'Dr. Evelyn Reed', action: 'Death Declaration Signed.' }
        ]
    },
    {
        id: 'mort-002',
        name: 'Jane Doe',
        age: 45,
        gender: 'Female',
        dateOfDeath: '2024-07-27T08:00:00Z',
        causeOfDeath: 'Complications from Pneumonia',
        storageLocation: 'Locker A-02',
        status: MortuaryStatus.Released,
        dateAdmitted: '2024-07-27T09:15:00Z',
        dateReleased: '2024-07-28T11:00:00Z',
        releasedTo: 'Robert Doe (Spouse)',
        chainOfCustody: [
            { timestamp: '2024-07-27T09:15:00Z', person: 'Admin User', action: 'Case Registered.' },
            { timestamp: '2024-07-28T11:00:00Z', person: 'Admin User', action: 'Body released to Robert Doe.' }
        ]
    }
];

export const MOCK_COMPLAINTS: ComplaintTicket[] = [
  {
    id: 'comp-001',
    patientId: 'pat-005',
    patientName: 'Alex Ray',
    submittedAt: '2024-07-28T10:00:00Z',
    complaintText: 'The billing statement I received seems to have an overcharge for the CT scan. The quoted price was much lower than what is on the bill. Can someone please look into this?',
    channel: 'Portal',
    status: ComplaintStatus.OPEN,
    category: ComplaintCategory.BILLING,
    urgency: ComplaintUrgency.MEDIUM,
    summary: 'Patient is disputing a charge for a CT scan on their bill.',
    assignedTo: 'user-adm-01',
    assignedToName: 'Admin User',
    history: [
      { timestamp: '2024-07-28T10:00:00Z', action: 'Complaint Submitted.', actor: 'Alex Ray' },
      { timestamp: '2024-07-28T10:00:15Z', action: 'AI Analysis Complete. Assigned to Admin.', actor: 'System (AI)' },
    ],
  },
  {
    id: 'comp-002',
    patientId: 'pat-002',
    patientName: 'Emily Johnson',
    submittedAt: '2024-07-27T15:30:00Z',
    complaintText: 'The waiting time for my neurology appointment was over 2 hours past the scheduled time. This is unacceptable, especially for someone suffering from a migraine.',
    channel: 'Portal',
    status: ComplaintStatus.IN_PROGRESS,
    category: ComplaintCategory.WAIT_TIME,
    urgency: ComplaintUrgency.HIGH,
    summary: 'Patient expresses frustration over a long wait time for a neurology appointment.',
    assignedTo: 'user-doc-03',
    assignedToName: 'Dr. Chloe Davis',
    resolutionNotes: 'Contacted patient to apologize. Reviewing scheduling procedures to prevent this in the future.',
    history: [
      { timestamp: '2024-07-27T15:30:00Z', action: 'Complaint Submitted.', actor: 'Emily Johnson' },
      { timestamp: '2024-07-27T15:30:12Z', action: 'AI Analysis Complete.', actor: 'System (AI)' },
      { timestamp: '2024-07-28T09:00:00Z', action: 'Assigned to Dr. Chloe Davis.', actor: 'Admin User' },
    ],
  },
  {
    id: 'comp-003',
    patientId: 'pat-001',
    patientName: 'John Smith',
    submittedAt: '2024-07-26T11:00:00Z',
    complaintText: 'The restroom in the cardiology ward was not clean.',
    channel: 'In-Person',
    status: ComplaintStatus.RESOLVED,
    category: ComplaintCategory.FACILITIES,
    urgency: ComplaintUrgency.LOW,
    summary: 'Patient reported an unclean restroom in the cardiology ward.',
    assignedTo: 'user-eng-01',
    assignedToName: 'Tech Officer',
    resolutionNotes: 'Housekeeping staff was dispatched immediately to clean and sanitize the restroom. Ward nurse confirmed resolution.',
    history: [
      { timestamp: '2024-07-26T11:00:00Z', action: 'Complaint registered by staff.', actor: 'Admin User' },
      { timestamp: '2024-07-26T11:00:10Z', action: 'AI Analysis Complete. Assigned to Engineering.', actor: 'System (AI)' },
      { timestamp: '2024-07-26T11:30:00Z', action: 'Status changed to Resolved.', actor: 'Admin User' },
    ],
  },
];

export const MOCK_PHARMACY_INVENTORY: PharmacyInventoryItem[] = [
    { id: 'pharm-001', drugName: 'Ciprofloxacin', stockQuantity: 150, reorderLevel: 50, costPerUnit: 25 },
    { id: 'pharm-002', drugName: 'Acetaminophen', stockQuantity: 85, reorderLevel: 100, costPerUnit: 15 },
    { id: 'pharm-003', drugName: 'Docusate Sodium', stockQuantity: 40, reorderLevel: 30, costPerUnit: 18 },
    { id: 'pharm-004', drugName: 'Aspirin', stockQuantity: 200, reorderLevel: 100, costPerUnit: 5 },
    { id: 'pharm-005', drugName: 'Sumatriptan', stockQuantity: 60, reorderLevel: 40, costPerUnit: 45 },
    { id: 'pharm-006', drugName: 'Penicillin', stockQuantity: 120, reorderLevel: 75, costPerUnit: 25 },
];

export const MOCK_ADR_REPORTS: ADRReport[] = [
    {
        id: 'adr-001',
        patientId: 'pat-003',
        drugInvolved: 'Penicillin',
        reactionDescription: 'Patient developed a widespread urticarial rash and mild shortness of breath after the first dose.',
        reportedBy: 'Maria Hill',
        reportedAt: new Date().toISOString(),
    }
];

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
    completedAt: '2024-07-28T14:30:00Z',
    results: [
      { parameter: 'WBC', value: '12.5', referenceRange: '4.5-11.0 x10^9/L', isAbnormal: true },
      { parameter: 'RBC', value: '4.8', referenceRange: '4.2-5.9 x10^12/L', isAbnormal: false },
      { parameter: 'Hemoglobin', value: '14.5', referenceRange: '13.5-17.5 g/dL', isAbnormal: false },
      { parameter: 'Platelets', value: '250', referenceRange: '150-450 x10^9/L', isAbnormal: false },
    ],
  },
  {
    id: 'lab-002',
    patientId: 'pat-005',
    patientName: 'Alex Ray',
    testName: 'Basic Metabolic Panel',
    orderedBy: 'Dr. James Wilson',
    orderedAt: '2024-07-29T09:15:00Z',
    status: LabTestStatus.IN_PROGRESS,
    sampleId: 'SMP-002-B',
  },
  {
    id: 'lab-003',
    patientId: 'pat-003',
    patientName: 'Michael Williams',
    testName: 'Sputum Culture',
    orderedBy: 'Dr. James Wilson',
    orderedAt: '2024-07-29T11:00:00Z',
    status: LabTestStatus.SAMPLE_COLLECTED,
    sampleId: 'SMP-003-C',
  },
  {
    id: 'lab-004',
    patientId: 'pat-002',
    patientName: 'Emily Johnson',
    testName: 'Thyroid Panel',
    orderedBy: 'Dr. Chloe Davis',
    orderedAt: '2024-07-29T12:00:00Z',
    status: LabTestStatus.ORDERED,
  },
];