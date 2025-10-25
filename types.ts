export enum UserRole {
  Patient = 'Patient',
  Doctor = 'Doctor',
  Nurse = 'Nurse',
  Admin = 'Admin',
  Pharmacy = 'Pharmacy',
  Engineering = 'Engineering & Infrastructure',
  LabTechnician = 'Lab Technician',
}

export enum DoctorSpecialty {
  Cardiologist = 'Cardiologist',
  Dermatologist = 'Dermatologist',
  Neurologist = 'Neurologist',
  Oncologist = 'Oncologist',
  Pediatrician = 'Pediatrician',
  General = 'General Practitioner',
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  password?: string;
  specialty?: DoctorSpecialty;
  recordIds?: string[]; // Link patient user to one or more patient records
  experienceYears?: number;
  profilePhotoUrl?: string;
  patientsTreated?: number;
  patientsCured?: number;
  patientsUndergoingTreatment?: number;
}

export enum TriagePriority {
    CRITICAL = 'CRITICAL',
    URGENT = 'URGENT',
    NON_URGENT = 'NON_URGENT',
}

export interface TriageResult {
    priority: TriagePriority;
    rationale: string;
}

export type MedicationTiming = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export interface PrescriptionItem {
  drug: string;
  dosage: string;
  frequency: string;
  timing?: MedicationTiming[];
  notes?: string;
}

export interface Prescription extends PrescriptionItem {
    prescribedQuantity: number;
    boughtQuantity: number;
}

export interface PrescriptionSuggestion {
    prescriptions: PrescriptionItem[];
    rationale: string;
}

export interface DailyMealPlan {
    day: string;
    breakfast: string;
    lunch: string;
    dinner: string;
    notes?: string;
}

export interface DietPlanSuggestion {
    rationale: string;
    plan: DailyMealPlan[];
}

export enum BedStatus {
    Available = 'Available',
    Occupied = 'Occupied',
    Cleaning = 'Cleaning',
}

export interface Bed {
    id: string;
    ward: string;
    bedNumber: number;
    status: BedStatus;
    patientId?: string;
}

export interface BillingItem {
    id: string;
    description: string;
    category: 'Consultation' | 'Pharmacy' | 'Lab Test' | 'Procedure';
    cost: number;
}

export interface CaseSheet {
  occupation?: string;
  place?: string;
  presentingIllness?: string;
  pastHistory?: string;
  familyHistory?: string;
  personalHistory?: string;
  treatmentHistory?: string;
  summary?: string;
}

export interface VitalSignHistory {
  timestamp: string; // ISO string
  heartRate: number;
  bloodPressure: string; // "systolic/diastolic"
  oxygenSaturation: number;
}

export interface PatientRecord {
    id: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female' | 'Other';
    chiefComplaint: string;
    vitals: {
        heartRate: number;
        bloodPressure: string;
        temperature: number;
        oxygenSaturation: number;
        respiratoryRate?: number;
    };
    notes: string;
    billing: BillingItem[];
    bedId?: string;
    prescriptions?: Prescription[];
    paymentStatus: 'Paid' | 'Unpaid';
    caseSheet?: CaseSheet;
    email?: string;
    vitalsHistory?: VitalSignHistory[];
}

export enum AmbulanceStatus {
  EnRouteToScene = 'En Route to Scene',
  AtScene = 'At Scene',
  TransportingToHospital = 'Transporting to Hospital',
  Available = 'Available',
  AtHospital = 'At Hospital',
}

export interface Ambulance {
  id: string;
  unitNumber: string;
  status: AmbulanceStatus;
  etaMinutes?: number;
  patientInfo?: {
    complaint: string;
    vitals: {
        heartRate: number;
        bloodPressure: string;
    }
  }
}

export interface BroughtDeadRecord {
    id: string;
    name: string; // "John Doe" if unknown
    age: number;
    gender: 'Male' | 'Female' | 'Other' | 'Unknown';
    dateTimeOfArrival: string;
    broughtInBy: string;
    circumstances: string;
    preliminaryCause: string;
}

