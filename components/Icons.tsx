import React from 'react';

export const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

export const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
    </svg>
);

export const StethoscopeIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 10.99h2V21H5zM17 11h2V5c0-1.1-.9-2-2-2h-2v2h2v6zm-4.38 3.01c.38.38.38 1.02 0 1.41l-2.01 2.01c-.55.55-1.3.82-2.12.82s-1.57-.27-2.12-.82c-1.17-1.17-1.17-3.07 0-4.24l2.01-2.01c.38-.38 1.02-.38 1.41 0l2.83 2.83zM12 2c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2s2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </svg>
);

export const NurseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L1 9l4 2.18v6.32L1 21l11-6 9-4.91V9L12 3zm6 8.25l-2.09-.76-1.91.69V13l4-2.25V11zm-8 0V13l-4-2.25V11l4 2.25zM12 13.5l-4-2.25v-1.5L12 12l4-2.25v1.5L12 13.5z"/>
  </svg>
);

export const AdminIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l-.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
    </svg>
);

export const PharmacyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13 9h-2v2H9v2h2v2h2v-2h2v-2h-2V9zm-1-7c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/>
    </svg>
);

export const EngineeringIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm-6 4c0-3.31 2.69-6 6-6s6 2.69 6 6-2.69 6-6 6-6-2.69-6-6z"/>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 4.18 14.25 4 14 4h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2 3.46c.12-.22.07-.49-.12-.64l-2.11-1.65z"/>
    </svg>
);

export const MicroscopeIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.5 12c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm5.91-4.36l-2.2-2.2c-.39-.39-1.02-.39-1.41 0l-.82.82c.98.53 1.78 1.33 2.31 2.31l.82-.82c.39-.39.39-1.02 0-1.41zM11 12c.55 0 1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1v-6c0-.55.45-1 1-1zM5.5 16h3v5.5H12V16h3c.83 0 1.5-.67 1.5-1.5v-3c0-.83-.67-1.5-1.5-1.5H5.5c-1.38 0-2.5 1.12-2.5 2.5S4.12 16 5.5 16z"/>
    </svg>
);

export const ChartLineIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z" />
    </svg>
);


export const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.5l1.06 3.25h3.44l-2.78 2 1.06 3.25-2.78-2-2.78 2 1.06-3.25-2.78-2h3.44L12 2.5zM6 14.5l.8 2.44h2.56l-2.09 1.5.8 2.44-2.09-1.5-2.09 1.5.8-2.44-2.09-1.5h2.56L6 14.5zm12 0l.8 2.44h2.56l-2.09 1.5.8 2.44-2.09-1.5-2.09 1.5.8-2.44-2.09-1.5h2.56L18 14.5z"/>
    </svg>
);

export const AlertIcon: React.FC<{ className?: string; level: 'critical' | 'urgent' | 'non-urgent' }> = ({ className, level }) => {
  if (level === 'critical') {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2zm0-8h2v6h-2z" />
        </svg>
    );
  }
  if (level === 'urgent') {
      return (
          <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2V7h2v7z" />
          </svg>
      )
  }
  return (
      <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
  )
};

export const BedIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 10.78V8c0-1.1-.9-2-2-2h-9c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h.35c-.22-.63-.35-1.3-.35-2 0-2.76 2.24-5 5-5 .34 0 .68.03 1 .09V10.78zM19 12c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zm-6-4h5V6H8v2c0 .55.45 1 1 1h4z"/>
    </svg>
);

export const BillingIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-.9.6-1.5 1.7-1.5 1.1 0 1.7.6 1.7 1.5H14c0-1.4-1.2-2.5-2.5-2.5S9 7.1 9 8.5c0 1.3.9 2.4 2.1 2.7l.2.1c2.1.5 2.7 1.2 2.7 2.2 0 1.1-.9 1.6-1.8 1.6-1.2 0-1.9-.8-2-1.6H9c.1 1.7 1.3 2.6 2.8 2.6 1.7 0 2.7-1 2.7-2.2 0-1.3-1.2-2.3-2.5-2.6l-.2-.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
    </svg>
);

