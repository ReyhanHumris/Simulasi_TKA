import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, KELAS_OPTIONS, type Kelas } from '../auth';
import { motion } from 'framer-motion';
import { Mail, Lock, User, GraduationCap, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Register = () => {
  const { registerStudent } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [kelas, setKelas] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!kelas) {
      setError('Please select a class (Kelas).');
      return;
    }
    
    setLoading(true);
    
    try {
      await registerStudent(name, email, password, kelas as Kelas);
      navigate('/student');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: 'var(--k-bg)' }}>
      {/* Background decorations */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'var(--k-navy)' }}></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'var(--k-orange)' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="rounded-xl shadow-2xl overflow-hidden border bg-white/50 backdrop-blur-sm" style={{ backgroundColor: 'var(--k-bg-card)', borderColor: 'var(--k-border)' }}>
          <div className="p-8 pb-6 border-b" style={{ borderColor: 'var(--k-border)' }}>
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--k-orange)' }}>
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2 font-['Poppins']" style={{ color: 'var(--k-navy)' }}>Join Kingster</h1>
            <p className="text-center font-['Open_Sans']" style={{ color: 'var(--k-text-muted)' }}>Create your student account to get started.</p>
          </div>
          
          <div className="p-8 pt-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                className="mb-6 p-4 rounded-lg flex items-start gap-3 bg-red-50 border border-red-200 text-red-700"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-medium font-['Open_Sans']">{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium font-['Poppins']" style={{ color: 'var(--k-text)' }}>Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="w-5 h-5" style={{ color: 'var(--k-text-muted)' }} />
                  </div>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-['Open_Sans'] transition-all"
                    style={{ backgroundColor: 'var(--k-bg)', borderColor: 'var(--k-border)', color: 'var(--k-text)', '--tw-ring-color': 'var(--k-orange)' } as React.CSSProperties}
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium font-['Poppins']" style={{ color: 'var(--k-text)' }}>Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5" style={{ color: 'var(--k-text-muted)' }} />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-['Open_Sans'] transition-all"
                    style={{ backgroundColor: 'var(--k-bg)', borderColor: 'var(--k-border)', color: 'var(--k-text)', '--tw-ring-color': 'var(--k-orange)' } as React.CSSProperties}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium font-['Poppins']" style={{ color: 'var(--k-text)' }}>Class (Kelas)</label>
                  <div className="relative">
                    <select
                      value={kelas}
                      onChange={(e) => setKelas(e.target.value)}
                      required
                      className="w-full px-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-['Open_Sans'] transition-all appearance-none"
                      style={{ backgroundColor: 'var(--k-bg)', borderColor: 'var(--k-border)', color: kelas ? 'var(--k-text)' : 'var(--k-text-muted)', '--tw-ring-color': 'var(--k-orange)' } as React.CSSProperties}
                    >
                      <option value="" disabled>Select Class</option>
                      {KELAS_OPTIONS.map((k) => (
                        <option key={k} value={k} style={{ color: 'var(--k-text)' }}>{k}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4" style={{ color: 'var(--k-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <label className="block text-sm font-medium font-['Poppins']" style={{ color: 'var(--k-text)' }}>Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="w-4 h-4" style={{ color: 'var(--k-text-muted)' }} />
                    </div>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-9 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-['Open_Sans'] transition-all text-sm"
                      style={{ backgroundColor: 'var(--k-bg)', borderColor: 'var(--k-border)', color: 'var(--k-text)', '--tw-ring-color': 'var(--k-orange)' } as React.CSSProperties}
                      placeholder="Password"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" style={{ color: 'var(--k-text-muted)' }} />
                      ) : (
                        <Eye className="w-4 h-4" style={{ color: 'var(--k-text-muted)' }} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full mt-2 py-3 px-4 flex items-center justify-center gap-2 rounded-lg text-white font-medium font-['Poppins'] shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                style={{ backgroundColor: 'var(--k-orange)' }}
              >
                {loading ? 'Creating account...' : 'Create Account'}
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: 'var(--k-border)' }}>
              <p className="text-sm font-['Open_Sans']" style={{ color: 'var(--k-text-muted)' }}>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--k-navy)' }}>
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
