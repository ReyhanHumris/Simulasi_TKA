import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { motion } from 'framer-motion';
import { BookOpenCheck, Mail, Lock, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const user = await login(email, password);
      if (user && user.role === 'guru') {
        navigate('/teacher');
      } else if (user) {
        navigate('/student');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: 'var(--k-bg)' }}>
      {/* Background decorations */}
      <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'var(--k-navy)' }}></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: 'var(--k-orange)' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="rounded-xl shadow-2xl overflow-hidden border bg-white/50 backdrop-blur-sm" style={{ backgroundColor: 'var(--k-bg-card)', borderColor: 'var(--k-border)' }}>
          <div className="p-8 pb-6 border-b" style={{ borderColor: 'var(--k-border)' }}>
            <div className="flex justify-center mb-6">
              <div className="p-3 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--k-navy)' }}>
                <BookOpenCheck className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center mb-2 font-['Poppins']" style={{ color: 'var(--k-navy)' }}>Kingster TKA</h1>
            <p className="text-center font-['Open_Sans']" style={{ color: 'var(--k-text-muted)' }}>Welcome back! Please login to your account.</p>
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

              <div className="space-y-2">
                <label className="block text-sm font-medium font-['Poppins']" style={{ color: 'var(--k-text)' }}>Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5" style={{ color: 'var(--k-text-muted)' }} />
                  </div>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent font-['Open_Sans'] transition-all"
                    style={{ backgroundColor: 'var(--k-bg)', borderColor: 'var(--k-border)', color: 'var(--k-text)', '--tw-ring-color': 'var(--k-orange)' } as React.CSSProperties}
                    placeholder="Enter your password"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:opacity-70 transition-opacity"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" style={{ color: 'var(--k-text-muted)' }} />
                    ) : (
                      <Eye className="w-5 h-5" style={{ color: 'var(--k-text-muted)' }} />
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 px-4 flex items-center justify-center gap-2 rounded-lg text-white font-medium font-['Poppins'] shadow-md hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                style={{ backgroundColor: 'var(--k-navy)' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
                {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t flex flex-col gap-4 text-center" style={{ borderColor: 'var(--k-border)' }}>
              <p className="text-sm font-['Open_Sans']" style={{ color: 'var(--k-text-muted)' }}>
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold hover:underline" style={{ color: 'var(--k-orange)' }}>
                  Register here
                </Link>
              </p>
              
              <div className="p-4 rounded-lg text-sm text-left border" style={{ backgroundColor: 'var(--k-bg)', borderColor: 'var(--k-border)' }}>
                <p className="font-semibold mb-1 font-['Poppins']" style={{ color: 'var(--k-navy)' }}>Demo Account:</p>
                <div className="space-y-1 font-['Open_Sans']" style={{ color: 'var(--k-text-muted)' }}>
                  <p>Guru: <strong>guru@demo.com</strong> / <strong>guru123</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
