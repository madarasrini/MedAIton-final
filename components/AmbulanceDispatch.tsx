import React, { useState, useEffect, useRef, FC, useMemo, useCallback } from 'react';
import { Ambulance, AmbulanceStatus, TriagePriority } from '../types.ts';
import { MOCK_AMBULANCES } from '../constants.ts';
import {
  AmbulanceIcon,
  SirenIcon,
  SparklesIcon,
  CheckCircleIcon,
  ActivityIcon,
  MapPinIcon,
  NavigationIcon,
  Volume2Icon,
  VolumeXIcon,
  RadioIcon,
  ShieldAlertIcon,
  XIcon
} from './Icons.tsx';
import { SoundControl } from './SoundControl.tsx';
import { soundService } from '../services/soundService.ts';

// Photorealistic high quality generated ambulance images for each dispatch state
const AMBULANCE_IMAGES: Record<string, string> = {
  Available: '/src/assets/images/ambulance_at_hospital_1786945314604.jpg',
  AtHospital: '/src/assets/images/ambulance_at_hospital_1786945314604.jpg',
  EnRouteToScene: '/src/assets/images/ambulance_moving_en_route_1786945329421.jpg',
  AtScene: '/src/assets/images/ambulance_at_scene_1786945344357.jpg',
  TransportingToHospital: '/src/assets/images/ambulance_transporting_1786945360156.jpg',
};

// District Waypoints on the City Map (x%, y%)
const DISTRICT_ZONES = [
  { id: 'zone-a', name: 'Zone A • Financial District', x: 24, y: 32, address: '824 Grand Ave, Financial District' },
  { id: 'zone-b', name: 'Zone B • North Expressway', x: 76, y: 22, address: 'I-95 Northbound at Mile Marker 18' },
  { id: 'zone-c', name: 'Zone C • West Oakwood Residential', x: 26, y: 74, address: '418 Oakwood Ave, Apt 3B' },
  { id: 'zone-d', name: 'Zone D • East Harbor Medical Tech', x: 82, y: 68, address: '1250 Broadway Tech Center' },
];

const HOSPITAL_BASE = { x: 50, y: 50, name: 'MediFlow Trauma Center Emergency Base' };

interface AmbulanceDispatchProps {
  onAdmitToERQueue?: (patient: {
    bayNumber?: number;
    complaint: string;
    vitals: { heartRate: number; bloodPressure: string; oxygenSaturation?: number; temperature?: number };
    result: { priority: TriagePriority; rationale: string };
  }) => void;
}

interface IncidentPreset {
  title: string;
  location: string;
  coords: { x: number; y: number };
  priority: 'Code 1 (Routine)' | 'Code 2 (Urgent)' | 'Code 3 (Emergency Hot)';
  complaint: string;
  acuity: 'Critical' | 'Urgent' | 'Stable';
  vitals: {
    heartRate: number;
    bloodPressure: string;
    oxygenSaturation: number;
    respiratoryRate: number;
    temperature?: number;
    ecgRhythm: 'Normal Sinus Rhythm' | 'Sinus Tachycardia' | 'Atrial Fibrillation' | 'Ventricular Tachycardia' | 'STEMI / ST Elevation';
  };
}

const INCIDENT_PRESETS: IncidentPreset[] = [
  {
    title: 'Acute STEMI / Cardiac Alert',
    location: '824 Grand Ave, Financial District',
    coords: { x: 24, y: 32 },
    priority: 'Code 3 (Emergency Hot)',
    complaint: 'Crushing sub-sternal chest pain radiating to jaw with diaphoresis',
    acuity: 'Critical',
    vitals: {
      heartRate: 122,
      bloodPressure: '168/102',
      oxygenSaturation: 92,
      respiratoryRate: 24,
      temperature: 36.9,
      ecgRhythm: 'STEMI / ST Elevation',
    },
  },
  {
    title: 'Multi-Vehicle Highway Collision',
    location: 'I-95 Northbound at Mile Marker 18',
    coords: { x: 76, y: 22 },
    priority: 'Code 3 (Emergency Hot)',
    complaint: 'High-speed 3-car collision with rollover & trapped occupant extrication',
    acuity: 'Critical',
    vitals: {
      heartRate: 110,
      bloodPressure: '115/75',
      oxygenSaturation: 96,
      respiratoryRate: 20,
      temperature: 37.0,
      ecgRhythm: 'Sinus Tachycardia',
    },
  },
  {
    title: 'Severe Respiratory Crisis (COPD)',
    location: '418 Oakwood Ave, Apt 3B',
    coords: { x: 26, y: 74 },
    priority: 'Code 2 (Urgent)',
    complaint: 'Extreme shortness of breath, audible wheezing & cyanotic lips',
    acuity: 'Urgent',
    vitals: {
      heartRate: 104,
      bloodPressure: '142/90',
      oxygenSaturation: 87,
      respiratoryRate: 28,
      temperature: 37.2,
      ecgRhythm: 'Sinus Tachycardia',
    },
  },
  {
    title: 'Suspected Acute Stroke / FAST Alert',
    location: '1250 Broadway Senior Living Center',
    coords: { x: 82, y: 68 },
    priority: 'Code 3 (Emergency Hot)',
    complaint: 'Sudden onset right facial droop, slurred speech & arm weakness',
    acuity: 'Critical',
    vitals: {
      heartRate: 88,
      bloodPressure: '178/104',
      oxygenSaturation: 97,
      respiratoryRate: 18,
      temperature: 36.8,
      ecgRhythm: 'Atrial Fibrillation',
    },
  },
];