export const AmbulanceIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.5 8.5c-.83 0-1.5.67-1.5 1.5v5h-1v-3.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5V15h-1V9.5c0-.83-.67-1.5-1.5-1.5S11 8.67 11 9.5V15H8v-5c0-1.38-1.12-2.5-2.5-2.5S3 8.62 3 10v6c0 .55.45 1 1 1h1.05c.27 1.5 1.63 2.5 3.2 2.5s2.93-1 3.2-2.5h3.09c.27 1.5 1.63 2.5 3.2 2.5s2.93-1 3.2-2.5H22c.55 0 1-.45 1-1v-4.5c0-2.21-1.79-4-4-4zm-15 7.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
    </svg>
);

export const ClipboardListIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
    </svg>
);

export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
);

export const CreditCardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
    </svg>
);

export const PaypalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.22,6.17a2,2,0,0,0-2-1.83H9.28A3.68,3.68,0,0,0,5.71,7.89,4.24,4.24,0,0,0,6,11.3c0,2.3,1.6,3.3,3.8,3.3h1.29c.6,0,1,.2,1,.6,0,.5-.6,.7-1.2,.7H9.5a1,1,0,0,0,0,2h2.21c2.2,0,3.8-1,3.8-3.3,0-1.9-1.2-2.8-3.1-3.2-.8-.2-1.3-.4-1.3-.9,0-.3.3-.6.9-.6h2.72a1,1,0,0,0,1-1.15A8.52,8.52,0,0,0,16.22,6.17Z" />
      <path d="M17.67,6.33a2,2,0,0,0-2-1.93H10.79a3.68,3.68,0,0,0-3.57,3.55,4.24,4.24,0,0,0,.3,1.45,1,1,0,0,0,1,.75H13a1,1,0,0,1,0,2H8.33a1,1,0,0,0,0,2H13a1,1,0,0,1,0,2H9.29a1,1,0,1,0,0,2H13a3.68,3.68,0,0,0,3.57-3.55,4.24,4.24,0,0,0,-.3-1.45,1,1,0,0,0-1-.75H10.78a1,1,0,0,1,0-2h4.89a1,1,0,0,0,0-2H10.78a1,1,0,0,1,0-2h4.89a1,1,0,0,0,1-1.15A8.52,8.52,0,0,0,17.67,6.33Z" />
    </svg>
);

export const NutritionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
);

export const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
    </svg>
);

export const DiagnosisIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 11h-2v2H9v-2H7v-2h2V9h2v2h2v2zm1-7V3.5L18.5 9H14z"/>
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16a6.471 6.471 0 0 0 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z"/>
  </svg>
);

export const TreatmentPlanIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM8 18c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0-4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm7 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V8h4v2z"/>
    </svg>
);

export const MedicationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10.5 16.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V15h2V13h-2v-1.5c0-.82-.67-1.5-1.5-1.5s-1.5.68-1.5 1.5V13h-2v2h2v1.5zM19 8h-1V5c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v3H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-4 8H9v-2h6v2zm0-3H9v-2h6v2z"/>
    </svg>
);

export const SunIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.64 5.64c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41L5.64 2.81c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41L5.64 5.64zm12.72 12.72c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41l-1.41-1.41c-.39-.39-1.02-.39-1.41 0s-.39 1.02 0 1.41l1.41 1.41zM4.22 18.36c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0l1.41-1.41c.39-.39.39-1.02 0-1.41s-1.02-.39-1.41 0l-1.41 1.41zm14.14-14.14c-.39.39-.39 1.02 0 1.41s1.02.39 1.41 0l1.41-1.41c.39-.39.39-1.02 0-1.41s-1.02-.39-1.41 0l-1.41 1.41z"/>
    </svg>
);

export const SunsetIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 17c-1.38 0-2.63-.56-3.54-1.46S7 13.38 7 12c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.38-.56 2.63-1.46 3.54S13.38 17 12 17zM20 18H4v-2h16v2zM5.34 6.34C4.9 5.9 4.9 5.1 5.34 4.66s1.2-.44 1.64 0l1.41 1.41c.44.44.44 1.2 0 1.64s-1.2.44-1.64 0L5.34 6.34zM2 12h2v-2H2v2zm18 0h2v-2h-2v2zm-3.07-5.93c.44-.44 1.2-.44 1.64 0s.44 1.2 0 1.64l-1.41 1.41c-.44.44-1.2.44-1.64 0s-.44-1.2 0-1.64l1.41-1.41zM11 4h2V2h-2v2z"/>
    </svg>
);