export interface QueueItem {
    id: number;
    bayNumber: number;
    complaint: string;
    vitals: Partial<PatientRecord['vitals']>;
    result: TriageResult;
    isAlarming?: boolean;
}

export enum AppointmentStatus {
  Scheduled = 'Scheduled',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  specialty: DoctorSpecialty;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  reason: string;
  status: AppointmentStatus;
}

export enum IncidentType {
  MedicationError = 'Medication Error',
  ADR = 'Adverse Drug Reaction',
  Materiovigilance = 'Materiovigilance',
}

export enum IncidentSeverity {
  Mild = 'Mild',
  Moderate = 'Moderate',
  Severe = 'Severe',
  Critical = 'Critical',
}

export enum IncidentStatus {
  Pending = 'Pending Analysis',
  Analyzed = 'Analyzed',
  Resolved = 'Resolved',
}

export interface IncidentAnalysis {
  severity: IncidentSeverity;
  rootCause: string;
  correctivePlan: string;
}

export interface IncidentReport {
  id: string;
  type: IncidentType;
  patientId: string;
  dateReported: string; // ISO string
  reportedBy: string; // User's name
  description: string;
  medicationInvolved?: string;
  status: IncidentStatus;
  analysis?: IncidentAnalysis;
}

export interface NotificationItem {
  id: number;
  patientId: string;
  drug: string;
  timing: MedicationTiming;
}

// --- Mortuary Types ---
export enum MortuaryStatus {
  Admitted = 'Admitted',
  Released = 'Released',
}

export interface ChainOfCustodyEntry {
  timestamp: string; // ISO string
  person: string;
  action: string;
}

export interface MortuaryRecord {
  id: string;
  patientId?: string; // Optional if not a previous patient
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other' | 'Unknown';
  dateOfDeath: string; // ISO string
  causeOfDeath: string;
  storageLocation: string; // e.g., 'Locker C-4'
  status: MortuaryStatus;
  chainOfCustody: ChainOfCustodyEntry[];
  dateAdmitted: string; // ISO string
  dateReleased?: string; // ISO string
  releasedTo?: string;
}

// --- Complaint Management Types ---
export enum ComplaintStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  RESOLVED = 'Resolved',
  CLOSED = 'Closed',
  ESCALATED = 'Escalated',
}

export enum ComplaintUrgency {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical',
}

export enum ComplaintCategory {
  BILLING = 'Billing Issue',
  STAFF_BEHAVIOR = 'Staff Behavior',
  TREATMENT_QUALITY = 'Treatment Quality',
  WAIT_TIME = 'Wait Time',
  FACILITIES = 'Facilities',
  OTHER = 'Other',
}

export interface ComplaintTicket {
  id: string;
  patientId: string;
  patientName: string;
  submittedAt: string; // ISO string
  complaintText: string;
  channel: 'Portal' | 'Email' | 'In-Person';
  status: ComplaintStatus;
  category: ComplaintCategory;
  urgency: ComplaintUrgency;
  summary: string;
  assignedTo?: string; // User ID of staff
  assignedToName?: string;
  resolutionNotes?: string;
  history: {
    timestamp: string; // ISO string
    action: string;
    actor: string; // e.g., "System (AI)" or user name
  }[];
}

// --- Pharmacy Types ---
export interface PharmacyInventoryItem {
  id: string;
  drugName: string;
  stockQuantity: number;
  reorderLevel: number;
  costPerUnit: number;
}

export interface ADRReport {
  id: string;
  patientId: string;
  drugInvolved: string;
  reactionDescription: string;
  reportedBy: string; // user name
  reportedAt: string; // ISO string
}

// --- LIS Types ---
export enum LabTestStatus {
  ORDERED = 'Ordered',
  SAMPLE_COLLECTED = 'Sample Collected',
  IN_PROGRESS = 'In Progress',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

export interface LabResult {
  parameter: string;
  value: string;
  referenceRange: string;
  isAbnormal: boolean;
}

export interface LabTest {
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
  orderedBy: string; // Doctor's name
  orderedAt: string; // ISO string
  status: LabTestStatus;
  sampleId?: string;
  results?: LabResult[];
  completedAt?: string; // ISO string
}