import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, type SimulationResult, type Kelas } from '../auth';
import { motion } from 'framer-motion';
import { LogOut, ArrowRight, BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react';

const StudentHome: React.FC = () => {
  const { user, logout, getResultsByStudent } = useAuth();
  const navigate = useNavigate();
  const [results, setResults] = useState<SimulationResult[]>([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'siswa') {
        const studentResults = getResultsByStudent(user.name, user.kelas as Kelas);
        // Sort descending by completion time if available
        const sortedResults = [...studentResults].sort((a, b) => {
            if (!a.completedAt || !b.completedAt) return 0;
            return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
        });
        setResults(sortedResults);
    }
  }, [user, navigate, getResultsByStudent]);

  if (!user) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div 
      className="min-h-screen p-6 md:p-8 lg:p-12 font-[Open_Sans]"
      style={{ backgroundColor: 'var(--k-bg)', color: 'var(--k-text)' }}
    >
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-2xl shadow-sm border"
          style={{ backgroundColor: 'var(--k-bg-card)', borderColor: 'var(--k-border)' }}
        >
          <div>
            <h1 className="text-3xl font-bold font-[Poppins] mb-2" style={{ color: 'var(--k-navy)' }}>
              Halo, {user.name}!
            </h1>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 text-sm font-semibold rounded-full bg-blue-50" style={{ color: 'var(--k-navy)' }}>
                Kelas {user.kelas}
              </span>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors hover:bg-gray-100"
            style={{ color: 'var(--k-text-muted)' }}
          >
            <LogOut size={18} />
            <span>Keluar</span>
          </button>
        </motion.div>

        {/* Quick Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div 
            className="rounded-2xl p-8 shadow-md relative overflow-hidden group cursor-pointer"
            style={{ 
              backgroundColor: 'var(--k-navy)',
            }}
            onClick={() => navigate('/app')}
          >
            {/* Decorative background circle */}
            <div 
              className="absolute -right-20 -top-20 w-64 h-64 rounded-full opacity-20 transition-transform group-hover:scale-110 duration-500"
              style={{ backgroundColor: 'var(--k-orange)' }}
            />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-white">
                <h2 className="text-2xl font-bold font-[Poppins] mb-2">Siap untuk berlatih?</h2>
                <p className="text-blue-100 opacity-90 max-w-md">
                  Uji kemampuanmu dengan simulasi ujian terbaru. Dapatkan hasil instan dan analisis pembelajaran.
                </p>
              </div>
              
              <button 
                className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-transform hover:scale-105 shadow-lg"
                style={{ 
                  backgroundColor: 'var(--k-orange)',
                  color: 'white'
                }}
              >
                <span>Mulai Simulasi</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Riwayat Simulasi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Clock size={24} style={{ color: 'var(--k-orange)' }} />
            <h2 className="text-2xl font-bold font-[Poppins]" style={{ color: 'var(--k-navy)' }}>
              Riwayat Simulasi
            </h2>
          </div>

          {results.length === 0 ? (
            <div 
              className="text-center py-16 rounded-2xl border border-dashed"
              style={{ backgroundColor: 'var(--k-bg-card)', borderColor: 'var(--k-border)' }}
            >
              <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-gray-50">
                <BookOpen size={32} style={{ color: 'var(--k-text-muted)' }} />
              </div>
              <h3 className="text-lg font-bold font-[Poppins] mb-1" style={{ color: 'var(--k-navy)' }}>Belum ada riwayat</h3>
              <p style={{ color: 'var(--k-text-muted)' }}>Kamu belum menyelesaikan simulasi apapun.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((result) => {
                const isPassed = result.score >= 70;
                
                return (
                  <div 
                    key={result.id}
                    className="rounded-2xl p-6 shadow-sm border transition-shadow hover:shadow-md"
                    style={{ backgroundColor: 'var(--k-bg-card)', borderColor: 'var(--k-border)' }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold font-[Poppins] text-lg mb-1" style={{ color: 'var(--k-navy)' }}>
                          {result.subject}
                        </h3>
                        <div className="flex gap-2 text-sm">
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 font-medium" style={{ color: 'var(--k-text)' }}>
                            Paket {result.paket}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 font-medium capitalize" style={{ color: 'var(--k-text)' }}>
                            {result.difficulty}
                          </span>
                        </div>
                      </div>
                      
                      <div 
                        className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-4 ${
                          isPassed ? 'border-green-100 bg-green-50 text-green-600' : 'border-red-100 bg-red-50 text-red-600'
                        }`}
                      >
                        <span className="font-bold text-lg leading-none">{Math.round(result.score)}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-green-600 font-medium">
                          <CheckCircle size={16} />
                          <span>{result.correct} Benar</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-red-600 font-medium">
                          <XCircle size={16} />
                          <span>{result.incorrect} Salah</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-green-500 h-full"
                          style={{ width: `${(result.correct / result.total) * 100}%` }}
                        />
                        <div 
                          className="bg-red-500 h-full"
                          style={{ width: `${(result.incorrect / result.total) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t text-xs font-medium flex items-center justify-between" style={{ borderColor: 'var(--k-border)', color: 'var(--k-text-muted)' }}>
                      <span>Selesai pada:</span>
                      <span>{formatDate(result.completedAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
};

export default StudentHome;