export const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.34 2.02c-5.78 1.43-10 6.6-10 12.48 0 7.18 5.82 13 13 13 4.43 0 8.3-2.22 10.66-5.66-1.03.24-2.1.37-3.21.37-6.07 0-11-4.93-11-11 0-1.15.17-2.27.47-3.33-.28-.05-.56-.09-.85-.13z"/>
    </svg>
);

export const BriefcaseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zM10 4h4v2h-4V4zm10 15H4V8h16v11z"/>
    </svg>
);

export const UsersIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
    </svg>
);

export const ShieldExclamationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 16h2v-2h-2v2zm0-4h2V7h-2v6z"/>
    </svg>
);

export const HeartbeatIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <defs><linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor: '#fb7185', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#f43f5e', stopOpacity: 1}} /></linearGradient></defs>
        <path fill="url(#grad1)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
);
export const BloodPressureIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <defs><linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor: '#67e8f9', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#06b6d4', stopOpacity: 1}} /></linearGradient></defs>
        <path fill="url(#grad2)" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-2h2v-2H9v-2h2V9H9V7h4v10h-2v-2z"/>
    </svg>
);
export const OxygenIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <defs><linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor: '#a5b4fc', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#6366f1', stopOpacity: 1}} /></linearGradient></defs>
        <path fill="url(#grad3)" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35zM12 5.25c-1.83 0-3.33 1.5-3.33 3.33 0 1.55 1.07 2.85 2.5 3.21V14h1.67v-2.21c1.43-.36 2.5-1.66 2.5-3.21 0-1.83-1.5-3.33-3.34-3.33z"/>
    </svg>
);
export const ThermometerIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
        <defs><linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor: '#fcd34d', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#fbbf24', stopOpacity: 1}} /></linearGradient></defs>
        <path fill="url(#grad4)" d="M15 13V5c0-1.66-1.34-3-3-3S9 3.34 9 5v8c-1.21.91-2 2.37-2 4 0 2.76 2.24 5 5 5s5-2.24 5-5c0-1.63-.79-3.09-2-4zm-3-1c0-.55.45-1 1-1s1 .45 1 1v1.17c.31.16.59.38.83.64l.58.64c.27.3.43.68.43 1.08 0 1.1-.9 2-2 2s-2-.9-2-2c0-.4.16-.78.43-1.08l.58-.64c.24-.26.52-.48.83-.64V12z"/>
    </svg>
);

export const VitalsIcons: React.FC = () => (
    <svg width="0" height="0" className="absolute">
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor: '#fb7185', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#f43f5e', stopOpacity: 1}} /></linearGradient>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor: '#67e8f9', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#06b6d4', stopOpacity: 1}} /></linearGradient>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor: '#a5b4fc', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#6366f1', stopOpacity: 1}} /></linearGradient>
            <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor: '#fcd34d', stopOpacity: 1}} /><stop offset="100%" style={{stopColor: '#fbbf24', stopOpacity: 1}} /></linearGradient>
        </defs>
    </svg>
);

export const SirenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 3.09C4.31 4.54 3 7.37 3 10.51v.19c.45-.3.96-.51 1.5-.61V10c0-3.86 3.14-7 7-7 1.94 0 3.7.8 4.95 2.05L15.5 6.5C14.54 5.54 13.31 5 12 5c-2.76 0-5 2.24-5 5v.09c-.54.1-.96.31-1.5.61l-.01.03C5.5 17.03 12 22 12 22s6.5-4.97 6.5-11.27C18.5 7.6 16.27 4.88 13.3 3.39L12 2.5 10.7 3.39c-.92-.61-1.99-1-3.15-1.12L7 3.09zM12 19c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
  </svg>
);

export const PencilIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
    </svg>
);

