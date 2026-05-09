import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Stethoscope, 
  Package, 
  BarChart3, 
  AlertCircle,
  PlusCircle,
  ChevronRight,
  User,
  Activity,
  Clock,
  ArrowUpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Utility for Tailwind class merging */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types
interface Patient {
  id: number;
  name: string;
  age: number;
  gender: string;
  phone: string;
  status: string;
  created_at: string;
}

interface Doctor {
  id: number;
  name: string;
  specialization: string;
  phone: string;
}

interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  appointment_date: string;
  severity: number;
  status: string;
  patient_name: string;
  doctor_name: string;
}

interface InventoryItem {
  id: number;
  medicine_name: string;
  stock: number;
  expiry_date: string;
}

interface WorkloadData {
  name: string;
  appointment_count: number;
}

type Tab = 'dashboard' | 'patients' | 'appointments' | 'doctors' | 'inventory';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [workload, setWorkload] = useState<WorkloadData[]>([]);

  // Form states
  const [patientForm, setPatientForm] = useState({ name: '', age: '', gender: 'Male', phone: '' });
  const [appointmentForm, setAppointmentForm] = useState({ patient_id: '', doctor_id: '', appointment_date: '', severity: '1' });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const [resP, resD, resA, resI, resW] = await Promise.all([
        fetch('/api/patients'),
        fetch('/api/doctors'),
        fetch('/api/appointments'),
        fetch('/api/inventory'),
        fetch('/api/analysis/workload')
      ]);
      setPatients(await resP.json());
      setDoctors(await resD.json());
      setAppointments(await resA.json());
      setInventory(await resI.json());
      setWorkload(await resW.json());
    } catch (e) {
      console.error('Error fetching data:', e);
    }
  };

  const registerPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientForm)
    });
    setPatientForm({ name: '', age: '', gender: 'Male', phone: '' });
    fetchData();
    setActiveTab('patients');
  };

  const dischargePatient = async (id: number) => {
    const notes = prompt('Enter discharge notes (optional):');
    if (notes === null) return; // Cancelled
    
    await fetch(`/api/patients/${id}/discharge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes })
    });
    fetchData();
  };

  const bookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appointmentForm)
    });
    setAppointmentForm({ patient_id: '', doctor_id: '', appointment_date: '', severity: '1' });
    fetchData();
    setActiveTab('appointments');
  };

  const isExpiringSoon = (date: string) => {
    const expiry = new Date(date);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 30; // Alert if less than 30 days
  };

  const SidebarItem = ({ id, icon: Icon, label }: { id: Tab, icon: any, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-3 px-8 py-4 rounded-none w-full transition-all duration-200 border-l-4 text-left",
        activeTab === id 
          ? "bg-slate-50 text-blue-600 border-blue-600" 
          : "text-slate-400 border-transparent hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className={cn("w-4 h-4", activeTab === id ? "stroke-[3px]" : "stroke-[2px]")} />
      <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans select-none overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-10 shadow-sm">
        <div className="flex flex-col px-8 py-12">
          <h1 className="text-3xl font-black tracking-tighter leading-none">HOSPITAL.OS</h1>
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300 mt-2">Integrated Platform v2</span>
        </div>

        <nav className="flex-1">
          <SidebarItem id="dashboard" icon={BarChart3} label="Dashboard" />
          <SidebarItem id="patients" icon={Users} label="Patients" />
          <SidebarItem id="appointments" icon={Calendar} label="Appointments" />
          <SidebarItem id="doctors" icon={Stethoscope} label="Medical Staff" />
          <SidebarItem id="inventory" icon={Package} label="Pharmacy" />
        </nav>

        <div className="mt-auto p-10 border-t border-slate-100 bg-slate-50/30">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">Operating Lead</span>
            <span className="text-sm font-black tracking-tight mt-1">Dr. Sarah Chen</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        <header className="px-12 py-10 border-b border-slate-200 bg-white flex justify-between items-center sticky top-0 z-20">
          <div className="flex flex-col">
            <h2 className="text-5xl font-black tracking-tighter leading-none capitalize">{activeTab.replace('-', ' ')}</h2>
            <div className="flex items-center gap-3 mt-4">
               <div className="h-1.5 w-12 bg-blue-600" />
               <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-300">Live Telemetry Active</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <button 
              onClick={() => setActiveTab('patients')}
              className="bg-slate-900 text-white px-8 py-4 text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-600 transition-all active:scale-95"
            >
              Add New Record
            </button>
            <div className="w-12 h-12 bg-slate-100 border border-slate-200 p-1">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="flex-1 p-12 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
            >
            {activeTab === 'dashboard' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    {[
                      { label: 'Total Patients', val: patients.length, icon: Users, color: 'blue' },
                      { label: 'Avg Severity', val: appointments.length ? (appointments.reduce((a, b) => a + b.severity, 0) / appointments.length).toFixed(1) : 0, icon: AlertCircle, color: 'red' },
                      { label: 'Pending Apps', val: appointments.length, icon: Clock, color: 'amber' },
                      { label: 'Active Doctors', val: doctors.length, icon: Stethoscope, color: 'emerald' },
                    ].map((stat, i) => (
                      <div key={i} className="bg-white p-10 border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <div className="w-2 h-2 bg-slate-200" />
                        </div>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4">{stat.label}</p>
                        <h3 className="text-6xl font-black tracking-tighter leading-none">{stat.val}</h3>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 flex flex-col gap-10">
                      <section className="bg-white p-12 border border-slate-200 shadow-[20px_20px_0px_rgba(0,0,0,0.02)]">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300 mb-10">Medical Staff Workload</h3>
                        <div className="grid grid-cols-4 gap-8">
                          {workload.slice(0, 4).map((entry, idx) => (
                            <div key={idx} className={cn("border-l-4 pl-6 transition-all", idx % 2 === 0 ? "border-blue-600 bg-blue-50/20" : "border-slate-100")}>
                              <div className="text-6xl font-black tracking-tighter leading-none mb-2">{entry.appointment_count.toString().padStart(2, '0')}</div>
                              <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider leading-tight">{entry.name}</div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    <div className="lg:col-span-4 flex flex-col gap-10">
                      <section className="bg-white border border-slate-200 flex flex-col min-h-full">
                        <div className="px-8 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <h2 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-400">Emergency Queue</h2>
                          <span className="text-[10px] bg-red-600 text-white px-2 py-1 font-black">FAST TRACK</span>
                        </div>
                        <div className="flex-1">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="text-[9px] uppercase font-black text-slate-300 tracking-[0.4em] border-b border-slate-100">
                                <th className="px-8 py-6">Rank</th>
                                <th className="px-8 py-6">Identification</th>
                              </tr>
                            </thead>
                            <tbody className="text-sm">
                              {appointments.slice(0, 10).map((app) => (
                                <tr key={app.id} className={cn("border-b border-slate-50 transition-all hover:bg-slate-50 cursor-pointer", app.severity >= 4 ? "bg-red-50/30" : "")}>
                                  <td className="px-8 py-6">
                                    <span className={cn("text-4xl font-black leading-none tracking-tighter", 
                                      app.severity >= 4 ? "text-red-600" : 
                                      app.severity >= 3 ? "text-slate-800" : "text-slate-200"
                                    )}>
                                      {app.severity.toString().padStart(2, '0')}
                                    </span>
                                  </td>
                                  <td className="px-8 py-6">
                                    <p className="font-black text-slate-900 text-base leading-none tracking-tight underline decoration-blue-600/30 underline-offset-4 uppercase">{app.patient_name}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 leading-none italic">{app.doctor_name}</p>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </div>
                  </div>
                </div>
              )}

            {activeTab === 'patients' && (
                <div className="grid grid-cols-12 gap-12">
                  <div className="col-span-4 self-start space-y-6">
                    <section className="bg-blue-600 p-12 text-white shadow-[20px_20px_0px_rgba(37,99,235,0.1)]">
                      <h2 className="text-[12px] font-black uppercase tracking-[0.6em] text-blue-100 mb-10 leading-none">Deployment // New Patient</h2>
                      <form onSubmit={registerPatient} className="flex flex-col gap-8">
                        <div className="flex flex-col gap-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-blue-200/50">Full Identity String</label>
                          <input 
                            required
                            value={patientForm.name}
                            onChange={(e) => setPatientForm({...patientForm, name: e.target.value})}
                            className="bg-blue-700 border-none p-5 text-white font-black placeholder:text-blue-400 outline-none text-xl tracking-tight"
                            placeholder="JOHN DOE"
                            style={{ width: '100px' }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-200/50">Age</label>
                            <input 
                              type="number"
                              required
                              value={patientForm.age}
                              onChange={(e) => setPatientForm({...patientForm, age: e.target.value})}
                              className="bg-blue-700 border-none p-5 text-white font-black outline-none text-xl"
                              placeholder="00"
                              style={{ width: '50px' }}
                            />
                          </div>
                          <div className="flex flex-col gap-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-blue-200/50">Biological Class</label>
                            <select 
                              value={patientForm.gender}
                              onChange={(e) => setPatientForm({...patientForm, gender: e.target.value})}
                              className="bg-blue-700 border-none p-5 text-white font-black outline-none appearance-none cursor-pointer"
                              style={{ width: '71px' }}
                            >
                              <option>Male</option>
                              <option>Female</option>
                              <option>Other</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex flex-col gap-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-blue-200/50">Connectivity (TEL)</label>
                          <input 
                            required
                            value={patientForm.phone}
                            onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})}
                            className="bg-blue-700 border-none p-5 text-white font-black outline-none tracking-widest text-lg"
                            placeholder="XXX-XXXX-XXX"
                          />
                        </div>
                        <button className="mt-4 bg-white text-blue-700 font-black py-6 uppercase text-[12px] tracking-[0.4em] hover:bg-slate-50 transition-all active:scale-[0.98] shadow-2xl">
                          Authorize Entry
                        </button>
                      </form>
                    </section>
                  </div>

                  <div className="col-span-8">
                    <section className="bg-white border-2 border-slate-900 overflow-hidden shadow-[20px_20px_0px_rgba(15,23,42,0.05)]">
                      <div className="px-12 py-8 bg-slate-900 flex justify-between items-center text-white">
                        <h3 className="text-[11px] font-black uppercase tracking-[0.5em]">Identity Archive Database</h3>
                        <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">Total: {patients.length}</span>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[9px] uppercase font-black text-slate-300 tracking-[0.4em] bg-slate-50 border-b border-slate-100">
                            <th className="px-12 py-6" style={{ width: '150px' }}>Unique Identity</th>
                            <th className="px-12 py-6">Attributes</th>
                            <th className="px-12 py-6">Status</th>
                            <th className="px-12 py-6 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {patients.map((p) => (
                            <tr key={p.id} className="hover:bg-slate-50 transition-all group cursor-pointer">
                              <td className="px-12 py-8" style={{ width: '150px' }}>
                                <span className="font-black text-3xl tracking-tighter block group-hover:text-blue-600 transition-colors uppercase">{p.name}</span>
                              </td>
                              <td className="px-12 py-8">
                                <span className="font-black uppercase text-[12px] text-slate-500 tracking-[0.3em] bg-slate-100 px-3 py-1.5">{p.age}Y // {p.gender}</span>
                              </td>
                              <td className="px-12 py-8">
                                <span className="text-[10px] font-black uppercase border-b-2 border-green-500 text-slate-900">{p.status}</span>
                              </td>
                              <td className="px-12 py-8 text-right">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); dischargePatient(p.id); }}
                                  className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 hover:bg-red-600 transition-all"
                                >
                                  Discharge
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  </div>
                </div>
              )}

            {activeTab === 'appointments' && (
                <div className="grid grid-cols-12 gap-12">
                  <div className="col-span-4 space-y-8">
                    <section className="bg-slate-900 p-12 text-white">
                      <h2 className="text-[12px] font-black uppercase tracking-[0.6em] text-blue-500 mb-10 leading-none">Schedule // Phase Deployment</h2>
                      <form onSubmit={bookAppointment} className="flex flex-col gap-8">
                        <div className="flex flex-col gap-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subject Identification</label>
                          <select 
                            required
                            value={appointmentForm.patient_id}
                            onChange={(e) => setAppointmentForm({...appointmentForm, patient_id: e.target.value})}
                            className="bg-slate-800 border-none p-5 text-white font-black outline-none uppercase tracking-tighter text-xl"
                          >
                            <option value="">SELECT SUBJECT...</option>
                            {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Authorized Consultant</label>
                          <select 
                            required
                            value={appointmentForm.doctor_id}
                            onChange={(e) => setAppointmentForm({...appointmentForm, doctor_id: e.target.value})}
                            className="bg-slate-800 border-none p-5 text-white font-black outline-none uppercase tracking-tighter text-xl"
                          >
                            <option value="">SELECT LEAD...</option>
                            {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-col gap-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Timeline Coordinates</label>
                          <input 
                            type="date"
                            required
                            value={appointmentForm.appointment_date}
                            onChange={(e) => setAppointmentForm({...appointmentForm, appointment_date: e.target.value})}
                            className="bg-slate-800 border-none p-5 text-white font-black outline-none text-xl"
                          />
                        </div>
                        <div className="flex flex-col gap-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Severity Metric Logic</label>
                          <div className="grid grid-cols-5 gap-3">
                            {[1, 2, 3, 4, 5].map(lvl => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => setAppointmentForm({...appointmentForm, severity: lvl.toString()})}
                                className={cn(
                                  "py-4 font-black transition-all text-sm",
                                  appointmentForm.severity === lvl.toString()
                                    ? "bg-blue-600 text-white ring-4 ring-blue-600/20"
                                    : "bg-slate-800 text-slate-500 hover:bg-slate-700"
                                )}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button className="mt-4 bg-blue-600 text-white font-black py-6 uppercase text-[12px] tracking-[0.4em] hover:bg-blue-500 transition-all shadow-[10px_10px_0px_rgba(37,99,235,0.2)]">
                          Finalize Operation
                        </button>
                      </form>
                    </section>
                  </div>

                  <div className="col-span-8">
                    <section className="bg-white border border-slate-200 flex flex-col overflow-hidden">
                      <div className="px-12 py-8 border-b-4 border-black flex justify-between items-center bg-white">
                        <div className="flex flex-col">
                          <h2 className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-900 leading-none">Global Queue Logic</h2>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3">Priority Ranking: High &rarr; Low Severity</span>
                        </div>
                        <div className="bg-slate-100 p-4 font-black text-xs uppercase tracking-widest">
                          Active Phase: {new Date().toLocaleDateString()}
                        </div>
                      </div>
                      <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                          <tr className="text-[10px] uppercase font-black text-slate-300 tracking-[0.5em] border-b border-slate-50">
                            <th className="px-6 py-8 w-24">INDEX</th>
                            <th className="px-6 py-8">SPECIMEN // IDENTITY</th>
                            <th className="px-6 py-8 w-48">LEAD COMMAND</th>
                            <th className="px-6 py-8 w-40 text-right">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm">
                          {appointments.map((app) => (
                            <tr key={app.id} className={cn("border-b border-slate-50 transition-all", app.severity >= 4 ? "bg-red-50/40" : "")}>
                              <td className="px-6 py-10">
                                <span className={cn("text-4xl font-black tracking-tighter leading-none", 
                                  app.severity >= 4 ? "text-red-600" : 
                                  app.severity >= 2 ? "text-slate-900" : "text-slate-100"
                                )}>
                                  {app.severity.toString().padStart(2, '0')}
                                </span>
                              </td>
                              <td className="px-6 py-10">
                                <p className="text-2xl font-black tracking-tight leading-none uppercase">{app.patient_name}</p>
                                <div className="flex items-center gap-2 mt-4">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">{app.appointment_date}</span>
                                </div>
                              </td>
                              <td className="px-6 py-10">
                                <div className="flex flex-col">
                                   <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Consultant</span>
                                   <span className="font-black text-sm text-slate-700 tracking-tight leading-none uppercase italic">{app.doctor_name}</span>
                                </div>
                              </td>
                              <td className="px-6 py-10 text-right">
                                <div className="inline-flex items-center gap-4 px-4 py-2 bg-slate-900">
                                  <div className="w-1.5 h-1.5 bg-green-500 blink" />
                                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white whitespace-nowrap">{app.status}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </section>
                  </div>
                </div>
              )}

            {activeTab === 'doctors' && (
                <div className="space-y-16">
                  <div className="grid grid-cols-12 gap-10">
                    {doctors.map(d => (
                        <div key={d.id} className="col-span-4 bg-white border border-slate-200 group relative">
                          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="w-3 h-3 bg-blue-600" />
                          </div>
                          <div className="p-12 flex flex-col h-full">
                            <div className="w-32 h-32 bg-slate-50 border-4 border-white shadow-xl mb-12 grayscale group-hover:grayscale-0 transition-all p-2">
                               <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${d.name}`} alt={d.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.5em] leading-none mb-2">{d.specialization}</span>
                              <h4 className="font-black text-4xl tracking-tighter leading-none border-l-8 border-slate-100 pl-6 group-hover:border-blue-600 transition-all uppercase">{d.name}</h4>
                            </div>
                            <div className="mt-12 flex justify-between items-end">
                               <div className="flex flex-col">
                                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Comm Line</span>
                                 <span className="font-mono text-xs font-black mt-1 text-slate-500">{d.phone}</span>
                               </div>
                               <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest hover:text-blue-600 transition-colors">Record // Feed</button>
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>

                  <section className="bg-slate-900 p-16 text-white overflow-hidden relative">
                    <div className="absolute right-0 top-0 text-[200px] font-black text-white/[0.03] leading-none select-none pointer-events-none -mr-20 -mt-20">
                      METRICS
                    </div>
                    <div className="relative z-10 flex flex-col gap-16">
                      <div className="flex flex-col gap-4">
                        <h3 className="text-[12px] font-black uppercase tracking-[0.8em] text-blue-500 leading-none">Diagnostic Analytics Readout</h3>
                        <h2 className="text-6xl font-black tracking-tighter uppercase leading-none">Operational Load // Total Aggregate</h2>
                      </div>
                      <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={workload} layout="vertical" margin={{ left: 50 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 13, fontWeight: 900, fill: '#64748b' }} width={120} />
                            <Tooltip 
                               cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                               contentStyle={{ borderRadius: '0px', border: '1px solid #334155', background: '#0f172a', color: '#fff', boxShadow: 'none' }}
                            />
                            <Bar 
                              dataKey="appointment_count" 
                              fill="#3b82f6" 
                              radius={0} 
                              barSize={50}
                              label={{ position: 'right', fontSize: 14, fontWeight: 900, fill: '#3b82f6', formatter: (v: number) => `METRIC:${v}` }}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </section>
                </div>
              )}

            {activeTab === 'inventory' && (
                <div className="space-y-12">
                  <header className="flex justify-between items-end bg-white border border-slate-200 p-16 shadow-[40px_40px_0px_rgba(0,0,0,0.02)]">
                    <div className="flex flex-col gap-6">
                      <h3 className="text-[12px] font-black uppercase tracking-[0.8em] text-slate-300 leading-none">Pharmacy Deployment Tracking</h3>
                      <h2 className="text-8xl font-black tracking-tighter uppercase leading-none border-l-8 border-blue-600 pl-10">Resource<br />Inventory</h2>
                    </div>
                    <div className="bg-red-600 text-white p-12 flex flex-col items-end gap-2 shadow-2xl">
                      <span className="text-[12px] font-black uppercase tracking-[0.4em] opacity-60 leading-none">Active Alerts</span>
                      <span className="text-8xl font-black leading-none tracking-tighter">{inventory.filter(i => isExpiringSoon(i.expiry_date)).length.toString().padStart(2, '0')}</span>
                    </div>
                  </header>

                  <section className="bg-white border-4 border-slate-900 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="text-[11px] uppercase font-black text-slate-300 tracking-[0.6em] bg-slate-900 text-white border-b border-white/10">
                          <th className="px-16 py-10">Catalog Identification</th>
                          <th className="px-16 py-10 text-center">Volume Metric</th>
                          <th className="px-16 py-10 text-right">Termination Phase</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-2 divide-slate-100">
                        {inventory.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-all group">
                            <td className="px-16 py-12">
                              <p className="text-5xl font-black tracking-tighter text-slate-900 leading-none uppercase group-hover:text-blue-600 transition-colors">{item.medicine_name}</p>
                              <div className="flex gap-4 mt-6">
                                {isExpiringSoon(item.expiry_date) && (
                                  <span className="bg-red-600 text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em]">Critical // Expiry threat</span>
                                )}
                                <span className={cn("px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em]", item.stock < 100 ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-400 font-bold")}>
                                  Protocol {item.stock < 100 ? "Restock Required" : "Stable Status"}
                                </span>
                              </div>
                            </td>
                            <td className="px-16 py-12 text-center text-8xl font-black tracking-tighter text-slate-100 group-hover:text-slate-200 transition-colors">
                              {item.stock}
                            </td>
                            <td className="px-16 py-12 text-right">
                              <p className={cn("text-3xl font-black tracking-tighter", isExpiringSoon(item.expiry_date) ? "text-red-600" : "text-slate-900")}>
                                {new Date(item.expiry_date).toLocaleDateString()}
                              </p>
                              <p className="text-[11px] font-black uppercase text-slate-300 tracking-[0.4em] mt-3">Batch Finalization Loop</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                </div>
              )}
          </motion.div>
          </AnimatePresence>
        </div>

        <footer className="px-12 py-8 bg-slate-900 text-white flex justify-between items-center mt-auto border-t border-white/5">
          <div className="flex gap-16">
             <div className="flex flex-col border-l-2 border-green-500 pl-6">
               <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-2">Core Telemetry</span>
               <span className="text-[11px] font-black text-green-400 uppercase tracking-[0.3em]">Status // ACTIVE_01</span>
             </div>
             <div className="flex flex-col border-l-2 border-blue-500 pl-6">
               <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 mb-2">Internal Engine</span>
               <span className="text-[11px] font-black text-blue-400 uppercase tracking-[0.3em]">Query // SQLite_v3_RUN</span>
             </div>
          </div>
          <div className="flex flex-col items-end">
             <div className="text-[10px] font-black uppercase tracking-[0.6em] text-white/40 leading-none">Medicare Intelligence System</div>
             <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 mt-3 italic underline decoration-blue-600/50">PulsePoint Core Architecture v2.0 - 2026</div>
          </div>
        </footer>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700;800&display=swap');
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.1; }
        }
        .blink {
          animation: blink 2s infinite ease-in-out;
        }
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 0px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}
