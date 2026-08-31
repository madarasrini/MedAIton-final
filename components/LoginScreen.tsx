
import React, { useState, useMemo } from 'react';
import { User, UserRole, DoctorSpecialty } from '../types.ts';
import { MOCK_USERS } from '../users.ts';
import { StethoscopeIcon, UserIcon, NurseIcon, AdminIcon, LockIcon, EngineeringIcon, PharmacyIcon, MicroscopeIcon, InfoIcon } from './Icons.tsx';

interface LoginScreenProps {
  onLogin: (user: User, rememberMe: boolean) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.Patient);
  const [specialty, setSpecialty] = useState<DoctorSpecialty>(DoctorSpecialty.Cardiologist);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const demoCredentials = useMemo(() => {
    const user = MOCK_USERS.find(u => {
      if (u.role !== activeRole) return false;
      if (activeRole === UserRole.Doctor && u.specialty !== specialty) return false;
      return true;
    });
    return user ? { username: user.username, password: 'password123' } : null;
  }, [activeRole, specialty]);

  const handleLogin = () => {
    setError('');

    const potentialUser = MOCK_USERS.find(u => {
      if (u.role !== activeRole) return false;
      if (activeRole === UserRole.Doctor && u.specialty !== specialty) return false;
      return u.username.toLowerCase() === username.toLowerCase();
    });

    if (potentialUser && potentialUser.password === password) {
      const { password: _, ...loggedInUser } = potentialUser;
      onLogin(loggedInUser, rememberMe);
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  const handleAutoFill = () => {
    if (demoCredentials) {
      setUsername(demoCredentials.username);
      setPassword(demoCredentials.password);
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch(role) {
      case UserRole.Patient: return <UserIcon className="h-6 w-6 mb-2" />;
      case UserRole.Doctor: return <StethoscopeIcon className="h-6 w-6 mb-2" />;
      case UserRole.Nurse: return <NurseIcon className="h-6 w-6 mb-2" />;
      case UserRole.Admin: return <AdminIcon className="h-6 w-6 mb-2" />;
      case UserRole.Pharmacy: return <PharmacyIcon className="h-6 w-6 mb-2" />;
      case UserRole.LabTechnician: return <MicroscopeIcon className="h-6 w-6 mb-2" />;
      case UserRole.Engineering: return <EngineeringIcon className="h-6 w-6 mb-2" />;
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fade-in py-12">
      <div className="w-full max-w-xl glass-panel rounded-[2rem] p-8 md:p-12 space-y-8 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-200/20 rounded-full blur-3xl"></div>

        <div className="text-center relative z-10">
          <div className="inline-flex p-4 rounded-3xl bg-indigo-100 text-indigo-600 mb-4 ai-pulse">
            <StethoscopeIcon className="h-10 w-10"/>
          </div>
          <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            MediFlow <span className="text-indigo-600">AI</span>
          </h2>
          <p className="mt-3 text-gray-500 font-medium">
            Novaile clinical intelligence portal
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative z-10">
          {(Object.values(UserRole)).map((role) => (
            <button
              key={role}
              onClick={() => {
                  setActiveRole(role);
                  setError('');
              }}
              className={`flex flex-col items-center justify-center p-4 text-xs font-bold rounded-2xl transition-all duration-300 ${
                activeRole === role
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105'
                  : 'text-gray-600 bg-white/50 hover:bg-white border border-transparent hover:border-indigo-100'
              }`}
            >
              {getRoleIcon(role)}
              <span className="text-center">{role}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t border-gray-100 relative z-10">
          {activeRole === UserRole.Doctor && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Specialty</label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value as DoctorSpecialty)}
                className="w-full h-12 px-4 glass-panel rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all font-semibold"
              >
                {Object.values(DoctorSpecialty).map((spec) => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Username</label>
            <div className="relative">
              <UserIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-4 transform -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-12 pl-12 pr-4 glass-panel rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder-gray-300 font-medium"
                placeholder="Enter your username..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <LockIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-4 transform -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 pl-12 pr-4 glass-panel rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder-gray-300 font-medium"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        {/* Demo Helper Box */}
        {demoCredentials && (
          <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl animate-fade-in">
            <div className="flex items-center gap-2 mb-2 text-indigo-700">
              <InfoIcon className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Demo Access</span>
            </div>
            <button 
              onClick={handleAutoFill}
              className="w-full flex items-center justify-between text-left group transition-all"
            >
              <div>
                <p className="text-xs text-gray-600 font-medium">User: <span className="font-bold text-indigo-600">{demoCredentials.username}</span></p>
                <p className="text-xs text-gray-600 font-medium">Pass: <span className="font-bold text-indigo-600">{demoCredentials.password}</span></p>
              </div>
              <span className="text-[10px] font-bold text-indigo-500 group-hover:underline">Auto-fill &rarr;</span>
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-500 text-center font-medium animate-bounce">{error}</p>}

        <button
          onClick={handleLogin}
          className="w-full h-14 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-[0.98] relative z-10"
        >
          Access Novaile Portal
        </button>

        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] relative z-10">
          Powered by MediFlow Neural Network
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