export const ArchiveBoxIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM6.24 5h11.52l.83 1H5.42l.82-1zM5 19V8h14v11H5zm8-7c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
    </svg>
);

export const LinkIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
    </svg>
);

export const FileTextIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
    </svg>
);

export const BellIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
    </svg>
);

export const BellSlashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.79 16.79L18 15v-4c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68c-.41.1-.81.25-1.19.42L4.21 3.21 3 4.42l16.79 16.79 1.21-1.21zM12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm4-11.45V11c0 2.21-1.29 4.14-3.13 4.91l-1.43-1.43C12.87 14.1 14 12.67 14 11V11h-1l-2-2h3zm-4 0v.45l-2-2V11c0-.28.03-.55.08-.82l-1.9-1.9C6.01 8.87 6 9.42 6 10v5l-2 2v1h13.45l-2-2H8v-5c0-.68.12-1.32.34-1.92L8 8.41V8h1.17l2 2H10z"/>
    </svg>
);

export const XIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
    </svg>
);

export const ComplaintIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22 4c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4zm-2 13.17L18.83 16H4V4h16v13.17zM11 12h2v2h-2zm0-6h2v4h-2z"/>
    </svg>
);

export const InteractionIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.9,12.42l-3.53,3.53a1,1,0,0,1-1.42,0,1,1,0,0,1,0-1.42L15.36,13H8.64L7.22,14.41a1,1,0,0,1-1.42,0,1,1,0,0,1,0-1.42L9.34,9.46A3,3,0,0,1,11.46,8h1.08a3,3,0,0,1,2.12.88l3.54,3.54A1,1,0,0,1,18.9,12.42ZM20.66,3.34a1,1,0,0,0-1.41,0L15,7.59V4.5a1,1,0,0,0-2,0V9a1,1,0,0,0,1,1h4.5a1,1,0,0,0,0-2H16.41l4.25-4.24A1,1,0,0,0,20.66,3.34ZM10,13H4.5a1,1,0,0,0,0,2H7.59l-3.25,3.24a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L9,16.41V19.5a1,1,0,0,0,2,0V15A1,1,0,0,0,10,13Z" />
    </svg>
);

export const FoodIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.7,4.3a.987.987,0,0,0-1.4,0L14,7.57,11,4.56a.987.987,0,0,0-1.4,0,1.012,1.012,0,0,0,0,1.41L12.55,9,9.59,12H2v2H9.59L12.55,15,9.64,17.9a1,1,0,0,0,1.41,1.41L14,16.43l2.88,2.88a1,1,0,0,0,1.41-1.41L15.45,15l2.88-2.88V22h2V12.12L15.45,9,18.4,6.05a1,1,0,0,0,.3-1.06A.987.987,0,0,0,18.7,4.3Z" />
    </svg>
);

export const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
);

export const ReportIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-1 13h-2v-2h2v2zm0-4h-2V6h2v5z" />
    </svg>
);

export const ShieldAlertIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm1 14h-2v-2h2v2zm0-4h-2V7h2v4z"/>
    </svg>
);

export const MapPinIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
);

export const NavigationIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
    </svg>
);

export const Volume2Icon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
    </svg>
);

export const VolumeXIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
    </svg>
);

export const ActivityIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 10.5h-2.3l-1.5 4.5c-.15.46-.68.66-1.1.41-.12-.07-.22-.17-.28-.29L10 11.2l-1.2 2.4c-.16.32-.49.52-.85.51H5V12h2.3l1.5-4.5c.15-.46.68-.66 1.1-.41.12.07.22.17.28.29L13 14.8l1.2-2.4c.16-.32.49-.52.85-.51H18v1.61z"/>
    </svg>
);

export const PhoneCallIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>
    </svg>
);

export const RadioIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.24 6.15C2.51 6.43 2 7.17 2 8v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H8.3l8.26-3.34c.48-.19.72-.73.53-1.21-.19-.48-.73-.72-1.21-.53L3.24 6.15zM7 20c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm13-8h-8v-2h8v2zm0 4h-8v-2h8v2z"/>
    </svg>
);

export const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
    </svg>
);

export const PauseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
    </svg>
);

