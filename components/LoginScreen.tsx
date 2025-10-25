import React, { useState } from 'react';
import { User, UserRole, DoctorSpecialty } from '../types';
import { MOCK_USERS } from '../users';
import { StethoscopeIcon, UserIcon, NurseIcon, AdminIcon, LockIcon, EngineeringIcon, PharmacyIcon, MicroscopeIcon } from './Icons';

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

  const handleLogin = () => {
    setError('');

    const potentialUser = MOCK_USERS.find(u => {
      if (u.role !== activeRole) return false;
      if (activeRole === UserRole.Doctor && u.specialty !== specialty) return false;
      return u.username.toLowerCase() === username.toLowerCase();
    });

    if (potentialUser && potentialUser.password === password) {
      // Don't pass the password to the app state
      const { password: _, ...loggedInUser } = potentialUser;
      onLogin(loggedInUser, rememberMe);
    } else {
      setError('Invalid username or password for the selected role.');
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch(role) {
      case UserRole.Patient: return <UserIcon className="h-6 w-6 mb-2 text-indigo-600" />;
      case UserRole.Doctor: return <StethoscopeIcon className="h-6 w-6 mb-2 text-indigo-600" />;
      case UserRole.Nurse: return <NurseIcon className="h-6 w-6 mb-2 text-indigo-600" />;
      case UserRole.Admin: return <AdminIcon className="h-6 w-6 mb-2 text-indigo-600" />;
      case UserRole.Pharmacy: return <PharmacyIcon className="h-6 w-6 mb-2 text-indigo-600" />;
      case UserRole.LabTechnician: return <MicroscopeIcon className="h-6 w-6 mb-2 text-indigo-600" />;
      case UserRole.Engineering: return <EngineeringIcon className="h-6 w-6 mb-2 text-indigo-600" />;
    }
  }
  
  const getPlaceholderUsername = () => {
      switch(activeRole) {
          case UserRole.Patient: return 'patient';
          case UserRole.Nurse: return 'nurse';
          case UserRole.Admin: return 'admin';
          case UserRole.Pharmacy: return 'pharmacy';
          case UserRole.LabTechnician: return 'labtech';
          case UserRole.Engineering: return 'engineer';
          case UserRole.Doctor:
              if (specialty === DoctorSpecialty.General) return 'doctor-general';
              return `doctor-${specialty.toLowerCase()}`;
          default: return 'username';
      }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen -mt-20 bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="w-full max-w-lg bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl shadow-slate-200 p-8 space-y-6">
        <div className="text-center">
          <StethoscopeIcon className="mx-auto h-12 w-12 text-indigo-600"/>
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
            Welcome to MediFlow AI
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Select your role to begin
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.values(UserRole)).map((role) => (
            <button
              key={role}
              onClick={() => {
                  setActiveRole(role);
                  setError(''); // Reset error on role change
              }}
              className={`flex flex-col items-center justify-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none border-2 ${
                activeRole === role
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-500 shadow-md'
                  : 'text-gray-600 bg-white hover:bg-gray-100 border-gray-200'
              }`}
            >
              {getRoleIcon(role)}
              <span>{role}</span>
            </button>
          ))}
        </div>

        {activeRole === UserRole.Doctor && (
          <div className="space-y-2 animate-fade-in">
            <label htmlFor="specialty" className="text-sm font-medium text-gray-700">
              Specialty
            </label>
            <select
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value as DoctorSpecialty)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {Object.values(DoctorSpecialty).map((spec) => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-4">
            <div className="relative">
                <UserIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder={`Username (e.g., ${getPlaceholderUsername()})`}
                 />
            </div>
             <div className="relative">
                <LockIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
                <input
                    id="password-input"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Password (e.g., password123)"
                />
            </div>
        </div>

        <div className="flex items-center">
            <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
            </label>
        </div>

        {error && <p className="text-sm text-red-600 text-center -my-2">{error}</p>}

        <div>
          <button
            onClick={handleLogin}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-blue-500 hover:shadow-lg hover:from-indigo-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;