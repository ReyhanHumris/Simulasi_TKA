import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, KELAS_OPTIONS, type Kelas, type CustomQuestion, type SimulationResult } from '../auth';
import { 
  LogOut, PlusCircle, List, BarChart3, Edit, Trash2, 
  Search, Filter, BookOpen, Users, Award, TrendingUp, TrendingDown,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

const SUBJECTS = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 
  'TKA Matematika Tingkat Lanjut', 'Bahasa Inggris Tingkat Lanjut', 'PKK'
];

const PACKAGES = ['Paket 1', 'Paket 2'];
const DIFFICULTIES = ['Mudah', 'Sedang', 'Sulit'];

export default function TeacherDashboard() {
  const { 
    user, logout, 
    addCustomQuestion, updateCustomQuestion, deleteCustomQuestion, getCustomQuestions,
    getAllSimulationResults, getResultsByClass
  } = useAuth();
  
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'kelola' | 'hasil' | 'rekap'>('kelola');
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auth Guard
  useEffect(() => {
    if (isMounted) {
      if (!user) {
        navigate('/login');
      } else if (user.role !== 'guru') {
        navigate('/student');
      }
    }
  }, [user, navigate, isMounted]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ================= TAB 1: Kelola Soal State =================
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);
  const loadQuestions = () => setQuestions(getCustomQuestions());
  
  useEffect(() => {
    if (user && user.role === 'guru') {
      loadQuestions();
    }
  }, [user]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subject: SUBJECTS[0],
    paket: PACKAGES[0],
    difficulty: DIFFICULTIES[0] as 'Mudah' | 'Sedang' | 'Sulit',
    stem: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: ''
  });

  const handleFormReset = () => {
    setEditingId(null);
    setFormData({
      subject: SUBJECTS[0],
      paket: PACKAGES[0],
      difficulty: DIFFICULTIES[0] as 'Mudah' | 'Sedang' | 'Sulit',
      stem: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: ''
    });
  };

  const handleEditClick = (q: CustomQuestion) => {
    setEditingId(q.id);
    setFormData({
      subject: q.subject,
      paket: q.paket,
      difficulty: q.difficulty as 'Mudah' | 'Sedang' | 'Sulit',
      stem: q.stem,
      options: [...q.options] as [string, string, string, string],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteClick = (id: string) => {
    Swal.fire({
      title: 'Hapus Soal?',
      text: "Soal yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'var(--k-orange)',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteCustomQuestion(id);
        loadQuestions();
        if (editingId === id) handleFormReset();
        Swal.fire({
          title: 'Terhapus!',
          text: 'Soal berhasil dihapus.',
          icon: 'success',
          confirmButtonColor: 'var(--k-navy)'
        });
      }
    });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stem || formData.options.some(opt => !opt)) {
      Swal.fire('Error', 'Harap isi soal dan semua pilihan jawaban', 'error');
      return;
    }

    if (editingId) {
      updateCustomQuestion(editingId, {
        subject: formData.subject,
        paket: formData.paket,
        difficulty: formData.difficulty,
        stem: formData.stem,
        options: formData.options as [string, string, string, string],
        correctAnswer: formData.correctAnswer,
        explanation: formData.explanation
      });
      Swal.fire({
        title: 'Berhasil!',
        text: 'Soal berhasil diperbarui.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      addCustomQuestion({
        subject: formData.subject,
        paket: formData.paket,
        difficulty: formData.difficulty,
        stem: formData.stem,
        options: formData.options as [string, string, string, string],
        correctAnswer: formData.correctAnswer,
        explanation: formData.explanation
      });
      Swal.fire({
        title: 'Berhasil!',
        text: 'Soal baru berhasil ditambahkan.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    }
    
    handleFormReset();
    loadQuestions();
  };

  const updateOption = (index: number, val: string) => {
    const newOptions = [...formData.options];
    newOptions[index] = val;
    setFormData({ ...formData, options: newOptions });
  };

  // ================= TAB 2: Hasil Simulasi State =================
  const [filterKelas, setFilterKelas] = useState<Kelas | 'Semua'>('Semua');
  const [filterMapel, setFilterMapel] = useState<string>('Semua');
  const allResults = useMemo(() => getAllSimulationResults(), [user, activeTab]);

  const filteredResults = useMemo(() => {
    return allResults.filter(r => {
      const matchKelas = filterKelas === 'Semua' || r.studentKelas === filterKelas;
      const matchMapel = filterMapel === 'Semua' || r.subject === filterMapel;
      return matchKelas && matchMapel;
    });
  }, [allResults, filterKelas, filterMapel]);

  // ================= TAB 3: Rekap per Kelas State =================
  const [rekapKelas, setRekapKelas] = useState<Kelas>(KELAS_OPTIONS[0]);
  const classResults = useMemo(() => getResultsByClass(rekapKelas), [rekapKelas, user, activeTab]);
  
  const classStats = useMemo(() => {
    if (classResults.length === 0) return null;
    const totalScore = classResults.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = totalScore / classResults.length;
    const maxScore = Math.max(...classResults.map(r => r.score));
    const minScore = Math.min(...classResults.map(r => r.score));
    const uniqueStudents = new Set(classResults.map(r => r.studentName)).size;

    return { avgScore, maxScore, minScore, uniqueStudents, totalAttempts: classResults.length };
  }, [classResults]);

  if (!user || user.role !== 'guru') return null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--k-bg)', color: 'var(--k-text)' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 shadow-md border-b" style={{ backgroundColor: 'var(--k-navy)', borderColor: 'var(--k-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
              <BookOpen className="text-[var(--k-orange)]" size={24} />
              Kingster Dashboard Guru
            </h1>
            <p className="text-sm text-gray-300 mt-1">Selamat datang, {user.name}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:bg-white/10 transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-2 overflow-x-auto pb-[-1px]">
          <TabButton 
            active={activeTab === 'kelola'} 
            onClick={() => setActiveTab('kelola')} 
            icon={<PlusCircle size={18} />} 
            label="Kelola Soal" 
          />
          <TabButton 
            active={activeTab === 'hasil'} 
            onClick={() => setActiveTab('hasil')} 
            icon={<List size={18} />} 
            label="Hasil Simulasi" 
          />
          <TabButton 
            active={activeTab === 'rekap'} 
            onClick={() => setActiveTab('rekap')} 
            icon={<BarChart3 size={18} />} 
            label="Rekap per Kelas" 
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* TAB 1: KELOLA SOAL */}
          {activeTab === 'kelola' && (
            <motion.div 
              key="kelola"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--k-bg-card)', borderColor: 'var(--k-border)' }}>
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}>
                  {editingId ? <Edit className="text-[var(--k-orange)]" /> : <PlusCircle className="text-[var(--k-orange)]" />}
                  {editingId ? 'Edit Soal' : 'Tambah Soal Baru'}
                </h2>
                
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Mata Pelajaran</label>
                      <select 
                        value={formData.subject}
                        onChange={e => setFormData({...formData, subject: e.target.value})}
                        className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
                        style={{ borderColor: 'var(--k-border)', backgroundColor: 'var(--k-bg)' }}
                      >
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Paket</label>
                      <select 
                        value={formData.paket}
                        onChange={e => setFormData({...formData, paket: e.target.value})}
                        className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
                        style={{ borderColor: 'var(--k-border)', backgroundColor: 'var(--k-bg)' }}
                      >
                        {PACKAGES.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tingkat Kesulitan</label>
                      <select 
                        value={formData.difficulty}
                        onChange={e => setFormData({...formData, difficulty: e.target.value as any})}
                        className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
                        style={{ borderColor: 'var(--k-border)', backgroundColor: 'var(--k-bg)' }}
                      >
                        {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Pertanyaan</label>
                    <textarea 
                      value={formData.stem}
                      onChange={e => setFormData({...formData, stem: e.target.value})}
                      rows={4}
                      className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
                      style={{ borderColor: 'var(--k-border)', backgroundColor: 'var(--k-bg)' }}
                      placeholder="Ketik pertanyaan di sini..."
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium">Pilihan Jawaban & Kunci</label>
                    {formData.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <input 
                          type="radio"
                          name="correctAnswer"
                          checked={formData.correctAnswer === i}
                          onChange={() => setFormData({...formData, correctAnswer: i})}
                          className="w-5 h-5 cursor-pointer accent-[var(--k-orange)]"
                        />
                        <span className="font-semibold text-lg w-6 text-center">{String.fromCharCode(65 + i)}</span>
                        <input 
                          type="text"
                          value={opt}
                          onChange={e => updateOption(i, e.target.value)}
                          className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 ${formData.correctAnswer === i ? 'ring-1 ring-[var(--k-orange)]' : ''}`}
                          style={{ borderColor: 'var(--k-border)', backgroundColor: 'var(--k-bg)' }}
                          placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Pembahasan (Opsional)</label>
                    <textarea 
                      value={formData.explanation}
                      onChange={e => setFormData({...formData, explanation: e.target.value})}
                      rows={3}
                      className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
                      style={{ borderColor: 'var(--k-border)', backgroundColor: 'var(--k-bg)' }}
                      placeholder="Ketik pembahasan soal..."
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t" style={{ borderColor: 'var(--k-border)' }}>
                    {editingId && (
                      <button 
                        type="button" 
                        onClick={handleFormReset}
                        className="px-4 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
                        style={{ borderColor: 'var(--k-border)' }}
                      >
                        Batal
                      </button>
                    )}
                    <button 
                      type="submit"
                      className="px-6 py-2 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                      style={{ backgroundColor: 'var(--k-orange)' }}
                    >
                      {editingId ? 'Simpan Perubahan' : 'Tambah Soal'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Daftar Soal */}
              <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--k-bg-card)', borderColor: 'var(--k-border)' }}>
                <h2 className="text-xl font-semibold mb-6" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}>
                  Daftar Soal Custom ({questions.length})
                </h2>
                
                {questions.length === 0 ? (
                  <div className="text-center py-12 rounded-lg border border-dashed" style={{ borderColor: 'var(--k-border)' }}>
                    <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                    <p className="text-lg" style={{ color: 'var(--k-text-muted)' }}>Belum ada soal yang ditambahkan</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {questions.map((q, idx) => (
                      <div key={q.id} className="rounded-lg border p-4 flex flex-col md:flex-row gap-4 justify-between" style={{ borderColor: 'var(--k-border)' }}>
                        <div className="flex-1">
                          <div className="flex gap-2 mb-2 flex-wrap">
                            <span className="text-xs px-2 py-1 rounded-md text-white font-medium" style={{ backgroundColor: 'var(--k-navy)' }}>{q.subject}</span>
                            <span className="text-xs px-2 py-1 rounded-md bg-gray-200 text-gray-700">{q.paket}</span>
                            <span className={`text-xs px-2 py-1 rounded-md font-medium ${q.difficulty === 'Mudah' ? 'bg-green-100 text-green-700' : q.difficulty === 'Sedang' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                              {q.difficulty}
                            </span>
                          </div>
                          <p className="font-medium mb-3 line-clamp-2">{q.stem}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm" style={{ color: 'var(--k-text-muted)' }}>
                            {q.options.map((opt, i) => (
                              <div key={i} className={`flex items-start gap-1 ${q.correctAnswer === i ? 'text-[var(--k-orange)] font-semibold' : ''}`}>
                                <span>{String.fromCharCode(65 + i)}.</span>
                                <span className="line-clamp-1">{opt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-row md:flex-col gap-2 justify-start md:justify-center border-t md:border-t-0 md:border-l pt-3 md:pt-0 md:pl-4" style={{ borderColor: 'var(--k-border)' }}>
                          <button 
                            onClick={() => handleEditClick(q)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-blue-600 flex items-center justify-center transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(q.id)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-red-500 flex items-center justify-center transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: HASIL SIMULASI */}
          {activeTab === 'hasil' && (
            <motion.div 
              key="hasil"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="rounded-xl shadow-sm border p-6" style={{ backgroundColor: 'var(--k-bg-card)', borderColor: 'var(--k-border)' }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}>
                    <List className="text-[var(--k-orange)]" />
                    Semua Hasil Simulasi
                  </h2>
                  
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <Filter size={16} style={{ color: 'var(--k-text-muted)' }} />
                      <select 
                        value={filterKelas} 
                        onChange={e => setFilterKelas(e.target.value as Kelas | 'Semua')}
                        className="rounded-lg border px-3 py-1.5 text-sm outline-none"
                        style={{ borderColor: 'var(--k-border)', backgroundColor: 'var(--k-bg)' }}
                      >
                        <option value="Semua">Semua Kelas</option>
                        {KELAS_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <select 
                        value={filterMapel} 
                        onChange={e => setFilterMapel(e.target.value)}
                        className="rounded-lg border px-3 py-1.5 text-sm outline-none"
                        style={{ borderColor: 'var(--k-border)', backgroundColor: 'var(--k-bg)' }}
                      >
                        <option value="Semua">Semua Mapel</option>
                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--k-border)' }}>
                  <table className="w-full text-left text-sm">
                    <thead style={{ backgroundColor: 'var(--k-navy)', color: 'white' }}>
                      <tr>
                        <th className="px-4 py-3 font-medium">No</th>
                        <th className="px-4 py-3 font-medium">Nama Siswa</th>
                        <th className="px-4 py-3 font-medium">Kelas</th>
                        <th className="px-4 py-3 font-medium">Mapel</th>
                        <th className="px-4 py-3 font-medium">Paket</th>
                        <th className="px-4 py-3 font-medium text-center">Skor</th>
                        <th className="px-4 py-3 font-medium text-center">B/S</th>
                        <th className="px-4 py-3 font-medium">Tanggal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResults.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                            Tidak ada data hasil simulasi yang sesuai filter.
                          </td>
                        </tr>
                      ) : (
                        filteredResults.map((r, i) => (
                          <tr key={r.id} className="border-t hover:bg-gray-50 transition-colors" style={{ borderColor: 'var(--k-border)' }}>
                            <td className="px-4 py-3">{i + 1}</td>
                            <td className="px-4 py-3 font-medium">{r.studentName}</td>
                            <td className="px-4 py-3">{r.studentKelas}</td>
                            <td className="px-4 py-3">{r.subject}</td>
                            <td className="px-4 py-3">{r.paket}</td>
                            <td className="px-4 py-3 text-center font-bold" style={{ color: 'var(--k-orange)' }}>
                              {Math.round(r.score)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-green-600">{r.correct}</span> / <span className="text-red-500">{r.incorrect}</span>
                            </td>
                            <td className="px-4 py-3 text-xs" style={{ color: 'var(--k-text-muted)' }}>
                              {new Date(r.completedAt).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: REKAP PER KELAS */}
          {activeTab === 'rekap' && (
            <motion.div 
              key="rekap"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-semibold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}>
                  Statistik & Rekapitulasi
                </h2>
                <div className="flex items-center gap-2 p-1.5 rounded-lg border shadow-sm" style={{ backgroundColor: 'var(--k-bg-card)', borderColor: 'var(--k-border)' }}>
                  <Users size={18} style={{ color: 'var(--k-text-muted)', marginLeft: 8 }} />
                  <select 
                    value={rekapKelas}
                    onChange={e => setRekapKelas(e.target.value as Kelas)}
                    className="bg-transparent border-none outline-none pr-4 py-1 text-sm font-medium"
                    style={{ color: 'var(--k-navy)' }}
                  >
                    {KELAS_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </div>

              {!classStats ? (
                <div className="rounded-xl shadow-sm border p-12 text-center" style={{ backgroundColor: 'var(--k-bg-card)', borderColor: 'var(--k-border)' }}>
                  <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                  <h3 className="text-lg font-medium mb-1">Belum Ada Data</h3>
                  <p style={{ color: 'var(--k-text-muted)' }}>Belum ada siswa dari kelas {rekapKelas} yang mengerjakan simulasi.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard 
                      title="Rata-rata Skor" 
                      value={Math.round(classStats.avgScore).toString()} 
                      icon={<BarChart3 />} 
                      color="var(--k-navy)" 
                    />
                    <StatCard 
                      title="Peserta Aktif" 
                      value={`${classStats.uniqueStudents} Siswa`} 
                      subtitle={`${classStats.totalAttempts} kali simulasi`}
                      icon={<Users />} 
                      color="var(--k-orange)" 
                    />
                    <StatCard 
                      title="Skor Tertinggi" 
                      value={Math.round(classStats.maxScore).toString()} 
                      icon={<TrendingUp />} 
                      color="#10b981" 
                    />
                    <StatCard 
                      title="Skor Terendah" 
                      value={Math.round(classStats.minScore).toString()} 
                      icon={<TrendingDown />} 
                      color="#ef4444" 
                    />
                  </div>

                  <div className="rounded-xl shadow-sm border p-6 mt-8" style={{ backgroundColor: 'var(--k-bg-card)', borderColor: 'var(--k-border)' }}>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      <Award className="text-[var(--k-orange)]" />
                      Detail Peserta - {rekapKelas}
                    </h3>
                    
                    <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--k-border)' }}>
                      <table className="w-full text-left text-sm">
                        <thead style={{ backgroundColor: 'var(--k-bg)', borderBottom: '1px solid var(--k-border)' }}>
                          <tr>
                            <th className="px-4 py-3 font-medium">Nama Siswa</th>
                            <th className="px-4 py-3 font-medium">Mapel</th>
                            <th className="px-4 py-3 font-medium">Paket</th>
                            <th className="px-4 py-3 font-medium text-center">Skor</th>
                            <th className="px-4 py-3 font-medium">Tanggal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classResults.map((r) => (
                            <tr key={r.id} className="border-t hover:bg-gray-50" style={{ borderColor: 'var(--k-border)' }}>
                              <td className="px-4 py-3 font-medium">{r.studentName}</td>
                              <td className="px-4 py-3">{r.subject}</td>
                              <td className="px-4 py-3">{r.paket}</td>
                              <td className="px-4 py-3 text-center font-bold">{Math.round(r.score)}</td>
                              <td className="px-4 py-3 text-xs" style={{ color: 'var(--k-text-muted)' }}>
                                {new Date(r.completedAt).toLocaleDateString('id-ID')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// Subcomponents
function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 rounded-t-lg font-medium transition-colors border-t border-x ${
        active 
          ? 'text-white border-transparent' 
          : 'bg-white/5 text-gray-300 hover:bg-white/10 border-transparent'
      }`}
      style={{
        backgroundColor: active ? 'var(--k-bg)' : undefined,
        color: active ? 'var(--k-navy)' : undefined,
      }}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <motion.div 
          layoutId="activeTabIndicator"
          className="absolute bottom-0 left-0 right-0 h-0.5"
          style={{ backgroundColor: 'var(--k-orange)' }}
        />
      )}
    </button>
  );
}

function StatCard({ title, value, subtitle, icon, color }: { title: string, value: string, subtitle?: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="rounded-xl shadow-sm border p-5 flex items-start gap-4" style={{ backgroundColor: 'var(--k-bg-card)', borderColor: 'var(--k-border)' }}>
      <div className="p-3 rounded-lg text-white" style={{ backgroundColor: color }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--k-text-muted)' }}>{title}</p>
        <p className="text-2xl font-bold mt-1" style={{ color: 'var(--k-navy)' }}>{value}</p>
        {subtitle && <p className="text-xs mt-1" style={{ color: 'var(--k-text-muted)' }}>{subtitle}</p>}
      </div>
    </div>
  );
}
