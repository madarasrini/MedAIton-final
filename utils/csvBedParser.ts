import { Bed, BedStatus } from '../types.ts';
import { generate24HourRiskHistory } from './riskHistoryHelper.ts';

/**
 * Robust CSV parser that handles quotes, commas inside quotes, CRLF/LF line breaks, and whitespace
 */
export function parseCSVToBeds(csvContent: string): { beds: Bed[]; errors: string[] } {
  const errors: string[] = [];
  const lines = csvContent
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter(line => line.trim().length > 0);

  if (lines.length === 0) {
    return { beds: [], errors: ['CSV file appears to be empty.'] };
  }

  // Parse header
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine).map(h => h.trim().toLowerCase().replace(/[\s_-]+/g, ''));

  const requiredFields = ['ward', 'bednumber'];
  const hasRequired = requiredFields.every(field =>
    headers.some(h => h.includes(field) || (field === 'bednumber' && (h === 'bed' || h === 'bedno' || h === 'bednum')))
  );

  const parsedBeds: Bed[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine.trim()) continue;

    const values = parseCSVLine(rawLine);
    if (values.length === 0) continue;

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx]?.trim() ?? '';
    });

    try {
      // Find ward
      const wardKey = headers.find(h => h.includes('ward') || h.includes('dept') || h.includes('department') || h.includes('unit'));
      const ward = wardKey && rowObj[wardKey] ? rowObj[wardKey] : 'General';

      // Find bed number
      const bedNumKey = headers.find(h => h.includes('bednumber') || h === 'bed' || h === 'bedno' || h === 'bednum' || h.includes('number'));
      const rawBedNum = bedNumKey ? rowObj[bedNumKey] : '';
      const bedNumber = parseInt(rawBedNum.replace(/\D/g, ''), 10) || (100 + i);

      // Find ID
      const idKey = headers.find(h => h === 'id' || h === 'bedid');
      const id = (idKey && rowObj[idKey]) ? rowObj[idKey] : `bed-${ward.toLowerCase().slice(0, 3)}-${bedNumber}`;

      // Find status
      const statusKey = headers.find(h => h.includes('status') || h.includes('state'));
      const rawStatus = (statusKey && rowObj[statusKey]) ? rowObj[statusKey].toLowerCase() : '';
      let status: BedStatus = BedStatus.Available;
      if (rawStatus.includes('occup') || rawStatus.includes('busy') || rawStatus.includes('inuse') || rawStatus.includes('admit')) {
        status = BedStatus.Occupied;
      } else if (rawStatus.includes('clean') || rawStatus.includes('sanit') || rawStatus.includes('dirty') || rawStatus.includes('prep')) {
        status = BedStatus.Cleaning;
      }

      // Optional fields
      const patientIdKey = headers.find(h => h.includes('patientid') || h === 'patid' || h === 'pid');
      const patientId = patientIdKey && rowObj[patientIdKey] ? rowObj[patientIdKey] : (status === BedStatus.Occupied ? `pat-${100 + i}` : undefined);

      const patientNameKey = headers.find(h => h.includes('patientname') || h === 'patient' || h === 'name');
      const patientName = patientNameKey && rowObj[patientNameKey] ? rowObj[patientNameKey] : undefined;

      const riskKey = headers.find(h => h.includes('risk') || h.includes('mlrisk') || h.includes('deterioration') || h.includes('score'));
      const mlRiskScore = riskKey && rowObj[riskKey] ? parseFloat(rowObj[riskKey]) : (status === BedStatus.Occupied ? Math.floor(25 + Math.random() * 50) : undefined);

      const losKey = headers.find(h => h.includes('los') || h.includes('lengthofstay') || h.includes('hours') || h.includes('stay'));
      const mlPredictedLOSHours = losKey && rowObj[losKey] ? parseFloat(rowObj[losKey]) : (status === BedStatus.Occupied ? 8.0 : undefined);

      const dischargeMinsKey = headers.find(h => h.includes('discharge') || h.includes('predicteddischarge') || h.includes('mins'));
      const predictedDischargeMinutes = dischargeMinsKey && rowObj[dischargeMinsKey] ? parseInt(rowObj[dischargeMinsKey], 10) : (status === BedStatus.Occupied ? Math.floor(20 + Math.random() * 70) : undefined);

      const cleaningMinsKey = headers.find(h => h.includes('cleaningtime') || h.includes('cleanmins'));
      const cleaningTimeRemainingMinutes = cleaningMinsKey && rowObj[cleaningMinsKey] ? parseInt(rowObj[cleaningMinsKey], 10) : (status === BedStatus.Cleaning ? 5 : undefined);

      const confKey = headers.find(h => h.includes('confidence') || h.includes('conf') || h.includes('accuracy'));
      const mlConfidence = confKey && rowObj[confKey] ? parseFloat(rowObj[confKey]) : (status === BedStatus.Occupied ? 92 : 98);

      const specialtyKey = headers.find(h => h.includes('specialty') || h.includes('care'));
      const specialtyRequired = specialtyKey && rowObj[specialtyKey] ? rowObj[specialtyKey] : ward;

      let acuityLevel: Bed['acuityLevel'] = undefined;
      if (status === BedStatus.Occupied) {
        const acuityKey = headers.find(h => h.includes('acuity') || h.includes('severity') || h.includes('priority'));
        if (acuityKey && rowObj[acuityKey]) {
          const rawAcuity = rowObj[acuityKey].toLowerCase();
          if (rawAcuity.includes('crit')) acuityLevel = 'Critical';
          else if (rawAcuity.includes('high')) acuityLevel = 'High';
          else if (rawAcuity.includes('mod')) acuityLevel = 'Moderate';
          else acuityLevel = 'Low';
        } else if (mlRiskScore !== undefined) {
          if (mlRiskScore >= 75) acuityLevel = 'Critical';
          else if (mlRiskScore >= 50) acuityLevel = 'High';
          else if (mlRiskScore >= 30) acuityLevel = 'Moderate';
          else acuityLevel = 'Low';
        }
      }

      const riskHistory = status === BedStatus.Occupied && mlRiskScore !== undefined 
        ? generate24HourRiskHistory(mlRiskScore) 
        : undefined;

      parsedBeds.push({
        id,
        ward,
        bedNumber,
        status,
        patientId,
        patientName,
        predictedDischargeMinutes,
        cleaningTimeRemainingMinutes,
        mlRiskScore,
        mlPredictedLOSHours,
        mlConfidence,
        specialtyRequired,
        acuityLevel,
        lastUpdated: new Date().toISOString(),
        riskHistory,
      });
    } catch (err: any) {
      errors.push(`Row ${i + 1}: ${err.message || 'Parse error'}`);
    }
  }

  return { beds: parsedBeds, errors };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export function exportBedsToCSV(beds: Bed[]): string {
  const headers = ['id', 'ward', 'bedNumber', 'status', 'patientId', 'patientName', 'mlRiskScore', 'mlPredictedLOSHours', 'predictedDischargeMinutes', 'mlConfidence', 'acuityLevel', 'specialtyRequired'];
  const rows = beds.map(b => [
    b.id,
    b.ward,
    b.bedNumber,
    b.status,
    b.patientId || '',
    b.patientName ? `"${b.patientName.replace(/"/g, '""')}"` : '',
    b.mlRiskScore !== undefined ? b.mlRiskScore : '',
    b.mlPredictedLOSHours !== undefined ? b.mlPredictedLOSHours : '',
    b.predictedDischargeMinutes !== undefined ? b.predictedDischargeMinutes : '',
    b.mlConfidence !== undefined ? b.mlConfidence : '',
    b.acuityLevel || '',
    b.specialtyRequired || b.ward,
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

export function generateTemplateCSV(): string {
  return `id,ward,bedNumber,status,patientId,patientName,mlRiskScore,mlPredictedLOSHours,predictedDischargeMinutes,mlConfidence,acuityLevel,specialtyRequired
bed-101,Cardiology,101,Occupied,pat-001,John Smith,78,4.5,38,94,High,Cardiology
bed-102,Cardiology,102,Available,,,,,,98,,Cardiology
bed-103,Cardiology,103,Cleaning,,,,,,95,,Cardiology
bed-201,Neurology,201,Occupied,pat-002,Emily Johnson,35,8.0,65,89,Moderate,Neurology
bed-202,Neurology,202,Available,,,,,,98,,Neurology
bed-301,General,301,Occupied,pat-003,Michael Williams,42,24.0,110,91,Moderate,General
bed-302,General,302,Available,,,,,,98,,General
bed-401,Pediatrics,401,Occupied,pat-004,Sophia Brown,20,3.5,25,96,Low,Pediatrics
bed-402,Pediatrics,402,Cleaning,,,,,,95,,Pediatrics
bed-501,ICU,501,Occupied,pat-005,Robert Davis,88,36.0,180,95,Critical,Intensive Care
bed-502,ICU,502,Available,,,,,,98,,Intensive Care`;
}
