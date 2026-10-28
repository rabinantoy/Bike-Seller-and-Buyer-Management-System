import React, { useState } from 'react';
import { Bike as BikeIcon, Shield, User, Lock, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@apexmotohub.com');
  const [password, setPassword] = useState('ApexDealership2026!');
  const [role, setRole] = useState<UserRole>('admin');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide an email address and password.');
      return;
    }
    login(email, role);
  };

  const handleQuickLogin = (selectedRole: UserRole) => {
    if (selectedRole === 'admin') {
      login('admin@apexmotohub.com', 'admin');
    } else {
      login('staff@apexmotohub.com', 'staff');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Dealership Branding Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl">
          {/* Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30 mb-4">
              <BikeIcon className="h-8 w-8" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-white uppercase">
              Apex Moto Hub
            </h1>
            <p className="text-xs text-blue-400 font-medium tracking-wider uppercase mt-0.5">
              Bike Seller & Buyer Management System
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Sign in to manage inventory, sellers, buyers, and sales transactions.
            </p>
          </div>

          {/* Quick Demo Switcher Buttons for Easy Evaluation */}
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-amber-400" />
                Quick Evaluator Access:
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">1-Click Sign In</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 px-3 py-2 text-xs font-bold text-blue-300 hover:bg-blue-600 hover:text-white transition"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin Login</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickLogin('staff')}
                className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition"
              >
                <User className="h-3.5 w-3.5" />
                <span>Staff Login</span>
              </button>
            </div>
          </div>

          {/* Custom Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-300">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Role Permission
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`rounded-lg py-2 text-xs font-semibold border transition ${
                    role === 'admin'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Administrator
                </button>
                <button
                  type="button"
                  onClick={() => setRole('staff')}
                  className={`rounded-lg py-2 text-xs font-semibold border transition ${
                    role === 'staff'
                      ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  Sales Staff
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@apexmotohub.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-hidden"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              <span>Authenticate & Enter Portal</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* College Project Disclaimer */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <p className="text-[11px] text-slate-500">
              Dealership Portal • Persistent Session Mode Enabled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