export const AmbulanceDispatch: FC<AmbulanceDispatchProps> = ({ onAdmitToERQueue }) => {
  const [ambulances, setAmbulances] = useState<Ambulance[]>(() => {
    try {
      const saved = localStorage.getItem('mediflow_ambulance_fleet_v3');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed loading ambulances from localStorage', e);
    }
    return MOCK_AMBULANCES;
  });

  const [activeTab, setActiveTab] = useState<'grid' | 'map' | 'telemetry'>('grid');
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string>('amb-02');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [selectedUnitForDispatch, setSelectedUnitForDispatch] = useState<string>('');
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1); // 0 = paused, 1 = 1x, 2 = 2x, 4 = 4x
  const [isAutoDemoActive, setIsAutoDemoActive] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Live CAD Radio Transcripts Feed
  const [radioLogs, setRadioLogs] = useState<Array<{ id: string; time: string; sender: string; message: string; priority: string }>>([
    { id: 'cad-init-1', time: '10:24:10', sender: 'DISPATCH CAD', message: 'Unit A-102 en route to Trauma Base with STEMI patient. Cath Lab pre-alert active.', priority: 'Code 3' },
    { id: 'cad-init-2', time: '10:23:45', sender: 'UNIT B-201', message: 'Speeding North on Grand Ave, ETA 3 minutes to collision scene.', priority: 'Code 3' },
    { id: 'cad-init-3', time: '10:22:15', sender: 'UNIT C-301', message: 'Albuterol nebulizer cycle 1 delivered. Patient SpO2 improved from 85% to 89%.', priority: 'Code 2' },
  ]);

  // Custom Dispatch Form state
  const [dispatchForm, setDispatchForm] = useState({
    patientName: '',
    patientAge: 48,
    patientGender: 'Male',
    incidentLocation: '824 Grand Ave, Financial District',
    coords: { x: 24, y: 32 },
    priorityCode: 'Code 3 (Emergency Hot)' as 'Code 1 (Routine)' | 'Code 2 (Urgent)' | 'Code 3 (Emergency Hot)',
    complaint: 'Severe crushing chest pain and acute shortness of breath',
    acuity: 'Critical' as 'Critical' | 'Urgent' | 'Stable',
    selectedUnitId: '',
  });

  // Save to local storage on change
  useEffect(() => {
    try {
      localStorage.setItem('mediflow_ambulance_fleet_v3', JSON.stringify(ambulances));
    } catch (e) {
      console.warn('Failed saving ambulances to localStorage', e);
    }
  }, [ambulances]);

  // Web Audio Synthesizer for realistic ambulance siren & monitor beeps
  const playAudioTone = useCallback((type: 'wail' | 'yelp' | 'chime' | 'ecg-beep' | 'defib-shock' = 'wail') => {
    if (!soundService.isSoundAllowed()) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'wail') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1150, ctx.currentTime + 0.6);
        osc.frequency.linearRampToValueAtTime(650, ctx.currentTime + 1.2);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.25);
      } else if (type === 'yelp') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(750, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(1300, ctx.currentTime + 0.18);
        osc.frequency.linearRampToValueAtTime(750, ctx.currentTime + 0.36);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'ecg-beep') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(950, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
      } else if (type === 'defib-shock') {
        // High voltage electric discharge zap
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(2200, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        // High-tech radio chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Ignore audio autoplay restrictions
    }
  }, [isSoundMuted]);

  // Text-to-Speech Dispatch Dispatcher Announcement
  const announceDispatch = useCallback((text: string) => {
    if (!soundService.isSoundAllowed()) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.1;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  // Unique ID counter for radio CAD logs
  const cadRadioCounterRef = useRef(100);

  // Add CAD Radio Message Helper
  const addRadioLog = useCallback((sender: string, message: string, priority: string = 'Info') => {
    cadRadioCounterRef.current += 1;
    const uniqueId = `cad-radio-${Date.now()}-${cadRadioCounterRef.current}-${Math.random().toString(36).slice(2, 7)}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setRadioLogs(prev => [
      { id: uniqueId, time, sender, message, priority },
      ...prev.slice(0, 19), // Keep top 20
    ]);
  }, []);

  // Continuous Dynamic Real-Time Simulation Engine (Runs every 1 second)
  useEffect(() => {
    if (simulationSpeed === 0) return;

    const tickIntervalMs = Math.max(250, 1000 / simulationSpeed);

    const timer = setInterval(() => {
      setAmbulances(prevAmbulances => {
        let updatedList = prevAmbulances.map(amb => {
          let updated = { ...amb };
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          // 1. Available Standing at Hospital Bay
          if (updated.status === AmbulanceStatus.Available) {
            updated.speedMph = 0;
            updated.routeProgressPercent = 0;
            updated.lightsActive = false;
            updated.gpsCoords = updated.gpsCoords || { x: 48, y: 52 };
            updated.turnInstruction = 'Standing by at Trauma Station Ingress Bay 1';
          }

          // 2. En Route to Scene (Rushing from Base to Target Scene)
          else if (updated.status === AmbulanceStatus.EnRouteToScene) {
            updated.lightsActive = true;
            const progress = (updated.routeProgressPercent || 0) + (1.8 * simulationSpeed);
            const targetZone = DISTRICT_ZONES.find(z => updated.destinationAddress?.includes(z.name) || updated.destinationAddress?.includes('Grand Ave')) || DISTRICT_ZONES[0];
            const targetX = targetZone.x;
            const targetY = targetZone.y;
            const startX = HOSPITAL_BASE.x;
            const startY = HOSPITAL_BASE.y;

            if (progress < 100) {
              updated.routeProgressPercent = Number(progress.toFixed(1));
              const currentX = startX + ((targetX - startX) * (progress / 100));
              const currentY = startY + ((targetY - startY) * (progress / 100));
              updated.gpsCoords = { x: Number(currentX.toFixed(2)), y: Number(currentY.toFixed(2)) };

              // Dynamic heading angle
              const dx = targetX - startX;
              const dy = targetY - startY;
              updated.headingDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

              // Live Speed Fluctuations (58 - 72 MPH)
              updated.speedMph = Math.floor(60 + Math.sin(Date.now() / 1500) * 8 + Math.random() * 4);

              // Countdown ETA seconds
              const remainingSec = Math.max(5, Math.round(((100 - progress) / 100) * 240));
              updated.etaSeconds = remainingSec;
              updated.etaMinutes = Math.max(1, Math.ceil(remainingSec / 60));
              updated.distanceKmRemaining = Number(((remainingSec / 60) * 0.8).toFixed(1));
              updated.turnInstruction = `Code 3 Emergency: Speeding towards ${updated.destinationAddress || 'Incident Scene'} (${updated.distanceKmRemaining} km)`;
            } else {
              // Reached Scene!
              updated.status = AmbulanceStatus.AtScene;
              updated.speedMph = 0;
              updated.routeProgressPercent = 100;
              updated.gpsCoords = { x: targetX, y: targetY };
              updated.etaMinutes = 0;
              updated.etaSeconds = 0;
              updated.distanceKmRemaining = 0;
              updated.onSceneTimerSeconds = 1;
              updated.turnInstruction = 'Arrived on Scene • Paramedics initiating mobile patient stabilization';
              updated.timelineLogs = [
                ...(updated.timelineLogs || []),
                { timestamp: nowStr, status: AmbulanceStatus.AtScene, note: `Unit arrived at ${updated.destinationAddress || 'scene'}. Paramedic crew stabilizing patient.` },
              ];
              addRadioLog(`UNIT ${updated.unitNumber}`, `Arrived on scene at ${updated.destinationAddress || 'incident location'}. Initiating patient triage.`, 'At Scene');
              playAudioTone('chime');
            }
          }

          // 3. At Scene (Paramedics stabilizing patient)
          else if (updated.status === AmbulanceStatus.AtScene) {
            updated.speedMph = 0;
            updated.lightsActive = true;
            updated.onSceneTimerSeconds = (updated.onSceneTimerSeconds || 0) + 1;
            updated.turnInstruction = `On-Scene Triage • Care active for ${Math.floor((updated.onSceneTimerSeconds || 0) / 60)}m ${((updated.onSceneTimerSeconds || 0) % 60)}s`;

            // After ~15-20 seconds on scene (or random chance in faster sim), begin transport to ER
            if ((updated.onSceneTimerSeconds || 0) > (16 / simulationSpeed) || (isAutoDemoActive && (updated.onSceneTimerSeconds || 0) > 8)) {
              updated.status = AmbulanceStatus.TransportingToHospital;
              updated.routeProgressPercent = 0;
              updated.etaSeconds = 180;
              updated.etaMinutes = 3;
              updated.distanceKmRemaining = 2.8;
              updated.speedMph = 62;
              updated.destinationAddress = 'MediFlow General Trauma ER, Ingress Bay 2';
              updated.turnInstruction = 'Patient loaded onto stretcher • Code 3 high-speed transport to Trauma ER';
              updated.timelineLogs = [
                ...(updated.timelineLogs || []),
                { timestamp: nowStr, status: AmbulanceStatus.TransportingToHospital, note: 'Patient stabilized. Transporting Code 3 to MediFlow General Trauma Center.' },
              ];
              addRadioLog(`UNIT ${updated.unitNumber}`, `Patient loaded on Stryker gurney. Transporting Code 3 to Trauma ER. Pre-alerting Trauma Team.`, 'Code 3');
              playAudioTone('yelp');
            }
          }

          // 4. Transporting to Hospital (High-speed transit back to Hospital Base 50%, 50%)
          else if (updated.status === AmbulanceStatus.TransportingToHospital) {
            updated.lightsActive = true;
            const progress = (updated.routeProgressPercent || 0) + (1.6 * simulationSpeed);
            const sceneZone = DISTRICT_ZONES.find(z => updated.currentAddress?.includes(z.name) || updated.timelineLogs?.[0]?.note.includes(z.name)) || DISTRICT_ZONES[2];
            const startX = sceneZone.x;
            const startY = sceneZone.y;
            const targetX = HOSPITAL_BASE.x;
            const targetY = HOSPITAL_BASE.y;

            if (progress < 100) {
              updated.routeProgressPercent = Number(progress.toFixed(1));
              const currentX = startX + ((targetX - startX) * (progress / 100));
              const currentY = startY + ((targetY - startY) * (progress / 100));
              updated.gpsCoords = { x: Number(currentX.toFixed(2)), y: Number(currentY.toFixed(2)) };

              // Dynamic heading angle towards hospital
              const dx = targetX - startX;
              const dy = targetY - startY;
              updated.headingDeg = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);

              // Live Speed Fluctuations (54 - 68 MPH)
              updated.speedMph = Math.floor(56 + Math.cos(Date.now() / 1200) * 8 + Math.random() * 4);

              // Real-time Countdown
              const remainingSec = Math.max(4, Math.round(((100 - progress) / 100) * 200));
              updated.etaSeconds = remainingSec;
              updated.etaMinutes = Math.max(1, Math.ceil(remainingSec / 60));
              updated.distanceKmRemaining = Number(((remainingSec / 60) * 0.75).toFixed(1));
              updated.turnInstruction = `Inbound Code 3: Ingress via Arterial Expressway (${updated.distanceKmRemaining} km, ETA ${Math.floor(remainingSec / 60)}m ${remainingSec % 60}s)`;

              // Live in-transit patient vitals oscillations
              if (updated.patientInfo?.vitals) {
                const hrNoise = Math.floor(Math.random() * 3) - 1;
                const newHr = Math.max(60, Math.min(145, updated.patientInfo.vitals.heartRate + hrNoise));
                updated.patientInfo = {
                  ...updated.patientInfo,
                  vitals: {
                    ...updated.patientInfo.vitals,
                    heartRate: newHr,
                    oxygenSaturation: Math.min(100, Math.max(88, (updated.patientInfo.vitals.oxygenSaturation || 94) + (Math.random() > 0.8 ? 1 : 0))),
                  },
                };
              }
            } else {
              // Reached Trauma ER Bay!
              updated.status = AmbulanceStatus.AtHospital;
              updated.speedMph = 0;
              updated.routeProgressPercent = 100;
              updated.gpsCoords = { x: HOSPITAL_BASE.x, y: HOSPITAL_BASE.y };
              updated.etaMinutes = 0;
              updated.etaSeconds = 0;
              updated.distanceKmRemaining = 0;
              updated.bayNumber = `Trauma Bay 0${Math.floor(Math.random() * 3) + 1}`;
              updated.turnInstruction = `Arrived at ${updated.bayNumber} • Handing over patient to Attending Physician`;
              updated.timelineLogs = [
                ...(updated.timelineLogs || []),
                { timestamp: nowStr, status: AmbulanceStatus.AtHospital, note: `Unit arrived at ${updated.bayNumber}. Ingress trauma handover in progress.` },
              ];
              addRadioLog(`UNIT ${updated.unitNumber}`, `Arrived at ${updated.bayNumber}. Handing over patient care to Attending ER Physician.`, 'Ingress');
              playAudioTone('chime');
            }
          }

          // 5. At Hospital (Ingress Handover & Sanitization -> Ready for Standby)
          else if (updated.status === AmbulanceStatus.AtHospital) {
            updated.speedMph = 0;
            updated.lightsActive = false;
            updated.gpsCoords = { x: HOSPITAL_BASE.x + 2, y: HOSPITAL_BASE.y - 2 };
            updated.turnInstruction = `${updated.bayNumber || 'Trauma Bay'} • Sanitizing vehicle & restocking oxygen tanks`;

            // Auto-recycle after 12s back to Available
            if (Math.random() < (0.08 * simulationSpeed) || isAutoDemoActive) {
              updated.status = AmbulanceStatus.Available;
              updated.patientInfo = undefined;
              updated.destinationAddress = undefined;
              updated.priorityCode = undefined;
              updated.speedMph = 0;
              updated.routeProgressPercent = 0;
              updated.fuelLevelPercent = Math.min(100, (updated.fuelLevelPercent || 85) + 12);
              if (updated.equipmentStatus) {
                updated.equipmentStatus.oxygenLevelPercent = 100;
              }
              updated.turnInstruction = 'Standing by at Trauma Station Bay 1 ready for 911 dispatch';
              updated.timelineLogs = [
                ...(updated.timelineLogs || []),
                { timestamp: nowStr, status: AmbulanceStatus.Available, note: 'Vehicle sanitized, disinfected & restocked with fresh oxygen. Placed on active standby.' },
              ];
              addRadioLog(`UNIT ${updated.unitNumber}`, `Vehicle sanitized and fully restocked. Unit back on active standby.`, 'Available');
            }
          }

          return updated;
        });

        // Auto-Demo Generator: If auto demo is on and a unit is available, dispatch random emergency incident
        if (isAutoDemoActive) {
          const avail = updatedList.find(a => a.status === AmbulanceStatus.Available);
          if (avail && Math.random() < 0.25) {
            const randomPreset = INCIDENT_PRESETS[Math.floor(Math.random() * INCIDENT_PRESETS.length)];
            const dispatchedUnit: Ambulance = {
              ...avail,
              status: AmbulanceStatus.EnRouteToScene,
              etaMinutes: 3,
              etaSeconds: 190,
              distanceKmRemaining: 2.6,
              speedMph: 66,
              priorityCode: randomPreset.priority,
              destinationAddress: randomPreset.location,
              dispatchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              routeProgressPercent: 0,
              gpsCoords: { x: HOSPITAL_BASE.x, y: HOSPITAL_BASE.y },
              turnInstruction: `Auto-Dispatched Code 3 to ${randomPreset.location}`,
              patientInfo: {
                name: 'Emergency Patient',
                age: 52,
                gender: 'Female',
                complaint: randomPreset.complaint,
                acuity: randomPreset.acuity,
                vitals: { ...randomPreset.vitals },
                notes: `Auto-dispatched for ${randomPreset.complaint}`,
              },
            };
            updatedList = updatedList.map(a => a.id === dispatchedUnit.id ? dispatchedUnit : a);
            addRadioLog('CAD DISPATCH', `Auto-dispatched Unit ${dispatchedUnit.unitNumber} Code 3 to ${randomPreset.location}`, 'Code 3');
            playAudioTone('wail');
          }
        }

        return updatedList;
      });
    }, tickIntervalMs);

    return () => clearInterval(timer);
  }, [simulationSpeed, isAutoDemoActive, addRadioLog, playAudioTone]);

  // Filtered ambulances
  const filteredAmbulances = useMemo(() => {
    return ambulances.filter(amb => {
      const matchesStatus = statusFilter === 'All' || amb.status === statusFilter;
      const matchesSearch =
        amb.unitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        amb.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        amb.paramedicName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        amb.patientInfo?.complaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        amb.patientInfo?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        amb.currentAddress?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        amb.destinationAddress?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [ambulances, statusFilter, searchQuery]);

  // Selected ambulance for detailed telemetry
  const selectedAmbulance = useMemo(() => {
    return ambulances.find(a => a.id === selectedAmbulanceId) || ambulances[0];
  }, [ambulances, selectedAmbulanceId]);

  // Summary counts
  const counts = useMemo(() => {
    return {
      total: ambulances.length,
      available: ambulances.filter(a => a.status === AmbulanceStatus.Available).length,
      enRoute: ambulances.filter(a => a.status === AmbulanceStatus.EnRouteToScene).length,
      atScene: ambulances.filter(a => a.status === AmbulanceStatus.AtScene).length,
      transporting: ambulances.filter(a => a.status === AmbulanceStatus.TransportingToHospital).length,
      atHospital: ambulances.filter(a => a.status === AmbulanceStatus.AtHospital).length,
    };
  }, [ambulances]);

  // Manual Step Forward for a specific unit
  const handleAdvanceUnitStatus = (unitId: string) => {
    setAmbulances(prev =>
      prev.map(amb => {
        if (amb.id !== unitId) return amb;

        let nextStatus = amb.status;
        let note = '';
        let nextEtaSec = amb.etaSeconds;
        let nextSpeed = amb.speedMph;
        let nextProgress = amb.routeProgressPercent;

        if (amb.status === AmbulanceStatus.Available) {
          nextStatus = AmbulanceStatus.EnRouteToScene;
          nextEtaSec = 210;
          nextSpeed = 64;
          nextProgress = 10;
          note = 'Manually dispatched Code 3 by Dispatcher.';
          playAudioTone('wail');
          addRadioLog(`UNIT ${amb.unitNumber}`, 'Dispatched Code 3 with lights & siren active.', 'Code 3');
        } else if (amb.status === AmbulanceStatus.EnRouteToScene) {
          nextStatus = AmbulanceStatus.AtScene;
          nextEtaSec = 0;
          nextSpeed = 0;
          nextProgress = 100;
          note = 'Unit arrived at incident scene.';
          playAudioTone('chime');
          addRadioLog(`UNIT ${amb.unitNumber}`, 'Arrived on scene. Crew beginning stabilization.', 'At Scene');
        } else if (amb.status === AmbulanceStatus.AtScene) {
          nextStatus = AmbulanceStatus.TransportingToHospital;
          nextEtaSec = 180;
          nextSpeed = 60;
          nextProgress = 20;
          note = 'Patient loaded on Stryker gurney. En route to ER Trauma Center.';
          playAudioTone('yelp');
          addRadioLog(`UNIT ${amb.unitNumber}`, 'Transporting Code 3 to ER Trauma Bay.', 'Code 3');
        } else if (amb.status === AmbulanceStatus.TransportingToHospital) {
          nextStatus = AmbulanceStatus.AtHospital;
          nextEtaSec = 0;
          nextSpeed = 0;
          nextProgress = 100;
          note = 'Arrived at Hospital ER Trauma Bay.';
          playAudioTone('chime');
          addRadioLog(`UNIT ${amb.unitNumber}`, 'Arrived at ER Ingress Bay. Patient handover active.', 'Ingress');
        } else if (amb.status === AmbulanceStatus.AtHospital) {
          nextStatus = AmbulanceStatus.Available;
          nextProgress = 0;
          note = 'Handover complete. Unit sanitized and ready for dispatch.';
          addRadioLog(`UNIT ${amb.unitNumber}`, 'Unit sanitized & restocked. Ready at Bay.', 'Available');
        }

        return {
          ...amb,
          status: nextStatus,
          etaSeconds: nextEtaSec,
          etaMinutes: nextEtaSec ? Math.ceil(nextEtaSec / 60) : 0,
          speedMph: nextSpeed,
          routeProgressPercent: nextProgress,
          timelineLogs: [
            ...(amb.timelineLogs || []),
            {
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: nextStatus,
              note,
            },
          ],
        };
      })
    );

    setNotification(`Advancing Unit to next emergency stage.`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Dispatch Emergency handler
  const handleExecuteDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    const unitToDispatch = ambulances.find(
      a => a.id === (dispatchForm.selectedUnitId || selectedUnitForDispatch || ambulances.find(u => u.status === AmbulanceStatus.Available)?.id)
    );

    if (!unitToDispatch) {
      alert('No available ambulance selected.');
      return;
    }

    const updatedUnit: Ambulance = {
      ...unitToDispatch,
      status: AmbulanceStatus.EnRouteToScene,
      etaMinutes: 4,
      etaSeconds: 220,
      distanceKmRemaining: 3.2,
      speedMph: 66,
      routeProgressPercent: 0,
      gpsCoords: { x: HOSPITAL_BASE.x, y: HOSPITAL_BASE.y },
      priorityCode: dispatchForm.priorityCode,
      destinationAddress: dispatchForm.incidentLocation,
      dispatchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      turnInstruction: `Code 3 Dispatched to ${dispatchForm.incidentLocation}`,
      patientInfo: {
        name: dispatchForm.patientName || 'Emergency Patient',
        age: dispatchForm.patientAge,
        gender: dispatchForm.patientGender,
        complaint: dispatchForm.complaint,
        acuity: dispatchForm.acuity,
        vitals: {
          heartRate: 114,
          bloodPressure: '148/94',
          oxygenSaturation: 93,
          respiratoryRate: 22,
          temperature: 37.0,
          ecgRhythm: dispatchForm.acuity === 'Critical' ? 'STEMI / ST Elevation' : 'Sinus Tachycardia',
        },
        notes: `Dispatched for ${dispatchForm.complaint} at ${dispatchForm.incidentLocation}`,
      },
      timelineLogs: [
        ...(unitToDispatch.timelineLogs || []),
        {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          status: AmbulanceStatus.EnRouteToScene,
          note: `Dispatched ${dispatchForm.priorityCode} to ${dispatchForm.incidentLocation}. Complaint: ${dispatchForm.complaint}`,
        },
      ],
    };

    setAmbulances(prev => prev.map(a => (a.id === updatedUnit.id ? updatedUnit : a)));
    setIsDispatchModalOpen(false);
    setSelectedAmbulanceId(updatedUnit.id);

    // Audio effects
    playAudioTone('wail');
    announceDispatch(`Unit ${updatedUnit.unitNumber} dispatched ${updatedUnit.priorityCode} to ${dispatchForm.incidentLocation}`);
    addRadioLog('CAD DISPATCH', `Unit ${updatedUnit.unitNumber} assigned ${updatedUnit.priorityCode} to ${dispatchForm.incidentLocation}`, 'Dispatched');

    setNotification(`Ambulance ${updatedUnit.unitNumber} dispatched Code 3 to ${dispatchForm.incidentLocation}!`);
    setTimeout(() => setNotification(null), 4000);
  };

  // Preset Quick Dispatch loader
  const handleApplyPreset = (preset: IncidentPreset) => {
    setDispatchForm(prev => ({
      ...prev,
      complaint: preset.complaint,
      incidentLocation: preset.location,
      coords: preset.coords,
      priorityCode: preset.priority,
      acuity: preset.acuity,
    }));
  };

  // Direct Admission of Transported Patient into Hospital ER Queue
  const handleAdmitPatientToHospitalQueue = (amb: Ambulance) => {
    if (!amb.patientInfo) return;

    if (onAdmitToERQueue) {
      onAdmitToERQueue({
        complaint: amb.patientInfo.complaint,
        vitals: {
          heartRate: amb.patientInfo.vitals.heartRate,
          bloodPressure: amb.patientInfo.vitals.bloodPressure,
          oxygenSaturation: amb.patientInfo.vitals.oxygenSaturation || 95,
          temperature: amb.patientInfo.vitals.temperature || 37.0,
        },
        result: {
          priority: amb.patientInfo.acuity === 'Critical' ? TriagePriority.CRITICAL : TriagePriority.URGENT,
          rationale: `Inbound Ambulance ${amb.unitNumber} arrival: ${amb.patientInfo.complaint}. Paramedic: ${amb.paramedicName || 'EMS'}`,
        },
      });

      setNotification(`Patient ${amb.patientInfo.name || 'Inbound'} successfully registered into Live Hospital ER Triage Queue!`);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  // Deliver Defibrillator Shock Treatment
  const handleDefibShock = (ambId: string) => {
    playAudioTone('defib-shock');
    setAmbulances(prev =>
      prev.map(amb => {
        if (amb.id !== ambId || !amb.patientInfo) return amb;
        return {
          ...amb,
          patientInfo: {
            ...amb.patientInfo,
            vitals: {
              ...amb.patientInfo.vitals,
              heartRate: 84,
              oxygenSaturation: 98,
              ecgRhythm: 'Normal Sinus Rhythm',
            },
            notes: (amb.patientInfo.notes || '') + ' | 200J biphasic shock delivered. Rhythm converted to Normal Sinus Rhythm.',
          },
        };
      })
    );
    setNotification('⚡ 200J Biphasic Shock Delivered! Cardiac rhythm converted to Normal Sinus Rhythm.');
    setTimeout(() => setNotification(null), 4000);
  };

  // Administer In-Transit Medication
  const handleAdministerMedication = (ambId: string, medName: string) => {
    playAudioTone('chime');
    setAmbulances(prev =>
      prev.map(amb => {
        if (amb.id !== ambId || !amb.patientInfo) return amb;
        let nextHr = amb.patientInfo.vitals.heartRate;
        let nextSpo2 = amb.patientInfo.vitals.oxygenSaturation || 95;

        if (medName.includes('Oxygen')) {
          nextSpo2 = Math.min(100, nextSpo2 + 4);
        } else if (medName.includes('Nitroglycerin')) {
          nextHr = Math.max(75, nextHr - 12);
        } else if (medName.includes('Epinephrine')) {
          nextHr = Math.min(140, nextHr + 15);
        }

        return {
          ...amb,
          patientInfo: {
            ...amb.patientInfo,
            vitals: {
              ...amb.patientInfo.vitals,
              heartRate: nextHr,
              oxygenSaturation: nextSpo2,
            },
            notes: (amb.patientInfo.notes || '') + ` | Paramedic administered ${medName}.`,
          },
        };
      })
    );
    setNotification(`Administered ${medName} to patient. Telemetry updated.`);
    setTimeout(() => setNotification(null), 3000);
  };

  // Reset to default fleet
  const handleResetFleet = () => {
    setAmbulances(MOCK_AMBULANCES);
    localStorage.removeItem('mediflow_ambulance_fleet_v3');
    setNotification('Restored fleet database to default hospital dataset.');
    setTimeout(() => setNotification(null), 3000);
  };

  // Format seconds to mm:ss
  const formatSeconds = (sec?: number) => {
    if (sec === undefined || sec <= 0) return '00:00';
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Get status color palette and label
  const getStatusBadge = (status: AmbulanceStatus) => {
    switch (status) {
      case AmbulanceStatus.Available:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-300',
          dot: 'bg-emerald-500',
          border: 'border-emerald-500',
          pill: 'bg-emerald-600 text-white',
          desc: 'Standing by at Hospital Bay',
        };
      case AmbulanceStatus.EnRouteToScene:
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-500 animate-ping',
          border: 'border-amber-500',
          pill: 'bg-amber-500 text-slate-950 font-bold',
          desc: 'Speeding to Incident Scene',
        };
      case AmbulanceStatus.AtScene:
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-500 animate-pulse',
          border: 'border-rose-500',
          pill: 'bg-rose-600 text-white',
          desc: 'Reached Destination / Treating',
        };
      case AmbulanceStatus.TransportingToHospital:
        return {
          bg: 'bg-indigo-50 text-indigo-800 border-indigo-300',
          dot: 'bg-indigo-500 animate-ping',
          border: 'border-indigo-500',
          pill: 'bg-indigo-600 text-white',
          desc: 'In-Transit Code 3 to ER',
        };
      case AmbulanceStatus.AtHospital:
        return {
          bg: 'bg-purple-50 text-purple-800 border-purple-300',
          dot: 'bg-purple-500',
          border: 'border-purple-500',
          pill: 'bg-purple-600 text-white',
          desc: 'ER Ingress & Patient Handover',
        };
      default:
        return {
          bg: 'bg-slate-50 text-slate-700 border-slate-300',
          dot: 'bg-slate-500',
          border: 'border-slate-400',
          pill: 'bg-slate-600 text-white',
          desc: 'Unknown Status',
        };
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-indigo-500/30 flex items-center gap-3 backdrop-blur-md animate-slide-up">
          <SparklesIcon className="w-5 h-5 text-indigo-400 shrink-0" />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Main Mission Control Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-2xl border border-indigo-500/20">
        {/* Animated Background Strobe Gradients */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-96 h-96 rounded-full bg-rose-600/15 blur-3xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 rounded-full bg-blue-600/15 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                Live Dynamic EMS Emergency Telemetry & Fleet Command
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                CODE 3 REAL-TIME
              </span>
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <AmbulanceIcon className="w-8 h-8 text-indigo-400 inline-block" />
              Dynamic Ambulance Fleet Command
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Continuous live GPS route movement, alternating strobe beacons, active speedometer telemetry, on-scene stabilization timers, and second-by-second ER ETA countdowns.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/15 backdrop-blur-md">
              <button
                onClick={() => setActiveTab('grid')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'
                }`}
              >
                Fleet Grid
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'map' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'
                }`}
              >
                <MapPinIcon className="w-3.5 h-3.5" />
                City Radar Map
              </button>
              <button
                onClick={() => setActiveTab('telemetry')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'telemetry' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-300 hover:text-white'
                }`}
              >
                <ActivityIcon className="w-3.5 h-3.5" />
                In-Transit ECG
              </button>
            </div>

            {/* Emergency Siren & Alarm Audio Snooze/Mute Control */}
            <SoundControl dashboardName="EMS Dispatch" variant="pill" />

            {/* Simulation Speed Controls */}
            <div className="flex items-center bg-white/10 px-2 py-1 rounded-xl border border-white/15 text-xs text-slate-300 gap-1.5">
              <span className="text-[11px] font-semibold text-slate-400">Sim:</span>
              <button
                onClick={() => setSimulationSpeed(simulationSpeed === 0 ? 1 : 0)}
                className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-all ${
                  simulationSpeed === 0 ? 'bg-rose-600 text-white' : 'bg-white/15 text-slate-200 hover:bg-white/25'
                }`}
              >
                {simulationSpeed === 0 ? 'Paused' : '1x Real'}
              </button>
              <button
                onClick={() => setSimulationSpeed(2)}
                className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-all ${
                  simulationSpeed === 2 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                2x
              </button>
              <button
                onClick={() => setSimulationSpeed(4)}
                className={`px-2 py-0.5 rounded-md font-bold text-[11px] transition-all ${
                  simulationSpeed === 4 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                4x Fast
              </button>
            </div>

            {/* Auto-Demo Continuous Simulation Mode */}
            <button
              onClick={() => {
                const next = !isAutoDemoActive;
                setIsAutoDemoActive(next);
                setNotification(next ? 'Auto-Demo Mode Active: Automatic 911 Dispatches enabled!' : 'Auto-Demo Mode Deactivated.');
                setTimeout(() => setNotification(null), 3000);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                isAutoDemoActive
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/60 shadow-lg shadow-emerald-500/20'
                  : 'bg-white/10 text-slate-300 border-white/15 hover:bg-white/20'
              }`}
            >
              <SparklesIcon className={`w-3.5 h-3.5 ${isAutoDemoActive ? 'text-emerald-400 animate-spin' : ''}`} />
              <span>{isAutoDemoActive ? 'Auto-Demo: ON' : 'Auto-Demo'}</span>
            </button>

            {/* Quick 911 Dispatch Button */}
            <button
              onClick={() => {
                const avail = ambulances.find(a => a.status === AmbulanceStatus.Available);
                setSelectedUnitForDispatch(avail ? avail.id : ambulances[0]?.id || '');
                setIsDispatchModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/30 border border-rose-400/40 transition-all active:scale-95"
            >
              <SirenIcon className="w-4 h-4 animate-bounce" />
              Dispatch 911 (Code 3)
            </button>

            {/* Reset Fleet Button */}
            <button
              onClick={handleResetFleet}
              className="px-2.5 py-2 bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold rounded-xl border border-white/15 transition-all"
              title="Reset Fleet to Default Dataset"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Live Status Counter Bento Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-3 border border-white/10">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Fleet</div>
            <div className="text-2xl font-black text-white mt-1">{counts.total} Units</div>
            <div className="text-[11px] text-indigo-300 mt-0.5">Active ALS/BLS</div>
          </div>

          <div className="bg-emerald-500/10 backdrop-blur-md rounded-2xl p-3 border border-emerald-500/30">
            <div className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              At Hospital Bay
            </div>
            <div className="text-2xl font-black text-emerald-300 mt-1">{counts.available}</div>
            <div className="text-[11px] text-emerald-200/70 mt-0.5">Ready for dispatch</div>
          </div>

          <div className="bg-amber-500/10 backdrop-blur-md rounded-2xl p-3 border border-amber-500/30">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              En Route to Scene
            </div>
            <div className="text-2xl font-black text-amber-300 mt-1">{counts.enRoute}</div>
            <div className="text-[11px] text-amber-200/70 mt-0.5">Speeding to location</div>
          </div>

          <div className="bg-rose-500/10 backdrop-blur-md rounded-2xl p-3 border border-rose-500/30">
            <div className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              At Scene
            </div>
            <div className="text-2xl font-black text-rose-300 mt-1">{counts.atScene}</div>
            <div className="text-[11px] text-rose-200/70 mt-0.5">On-site stabilization</div>
          </div>

          <div className="bg-indigo-500/10 backdrop-blur-md rounded-2xl p-3 border border-indigo-500/30">
            <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
              Transporting
            </div>
            <div className="text-2xl font-black text-indigo-300 mt-1">{counts.transporting}</div>
            <div className="text-[11px] text-indigo-200/70 mt-0.5">Code 3 to Trauma ER</div>
          </div>

          <div className="bg-purple-500/10 backdrop-blur-md rounded-2xl p-3 border border-purple-500/30">
            <div className="text-[11px] font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              Hospital Ingress
            </div>
            <div className="text-2xl font-black text-purple-300 mt-1">{counts.atHospital}</div>
            <div className="text-[11px] text-purple-200/70 mt-0.5">Trauma bay handover</div>
          </div>
        </div>
      </div>

      {/* Live CAD Radio Ticker Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-3.5 shadow-md border border-slate-800 flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-600 rounded-lg text-[10px] font-black uppercase tracking-wider text-white shrink-0 shadow animate-pulse">
          <RadioIcon className="w-3.5 h-3.5" />
          <span>EMS Radio CAD</span>
        </div>
        <div className="flex-1 overflow-x-auto whitespace-nowrap text-xs text-slate-300 font-mono scrollbar-none flex items-center gap-4">
          {radioLogs.slice(0, 3).map(log => (
            <div key={log.id} className="inline-flex items-center gap-1.5 border-r border-slate-800 pr-4 shrink-0">
              <span className="text-slate-500 text-[10px]">{log.time}</span>
              <span className="font-bold text-indigo-400">[{log.sender}]:</span>
              <span className="text-slate-200">{log.message}</span>
            </div>
          ))}
        </div>
      </div>

      {/* View: Fleet Command Grid */}
      {activeTab === 'grid' && (
        <div className="space-y-6">
          {/* Filters & Search Toolbar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-4">
            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1">Filter:</span>
              {[
                'All',
                AmbulanceStatus.Available,
                AmbulanceStatus.EnRouteToScene,
                AmbulanceStatus.AtScene,
                AmbulanceStatus.TransportingToHospital,
                AmbulanceStatus.AtHospital,
              ].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === status
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'All' ? 'All Units' : status}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative min-w-[220px]">
              <input
                type="text"
                placeholder="Search unit, crew, complaint..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
            </div>
          </div>

          {/* Ambulance Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAmbulances.map(amb => {
              const badge = getStatusBadge(amb.status);
              const imageSrc =
                amb.status === AmbulanceStatus.Available || amb.status === AmbulanceStatus.AtHospital
                  ? AMBULANCE_IMAGES.Available
                  : amb.status === AmbulanceStatus.EnRouteToScene
                  ? AMBULANCE_IMAGES.EnRouteToScene
                  : amb.status === AmbulanceStatus.AtScene
                  ? AMBULANCE_IMAGES.AtScene
                  : AMBULANCE_IMAGES.TransportingToHospital;

              const isEmergencyMoving =
                amb.status === AmbulanceStatus.EnRouteToScene || amb.status === AmbulanceStatus.TransportingToHospital;

              // Heartbeat duration in seconds based on patient BPM
              const bpm = amb.patientInfo?.vitals.heartRate || 75;
              const beatDurationSec = (60 / bpm).toFixed(2);

              return (
                <div
                  key={amb.id}
                  className={`group relative overflow-hidden bg-white rounded-3xl border-2 transition-all duration-300 hover:shadow-2xl ${badge.border} shadow-md flex flex-col`}
                >
                  {/* Visual Header with Real Image & Dynamic Animated Beacon Overlays */}
                  <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                    <img
                      src={imageSrc}
                      alt={`Ambulance ${amb.unitNumber} - ${amb.status}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-95 group-hover:brightness-100"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>

                    {/* Live Alternating Emergency Strobe Light Bars for active units */}
                    {(isEmergencyMoving || amb.status === AmbulanceStatus.AtScene) && (
                      <div className="absolute top-0 inset-x-0 h-3 flex z-20 overflow-hidden shadow-lg">
                        <div className="flex-1 bg-red-600 animate-strobe-red"></div>
                        <div className="flex-1 bg-blue-600 animate-strobe-blue"></div>
                        <div className="flex-1 bg-red-600 animate-strobe-red"></div>
                        <div className="flex-1 bg-blue-600 animate-strobe-blue"></div>
                        <div className="flex-1 bg-red-600 animate-strobe-red"></div>
                        <div className="flex-1 bg-blue-600 animate-strobe-blue"></div>
                      </div>
                    )}

                    {/* Top Status & Unit Badges */}
                    <div className="absolute top-4 inset-x-3 flex items-center justify-between z-10">
                      <div className="flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                        <AmbulanceIcon className="w-4 h-4 text-indigo-400" />
                        <span className="font-black text-xs text-white tracking-wide">UNIT {amb.unitNumber}</span>
                        {amb.vehicleType && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/40 text-indigo-200 font-bold">
                            {amb.vehicleType}
                          </span>
                        )}
                      </div>

                      {/* Code Badge */}
                      {amb.priorityCode && (
                        <div className="flex items-center gap-1 bg-rose-600 text-white px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shadow-lg border border-rose-400/50 animate-pulse">
                          <SirenIcon className="w-3 h-3" />
                          {amb.priorityCode.includes('Hot') ? 'CODE 3 HOT' : amb.priorityCode}
                        </div>
                      )}
                    </div>

                    {/* Bottom Image Info Banner */}
                    <div className="absolute bottom-3 inset-x-3 flex items-end justify-between z-10">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`}></span>
                          <span className="text-xs font-black text-white tracking-wide uppercase">{amb.status}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 font-medium truncate max-w-[210px]">
                          {badge.desc}
                        </p>
                      </div>

                      {/* Dynamic Speedometer / Telemetry Tag */}
                      {isEmergencyMoving ? (
                        <div className="bg-slate-900/90 border border-amber-400/40 px-3 py-1 rounded-xl text-right backdrop-blur-md shadow-lg">
                          <div className="text-[9px] text-slate-400 font-bold uppercase">Speedometer</div>
                          <div className="text-sm font-black text-amber-400 font-mono flex items-baseline gap-1">
                            {amb.speedMph || 62} <span className="text-[10px] font-normal text-slate-300">MPH</span>
                          </div>
                        </div>
                      ) : amb.status === AmbulanceStatus.AtScene ? (
                        <div className="bg-slate-900/90 border border-rose-400/40 px-3 py-1 rounded-xl text-right backdrop-blur-md shadow-lg">
                          <div className="text-[9px] text-rose-300 font-bold uppercase">On Scene</div>
                          <div className="text-sm font-black text-white font-mono">
                            {formatSeconds(amb.onSceneTimerSeconds || 60)}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-900/80 border border-white/20 px-2.5 py-1 rounded-xl text-right backdrop-blur-md">
                          <div className="text-[9px] text-emerald-400 font-bold uppercase">Status</div>
                          <div className="text-xs font-bold text-white">Standby Ready</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dynamic Progress Bar for Moving Units */}
                  {isEmergencyMoving && (
                    <div className="w-full bg-slate-200 h-2 relative overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 via-rose-500 to-amber-500 transition-all duration-1000 relative"
                        style={{ width: `${Math.max(5, Math.min(100, amb.routeProgressPercent || 0))}%` }}
                      >
                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                      </div>
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Live Turn Instruction / Positioning */}
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                        <span className="flex items-center gap-1">
                          <NavigationIcon className="w-3.5 h-3.5 text-indigo-600" />
                          Live Telemetry Instruction
                        </span>
                        {amb.routeProgressPercent !== undefined && isEmergencyMoving && (
                          <span className="text-indigo-600 font-mono font-bold">
                            {amb.routeProgressPercent}% Completed
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-800 leading-snug">
                        {amb.turnInstruction || amb.currentAddress || 'MediFlow Trauma Center Emergency Base'}
                      </div>
                    </div>

                    {/* In-Transit Patient Card & Live Telemetry (If occupied) */}
                    {amb.patientInfo ? (
                      <div className="bg-gradient-to-br from-indigo-50/80 to-slate-50 rounded-2xl p-3.5 border border-indigo-200/60 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {/* Beating Heart Icon synchronized with exact BPM */}
                            <span
                              className="inline-block text-rose-500 text-sm animate-heart-pump"
                              style={{ animationDuration: `${beatDurationSec}s` }}
                            >
                              ❤️
                            </span>
                            <span className="text-xs font-black text-indigo-950 uppercase tracking-wide">
                              In-Transit Patient
                            </span>
                          </div>
                          {amb.patientInfo.acuity && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                                amb.patientInfo.acuity === 'Critical'
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {amb.patientInfo.acuity}
                            </span>
                          )}
                        </div>

                        <div className="text-xs font-bold text-slate-800">
                          {amb.patientInfo.name || 'Patient'} {amb.patientInfo.age ? `(${amb.patientInfo.age}y)` : ''}
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed font-medium line-clamp-2">
                          {amb.patientInfo.complaint}
                        </p>

                        {/* Vital Signs Strip with animated readings */}
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-indigo-100">
                          <div className="bg-white p-2 rounded-xl border border-indigo-100 text-center shadow-xs">
                            <div className="text-[10px] font-bold text-slate-400">Heart Rate</div>
                            <div className="text-xs font-black text-rose-600 flex items-center justify-center gap-1">
                              <span
                                className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block"
                                style={{ animationDuration: `${beatDurationSec}s` }}
                              ></span>
                              {amb.patientInfo.vitals.heartRate} <span className="text-[9px] font-normal">BPM</span>
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-indigo-100 text-center shadow-xs">
                            <div className="text-[10px] font-bold text-slate-400">Blood Press.</div>
                            <div className="text-xs font-black text-slate-800">
                              {amb.patientInfo.vitals.bloodPressure}
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-indigo-100 text-center shadow-xs">
                            <div className="text-[10px] font-bold text-slate-400">SpO2</div>
                            <div className="text-xs font-black text-emerald-600">
                              {amb.patientInfo.vitals.oxygenSaturation || 96}%
                            </div>
                          </div>
                        </div>

                        {/* ETA & Distance Countdown */}
                        {amb.status === AmbulanceStatus.TransportingToHospital && (
                          <div className="flex items-center justify-between bg-indigo-600 text-white px-3 py-2 rounded-xl font-bold text-xs shadow-md">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                              <span>Trauma ER ETA:</span>
                            </div>
                            <div className="text-amber-300 font-mono text-sm">
                              {formatSeconds(amb.etaSeconds || 180)} ({amb.distanceKmRemaining || 2.4} km)
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Standby Crew & Vehicle Specs (When available) */
                      <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Paramedic Crew & Readiness
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 block">EMT Driver:</span>
                            <span className="font-bold text-slate-700">{amb.driverName || 'EMT Marcus Hayes'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Lead Paramedic:</span>
                            <span className="font-bold text-slate-700">{amb.paramedicName || 'Sarah Jenkins, EMT-P'}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                          <span className="text-slate-500">Fuel: <strong>{amb.fuelLevelPercent || 92}%</strong></span>
                          <span className="text-slate-500">Oxygen: <strong>{amb.equipmentStatus?.oxygenLevelPercent || 100}%</strong></span>
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircleIcon className="w-3 h-3" /> Defib Ready
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Action Controls */}
                    <div className="pt-2 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {/* Primary Stage Advancer */}
                        <button
                          onClick={() => handleAdvanceUnitStatus(amb.id)}
                          className="flex-1 py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <SparklesIcon className="w-3.5 h-3.5 text-indigo-400" />
                          {amb.status === AmbulanceStatus.Available
                            ? 'Dispatch (Code 3)'
                            : amb.status === AmbulanceStatus.EnRouteToScene
                            ? 'Mark Arrived at Scene'
                            : amb.status === AmbulanceStatus.AtScene
                            ? 'Begin Transport to ER'
                            : amb.status === AmbulanceStatus.TransportingToHospital
                            ? 'Arrive at ER Bay'
                            : 'Clear & Standby at Bay'}
                        </button>

                        {/* Siren Test Button */}
                        <button
                          onClick={() => {
                            playAudioTone('wail');
                            setNotification(`Testing emergency siren audio on Unit ${amb.unitNumber}`);
                            setTimeout(() => setNotification(null), 2500);
                          }}
                          className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 transition-all"
                          title="Test Vehicle Emergency Siren"
                        >
                          <SirenIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* En-Route Medical Interventions (If patient active) */}
                      {amb.patientInfo && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdministerMedication(amb.id, 'High-Flow 100% Oxygen')}
                            className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-all"
                          >
                            + High-Flow O2
                          </button>
                          <button
                            onClick={() => handleAdministerMedication(amb.id, 'Sublingual Nitroglycerin')}
                            className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold border border-slate-200 transition-all"
                          >
                            + Nitro Tab
                          </button>
                          <button
                            onClick={() => handleDefibShock(amb.id)}
                            className="flex-1 py-1 px-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg text-[10px] font-black border border-rose-300 transition-all"
                          >
                            ⚡ 200J Defib
                          </button>
                        </div>
                      )}

                      {/* Direct Hospital ER Registration (If arrived or transporting) */}
                      {amb.patientInfo && (amb.status === AmbulanceStatus.AtHospital || amb.status === AmbulanceStatus.TransportingToHospital) && onAdmitToERQueue && (
                        <button
                          onClick={() => handleAdmitPatientToHospitalQueue(amb)}
                          className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold border border-indigo-200 transition-all flex items-center justify-center gap-1.5"
                        >
                          <ShieldAlertIcon className="w-3.5 h-3.5 text-indigo-600" />
                          Register Inbound Patient to ER Triage Queue
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View: City Radar GPS Route Map */}
      {activeTab === 'map' && (
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <MapPinIcon className="w-5 h-5 text-indigo-600" />
                Metro EMS Live City Radar & GPS Route Simulation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time dynamic unit coordinates gliding along routes, active rotating radar scan beam, and one-click incident targeting.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Live GPS Lock:</span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-mono text-xs font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> 99.9% 10Hz Lock
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Visual Radar Grid Canvas / SVG */}
          <div className="relative w-full h-[520px] bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            {/* SVG Background Grid, Animated Flowing Roads & Radar Rings */}
            <svg className="w-full h-full absolute inset-0">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                </pattern>
                <linearGradient id="radarSweepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(99, 102, 241, 0.4)" />
                  <stop offset="40%" stopColor="rgba(99, 102, 241, 0.15)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>

              {/* Grid Background */}
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* Concentric Radar Rings centered around Hospital Base (50%, 50%) */}
              <circle cx="50%" cy="50%" r="70" fill="none" stroke="rgba(99, 102, 241, 0.3)" strokeWidth="1" strokeDasharray="3,3" />
              <circle cx="50%" cy="50%" r="150" fill="none" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1" strokeDasharray="4,4" />
              <circle cx="50%" cy="50%" r="230" fill="none" stroke="rgba(99, 102, 241, 0.18)" strokeWidth="1" />

              {/* Major Arterial Highway Routes with Animated Flowing Dashes */}
              {/* Route 1: Northwest Expressway to Zone A (24%, 32%) */}
              <line x1="50%" y1="50%" x2="24%" y2="32%" stroke="rgba(239, 68, 68, 0.6)" strokeWidth="3" className="animate-route-flow" />
              {/* Route 2: Northeast Highway to Zone B (76%, 22%) */}
              <line x1="50%" y1="50%" x2="76%" y2="22%" stroke="rgba(245, 158, 11, 0.6)" strokeWidth="3" className="animate-route-flow" />
              {/* Route 3: Southwest Parkway to Zone C (26%, 74%) */}
              <line x1="50%" y1="50%" x2="26%" y2="74%" stroke="rgba(59, 130, 246, 0.6)" strokeWidth="3" className="animate-route-flow" />
              {/* Route 4: Southeast Boulevard to Zone D (82%, 68%) */}
              <line x1="50%" y1="50%" x2="82%" y2="68%" stroke="rgba(168, 85, 247, 0.6)" strokeWidth="3" className="animate-route-flow" />
            </svg>

            {/* Rotating Radar Sweep Cone */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] pointer-events-none animate-radar-sweep">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: 'conic-gradient(from 0deg at 50% 50%, rgba(99, 102, 241, 0.35) 0deg, rgba(99, 102, 241, 0.1) 45deg, transparent 90deg, transparent 360deg)',
                }}
              ></div>
            </div>

            {/* Central Hospital Base Landmark */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
              <div className="relative">
                <span className="w-14 h-14 rounded-full bg-indigo-500/30 absolute -inset-2 animate-ping"></span>
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl border-2 border-indigo-300 font-black text-xl">
                  🏥
                </div>
              </div>
              <div className="mt-2 bg-slate-900/95 text-white px-3 py-1 rounded-xl border border-indigo-400/50 text-[10px] font-black tracking-wider shadow-2xl backdrop-blur-md">
                MEDIFLOW TRAUMA BASE
              </div>
            </div>

            {/* District Hotspot Waypoint Markers */}
            {DISTRICT_ZONES.map(zone => (
              <div
                key={zone.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center group cursor-pointer"
                style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
                onClick={() => {
                  setDispatchForm(prev => ({
                    ...prev,
                    incidentLocation: zone.address,
                    coords: { x: zone.x, y: zone.y },
                  }));
                  setIsDispatchModalOpen(true);
                }}
                title="Click to dispatch available ambulance to this zone"
              >
                <div className="w-7 h-7 rounded-xl bg-slate-900/90 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg group-hover:scale-125 transition-transform">
                  📍
                </div>
                <div className="mt-1 bg-slate-950/80 text-slate-300 px-2 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap border border-white/10 group-hover:text-amber-300">
                  {zone.name}
                </div>
              </div>
            ))}

            {/* Dynamic Real-Time Moving Ambulance Tokens */}
            {ambulances.map(amb => {
              const coords = amb.gpsCoords || { x: 50, y: 50 };
              const isMoving = amb.status === AmbulanceStatus.EnRouteToScene || amb.status === AmbulanceStatus.TransportingToHospital;
              const isAtScene = amb.status === AmbulanceStatus.AtScene;

              return (
                <div
                  key={amb.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-30 group cursor-pointer transition-all duration-1000 ease-linear"
                  style={{ left: `${coords.x}%`, top: `${coords.y}%` }}
                  onClick={() => {
                    setSelectedAmbulanceId(amb.id);
                    setActiveTab('telemetry');
                  }}
                >
                  {/* Flashing Emergency Light Ripple Rings for Responding Vehicles */}
                  {(isMoving || isAtScene) && (
                    <>
                      <span className="w-10 h-10 rounded-full bg-rose-500/40 absolute -inset-2 animate-ping"></span>
                      <span className="w-10 h-10 rounded-full bg-blue-500/30 absolute -inset-2 animate-pulse"></span>
                    </>
                  )}

                  {/* Vehicle Body Box */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs border-2 shadow-2xl transition-transform ${
                      amb.status === AmbulanceStatus.Available
                        ? 'bg-emerald-500 text-slate-950 border-white'
                        : amb.status === AmbulanceStatus.EnRouteToScene
                        ? 'bg-amber-500 text-slate-950 border-white'
                        : amb.status === AmbulanceStatus.AtScene
                        ? 'bg-rose-600 text-white border-white animate-pulse'
                        : amb.status === AmbulanceStatus.TransportingToHospital
                        ? 'bg-indigo-600 text-white border-white'
                        : 'bg-purple-600 text-white border-white'
                    }`}
                  >
                    🚑
                  </div>

                  {/* Dynamic Hover Tooltip / Speed Tag */}
                  <div className="absolute left-1/2 -translate-x-1/2 -top-9 bg-slate-900/95 text-white px-2.5 py-1 rounded-xl shadow-2xl border border-white/20 whitespace-nowrap text-[9px] font-black tracking-wide flex items-center gap-1.5 backdrop-blur-md">
                    <span>UNIT {amb.unitNumber}</span>
                    {isMoving && (
                      <span className="text-amber-400 font-mono">
                        {amb.speedMph || 60} MPH
                      </span>
                    )}
                    {amb.status === AmbulanceStatus.TransportingToHospital && amb.etaSeconds && (
                      <span className="text-rose-300">
                        • ETA {formatSeconds(amb.etaSeconds)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View: In-Transit Telemetry & Defibrillator ECG Stream */}
      {activeTab === 'telemetry' && (
        <div className="bg-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-indigo-500/30 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-xs font-black uppercase tracking-widest text-indigo-400">
                  Live Zoll X-Series Telemetry & 12-Lead Monitor Stream
                </span>
              </div>
              <h3 className="text-2xl font-black text-white mt-1 flex items-center gap-2">
                <ActivityIcon className="w-6 h-6 text-rose-500" />
                Live In-Transit Cardiac & Acuity Surveillance
              </h3>
            </div>

            {/* Unit Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Select Unit:</span>
              <select
                value={selectedAmbulanceId}
                onChange={e => setSelectedAmbulanceId(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {ambulances.map(a => (
                  <option key={a.id} value={a.id}>
                    Unit {a.unitNumber} ({a.status}) {a.patientInfo ? `- ${a.patientInfo.name || 'Patient'}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Telemetry Display */}
          {selectedAmbulance ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: ECG Rhythm Waveform */}
              <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase font-mono">LEAD II • 25mm/s • 10mm/mV</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      {selectedAmbulance.patientInfo?.vitals.ecgRhythm || 'Normal Sinus Rhythm'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">FILT: 0.05-150Hz</div>
                </div>

                {/* Animated ECG SVG Monitor Line */}
                <div className="h-44 w-full bg-slate-950 rounded-xl p-3 relative overflow-hidden border border-emerald-500/30 flex items-center shadow-inner">
                  {/* Grid Lines on Monitor */}
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#064e3b15_1px,transparent_1px),linear-gradient(to_bottom,#064e3b15_1px,transparent_1px)] bg-[size:16px_16px]"></div>

                  <svg className="w-full h-full relative z-10" viewBox="0 0 600 120" preserveAspectRatio="none">
                    <path
                      d="M0,60 L40,60 L50,45 L60,75 L70,60 L120,60 L130,20 L140,110 L150,10 L160,75 L170,60 L210,60 L230,45 L240,60 L290,60 L300,20 L310,110 L320,10 L330,75 L340,60 L390,60 L400,45 L410,60 L460,60 L470,20 L480,110 L490,10 L500,75 L510,60 L600,60"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Sweep Line */}
                  <div className="absolute right-4 top-3 text-xs font-mono text-emerald-400 font-bold animate-pulse z-20 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>LIVE TELEMETRY STREAM</span>
                  </div>
                </div>

                {/* ALS Clinical Treatment Interventions Panel */}
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Paramedic In-Transit Interventions
                    </span>
                    <span className="text-xs text-indigo-400 font-bold">
                      Crew: {selectedAmbulance.paramedicName || 'Lead EMT-P'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleAdministerMedication(selectedAmbulance.id, 'High-Flow 100% O2')}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all"
                    >
                      + 100% O2 Mask
                    </button>
                    <button
                      onClick={() => handleAdministerMedication(selectedAmbulance.id, 'Sublingual Nitroglycerin 0.4mg')}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all"
                    >
                      + Sublingual Nitro
                    </button>
                    <button
                      onClick={() => handleAdministerMedication(selectedAmbulance.id, 'IV Epinephrine 1mg')}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all"
                    >
                      + Epinephrine 1mg
                    </button>
                    <button
                      onClick={() => handleDefibShock(selectedAmbulance.id)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      ⚡ Charge & Deliver 200J Shock
                    </button>
                  </div>
                </div>

                {/* Patient Summary & Notes */}
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 text-xs space-y-2">
                  <div className="text-slate-400 font-bold uppercase">Patient Clinical Notes & History</div>
                  <p className="text-slate-300 leading-relaxed font-medium">
                    {selectedAmbulance.patientInfo?.notes ||
                      selectedAmbulance.patientInfo?.complaint ||
                      'Unit standing by ready for dispatch at trauma center.'}
                  </p>
                </div>
              </div>

              {/* Right Column: Digital Vitals Readout Bento */}
              <div className="space-y-4">
                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase flex items-center justify-between">
                    <span>Heart Rate (ECG)</span>
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                  </div>
                  <div className="text-4xl font-black text-rose-500 font-mono mt-1 flex items-baseline gap-2">
                    {selectedAmbulance.patientInfo?.vitals.heartRate || 74}
                    <span className="text-xs font-normal text-slate-400">BPM</span>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase">NIBP Blood Pressure</div>
                  <div className="text-3xl font-black text-indigo-400 font-mono mt-1 flex items-baseline gap-2">
                    {selectedAmbulance.patientInfo?.vitals.bloodPressure || '120/80'}
                    <span className="text-xs font-normal text-slate-400">mmHg</span>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl">
                  <div className="text-xs font-bold text-slate-400 uppercase">Oxygen Saturation (SpO2)</div>
                  <div className="text-3xl font-black text-emerald-400 font-mono mt-1 flex items-baseline gap-2">
                    {selectedAmbulance.patientInfo?.vitals.oxygenSaturation || 99}
                    <span className="text-xs font-normal text-slate-400">% O2</span>
                  </div>
                </div>

                {/* Register Directly to ER Queue Button */}
                {selectedAmbulance.patientInfo && onAdmitToERQueue && (
                  <button
                    onClick={() => handleAdmitPatientToHospitalQueue(selectedAmbulance)}
                    className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-black shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldAlertIcon className="w-4 h-4 text-indigo-200" />
                    Register Inbound Patient to ER Triage Queue
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-sm">No ambulance unit selected.</div>
          )}
        </div>
      )}

      {/* Quick 911 Emergency Dispatch Modal */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-t-3xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <SirenIcon className="w-5 h-5 text-rose-200 animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-widest text-rose-200">CAD 911 Console</span>
                </div>
                <h3 className="text-2xl font-black text-white mt-0.5">Rapid Emergency Ambulance Dispatch</h3>
              </div>
              <button
                onClick={() => setIsDispatchModalOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <XIcon className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleExecuteDispatch} className="p-6 space-y-5">
              {/* Presets Ribbon */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 block mb-2">
                  ⚡ Quick Scenario Presets:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INCIDENT_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="p-2.5 text-left rounded-xl bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition-all text-xs group"
                    >
                      <div className="font-bold text-slate-800 group-hover:text-rose-700 truncate">{preset.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{preset.location}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Select Available Ambulance */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assign Ambulance Unit *</label>
                  <select
                    value={dispatchForm.selectedUnitId || selectedUnitForDispatch}
                    onChange={e => setDispatchForm(prev => ({ ...prev, selectedUnitId: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-rose-500"
                    required
                  >
                    {ambulances.map(amb => (
                      <option key={amb.id} value={amb.id}>
                        Unit {amb.unitNumber} ({amb.vehicleType || 'ALS'}) - Status: {amb.status} (
                        {amb.status === AmbulanceStatus.Available ? 'Ready at Bay' : 'Busy'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Incident Location */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Incident Scene Address *</label>
                  <input
                    type="text"
                    value={dispatchForm.incidentLocation}
                    onChange={e => setDispatchForm(prev => ({ ...prev, incidentLocation: e.target.value }))}
                    placeholder="e.g. 824 Grand Ave, Financial District"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                {/* Priority Code */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Response Priority *</label>
                  <select
                    value={dispatchForm.priorityCode}
                    onChange={e =>
                      setDispatchForm(prev => ({
                        ...prev,
                        priorityCode: e.target.value as 'Code 1 (Routine)' | 'Code 2 (Urgent)' | 'Code 3 (Emergency Hot)',
                      }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Code 3 (Emergency Hot)">Code 3 (Hot / Lights & Siren)</option>
                    <option value="Code 2 (Urgent)">Code 2 (Urgent Response)</option>
                    <option value="Code 1 (Routine)">Code 1 (Routine Non-Emergency)</option>
                  </select>
                </div>

                {/* Acuity */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Triage Acuity *</label>
                  <select
                    value={dispatchForm.acuity}
                    onChange={e =>
                      setDispatchForm(prev => ({
                        ...prev,
                        acuity: e.target.value as 'Critical' | 'Urgent' | 'Stable',
                      }))
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Critical">Critical / Level 1</option>
                    <option value="Urgent">Urgent / Level 2</option>
                    <option value="Stable">Stable / Level 3</option>
                  </select>
                </div>

                {/* Patient Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Patient Name (If known)</label>
                  <input
                    type="text"
                    value={dispatchForm.patientName}
                    onChange={e => setDispatchForm(prev => ({ ...prev, patientName: e.target.value }))}
                    placeholder="e.g. Robert Smith"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Estimated Age</label>
                  <input
                    type="number"
                    value={dispatchForm.patientAge}
                    onChange={e => setDispatchForm(prev => ({ ...prev, patientAge: Number(e.target.value) }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                {/* Complaint Details */}
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Emergency Complaint & Clinical Details *</label>
                  <textarea
                    rows={2}
                    value={dispatchForm.complaint}
                    onChange={e => setDispatchForm(prev => ({ ...prev, complaint: e.target.value }))}
                    placeholder="Describe patient symptoms, reported injuries, and scene hazards..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-lg shadow-rose-600/30 transition-all active:scale-95 flex items-center gap-2"
                >
                  <SirenIcon className="w-4 h-4 animate-bounce" />
                  Confirm & Dispatch Code 3
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
