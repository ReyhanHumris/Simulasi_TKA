import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Confetti from 'react-confetti'
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  Brain,
  Calculator,
  CheckCircle2,
  Clock,
  Globe,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const SUBJECTS_WAJIB = [
  'Literasi Bahasa Indonesia',
  'Literasi Bahasa Inggris',
  'Penalaran Matematika',
] as const

const SUBJECTS_PILIHAN = [
  'Matematika Tingkat Lanjut',
  'Bahasa Inggris Tingkat Lanjut',
] as const

const SUBJECTS = [...SUBJECTS_WAJIB, ...SUBJECTS_PILIHAN] as const
const PAKETS = ['Paket 1', 'Paket 2', 'Paket 3', 'Paket 4', 'Paket 5'] as const
const DIFFICULTIES = ['Mudah', 'Sedang', 'Sulit'] as const
const QUESTIONS_PER_SET = 25
const QUIZ_DURATION_SECONDS = 50 * 60 // 3000 seconds

// ─── TYPES ───────────────────────────────────────────────────────────────────

type Subject = (typeof SUBJECTS)[number]
type Paket = (typeof PAKETS)[number]
type Difficulty = (typeof DIFFICULTIES)[number]
type Screen = 'setup' | 'quiz' | 'result'

type Question = {
  id: string
  subject: Subject
  paket: Paket
  difficulty: Difficulty
  stem: string
  options: string[]
  correctAnswer: number
  explanation: string
}

type OptionSet = Pick<Question, 'options' | 'correctAnswer'>

// ─── METADATA ────────────────────────────────────────────────────────────────

const subjectMeta: Record<
  Subject,
  { icon: LucideIcon; description: string; metric: string; category: 'wajib' | 'pilihan' }
> = {
  'Literasi Bahasa Indonesia': {
    icon: BookOpen,
    description: 'Pemahaman bacaan, wacana, kalimat efektif, dan ejaan.',
    metric: '25 soal · 50 menit',
    category: 'wajib',
  },
  'Literasi Bahasa Inggris': {
    icon: Globe,
    description: 'Reading comprehension, vocabulary in context, inference.',
    metric: '25 soal · 50 menit',
    category: 'wajib',
  },
  'Penalaran Matematika': {
    icon: Brain,
    description: 'Aritmetika, aljabar, geometri, statistik, dan pola bilangan.',
    metric: '25 soal · 50 menit',
    category: 'wajib',
  },
  'Matematika Tingkat Lanjut': {
    icon: Calculator,
    description: 'Kalkulus, matriks, kombinatorik, dan trigonometri.',
    metric: '25 soal · 50 menit',
    category: 'pilihan',
  },
  'Bahasa Inggris Tingkat Lanjut': {
    icon: Star,
    description: 'Advanced grammar, idioms, and complex reading comprehension.',
    metric: '25 soal · 50 menit',
    category: 'pilihan',
  },
}

const difficultyMeta: Record<Difficulty, { tone: string; description: string; color: string }> = {
  Mudah: { tone: 'Fondasi', description: 'Konsep dasar dan pengenalan tipe soal.', color: '#1a8c4e' },
  Sedang: { tone: 'Aplikasi', description: 'Pemahaman mendalam dan ketelitian.', color: '#e8821a' },
  Sulit: { tone: 'Analitis', description: 'Tantangan HOTS dan penalaran tinggi.', color: '#c0392b' },
}

const paketDescriptions: Record<Paket, string> = {
  'Paket 1': 'Drill awal untuk membaca pola dan mengenali tipe soal.',
  'Paket 2': 'Variasi konteks yang lebih rapat dan beragam.',
  'Paket 3': 'Kombinasi konsep dengan jebakan pilihan jawaban.',
  'Paket 4': 'Simulasi ritme ujian dengan kasus lebih panjang.',
  'Paket 5': 'Paket pemantapan sebelum evaluasi akhir.',
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const rotate = <T,>(items: T[], amount: number) => {
  const shift = ((amount % items.length) + items.length) % items.length
  return [...items.slice(shift), ...items.slice(0, shift)]
}

const createOptionSet = (correct: string, distractors: string[], seed: number): OptionSet => {
  const unique = [correct, ...distractors].reduce<string[]>((acc, o) => {
    if (!acc.includes(o) && acc.length < 4) acc.push(o)
    return acc
  }, [])
  while (unique.length < 4) unique.push(`Opsi ${unique.length}`)
  const options = rotate(unique, seed % 4)
  return { options, correctAnswer: options.indexOf(correct) }
}

const numOpts = (answer: number, seed: number, spread = 3): OptionSet =>
  createOptionSet(
    String(answer),
    [answer + spread, answer - spread, answer + spread * 2, answer - spread * 2]
      .filter((v) => v !== answer)
      .map(String),
    seed,
  )

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ═══════════════════════════════════════════════════════════════════
// 1. PENALARAN MATEMATIKA — 25 soal
// ═══════════════════════════════════════════════════════════════════
const buildPenalaranMatematikaQuestion = (p: number, d: Difficulty, q: number) => {
  const seed = p * 37 + q
  const m = d === 'Mudah' ? 1 : d === 'Sedang' ? 2 : 3

  if (q === 1) {
    const a = 12 + p * 8 + m * 5; const b = 15 + p * 6 + m * 4
    return { stem: `Hasil dari ${a} + ${b} adalah ...`, ...numOpts(a + b, seed, 4 + m), explanation: `${a} + ${b} = ${a + b}.` }
  }
  if (q === 2) {
    const k = 4 + p + m; const an = 5 + p + m
    return { stem: `Terdapat ${k} kelompok belajar, masing-masing ${an} siswa. Total siswa adalah ...`, ...numOpts(k * an, seed, 5 + m), explanation: `${k} × ${an} = ${k * an} siswa.` }
  }
  if (q === 3) {
    const awal = 80 + p * 20 + m * 10; const kurang = 23 + p * 5 + m * 3
    return { stem: `Toko memiliki ${awal} buku, setelah ${kurang} terjual, sisa buku adalah ...`, ...numOpts(awal - kurang, seed, 4 + m), explanation: `${awal} − ${kurang} = ${awal - kurang}.` }
  }
  if (q === 4) {
    const n1 = 1 + (p % 3); const dn = 4 + (q % 3); const n2 = 1 + ((p + 1) % 3)
    return { stem: `Nilai dari ${n1}/${dn} + ${n2}/${dn} adalah ...`, ...createOptionSet(`${n1 + n2}/${dn}`, [`${n1 + n2 + 1}/${dn}`, `${n1 + n2 - 1}/${dn}`, `${n1 * n2}/${dn}`], seed), explanation: `${n1}/${dn} + ${n2}/${dn} = ${n1 + n2}/${dn} (penyebut sama, jumlahkan pembilang).` }
  }
  if (q === 5) {
    const base = 100 + p * 50 + m * 20; const pct = 10 + p * 5 + m * 5; const ans = (base * pct) / 100
    return { stem: `${pct}% dari ${base} adalah ...`, ...numOpts(ans, seed, 5 + m * 2), explanation: `${pct}/100 × ${base} = ${ans}.` }
  }
  if (q === 6) {
    const tot = 60 + p * 15 + m * 10; const r1 = 2 + p % 3; const r2 = 3 + (p + 1) % 3
    const bagian = Math.round((tot * r1) / (r1 + r2))
    return { stem: `Rp${tot}.000 dibagi rasio ${r1}:${r2}. Bagian pertama adalah ... ribu rupiah.`, ...numOpts(bagian, seed, 5 + m), explanation: `${r1}/(${r1}+${r2}) × ${tot} = ${bagian} ribu rupiah.` }
  }
  if (q === 7) {
    const koef = 2 + p % 3; const konst = 4 + p * 3 + m; const jawab = 3 + p + m; const rhs = koef * jawab + konst
    return { stem: `Nilai x yang memenuhi ${koef}x + ${konst} = ${rhs} adalah ...`, ...numOpts(jawab, seed, 2 + m), explanation: `${koef}x = ${rhs} − ${konst} = ${rhs - konst}, maka x = ${jawab}.` }
  }
  if (q === 8) {
    const jarak = 60 + p * 20 + m * 15; const waktu = 2 + p % 3 + m % 2; const kec = jarak / waktu
    return { stem: `Kendaraan menempuh ${jarak} km dalam ${waktu} jam. Kecepatan rata-ratanya ... km/jam.`, ...numOpts(kec, seed, 5 + m * 2), explanation: `Kecepatan = ${jarak} ÷ ${waktu} = ${kec} km/jam.` }
  }
  if (q === 9) {
    const px = 8 + p * 2 + m; const lx = 5 + p + m
    return { stem: `Luas persegi panjang panjang ${px} cm dan lebar ${lx} cm adalah ... cm².`, ...numOpts(px * lx, seed, 6 + m * 2), explanation: `Luas = ${px} × ${lx} = ${px * lx} cm².` }
  }
  if (q === 10) {
    const sisi = 6 + p * 2 + m
    return { stem: `Keliling persegi dengan sisi ${sisi} cm adalah ... cm.`, ...numOpts(4 * sisi, seed, 4 + m * 2), explanation: `Keliling = 4 × ${sisi} = ${4 * sisi} cm.` }
  }
  if (q === 11) {
    const a1 = 3 + p * 2; const beda = 2 + p + m; const nTh = 6 + p % 3 + m; const ans = a1 + (nTh - 1) * beda
    return { stem: `Suku ke-${nTh} barisan aritmetika dengan a₁=${a1} dan beda ${beda} adalah ...`, ...numOpts(ans, seed, 4 + m), explanation: `U${nTh} = ${a1} + (${nTh}−1)×${beda} = ${ans}.` }
  }
  if (q === 12) {
    const vals = [8 + p, 10 + p, 12 + p + m, 14 + p, 6 + p + m]
    const mean = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    return { stem: `Rata-rata dari data: ${vals.join(', ')} adalah ...`, ...numOpts(mean, seed, 2 + m), explanation: `Rata-rata = (${vals.join('+')})/5 = ${vals.reduce((a, b) => a + b, 0)}/5 = ${mean}.` }
  }
  if (q === 13) {
    const merah = 2 + p + m; const biru = 3 + p; const tot13 = merah + biru
    return { stem: `Kotak berisi ${merah} bola merah dan ${biru} bola biru. Peluang terambil bola merah adalah ...`, ...createOptionSet(`${merah}/${tot13}`, [`${biru}/${tot13}`, `${merah}/${biru}`, `1/${tot13}`], seed), explanation: `P(merah) = ${merah}/${tot13}.` }
  }
  if (q === 14) {
    const r1 = 2 + p; const r2 = 3 + p + m; const sum14 = r1 + r2; const prod = r1 * r2
    return { stem: `Akar-akar persamaan x²−${sum14}x+${prod}=0 adalah x₁ dan x₂. Nilai x₁+x₂ = ...`, ...numOpts(sum14, seed, 2), explanation: `Jumlah akar = koefisien x dengan tanda berlawanan = ${sum14}.` }
  }
  if (q === 15) {
    const alas = 10 + p * 2 + m; const tinggi = 6 + p + m; const luas15 = (alas * tinggi) / 2
    return { stem: `Luas segitiga dengan alas ${alas} cm dan tinggi ${tinggi} cm adalah ... cm².`, ...numOpts(luas15, seed, 5 + m * 2), explanation: `Luas = ½ × ${alas} × ${tinggi} = ${luas15} cm².` }
  }
  if (q === 16) {
    const px2 = 5 + p + m; const lx2 = 4 + p; const tx2 = 3 + m
    return { stem: `Volume balok p=${px2} cm, l=${lx2} cm, t=${tx2} cm adalah ... cm³.`, ...numOpts(px2 * lx2 * tx2, seed, 10 + m * 3), explanation: `V = ${px2}×${lx2}×${tx2} = ${px2 * lx2 * tx2} cm³.` }
  }
  if (q === 17) {
    const xVal = 3 + p + m; const yVal = 2 + p
    const c1 = 2 * xVal + yVal; const c2 = xVal + 2 * yVal
    return { stem: `Sistem persamaan: 2x+y=${c1} dan x+2y=${c2}. Nilai x adalah ...`, ...numOpts(xVal, seed, 2 + m), explanation: `Eliminasi kedua persamaan → x = ${xVal}.` }
  }
  if (q === 18) {
    const d1 = 4 + p + m; const d2 = 6 + p + m
    const hasil = ((d1 * d2) / (d1 + d2))
    return { stem: `A selesaikan pekerjaan dalam ${d1} hari, B dalam ${d2} hari. Bekerja bersama selesai dalam ... hari.`, ...createOptionSet(`${hasil.toFixed(1)}`, [`${d1 + d2}`, `${Math.min(d1, d2)}`, `${Math.ceil((d1 + d2) / 2)}`], seed), explanation: `1/${d1} + 1/${d2} = (${d1}+${d2})/(${d1}×${d2}), waktu = ${hasil.toFixed(1)} hari.` }
  }
  if (q === 19) {
    const a19 = 2 + p; const r19 = 2 + m % 2; const n19 = 4 + p % 3
    const ans19 = a19 * Math.pow(r19, n19 - 1)
    return { stem: `Suku ke-${n19} barisan geometri dengan a₁=${a19} dan r=${r19} adalah ...`, ...numOpts(ans19, seed, 5 + m * 2), explanation: `U${n19} = ${a19} × ${r19}^${n19 - 1} = ${ans19}.` }
  }
  if (q === 20) {
    const rawData = [5 + p, 8 + p, 6 + p + m, 9 + p, 7 + p]
    const sorted = [...rawData].sort((a, b) => a - b)
    const med = sorted[2]
    return { stem: `Median dari data: ${rawData.join(', ')} adalah ...`, ...numOpts(med, seed, 1 + m), explanation: `Diurutkan: ${sorted.join(', ')}. Median = nilai tengah = ${med}.` }
  }
  if (q === 21) {
    const a21 = 2 + p; const b21 = p + m; const x21 = 3 + p + m
    return { stem: `f(x) = ${a21}x + ${b21}. Nilai f(${x21}) adalah ...`, ...numOpts(a21 * x21 + b21, seed, 3 + m), explanation: `f(${x21}) = ${a21}×${x21}+${b21} = ${a21 * x21 + b21}.` }
  }
  if (q === 22) {
    const a22 = 2 + p % 3; const b22 = 5 + p * 2 + m; const max22 = Math.floor(b22 / a22)
    return { stem: `Bilangan bulat positif x terbesar yang memenuhi ${a22}x < ${b22} adalah ...`, ...numOpts(max22, seed, 2), explanation: `x < ${b22}/${a22} = ${(b22 / a22).toFixed(2)}, jadi x terbesar = ${max22}.` }
  }
  if (q === 23) {
    const x1 = 2 + p; const y1 = 4 + p; const x2 = 8 + p + m; const y2 = 10 + p + m
    const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2
    return { stem: `Titik tengah A(${x1},${y1}) dan B(${x2},${y2}) adalah ...`, ...createOptionSet(`(${mx}, ${my})`, [`(${mx + 1}, ${my})`, `(${mx}, ${my + 1})`, `(${x1}, ${y2})`], seed), explanation: `Titik tengah = ((${x1}+${x2})/2, (${y1}+${y2})/2) = (${mx}, ${my}).` }
  }
  if (q === 24) {
    const sel = 5 + p + m; const jum = 45 + p * 5 + m * 5; const anak = (jum - sel) / 2
    return { stem: `Jumlah umur ayah dan anak ${jum} tahun. Ayah lebih tua ${sel} tahun. Umur anak adalah ... tahun.`, ...numOpts(anak, seed, 3 + m), explanation: `Anak = (${jum}−${sel})/2 = ${anak} tahun.` }
  }
  const harga = 1000 + p * 500 + m * 200; const disc = 10 + p * 5 + m * 5; const jum25 = 3 + p + m
  const total25 = Math.round(harga * jum25 * (1 - disc / 100))
  return { stem: `Harga 1 buku Rp${harga.toLocaleString('id-ID')}. Beli ${jum25} buku diskon ${disc}%. Total bayar = Rp...`, ...numOpts(total25, seed, Math.max(100, Math.round(total25 * 0.05))), explanation: `${jum25}×Rp${harga.toLocaleString('id-ID')}×(1−${disc}/100) = Rp${total25.toLocaleString('id-ID')}.` }
}

// ═══════════════════════════════════════════════════════════════════
// 2. LITERASI BAHASA INDONESIA — 25 soal
// ═══════════════════════════════════════════════════════════════════
const buildLiterasiBahasaIndonesiaQuestion = (p: number, d: Difficulty, q: number) => {
  const seed = p * 41 + q
  const topik = ['lingkungan hidup', 'pendidikan', 'kesehatan masyarakat', 'teknologi informasi', 'budaya dan seni'][p - 1]
  const teks = [
    'Kerusakan lingkungan hidup di Indonesia semakin mengkhawatirkan. Deforestasi, pencemaran sungai, dan pembuangan sampah sembarangan menjadi masalah utama. Pemerintah telah mengeluarkan regulasi untuk melindungi alam, namun implementasinya masih perlu ditingkatkan. Kesadaran masyarakat dalam menjaga kebersihan dan kelestarian lingkungan sangat diperlukan untuk mencapai Indonesia yang lebih hijau dan bersih.',
    'Pendidikan merupakan investasi terbaik bagi masa depan bangsa. Melalui pendidikan yang berkualitas, individu dapat mengembangkan potensi diri secara optimal. Namun, masih terdapat kesenjangan pendidikan antara daerah perkotaan dan pedesaan. Program pemerataan pendidikan yang komprehensif harus dirancang agar seluruh generasi muda Indonesia mendapatkan akses yang sama terhadap pendidikan bermutu.',
    'Kesehatan masyarakat Indonesia menghadapi tantangan ganda: penyakit menular dan penyakit tidak menular. Di satu sisi, tuberkulosis dan malaria masih menjadi masalah di daerah tertentu. Di sisi lain, diabetes dan hipertensi semakin meningkat akibat perubahan gaya hidup. Sistem kesehatan perlu diperkuat agar mampu menghadapi kedua tantangan secara bersamaan.',
    'Teknologi informasi telah mengubah cara manusia bekerja, belajar, dan berinteraksi. Platform digital memungkinkan kolaborasi tanpa batas geografis dan akses informasi yang hampir tak terbatas. Namun, perkembangan ini membawa risiko berupa ancaman siber, hoaks, dan kesenjangan digital. Literasi digital menjadi keterampilan esensial yang harus dimiliki setiap individu di era ini.',
    'Budaya dan seni Indonesia merupakan warisan leluhur yang tak ternilai. Ribuan tradisi, tarian, musik, dan kesenian daerah mencerminkan kekayaan dan keberagaman bangsa. Namun, di era globalisasi ini, banyak seni tradisional yang mulai terlupakan oleh generasi muda. Pelestarian aktif melalui pendidikan seni dan festival budaya menjadi langkah penting untuk menjaga identitas bangsa.',
  ][p - 1]

  const gagasanUtama = [
    'Kerusakan lingkungan di Indonesia perlu ditangani bersama oleh pemerintah dan masyarakat',
    'Pendidikan berkualitas penting namun masih terdapat kesenjangan yang perlu diatasi',
    'Sistem kesehatan perlu diperkuat untuk menghadapi tantangan penyakit ganda',
    'Teknologi informasi membawa manfaat dan risiko yang harus diantisipasi bersama',
    'Pelestarian budaya dan seni tradisional Indonesia penting di tengah arus globalisasi',
  ][p - 1]

  if (q === 1) {
    const wrong = [['Deforestasi adalah masalah terbesar Indonesia', 'Pemerintah sudah berhasil mengatasi pencemaran', 'Sampah masih menjadi masalah utama'], ['Semua siswa sudah mendapat pendidikan yang sama', 'Beasiswa sudah menghapus kesenjangan pendidikan', 'Kualitas sekolah sudah merata'], ['Tuberkulosis sudah tidak ada lagi', 'Penyakit menular lebih berbahaya dari degeneratif', 'Hipertensi adalah masalah terbesar Indonesia'], ['Media sosial penyebab utama masalah teknologi', 'Literasi digital tidak perlu diajarkan di sekolah', 'Semua informasi digital dapat dipercaya'], ['Generasi muda tidak suka seni tradisional', 'Festival budaya tidak efektif melestarikan seni', 'Globalisasi harus dihentikan demi budaya lokal']][p - 1]
    return { stem: `Bacalah teks berikut!\n\n"${teks}"\n\nGagasan utama teks di atas adalah ...`, ...createOptionSet(gagasanUtama, wrong, seed), explanation: `Gagasan utama mencakup keseluruhan isi teks: "${gagasanUtama}".` }
  }
  if (q === 2) {
    const tersurat = ['Pemerintah telah mengeluarkan regulasi untuk melindungi alam', 'Terdapat kesenjangan pendidikan antara perkotaan dan pedesaan', 'Penyakit degeneratif semakin meningkat akibat perubahan gaya hidup', 'Platform digital memungkinkan kolaborasi tanpa batas geografis', 'Banyak seni tradisional mulai terlupakan oleh generasi muda'][p - 1]
    return { stem: `Berdasarkan teks tersebut, pernyataan yang SESUAI dengan isi teks adalah ...`, ...createOptionSet(tersurat, ['Seluruh regulasi lingkungan sudah berhasil', 'Semua sekolah sudah berkualitas sama', 'Hoaks sudah berhasil diberantas', 'Semua tradisi sudah dilestarikan', 'Semua siswa suka seni daerah'][p - 1] as unknown as string[], seed), explanation: `Pernyataan tersebut secara eksplisit disebutkan dalam teks.` }
  }
  if (q === 3) {
    const kata = ['regulasi', 'investasi', 'degeneratif', 'kolaborasi', 'globalisasi'][p - 1]
    const makna = ['aturan atau peraturan resmi', 'penanaman modal untuk masa depan', 'penurunan fungsi organ secara bertahap', 'kerja sama antar pihak', 'integrasi budaya dan ekonomi dunia'][p - 1]
    const wr3 = [['penghargaan prestasi', 'larangan sementara', 'kebijakan tidak mengikat'], ['pengeluaran rutin', 'tabungan tanpa hasil', 'pemberian cuma-cuma'], ['penyakit menular cepat', 'kondisi sembuh cepat', 'gangguan sementara'], ['persaingan ketat', 'kegiatan mandiri', 'pembagian tidak adil'], ['isolasi budaya', 'penolakan pengaruh asing', 'gerakan pelestarian lokal']][p - 1]
    return { stem: `Makna kata "${kata}" dalam teks tersebut adalah ...`, ...createOptionSet(makna, wr3, seed), explanation: `"${kata}" bermakna "${makna}" dalam konteks teks.` }
  }
  if (q === 4) {
    const simpu = ['Diperlukan sinergi pemerintah dan masyarakat untuk mengatasi masalah lingkungan', 'Pemerataan pendidikan bermutu harus menjadi prioritas pembangunan nasional', 'Penguatan sistem kesehatan yang komprehensif sangat diperlukan', 'Literasi digital adalah kunci memanfaatkan teknologi secara positif', 'Pelestarian aktif budaya lokal adalah solusi menghadapi globalisasi'][p - 1]
    return { stem: `Simpulan yang paling tepat berdasarkan teks tentang ${topik} tersebut adalah ...`, ...createOptionSet(simpu, ['Masalah ini tidak bisa diselesaikan', 'Pemerintah harus bertindak sendiri', 'Kondisi ini sudah membaik'][p % 3] as unknown as string[], seed), explanation: `Simpulan yang tepat: "${simpu}".` }
  }
  if (q === 5) {
    return { stem: `Teks tersebut termasuk jenis teks ...`, ...createOptionSet('Eksposisi', ['Narasi', 'Deskripsi', 'Persuasi'], seed), explanation: `Teks eksposisi memaparkan fakta dan argumen secara objektif tentang ${topik}.` }
  }
  if (q === 6) {
    const fakta = ['Deforestasi dan pencemaran sungai terjadi di Indonesia', 'Terdapat kesenjangan pendidikan antara daerah perkotaan dan pedesaan', 'Penyakit degeneratif semakin meningkat di Indonesia', 'Platform digital memungkinkan akses informasi yang luas', 'Ribuan tradisi daerah ada di Indonesia'][p - 1]
    return { stem: `Manakah pernyataan di bawah ini yang merupakan FAKTA dalam teks?`, ...createOptionSet(fakta, ['Kondisi ini sudah sangat mengkhawatirkan', 'Pemerintah harus segera bertindak', 'Masalah ini tidak bisa dibiarkan'][p % 3] as unknown as string[], seed), explanation: `"${fakta}" adalah fakta yang dapat diverifikasi, bukan pendapat.` }
  }
  if (q === 7) {
    return { stem: `Kata "namun" dalam teks tersebut berfungsi sebagai ...`, ...createOptionSet('Konjungsi pertentangan', ['Konjungsi penjumlahan', 'Konjungsi sebab-akibat', 'Konjungsi waktu'], seed), explanation: `"Namun" adalah konjungsi pertentangan yang menghubungkan dua kalimat dengan makna berlawanan.` }
  }
  if (q === 8) {
    const tujuan = ['menginformasikan kondisi lingkungan dan mendorong tindakan perbaikan', 'menjelaskan pentingnya pendidikan dan perlunya pemerataan', 'memberikan gambaran tantangan kesehatan dan urgensi solusinya', 'menguraikan dampak teknologi dan pentingnya literasi digital', 'memaparkan kekayaan budaya dan pentingnya pelestariannya'][p - 1]
    return { stem: `Tujuan penulis dalam teks tersebut adalah ...`, ...createOptionSet(tujuan, ['menghibur pembaca dengan cerita menarik', 'memengaruhi pembaca secara emosional', 'menceritakan pengalaman pribadi penulis'], seed), explanation: `Tujuan penulis adalah ${tujuan}.` }
  }
  if (q === 9) {
    return { stem: `Nada yang dominan dalam teks tersebut adalah ...`, ...createOptionSet('Informatif dan kritis', ['Humor dan santai', 'Emosional dan dramatis', 'Netral dan acuh'], seed), explanation: `Teks menggunakan nada informatif (memaparkan fakta) dan kritis (menunjukkan masalah yang perlu diperbaiki).` }
  }
  if (q === 10) {
    return { stem: `Paragraf terakhir dalam teks tersebut berfungsi sebagai ...`, ...createOptionSet('Penegasan ulang dan solusi', ['Pengantar topik', 'Argumen pertama', 'Latar belakang masalah'], seed), explanation: `Paragraf terakhir menegaskan kembali inti masalah dan menawarkan solusi.` }
  }
  if (q === 11) {
    const kat = ['mengkhawatirkan', 'optimal', 'komprehensif', 'esensial', 'melestarikan'][p - 1]
    const sin = ['mencemaskan', 'maksimal', 'menyeluruh', 'penting', 'mempertahankan'][p - 1]
    return { stem: `Sinonim kata "${kat}" dalam teks tersebut adalah ...`, ...createOptionSet(sin, ['melegakan', 'minimal', 'parsial', 'opsional', 'menghancurkan'][p - 1] as unknown as string[], seed), explanation: `"${kat}" bersinonim dengan "${sin}".` }
  }
  if (q === 12) {
    const kat2 = ['diatasi', 'berkualitas', 'meningkat', 'positif', 'melestarikan'][p - 1]
    const ant = ['dibiarkan', 'buruk', 'menurun', 'negatif', 'memusnahkan'][p - 1]
    return { stem: `Antonim kata "${kat2}" dalam teks tersebut adalah ...`, ...createOptionSet(ant, ['diselesaikan', 'unggul', 'bertambah', 'bermanfaat', 'melindungi'][p - 1] as unknown as string[], seed), explanation: `"${kat2}" berantonim dengan "${ant}".` }
  }
  if (q === 13) {
    return { stem: `Manakah kalimat yang paling efektif di bawah ini?`, ...createOptionSet('Pemerintah harus segera menangani kerusakan lingkungan.', ['Pemerintah harus segera untuk menangani kerusakan lingkungan itu.', 'Oleh pemerintah kerusakan lingkungan harus ditangani segera.', 'Harus pemerintah segera tangani kerusakan lingkungan itu.'], seed), explanation: `Kalimat efektif memiliki struktur S-P-O yang jelas, tidak berlebihan, dan mudah dipahami.` }
  }
  if (q === 14) {
    return { stem: `Kalimat manakah yang TIDAK mendukung kepaduan paragraf tentang ${topik}?`, ...createOptionSet('Cuaca hari ini sangat cerah dan menyenangkan.', ['Berbagai penyebab telah diidentifikasi oleh para ahli.', 'Dampaknya dirasakan oleh seluruh lapisan masyarakat.', 'Berbagai upaya telah dilakukan untuk mengatasinya.'], seed), explanation: `Kalimat tentang cuaca tidak relevan dengan topik ${topik} sehingga merusak kepaduan paragraf.` }
  }
  if (q === 15) {
    return { stem: `Apa makna frasa "tantangan ganda" dalam konteks teks kesehatan?`, ...createOptionSet('Menghadapi dua jenis masalah sekaligus dalam waktu bersamaan', ['Masalah dua kali lebih sulit dari biasanya', 'Tantangan dari dua arah berbeda', 'Dua orang menghadapi masalah bersama'], seed), explanation: `"Tantangan ganda" berarti menghadapi dua masalah (penyakit menular dan tidak menular) secara bersamaan.` }
  }
  if (q === 16) {
    return { stem: `Penulisan kata yang BENAR sesuai EYD adalah ...`, ...createOptionSet('apotek', ['apotik', 'aphotik', 'aphotek'], seed), explanation: `Penulisan yang benar menurut KBBI adalah "apotek", bukan "apotik".` }
  }
  if (q === 17) {
    return { stem: `Tanda baca yang tepat untuk: "Rina membeli buku___ pensil___ dan penghapus di toko." adalah ...`, ...createOptionSet(', (koma)', ['; (titik koma)', ': (titik dua)', '- (tanda hubung)'], seed), explanation: `Koma digunakan untuk memisahkan unsur-unsur dalam perincian.` }
  }
  if (q === 18) {
    return { stem: `Kata "pelestarian" terbentuk dari kata dasar "lestari" dengan imbuhan ...`, ...createOptionSet('pe-...-an', ['me-...-kan', 'ber-...-an', 'ke-...-an'], seed), explanation: `"Pelestarian" = pe + lestari + an → pe-...-an, bermakna proses atau hasil melestarikan.` }
  }
  if (q === 19) {
    return { stem: `Penulis memandang masalah ${topik} sebagai ...`, ...createOptionSet('Masalah serius yang membutuhkan tindakan nyata dan kolaboratif', ['Masalah yang sudah hampir terselesaikan', 'Isu yang terlalu dibesar-besarkan', 'Tanggung jawab pemerintah semata'], seed), explanation: `Penulis secara konsisten menunjukkan keprihatinan dan menekankan perlunya tindakan bersama.` }
  }
  if (q === 20) {
    const bukti = ['Pemerintah telah mengeluarkan regulasi namun implementasinya masih perlu ditingkatkan', 'Terdapat kesenjangan pendidikan antara perkotaan dan pedesaan', 'Diabetes dan hipertensi semakin meningkat akibat perubahan gaya hidup', 'Perkembangan teknologi membawa risiko ancaman siber dan hoaks', 'Banyak tradisi mulai tidak dikenal generasi muda'][p - 1]
    return { stem: `Pernyataan dalam teks yang paling kuat mendukung gagasan utama adalah ...`, ...createOptionSet(bukti, ['Tidak ada bukti yang mendukung', 'Penulis hanya memberikan pendapat', 'Teks tidak membahas hal tersebut'][p % 3] as unknown as string[], seed), explanation: `Bukti dalam teks: "${bukti}".` }
  }
  if (q === 21) {
    return { stem: `Pernyataan yang dapat DISIMPULKAN meski tidak dinyatakan eksplisit dalam teks adalah ...`, ...createOptionSet(`Masalah ${topik} tidak bisa diselesaikan oleh satu pihak saja`, ['Penulis pesimis terhadap masa depan', 'Kondisi sudah sangat baik', 'Pemerintah tidak peduli dengan masalah ini'], seed), explanation: `Dari konteks teks secara keseluruhan, tersirat bahwa diperlukan kerja sama semua pihak.` }
  }
  if (q === 22) {
    return { stem: `Pertanyaan yang TEPAT untuk menguji pemahaman kritis terhadap teks adalah ...`, ...createOptionSet(`Mengapa solusi yang ada belum cukup efektif mengatasi masalah ${topik}?`, ['Siapa nama penulis teks?', 'Berapa halaman teks tersebut?', 'Di mana teks tersebut diterbitkan?'], seed), explanation: `Pertanyaan kritis menggali analisis dan evaluasi, bukan sekadar fakta permukaan.` }
  }
  if (q === 23) {
    return { stem: `Jika masalah ${topik} tidak segera ditangani, dampak paling mungkin terjadi berdasarkan teks adalah ...`, ...createOptionSet('Masalah akan semakin parah dan berdampak lebih luas pada masyarakat', ['Kondisi akan membaik sendiri', 'Negara lain akan membantu', 'Masyarakat akan beradaptasi tanpa dampak'], seed), explanation: `Berdasarkan teks, tanpa tindakan nyata masalah ${topik} akan berkembang lebih buruk.` }
  }
  if (q === 24) {
    return { stem: `Media penerbitan yang paling sesuai untuk teks seperti ini adalah ...`, ...createOptionSet('Jurnal ilmiah populer atau majalah berita terpercaya', ['Novel fiksi remaja', 'Buku teks pelajaran SD', 'Kumpulan cerita pendek'], seed), explanation: `Teks eksposisi informatif tentang isu sosial paling tepat di jurnal ilmiah populer atau majalah berita.` }
  }
  return { stem: `Langkah paling efektif merespons informasi dalam teks tentang ${topik} adalah ...`, ...createOptionSet('Mencari informasi tambahan dari sumber terpercaya dan mendukung kebijakan yang relevan', ['Membagikan teks ke semua orang tanpa memverifikasi', 'Mengabaikan karena bukan tanggung jawab individu', 'Menolak karena dianggap terlalu negatif'], seed), explanation: `Respons yang tepat adalah mencari informasi lebih lanjut dan mengambil tindakan bertanggung jawab.` }
}

// ═══════════════════════════════════════════════════════════════════
// 3. LITERASI BAHASA INGGRIS — 25 soal
// ═══════════════════════════════════════════════════════════════════
const buildLiterasiBahasaInggrisQuestion = (p: number, d: Difficulty, q: number) => {
  const seed = p * 43 + q
  const topics = ['environment', 'education', 'health', 'technology', 'culture'][p - 1]
  const passages = [
    'Indonesia faces significant environmental challenges, including deforestation, river pollution, and plastic waste. These problems affect not only local ecosystems but also contribute to global climate change. While the government has enacted environmental regulations, enforcement remains inconsistent. Public awareness campaigns and community participation are essential for achieving meaningful progress in environmental protection.',
    'Quality education is considered the foundation of national development. However, significant disparities exist between urban and rural educational access in Indonesia. Schools in remote areas often lack qualified teachers and adequate facilities. Comprehensive programs, including teacher incentives and digital learning infrastructure, are needed to bridge this educational gap and ensure equal opportunities for all students.',
    'Indonesia\'s healthcare system faces a dual burden of communicable and non-communicable diseases. While infectious diseases like tuberculosis remain prevalent in certain regions, lifestyle-related conditions such as diabetes and hypertension are rapidly increasing. Strengthening primary healthcare facilities and promoting preventive health behaviors through public education are crucial strategies for improving overall population health outcomes.',
    'Digital technology has fundamentally transformed how people work, learn, and communicate. Social media platforms and instant messaging applications have made information sharing faster than ever before. However, these developments come with significant challenges, including cybersecurity threats, the spread of misinformation, and a growing digital divide. Building digital literacy skills is essential for navigating this complex landscape safely.',
    'Indonesia\'s rich cultural heritage, encompassing thousands of traditional dances, music forms, and crafts, represents an invaluable national treasure. However, globalization and changing youth preferences pose serious threats to cultural preservation. Without deliberate intervention through formal education and community programs, many traditional art forms risk falling into obscurity within a generation.',
  ][p - 1]

  if (q === 1) {
    const mainIdeas = ['Indonesia\'s environmental challenges require government action and public awareness', 'Educational disparities between urban and rural areas need comprehensive solutions', 'Indonesia\'s health system must address both communicable and non-communicable diseases', 'Digital technology brings benefits and challenges that require digital literacy', 'Cultural heritage preservation requires active intervention against globalization threats'][p - 1]
    return { stem: `Read the following text:\n\n"${passages}"\n\nWhat is the main idea of the text?`, ...createOptionSet(mainIdeas, ['The environment is completely destroyed', 'Education in Indonesia is already excellent', 'Health problems are easily solved', 'Technology has no negative effects', 'Traditional culture is no longer relevant'][p % 5] as unknown as string[], seed), explanation: `The main idea encompasses the overall message: "${mainIdeas}".` }
  }
  if (q === 2) {
    const details = ['The government has enacted environmental regulations', 'Schools in remote areas lack qualified teachers and facilities', 'Tuberculosis remains prevalent in certain regions', 'Social media has made information sharing faster than ever', 'Thousands of traditional dances and music forms exist in Indonesia'][p - 1]
    return { stem: `According to the text, which statement is EXPLICITLY mentioned?`, ...createOptionSet(details, ['The government has solved all environmental problems', 'All schools have equal quality education', 'Infectious diseases have been eliminated', 'Technology has no risks', 'All young people love traditional culture'][p % 5] as unknown as string[], seed), explanation: `This information is directly stated in the text: "${details}".` }
  }
  if (q === 3) {
    const words = ['enforcement', 'disparities', 'prevalent', 'misinformation', 'obscurity'][p - 1]
    const meanings = ['the act of making rules be obeyed', 'differences or inequalities', 'existing widely or commonly', 'false or inaccurate information', 'the state of being unknown or forgotten'][p - 1]
    const wrongs3 = [['the creation of new laws', 'a type of government policy', 'a form of public protest'], ['similarities between groups', 'advantages in a situation', 'types of schools or institutions'], ['completely eradicated', 'rarely seen or found', 'recently introduced'], ['accurate factual reporting', 'digital communication methods', 'government announcements'], ['a type of cultural performance', 'significant public recognition', 'modern artistic innovation']][p - 1]
    return { stem: `The word "${words}" in the text most likely means ...`, ...createOptionSet(meanings, wrongs3, seed), explanation: `In context, "${words}" means "${meanings}".` }
  }
  if (q === 4) {
    const inferences = ['Environmental problems require collaboration between government and citizens', 'Rural students may have fewer opportunities to succeed academically', 'A healthy lifestyle can reduce the risk of non-communicable diseases', 'People without digital skills may struggle in the modern economy', 'Young generations are the key to cultural preservation'][p - 1]
    return { stem: `What can be INFERRED from the text, even though it is not directly stated?`, ...createOptionSet(inferences, ['The problems described are completely unsolvable', 'Only one type of solution is effective', 'The author is not concerned about these issues', 'Other countries do not face similar challenges'][q % 4] as unknown as string[], seed), explanation: `This inference is logically supported by the evidence presented in the text.` }
  }
  if (q === 5) {
    return { stem: `What is the PRIMARY purpose of this text?`, ...createOptionSet('To inform readers about challenges and suggest directions for improvement', ['To entertain readers with an interesting story', 'To persuade readers to take one specific action immediately', 'To describe a personal experience of the author'], seed), explanation: `The text uses an informative and analytical tone to present problems and point toward solutions.` }
  }
  if (q === 6) {
    return { stem: `The overall tone of the text can best be described as ...`, ...createOptionSet('Concerned and analytical', ['Optimistic and cheerful', 'Angry and accusatory', 'Indifferent and neutral'], seed), explanation: `The author presents facts with concern while analytically examining causes and solutions.` }
  }
  if (q === 7) {
    return { stem: `In the text, what does the word "these" refer to in the second sentence?`, ...createOptionSet('The environmental challenges mentioned in the first sentence', ['The regulations enacted by the government', 'The local communities in Indonesia', 'The solutions proposed by experts'], seed), explanation: `"These" is a pronoun referring back to the "challenges" mentioned in the preceding sentence.` }
  }
  if (q === 8) {
    const trues = ['The government has implemented environmental regulations', 'Rural schools face a shortage of qualified teachers', 'Lifestyle diseases are increasing in Indonesia', 'Digital technology has changed how people communicate', 'Traditional art forms face the risk of disappearing'][p - 1]
    return { stem: `Which of the following is TRUE according to the text?`, ...createOptionSet(trues, ['All problems mentioned have been fully resolved', 'The government has taken no action on this issue', 'Young people are actively preserving traditions', 'Digital tools have eliminated all communication barriers'][q % 4] as unknown as string[], seed), explanation: `This statement is directly supported by information in the text.` }
  }
  if (q === 9) {
    const titles = ['Indonesia\'s Environmental Crisis: Challenges and Solutions', 'Bridging the Education Gap in Indonesia', 'Combating Indonesia\'s Dual Health Burden', 'Navigating the Digital Age: Opportunities and Risks', 'Preserving Indonesia\'s Cultural Heritage in a Globalized World'][p - 1]
    return { stem: `The best title for this text would be ...`, ...createOptionSet(titles, ['A History of Indonesian Traditions', 'Global Warming: A Universal Problem', 'The Benefits of Modern Technology', 'School Reforms Around the World'][q % 4] as unknown as string[], seed), explanation: `The title "${titles}" best captures the main theme of the text.` }
  }
  if (q === 10) {
    const causes = ['deforestation and river pollution cause ecosystem damage', 'lack of facilities causes educational inequality', 'changing lifestyles cause increases in non-communicable diseases', 'digital advancements cause cybersecurity threats', 'globalization causes threats to cultural preservation'][p - 1]
    return { stem: `According to the text, what is a cause-and-effect relationship described?`, ...createOptionSet(causes.charAt(0).toUpperCase() + causes.slice(1), ['Good policies always lead to positive outcomes', 'Economic growth automatically improves education', 'Cultural programs always succeed in preserving traditions', 'Digital tools automatically make people more informed'][q % 4] as unknown as string[], seed), explanation: `The text explicitly describes how ${causes}.` }
  }
  if (q === 11) {
    return { stem: `According to the text, which comparison is accurate?`, ...createOptionSet('Urban areas have better educational access than rural areas', ['Rural schools have more funding than urban schools', 'Digital technology has equal impact in all regions', 'Health facilities are equally distributed across Indonesia', 'Traditional and modern culture are equally valued by youth'], seed), explanation: `The text explicitly states the disparity between urban and rural educational access.` }
  }
  if (q === 12) {
    return { stem: `What is the author's opinion about the current situation?`, ...createOptionSet('Immediate and coordinated action is needed to address the problems described', ['The situation will improve without any intervention', 'Only the government is responsible for fixing these issues', 'The problems described are not serious enough to worry about'], seed), explanation: `The author's call for action and use of words like "crucial" and "essential" indicate urgency.` }
  }
  if (q === 13) {
    return { stem: `How is the text organized?`, ...createOptionSet('Problem identification followed by proposed solutions', ['Chronological order of historical events', 'Comparison and contrast of two opposing views', 'A series of personal anecdotes'], seed), explanation: `The text follows a problem-solution structure: describing challenges then suggesting responses.` }
  }
  if (q === 14) {
    return { stem: `Why does the author include specific examples (such as tuberculosis and diabetes)?`, ...createOptionSet('To illustrate and support the claim about the dual health burden', ['To recommend specific treatments for these diseases', 'To explain the history of these diseases in Indonesia', 'To argue that one type of disease is worse than the other'], seed), explanation: `Examples serve as evidence to make the abstract concept of "dual burden" concrete and credible.` }
  }
  if (q === 15) {
    return { stem: `Which sentence best paraphrases the idea that "public awareness campaigns and community participation are essential"?`, ...createOptionSet('Involving citizens in conservation efforts is critical for success', ['Government alone can handle all environmental issues', 'Public awareness campaigns are ineffective without laws', 'Community involvement has no significant impact on outcomes'], seed), explanation: `Paraphrase captures the core meaning: community involvement is necessary for success.` }
  }
  if (q === 16) {
    return { stem: `According to the text, what is the definition of "digital literacy"?`, ...createOptionSet('The ability to use technology safely and effectively in a complex digital environment', ['The ability to code and build software applications', 'Having access to a smartphone and the internet', 'The ability to read and write in a digital format'], seed), explanation: `In context, digital literacy refers to skills needed to navigate technology responsibly and safely.` }
  }
  if (q === 17) {
    return { stem: `What problem is presented in the text and what solution is suggested?`, ...createOptionSet('Problem: educational inequality; Solution: teacher incentives and digital infrastructure', ['Problem: too many students; Solution: build more schools only', 'Problem: low teacher salaries; Solution: reduce working hours', 'Problem: student laziness; Solution: stricter discipline'], seed), explanation: `The text identifies educational disparity and proposes comprehensive programs including digital solutions.` }
  }
  if (q === 18) {
    return { stem: `Who is the intended audience for this text?`, ...createOptionSet('Educated general readers interested in social and national issues', ['Young children learning to read', 'Medical specialists seeking clinical guidance', 'Foreign tourists visiting Indonesia'], seed), explanation: `The sophisticated vocabulary and analytical tone suggest the audience is educated adults concerned with social issues.` }
  }
  if (q === 19) {
    return { stem: `Which statement best SUMMARIZES the text?`, ...createOptionSet('Indonesia faces serious multidimensional challenges that require coordinated action from all stakeholders', ['Indonesia has solved its major social and environmental problems', 'International assistance is the only solution to Indonesia\'s problems', 'Economic growth will naturally resolve all the issues described'], seed), explanation: `The summary captures the text's overall message about challenges and the need for coordinated solutions.` }
  }
  if (q === 20) {
    return { stem: `Based on the text, what action should individuals take?`, ...createOptionSet('Develop relevant skills and actively participate in addressing the described challenges', ['Wait for the government to solve all problems', 'Ignore the issues since they are too complex for individuals', 'Only share information online about the problems'], seed), explanation: `The text implies individual responsibility through mentions of "public awareness" and "community participation".` }
  }
  if (q === 21) {
    return { stem: `The phrase "invaluable national treasure" suggests that the author views Indonesian cultural heritage as ...`, ...createOptionSet('Extremely precious and irreplaceable', ['Financially profitable', 'Easily reproduced', 'Outdated and irrelevant'], seed), explanation: `"Invaluable" means too valuable to be measured in money; "national treasure" emphasizes its importance to the nation.` }
  }
  if (q === 22) {
    return { stem: `The phrase "falling into obscurity within a generation" most likely means ...`, ...createOptionSet('Being completely forgotten by the next generation', ['Becoming popular among younger people', 'Being rediscovered after years of neglect', 'Spreading to other countries rapidly'], seed), explanation: `"Obscurity" means being unknown; "within a generation" means this could happen within 25-30 years.` }
  }
  if (q === 23) {
    return { stem: `Based on the information in the text, what can be logically concluded?`, ...createOptionSet('Without active intervention, the problems described are likely to worsen over time', ['The problems will solve themselves through natural processes', 'External countries are responsible for causing these problems', 'Technology advancement will automatically solve all these challenges'], seed), explanation: `The text presents ongoing problems without natural resolution mechanisms, implying worsening without action.` }
  }
  if (q === 24) {
    return { stem: `How does the text structure its argument about ${topics}?`, ...createOptionSet('By presenting the current problem, its causes, and then suggesting solutions', ['By listing only the positive aspects of the situation', 'By using a fictional narrative to illustrate a real issue', 'By comparing Indonesia to more successful countries'], seed), explanation: `The text follows a problem-cause-solution structure typical of expository writing.` }
  }
  return { stem: `Critically evaluate: which limitation of the text is most significant?`, ...createOptionSet('The text lacks specific data and statistics to support its claims', ['The text is too long and contains unnecessary information', 'The text focuses too much on solutions rather than problems', 'The text uses vocabulary that is too simple for the topic'], seed), explanation: `While informative, the text would be stronger with quantitative evidence (statistics, research data) to back its claims.` }
}

// ═══════════════════════════════════════════════════════════════════
// 4. MATEMATIKA TINGKAT LANJUT — 25 soal
// ═══════════════════════════════════════════════════════════════════
const buildMatematikaLanjutQuestion = (p: number, d: Difficulty, q: number) => {
  const seed = p * 53 + q
  const m = d === 'Mudah' ? 1 : d === 'Sedang' ? 2 : 3

  // Limit (Q1-5)
  if (q === 1) {
    const a = 2 + p; const b = p + m
    return { stem: `Nilai lim(x→${a}) dari (x² − ${a * a}) / (x − ${a}) adalah ...`, ...numOpts(2 * a, seed, 2), explanation: `Faktorkan: (x−${a})(x+${a})/(x−${a}) = x+${a}. Substitusi x=${a}: ${2 * a}.` }
  }
  if (q === 2) {
    const c = p + m
    return { stem: `Nilai lim(x→∞) dari (${c}x + 3) / (x − 1) adalah ...`, ...numOpts(c, seed, 1), explanation: `Bagi pembilang dan penyebut dengan x: (${c} + 3/x)/(1 − 1/x) → ${c}/1 = ${c}.` }
  }
  if (q === 3) {
    const a3 = p + m + 1
    return { stem: `Nilai lim(x→0) dari sin(${a3}x) / (${a3}x) adalah ...`, ...createOptionSet('1', ['0', `${a3}`, `1/${a3}`], seed), explanation: `Limit sin(ax)/(ax) = 1 untuk setiap konstanta a ≠ 0.` }
  }
  if (q === 4) {
    const a4 = p + 1; const b4 = 2 + m
    return { stem: `Jika lim(x→${a4}) f(x) = ${b4} dan lim(x→${a4}) g(x) = ${p + 1}, maka lim(x→${a4}) [f(x)·g(x)] = ...`, ...numOpts(b4 * (p + 1), seed, 3), explanation: `Sifat limit perkalian: lim(fg) = lim(f)·lim(g) = ${b4} × ${p + 1} = ${b4 * (p + 1)}.` }
  }
  if (q === 5) {
    const n = 2 + m; const c5 = p * 3 + 2
    return { stem: `Nilai lim(x→∞) dari (${n}x³ + ${c5}) / x³ adalah ...`, ...numOpts(n, seed, 1), explanation: `Pangkat tertinggi sama (x³). Limit = koefisien tertinggi pembilang/penyebut = ${n}/1 = ${n}.` }
  }
  // Turunan (Q6-10)
  if (q === 6) {
    const a6 = 2 + p; const b6 = 3 + m; const c6 = p + 1
    return { stem: `Turunan dari f(x) = ${a6}x³ + ${b6}x² + ${c6}x adalah ...`, ...createOptionSet(`${3 * a6}x² + ${2 * b6}x + ${c6}`, [`${a6}x² + ${b6}x`, `${a6 * 3}x² + ${b6}x + ${c6}`, `${a6}x³ + ${2 * b6}x`], seed), explanation: `f'(x) = ${a6}·3x² + ${b6}·2x + ${c6} = ${3 * a6}x² + ${2 * b6}x + ${c6}.` }
  }
  if (q === 7) {
    const a7 = 2 + p; const x7 = 1 + m
    return { stem: `Jika f(x) = x^${a7 + 1}, maka f'(${x7}) = ...`, ...numOpts((a7 + 1) * Math.pow(x7, a7), seed, 3 + m), explanation: `f'(x) = ${a7 + 1}x^${a7}, f'(${x7}) = ${a7 + 1}·${x7}^${a7} = ${(a7 + 1) * Math.pow(x7, a7)}.` }
  }
  if (q === 8) {
    const a8 = 2 + p
    return { stem: `Gradien garis singgung kurva y = x² + ${a8}x pada titik x = ${m} adalah ...`, ...numOpts(2 * m + a8, seed, 2), explanation: `y' = 2x + ${a8}. Pada x=${m}: y'=${m * 2}+${a8}=${2 * m + a8}.` }
  }
  if (q === 9) {
    const a9 = 3 + p; const b9 = 2 + m
    return { stem: `Nilai maksimum f(x) = −x² + ${a9}x − ${b9} adalah ...`, ...numOpts(Math.round(a9 * a9 / 4 - b9), seed, 2), explanation: `x maks = ${a9}/2. y maks = −(${a9}/2)² + ${a9}·(${a9}/2) − ${b9} = ${Math.round(a9 * a9 / 4 - b9)}.` }
  }
  if (q === 10) {
    const a10 = p + 2
    return { stem: `Turunan dari f(x) = (x + ${a10})² adalah ...`, ...createOptionSet(`2(x + ${a10})`, [`x + ${a10}`, `2x + ${a10}`, `(x + ${a10})`], seed), explanation: `f'(x) = 2·(x+${a10})·1 = 2(x+${a10}).` }
  }
  // Integral (Q11-15)
  if (q === 11) {
    const a11 = 2 + p; const b11 = 3 + m
    return { stem: `∫(${a11}x + ${b11}) dx = ...`, ...createOptionSet(`${a11}x²/2 + ${b11}x + C`, [`${a11}x² + ${b11}x + C`, `${a11}x²/2 + C`, `${a11}x + ${b11} + C`], seed), explanation: `∫${a11}x dx + ∫${b11} dx = ${a11}x²/2 + ${b11}x + C.` }
  }
  if (q === 12) {
    const a12 = 2 + m; const b12 = p
    const F = (x: number) => a12 * x * x / 2 + b12 * x
    const upper = 2 + p % 2; const lower = 0
    return { stem: `Nilai ∫₀^${upper} (${a12}x + ${b12}) dx adalah ...`, ...numOpts(F(upper) - F(lower), seed, 3), explanation: `[${a12}x²/2 + ${b12}x]₀^${upper} = ${F(upper)} − 0 = ${F(upper) - F(lower)}.` }
  }
  if (q === 13) {
    const a13 = 3 + p
    return { stem: `∫ ${a13}x² dx = ...`, ...createOptionSet(`${a13}x³/3 + C`, [`${a13 * 2}x + C`, `${a13}x³ + C`, `x³/3 + C`], seed), explanation: `∫${a13}x² dx = ${a13}·x³/3 + C = ${a13}x³/3 + C.` }
  }
  if (q === 14) {
    const a14 = 1 + p % 3; const b14 = 1 + m % 3
    const area = Math.abs((a14 + b14) * (a14 + b14) / 2 - a14 * a14 / 2 - (a14 + b14) + a14)
    return { stem: `Luas daerah yang dibatasi y = x dan y = ${a14} antara x=${a14} dan x=${a14 + b14} adalah ... satuan luas.`, ...numOpts(b14 * b14 / 2, seed, 1), explanation: `Luas = ∫[${a14} ke ${a14 + b14}] (x − ${a14}) dx = [x²/2 − ${a14}x]... = ${b14 * b14 / 2} satuan luas.` }
  }
  if (q === 15) {
    const n15 = 2 + p
    return { stem: `∫₁^${n15} x dx = ...`, ...numOpts((n15 * n15 - 1) / 2, seed, 2), explanation: `[x²/2]₁^${n15} = ${n15 * n15}/2 − 1/2 = ${(n15 * n15 - 1) / 2}.` }
  }
  // Matriks (Q16-20)
  if (q === 16) {
    const a16 = 1 + p; const b16 = 2 + m; const c16 = p; const d16 = 1 + m
    const det = a16 * d16 - b16 * c16
    return { stem: `Determinan matriks [[${a16},${b16}],[${c16},${d16}]] adalah ...`, ...numOpts(det, seed, 3), explanation: `det = ${a16}·${d16} − ${b16}·${c16} = ${a16 * d16} − ${b16 * c16} = ${det}.` }
  }
  if (q === 17) {
    const a17 = p + 1; const b17 = m
    return { stem: `Jika A = [[${a17},${b17}],[0,1]] dan B = [[1,0],[${m},${p}]], maka elemen baris 1 kolom 1 dari A+B adalah ...`, ...numOpts(a17 + 1, seed, 2), explanation: `(A+B)₁₁ = ${a17} + 1 = ${a17 + 1}.` }
  }
  if (q === 18) {
    const k18 = 2 + p
    return { stem: `Jika A = [[${k18},0],[0,${k18}]], maka |A| = ...`, ...numOpts(k18 * k18, seed, 3), explanation: `det([[${k18},0],[0,${k18}]]) = ${k18}·${k18} − 0·0 = ${k18 * k18}.` }
  }
  if (q === 19) {
    const a19 = 2 + p; const d19 = 1 + m
    const det19 = a19 * d19
    return { stem: `Matriks [[${a19},0],[0,${d19}]] memiliki invers dengan elemen baris 1 kolom 1 = ...`, ...createOptionSet(`${d19}/${det19}`, [`${a19}/${det19}`, `1/${a19}`, `−1/${d19}`], seed), explanation: `Invers matriks diagonal: 1/det × [[${d19},0],[0,${a19}]]. Elemen (1,1) = ${d19}/${det19}.` }
  }
  if (q === 20) {
    const a20 = p + 1; const b20 = 2 + m; const c20 = p; const d20 = 1 + m
    return { stem: `Transpos dari matriks [[${a20},${b20}],[${c20},${d20}]] adalah ...`, ...createOptionSet(`[[${a20},${c20}],[${b20},${d20}]]`, [`[[${d20},${b20}],[${c20},${a20}]]`, `[[${b20},${a20}],[${d20},${c20}]]`, `[[${a20},${b20}],[${c20},${d20}]]`], seed), explanation: `Transpos: baris menjadi kolom. Aᵀ = [[${a20},${c20}],[${b20},${d20}]].` }
  }
  // Kombinatorik & Peluang (Q21-25)
  if (q === 21) {
    const n21 = 4 + p; const r21 = 2 + m % 2
    const perm = (() => { let res = 1; for (let i = n21; i > n21 - r21; i--) res *= i; return res })()
    return { stem: `Banyak cara memilih dan menyusun ${r21} dari ${n21} benda yang berbeda (permutasi P(${n21},${r21})) adalah ...`, ...numOpts(perm, seed, perm / 4), explanation: `P(${n21},${r21}) = ${n21}!/(${n21}−${r21})! = ${perm}.` }
  }
  if (q === 22) {
    const n22 = 5 + p; const r22 = 2 + m % 2
    function fact(n: number): number { return n <= 1 ? 1 : n * fact(n - 1) }
    const comb = Math.round(fact(n22) / (fact(r22) * fact(n22 - r22)))
    return { stem: `Banyak cara memilih ${r22} dari ${n22} benda tanpa memperhatikan urutan C(${n22},${r22}) adalah ...`, ...numOpts(comb, seed, comb / 3), explanation: `C(${n22},${r22}) = ${n22}!/(${r22}!·${n22 - r22}!) = ${comb}.` }
  }
  if (q === 23) {
    const total23 = 6 + p; const fav = 2 + m % 3
    return { stem: `Dari ${total23} soal, ${fav} soal adalah soal mudah. Peluang dipilih soal mudah adalah ...`, ...createOptionSet(`${fav}/${total23}`, [`${total23 - fav}/${total23}`, `${fav}/${total23 - fav}`, `1/${fav}`], seed), explanation: `P(mudah) = ${fav}/${total23}.` }
  }
  if (q === 24) {
    const p24 = 1 + p % 4; const q24p = 1 + m % 4; const den = p24 + q24p
    const pA = p24; const pB = q24p
    const pAB = Math.max(1, p24 + q24p - den)
    return { stem: `P(A) = ${p24}/${den}, P(B) = ${q24p}/${den}, A dan B saling lepas. P(A∪B) = ...`, ...createOptionSet(`${p24 + q24p}/${den}`, [`${p24 * q24p}/${den * den}`, `${Math.abs(p24 - q24p)}/${den}`, `1`], seed), explanation: `P(A∪B) = P(A) + P(B) = ${p24}/${den} + ${q24p}/${den} = ${p24 + q24p}/${den}.` }
  }
  const n25 = 4 + p; const r25 = 2 + m % 3
  function fact25(n: number): number { return n <= 1 ? 1 : n * fact25(n - 1) }
  const comb25 = Math.round(fact25(n25) / (fact25(r25) * fact25(n25 - r25)))
  return { stem: `Dalam sebuah tim ada ${n25} anggota. Banyak cara memilih ${r25} orang untuk mewakili tim adalah ...`, ...numOpts(comb25, seed, comb25 / 4), explanation: `C(${n25},${r25}) = ${n25}!/(${r25}!·${n25 - r25}!) = ${comb25} cara.` }
}

// ═══════════════════════════════════════════════════════════════════
// 5. BAHASA INGGRIS TINGKAT LANJUT — 25 soal
// ═══════════════════════════════════════════════════════════════════
const buildBahasaInggrisLanjutQuestion = (p: number, d: Difficulty, q: number) => {
  const seed = p * 59 + q

  // Subject-verb agreement (Q1-3)
  if (q === 1) return { stem: `Choose the correct sentence:`, ...createOptionSet('Neither the students nor the teacher was present.', ['Neither the students nor the teacher were present.', 'Neither the students nor the teacher are present.', 'Neither the students nor the teacher is present.'], seed), explanation: `With "neither...nor", the verb agrees with the noun closest to it ("teacher" → singular "was").` }
  if (q === 2) return { stem: `Select the grammatically correct option:`, ...createOptionSet('Each of the books has been read.', ['Each of the books have been read.', 'Each of the books were read.', 'Each of the books are being read.'], seed), explanation: `"Each" is always singular, so the verb must be singular: "has been read".` }
  if (q === 3) return { stem: `Which sentence uses the correct tense?`, ...createOptionSet('By the time she arrived, they had already left.', ['By the time she arrived, they already left.', 'By the time she arrives, they had already left.', 'By the time she arrived, they have already left.'], seed), explanation: `Past perfect "had left" is correct for an action completed before another past action.` }

  // Perfect tenses (Q4-5)
  if (q === 4) return { stem: `Complete: "She ___ in this city for five years." (she still lives there)`, ...createOptionSet('has lived', ['lived', 'was living', 'had lived'], seed), explanation: `Present perfect "has lived" for an action starting in the past and continuing to now.` }
  if (q === 5) return { stem: `Which sentence uses the past perfect correctly?`, ...createOptionSet('He had finished the report before the meeting started.', ['He finished the report before the meeting had started.', 'He has finished the report before the meeting started.', 'He had finish the report before the meeting started.'], seed), explanation: `Past perfect shows an action completed before another past action. "had finished" is correct.` }

  // Conditional sentences (Q6-8)
  if (q === 6) return { stem: `Choose the correct conditional (real/likely situation):`, ...createOptionSet('If it rains tomorrow, we will cancel the trip.', ['If it rains tomorrow, we would cancel the trip.', 'If it rained tomorrow, we will cancel the trip.', 'If it had rained tomorrow, we would have cancelled.'], seed), explanation: `Type 1 conditional (real): If + simple present, will + infinitive.` }
  if (q === 7) return { stem: `Select the correct Type 2 conditional (unreal/hypothetical):`, ...createOptionSet('If I had more time, I would learn another language.', ['If I have more time, I will learn another language.', 'If I had more time, I will learn another language.', 'If I had had more time, I would have learned.'], seed), explanation: `Type 2: If + past simple, would + infinitive (for hypothetical situations).` }
  if (q === 8) return { stem: `Which sentence is a correct Type 3 conditional (unreal past)?`, ...createOptionSet('If she had studied harder, she would have passed the exam.', ['If she studied harder, she would have passed the exam.', 'If she had studied harder, she would pass the exam.', 'If she studies harder, she will pass the exam.'], seed), explanation: `Type 3: If + past perfect, would have + past participle (past hypothetical).` }

  // Passive voice (Q9-10)
  if (q === 9) return { stem: `Convert to passive: "The committee approved the proposal yesterday."`, ...createOptionSet('The proposal was approved by the committee yesterday.', ['The proposal is approved by the committee yesterday.', 'The proposal had been approved by the committee yesterday.', 'The proposal approved by the committee yesterday.'], seed), explanation: `Simple past passive: subject + was/were + past participle + by + agent.` }
  if (q === 10) return { stem: `Identify the correct passive sentence:`, ...createOptionSet('The new policy has been implemented by the management.', ['The new policy have been implemented by the management.', 'The new policy was been implemented by the management.', 'The new policy is implemented by the management yesterday.'], seed), explanation: `Present perfect passive: has/have + been + past participle.` }

  // Relative clauses (Q11-12)
  if (q === 11) return { stem: `Choose the correct relative clause:`, ...createOptionSet('The book that I borrowed from the library was very informative.', ['The book which I borrowed from the library were very informative.', 'The book who I borrowed from the library was very informative.', 'The book whom I borrowed from the library was very informative.'], seed), explanation: `"That" or "which" for things; "who/whom" for people. "That" is correct here.` }
  if (q === 12) return { stem: `Select the sentence with a NON-defining relative clause used correctly:`, ...createOptionSet('My sister, who lives in Bali, is a doctor.', ['My sister who lives in Bali is a doctor.', 'My sister, that lives in Bali, is a doctor.', 'My sister, whom lives in Bali, is a doctor.'], seed), explanation: `Non-defining clauses use commas and cannot use "that". "who" is correct for people.` }

  // Reported speech (Q13-14)
  if (q === 13) return { stem: `Convert: "I will help you," he said. → He said that ...`, ...createOptionSet('he would help me.', ['he will help me.', 'he would help you.', 'he helped me.'], seed), explanation: `Reported speech: "will" → "would"; "you" → "me" (perspective shift).` }
  if (q === 14) return { stem: `Which reported speech is CORRECT? (Original: "Are you coming to the party?")`, ...createOptionSet('She asked if I was coming to the party.', ['She asked if I am coming to the party.', 'She asked if you were coming to the party.', 'She asked am I coming to the party.'], seed), explanation: `Reported questions use if/whether + subject + verb (no question word order); tense shifts to past.` }

  // Gerund vs Infinitive (Q15-16)
  if (q === 15) return { stem: `Choose the correct form: "She enjoys ___ in the morning."`, ...createOptionSet('running', ['to run', 'run', 'ran'], seed), explanation: `After "enjoy", use gerund (-ing form): "enjoy running".` }
  if (q === 16) return { stem: `Select the correct option: "They decided ___ early."`, ...createOptionSet('to leave', ['leaving', 'leave', 'left'], seed), explanation: `After "decide", use infinitive: "decide to leave".` }

  // Modal verbs (Q17-18)
  if (q === 17) return { stem: `Which modal best expresses obligation in a formal context?`, ...createOptionSet('All employees must submit their reports by Friday.', ['All employees should submit their reports by Friday.', 'All employees might submit their reports by Friday.', 'All employees could submit their reports by Friday.'], seed), explanation: `"Must" expresses strong obligation/requirement; "should" suggests recommendation only.` }
  if (q === 18) return { stem: `Select the correct sentence expressing past ability:`, ...createOptionSet('When she was young, she could play the piano beautifully.', ['When she was young, she can play the piano beautifully.', 'When she was young, she would play the piano beautifully.', 'When she was young, she may play the piano beautifully.'], seed), explanation: `"Could" expresses past ability; "can" is present tense only.` }

  // Prepositions (Q19-20)
  if (q === 19) return { stem: `Choose the correct preposition: "She has been working ___ this company ___ 2018."`, ...createOptionSet('for / since', ['since / for', 'in / since', 'at / from'], seed), explanation: `"For" + duration (for 5 years); "since" + specific point in time (since 2018).` }
  if (q === 20) return { stem: `Which sentence uses the preposition correctly?`, ...createOptionSet('He is interested in learning new languages.', ['He is interested on learning new languages.', 'He is interested to learn new languages.', 'He is interested for learning new languages.'], seed), explanation: `"Interested in" is the correct collocation with this adjective.` }

  // Idioms & Collocations (Q21-25)
  if (q === 21) return { stem: `What does "break the ice" mean in a social context?`, ...createOptionSet('To initiate conversation and ease tension in an uncomfortable situation', ['To literally destroy frozen water', 'To end a friendship suddenly', 'To announce bad news to someone'], seed), explanation: `"Break the ice" is an idiom meaning to start a conversation or ease social awkwardness.` }
  if (q === 22) return { stem: `Which word best COLLOCATES with "make"?`, ...createOptionSet('make a decision', ['make a travel', 'make a sleep', 'make a work'], seed), explanation: `"Make a decision" is a standard collocation. Other options are incorrect combinations.` }
  if (q === 23) return { stem: `What does "under the weather" mean?`, ...createOptionSet('Feeling slightly ill or unwell', ['Experiencing bad weather conditions', 'Being in a difficult financial situation', 'Feeling overwhelmed by responsibilities'], seed), explanation: `"Under the weather" is an idiom meaning feeling slightly sick or not well.` }
  if (q === 24) return { stem: `Choose the correct academic collocation:`, ...createOptionSet('conduct research', ['make research', 'do a research', 'perform a research'], seed), explanation: `The standard academic collocation is "conduct research". "Make" and "do" are informal.` }
  return { stem: `What does "the ball is in your court" mean?`, ...createOptionSet('It is your turn to take action or make a decision', ['You are winning the game', 'You should practice more', 'The situation is beyond your control'], seed), explanation: `This idiom from tennis means the responsibility for the next action belongs to you.` }
}

// ─── QUESTION BANK GENERATOR ─────────────────────────────────────────────────

const generateQuestionBank = (): Question[] => {
  const bank: Question[] = []

  SUBJECTS.forEach((subject) => {
    PAKETS.forEach((paket, paketIndex) => {
      DIFFICULTIES.forEach((difficulty) => {
        const p = paketIndex + 1
        for (let q = 1; q <= QUESTIONS_PER_SET; q++) {
          let generated: { stem: string; options: string[]; correctAnswer: number; explanation: string }
          if (subject === 'Penalaran Matematika') {
            generated = buildPenalaranMatematikaQuestion(p, difficulty, q)
          } else if (subject === 'Literasi Bahasa Indonesia') {
            generated = buildLiterasiBahasaIndonesiaQuestion(p, difficulty, q)
          } else if (subject === 'Literasi Bahasa Inggris') {
            generated = buildLiterasiBahasaInggrisQuestion(p, difficulty, q)
          } else if (subject === 'Matematika Tingkat Lanjut') {
            generated = buildMatematikaLanjutQuestion(p, difficulty, q)
          } else {
            generated = buildBahasaInggrisLanjutQuestion(p, difficulty, q)
          }
          bank.push({
            id: `${subject}-${paket}-${difficulty}-${q}`.toLowerCase().replace(/\s+/g, '-'),
            subject,
            paket,
            difficulty,
            ...generated,
          })
        }
      })
    })
  })

  return bank
}

const questionBank = generateQuestionBank()

// ─── HOOKS ───────────────────────────────────────────────────────────────────

const useWindowSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return size
}

const screenVariants = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -18, scale: 0.98 },
}

// ─── APP ──────────────────────────────────────────────────────────────────────

function App() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedPaket, setSelectedPaket] = useState<Paket | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION_SECONDS)
  const [isNavOpen, setIsNavOpen] = useState(true)
  const windowSize = useWindowSize()

  const filteredQuestions = useMemo(
    () =>
      questionBank.filter(
        (q) =>
          q.subject === selectedSubject &&
          q.paket === selectedPaket &&
          q.difficulty === selectedDifficulty,
      ),
    [selectedSubject, selectedPaket, selectedDifficulty],
  )

  const currentQuestion = filteredQuestions[currentIndex]
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
  const isSetupComplete = Boolean(selectedSubject && selectedPaket && selectedDifficulty)
  const progress = filteredQuestions.length ? ((currentIndex + 1) / filteredQuestions.length) * 100 : 0
  const answeredCount = filteredQuestions.filter((q) => answers[q.id] !== undefined).length

  // Timer countdown
  useEffect(() => {
    if (screen !== 'quiz') return
    if (timeLeft <= 0) {
      setScreen('result')
      return
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(timer)
  }, [screen, timeLeft])

  const result = useMemo(() => {
    const correct = filteredQuestions.filter((q) => answers[q.id] === q.correctAnswer).length
    const total = filteredQuestions.length
    const incorrect = Math.max(total - correct, 0)
    const score = total ? Math.round((correct / total) * 100) : 0
    return { correct, incorrect, total, score }
  }, [answers, filteredQuestions])

  const startSimulation = () => {
    if (!isSetupComplete) return
    setAnswers({})
    setCurrentIndex(0)
    setTimeLeft(QUIZ_DURATION_SECONDS)
    setIsNavOpen(true)
    setScreen('quiz')
  }

  const chooseAnswer = (optionIndex: number) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionIndex }))
  }

  const finishQuiz = () => setScreen('result')

  const resetSimulation = () => {
    setSelectedSubject(null)
    setSelectedPaket(null)
    setSelectedDifficulty(null)
    setCurrentIndex(0)
    setAnswers({})
    setTimeLeft(QUIZ_DURATION_SECONDS)
    setScreen('setup')
  }

  const passed = result.score >= 70
  const timerColor =
    timeLeft > 10 * 60
      ? 'var(--k-navy)'
      : timeLeft > 5 * 60
        ? 'var(--k-orange)'
        : '#c0392b'

  return (
    <main
      className="min-h-screen antialiased"
      style={{ background: 'var(--k-bg)', color: 'var(--k-text)', fontFamily: "'Open Sans', sans-serif" }}
    >
      {/* ── Kingster Top Bar ── */}
      <div className="k-topbar">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span>📍 MAKN Ende, Nusa Tenggara Timur</span>
          <span>TKA Readiness Lab · Tahun Ajaran 2025/2026</span>
        </div>
      </div>

      {/* ── Kingster Main Header ── */}
      <header className="k-header sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, -4, 4, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="grid size-11 shrink-0 place-items-center rounded-lg"
              style={{ background: 'var(--k-navy)', color: '#fff' }}
            >
              <BookOpenCheck className="size-5" />
            </motion.div>
            <div>
              <p className="k-section-label" style={{ color: 'var(--k-orange)', fontSize: '0.58rem' }}>
                TKA Readiness Lab
              </p>
              <h1
                className="text-base font-bold leading-tight"
                style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}
              >
                Simulasi TKA MAKN Ende
              </h1>
            </div>
          </div>

          {/* Timer (quiz only) */}
          {screen === 'quiz' && (
            <motion.div
              className="flex items-center gap-2 rounded-lg px-4 py-2 font-bold"
              style={{
                fontFamily: 'Poppins, sans-serif',
                background: timeLeft <= 5 * 60 ? '#fdecea' : '#eef3fa',
                color: timerColor,
                border: `2px solid ${timerColor}`,
                fontSize: '1.1rem',
              }}
              animate={{ scale: timeLeft <= 60 && timeLeft % 2 === 0 ? 1.05 : 1 }}
            >
              <Clock className="size-4" />
              {formatTime(timeLeft)}
            </motion.div>
          )}

          {/* Stats (setup only) */}
          {screen !== 'quiz' && (
            <div className="hidden gap-2 sm:flex">
              {[
                { value: '3', label: 'Wajib' },
                { value: '2', label: 'Pilihan' },
                { value: '70', label: 'KKM' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-md px-3 py-2 text-center text-xs font-semibold"
                  style={{ background: '#eef3fa', color: 'var(--k-navy)', border: '1px solid var(--k-border)' }}
                >
                  <div
                    className="text-lg font-bold"
                    style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}
                  >
                    {s.value}
                  </div>
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* ── Page Content ── */}
      <div
        className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        style={{ paddingBottom: screen === 'quiz' ? '120px' : undefined }}
      >
        <AnimatePresence mode="wait">

          {/* ══════════════════════════════════════════════
              SETUP SCREEN
          ══════════════════════════════════════════════ */}
          {screen === 'setup' && (
            <motion.section
              key="setup"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.38, ease: 'easeOut' }}
              className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]"
            >
              {/* Hero left panel */}
              <div
                className="k-hero relative overflow-hidden rounded-xl p-8 text-white sm:p-10"
                style={{ minHeight: '480px' }}
              >
                <div className="pointer-events-none absolute -bottom-20 -right-20 size-64 rounded-full opacity-10" style={{ background: 'var(--k-orange)' }} />
                <div className="relative z-10">
                  <div className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest" style={{ background: 'var(--k-orange)', color: '#fff' }}>
                    <Sparkles className="size-3.5" />
                    Mode Latihan TKA Resmi
                  </div>
                  <h2 className="mb-4 text-4xl font-extrabold leading-tight sm:text-5xl" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Simulasi TKA<br />
                    <span style={{ color: 'var(--k-orange-light)' }}>25 Soal · 50 Menit.</span>
                  </h2>
                  <div className="mb-1 h-1 w-12 rounded-full" style={{ background: 'var(--k-orange)' }} />
                  <p className="mb-8 max-w-lg text-sm leading-7 text-white/75">
                    Pilih mapel, paket, dan tingkat kesulitan. Kerjakan 25 soal sesuai struktur TKA resmi
                    Kemendikdasmen — ada navigasi soal dan batas waktu 50 menit.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: '25 Soal/Sesi', icon: Target, desc: 'Simulasi penuh' },
                      { label: '50 Menit', icon: Clock, desc: 'Batas waktu resmi' },
                      { label: 'Navigator', icon: CheckCircle2, desc: 'Loncat antar soal' },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div key={item.label} className="rounded-lg p-4" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>
                          <div className="mb-3 grid size-9 place-items-center rounded-md" style={{ background: 'var(--k-orange)' }}>
                            <Icon className="size-4 text-white" />
                          </div>
                          <p className="text-sm font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>{item.label}</p>
                          <p className="mt-0.5 text-xs text-white/60">{item.desc}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Form right panel */}
              <div className="k-card k-card-accent space-y-6 rounded-xl p-6 sm:p-7">
                {/* 1. Mata Pelajaran */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)', fontSize: '1rem' }}>1. Pilih Mata Pelajaran</h3>
                    <span className="k-section-label text-[0.6rem]">Mapel</span>
                  </div>
                  <div className="mb-3 h-0.5 w-8 rounded-full" style={{ background: 'var(--k-orange)' }} />

                  {/* Wajib group */}
                  <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: 'var(--k-orange)' }}>
                    ● TKA Wajib
                  </p>
                  <div className="mb-3 grid gap-2">
                    {SUBJECTS_WAJIB.map((subject) => {
                      const Icon = subjectMeta[subject].icon
                      const isSel = selectedSubject === subject
                      return (
                        <motion.button
                          key={subject}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedSubject(subject)}
                          className={`k-subject-card w-full p-3 text-left${isSel ? ' selected' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="grid size-9 shrink-0 place-items-center rounded-md" style={{ background: isSel ? 'var(--k-orange)' : '#eef3fa', color: isSel ? '#fff' : 'var(--k-navy)', transition: 'background 0.2s' }}>
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}>{subject}</p>
                                {isSel && <CheckCircle2 className="size-4 shrink-0" style={{ color: 'var(--k-orange)' }} />}
                              </div>
                              <p className="mt-0.5 text-[0.65rem] leading-4" style={{ color: 'var(--k-text-muted)' }}>{subjectMeta[subject].description}</p>
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>

                  {/* Pilihan group */}
                  <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-widest" style={{ color: 'var(--k-navy-light)' }}>
                    ● TKA Pilihan
                  </p>
                  <div className="grid gap-2">
                    {SUBJECTS_PILIHAN.map((subject) => {
                      const Icon = subjectMeta[subject].icon
                      const isSel = selectedSubject === subject
                      return (
                        <motion.button
                          key={subject}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedSubject(subject)}
                          className={`k-subject-card w-full p-3 text-left${isSel ? ' selected' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="grid size-9 shrink-0 place-items-center rounded-md" style={{ background: isSel ? 'var(--k-orange)' : '#eef3fa', color: isSel ? '#fff' : 'var(--k-navy)', transition: 'background 0.2s' }}>
                              <Icon className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}>{subject}</p>
                                {isSel && <CheckCircle2 className="size-4 shrink-0" style={{ color: 'var(--k-orange)' }} />}
                              </div>
                              <p className="mt-0.5 text-[0.65rem] leading-4" style={{ color: 'var(--k-text-muted)' }}>{subjectMeta[subject].description}</p>
                            </div>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* 2. Paket */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)', fontSize: '1rem' }}>2. Pilih Paket</h3>
                    <span className="k-section-label text-[0.6rem]">Set</span>
                  </div>
                  <div className="mb-3 h-0.5 w-8 rounded-full" style={{ background: 'var(--k-orange)' }} />
                  <div className="grid grid-cols-5 gap-2">
                    {PAKETS.map((paket) => {
                      const isSel = selectedPaket === paket
                      return (
                        <motion.button
                          key={paket}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedPaket(paket)}
                          className="rounded-lg py-2.5 text-center text-xs font-bold"
                          style={{ fontFamily: 'Poppins, sans-serif', background: isSel ? 'var(--k-navy)' : '#eef3fa', color: isSel ? '#fff' : 'var(--k-navy)', border: isSel ? '2px solid var(--k-orange)' : '2px solid transparent' }}
                        >
                          {paket.replace('Paket ', 'P')}
                        </motion.button>
                      )
                    })}
                  </div>
                  {selectedPaket && (
                    <p className="mt-2 text-xs" style={{ color: 'var(--k-text-muted)' }}>📦 {paketDescriptions[selectedPaket]}</p>
                  )}
                </div>

                {/* 3. Kesulitan */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)', fontSize: '1rem' }}>3. Tingkat Kesulitan</h3>
                    <span className="k-section-label text-[0.6rem]">Level</span>
                  </div>
                  <div className="mb-3 h-0.5 w-8 rounded-full" style={{ background: 'var(--k-orange)' }} />
                  <div className="grid grid-cols-3 gap-2">
                    {DIFFICULTIES.map((diff) => {
                      const isSel = selectedDifficulty === diff
                      const col = difficultyMeta[diff].color
                      return (
                        <motion.button
                          key={diff}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedDifficulty(diff)}
                          className="rounded-lg p-3 text-left"
                          style={{ background: isSel ? col : '#eef3fa', color: isSel ? '#fff' : 'var(--k-navy)', border: isSel ? `2px solid ${col}` : '2px solid transparent' }}
                        >
                          <p className="text-sm font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>{diff}</p>
                          <p className="mt-0.5 text-[0.6rem] font-semibold uppercase tracking-widest opacity-80">{difficultyMeta[diff].tone}</p>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                <motion.button
                  type="button"
                  whileHover={isSetupComplete ? { y: -2 } : undefined}
                  whileTap={isSetupComplete ? { scale: 0.98 } : undefined}
                  onClick={startSimulation}
                  disabled={!isSetupComplete}
                  className="k-btn-primary flex w-full items-center justify-center gap-3 px-6 py-4 text-base"
                >
                  Mulai Simulasi TKA (50 menit)
                  <ArrowRight className="size-5" />
                </motion.button>
              </div>
            </motion.section>
          )}

          {/* ══════════════════════════════════════════════
              QUIZ SCREEN
          ══════════════════════════════════════════════ */}
          {screen === 'quiz' && currentQuestion && (
            <motion.section
              key="quiz"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.38, ease: 'easeOut' }}
              className="mx-auto flex w-full max-w-4xl flex-col gap-4"
            >
              {/* Quiz info strip */}
              <div className="flex flex-wrap items-center gap-2 rounded-lg px-4 py-2.5 text-sm text-white" style={{ background: 'var(--k-navy)' }}>
                <span className="flex items-center gap-1.5 font-semibold">
                  {(() => { const Icon = subjectMeta[selectedSubject!].icon; return <Icon className="size-4" style={{ color: 'var(--k-orange-light)' }} /> })()}
                  {selectedSubject}
                </span>
                <span className="opacity-40">·</span>
                <span>{selectedPaket}</span>
                <span className="opacity-40">·</span>
                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: difficultyMeta[selectedDifficulty!].color, color: '#fff' }}>{selectedDifficulty}</span>
                <span className="ml-auto text-xs text-white/60">{answeredCount}/{filteredQuestions.length} terjawab</span>
              </div>

              {/* Progress bar */}
              <div>
                <div className="mb-1.5 flex justify-between text-xs font-semibold" style={{ color: 'var(--k-text-muted)' }}>
                  <span>Soal {currentIndex + 1} dari {filteredQuestions.length}</span>
                  <span style={{ color: 'var(--k-orange)' }}>{Math.round(progress)}%</span>
                </div>
                <div className="k-progress-bar">
                  <motion.div className="k-progress-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: 'easeOut' }} />
                </div>
              </div>

              {/* Question card */}
              <div className="k-card k-card-accent overflow-hidden rounded-xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                  >
                    {/* Stem */}
                    <div className="p-5 sm:p-7" style={{ background: '#f8fbff', borderBottom: '1px solid var(--k-border)' }}>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider" style={{ background: 'var(--k-navy)', color: '#fff' }}>
                          <Target className="size-3" />
                          Soal {currentIndex + 1}
                        </span>
                        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider" style={{ background: 'var(--k-orange)', color: '#fff' }}>Pilih satu jawaban</span>
                      </div>
                      <h2 className="text-base font-bold leading-relaxed sm:text-lg whitespace-pre-line" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}>
                        {currentQuestion.stem}
                      </h2>
                    </div>

                    {/* Options */}
                    <div className="grid gap-2.5 p-5 sm:p-7">
                      {currentQuestion.options.map((option, idx) => {
                        const letter = String.fromCharCode(65 + idx)
                        const isSel = selectedAnswer === idx
                        return (
                          <motion.button
                            key={`${currentQuestion.id}-${idx}`}
                            type="button"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, duration: 0.2 }}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => chooseAnswer(idx)}
                            className={`k-option-card flex w-full items-start gap-3 p-3.5${isSel ? ' selected' : ''}`}
                          >
                            <span
                              className="grid size-8 shrink-0 place-items-center rounded-md text-sm font-extrabold"
                              style={{ fontFamily: 'Poppins, sans-serif', background: isSel ? 'var(--k-navy)' : '#eef3fa', color: isSel ? '#fff' : 'var(--k-navy)', transition: 'background 0.2s' }}
                            >
                              {letter}
                            </span>
                            <span className="pt-1 text-sm font-medium leading-6" style={{ color: isSel ? 'var(--k-navy)' : 'var(--k-text)' }}>{option}</span>
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 border-t px-5 py-3 sm:px-7" style={{ borderColor: 'var(--k-border)', background: '#fafcff' }}>
                  <p className="text-xs" style={{ color: 'var(--k-text-muted)' }}>
                    {selectedAnswer === undefined ? '⬆ Pilih jawaban, lalu navigasi bebas' : '✅ Tersimpan. Bisa lanjut atau ganti jawaban.'}
                  </p>
                  <div className="flex gap-2">
                    {currentIndex < filteredQuestions.length - 1 && (
                      <motion.button
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setCurrentIndex((i) => Math.min(filteredQuestions.length - 1, i + 1))}
                        className="k-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs"
                      >
                        Lanjut
                        <ArrowRight className="size-3.5" />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* ══════════════════════════════════════════════
              RESULT SCREEN
          ══════════════════════════════════════════════ */}
          {screen === 'result' && (
            <motion.section
              key="result"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.38, ease: 'easeOut' }}
              className="mx-auto grid w-full max-w-6xl items-start gap-6 lg:grid-cols-[0.85fr_1.15fr]"
            >
              {passed && windowSize.width > 0 && (
                <Confetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={450} gravity={0.16} colors={['#1e3a5f', '#e8821a', '#f5c518', '#2a4f80', '#f5a94e']} />
              )}

              {/* Score card */}
              <div className="k-card rounded-xl p-6 text-center sm:p-8" style={{ borderTop: `4px solid ${passed ? 'var(--k-orange)' : '#c0392b'}` }}>
                <div className="mx-auto mb-4 grid size-18 place-items-center rounded-xl" style={{ background: passed ? 'var(--k-navy)' : '#fdecea', color: passed ? '#fff' : '#c0392b', width: '4.5rem', height: '4.5rem' }}>
                  {passed ? <Trophy className="size-9" /> : <Target className="size-9" />}
                </div>
                <p className="k-section-label mb-1">Skor Akhir</p>
                <div className="k-score-ring mx-auto mt-4 size-40" style={{ '--score-deg': `${result.score * 3.6}deg` } as React.CSSProperties}>
                  <div className="k-score-inner">
                    <span className="text-5xl font-extrabold leading-none" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}>{result.score}</span>
                    <span className="mt-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--k-text-muted)' }}>/100</span>
                  </div>
                </div>
                <h2 className="mt-5 text-xl font-extrabold" style={{ fontFamily: 'Poppins, sans-serif', color: passed ? 'var(--k-navy)' : '#c0392b' }}>
                  {passed ? '🎉 Lulus! Pertahankan!' : '💪 Belum Lulus, Semangat!'}
                </h2>
                <p className="mt-2 text-sm leading-7" style={{ color: 'var(--k-text-muted)' }}>
                  {passed ? 'Skor memenuhi KKM 70. Ulangi paket lain untuk memperkuat kesiapan.' : 'Nilai belum mencapai KKM 70. Tinjau konsep dasar dan coba lagi.'}
                </p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[{ label: 'Benar', value: result.correct, color: 'var(--k-correct)' }, { label: 'Salah', value: result.incorrect, color: 'var(--k-wrong)' }, { label: 'Total', value: result.total, color: 'var(--k-navy)' }].map((s) => (
                    <div key={s.label} className="rounded-lg py-3" style={{ background: '#f4f7fb', border: '1px solid var(--k-border)' }}>
                      <div className="text-2xl font-extrabold" style={{ fontFamily: 'Poppins, sans-serif', color: s.color }}>{s.value}</div>
                      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--k-text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <motion.button
                  type="button" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                  onClick={resetSimulation}
                  className="k-btn-navy mt-5 flex w-full items-center justify-center gap-2 px-6 py-3 text-sm"
                >
                  <RotateCcw className="size-4" />Kembali ke Beranda
                </motion.button>
              </div>

              {/* Review panel */}
              <div className="k-card k-card-accent rounded-xl p-6 sm:p-8">
                <p className="k-section-label mb-1">Ringkasan Ujian</p>
                <div className="mb-1 h-0.5 w-10 rounded-full" style={{ background: 'var(--k-orange)' }} />
                <h3 className="mt-2 text-xl font-extrabold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}>{selectedSubject}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--k-text-muted)' }}>{selectedPaket} · Level {selectedDifficulty} · {result.total} soal · KKM <span className="font-bold" style={{ color: 'var(--k-navy)' }}>70</span></p>
                <div className="mt-5 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--k-text-muted)' }}>Review Cepat (25 soal)</p>
                  <div className="max-h-[400px] space-y-2 overflow-y-auto pr-1">
                    {filteredQuestions.map((question, index) => {
                      const isCorrect = answers[question.id] === question.correctAnswer
                      return (
                        <div key={question.id} className="rounded-lg p-3" style={{ background: isCorrect ? '#f0faf5' : '#fef4f3', border: `1px solid ${isCorrect ? '#a7e3c0' : '#f5c6c2'}`, borderLeft: `4px solid ${isCorrect ? 'var(--k-correct)' : 'var(--k-wrong)'}` }}>
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}>Soal {index + 1}</p>
                            <span className="rounded-full px-2.5 py-0.5 text-xs font-bold" style={{ background: isCorrect ? 'var(--k-correct)' : 'var(--k-wrong)', color: '#fff' }}>{isCorrect ? '✓ Benar' : '✗ Salah'}</span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-5" style={{ color: 'var(--k-text-muted)' }}>{question.explanation}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

        </AnimatePresence>
      </div>

      {/* ══════════════════════════════════════════════
          FLOATING QUESTION NAVIGATOR BAR (Quiz only)
      ══════════════════════════════════════════════ */}
      <AnimatePresence>
        {screen === 'quiz' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed bottom-0 left-0 right-0 z-40"
            style={{ background: '#fff', borderTop: '3px solid var(--k-orange)', boxShadow: '0 -4px 24px rgba(30,58,95,0.13)' }}
          >
            {/* Toggle header */}
            <div
              className="flex cursor-pointer items-center justify-between px-4 py-2"
              style={{ background: 'var(--k-navy)' }}
              onClick={() => setIsNavOpen((v) => !v)}
            >
              <div className="flex items-center gap-2 text-white">
                <span className="text-xs font-bold uppercase tracking-widest">Navigator Soal</span>
                <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ background: 'var(--k-orange)', color: '#fff' }}>{answeredCount}/{filteredQuestions.length}</span>
              </div>
              <div className="text-white/70">
                {isNavOpen ? <span className="text-xs">▼ Tutup</span> : <span className="text-xs">▲ Buka</span>}
              </div>
            </div>

            {/* Navigator body */}
            <AnimatePresence>
              {isNavOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Question number grid */}
                    <div className="flex flex-1 flex-wrap gap-1.5 overflow-x-auto">
                      {filteredQuestions.map((q, idx) => {
                        const isAnswered = answers[q.id] !== undefined
                        const isCurrent = idx === currentIndex
                        return (
                          <motion.button
                            key={q.id}
                            type="button"
                            whileHover={{ scale: 1.15 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setCurrentIndex(idx)}
                            className="grid size-8 shrink-0 place-items-center rounded-md text-xs font-bold transition"
                            style={{
                              fontFamily: 'Poppins, sans-serif',
                              background: isCurrent
                                ? 'var(--k-orange)'
                                : isAnswered
                                  ? 'var(--k-navy)'
                                  : '#dde5ef',
                              color: isCurrent || isAnswered ? '#fff' : 'var(--k-text-muted)',
                              border: isCurrent ? '2px solid var(--k-orange)' : '2px solid transparent',
                              boxShadow: isCurrent ? '0 0 0 3px rgba(232,130,26,0.25)' : 'none',
                            }}
                          >
                            {idx + 1}
                          </motion.button>
                        )
                      })}
                    </div>

                    {/* Legend + Finish button */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div className="hidden gap-2 text-xs sm:flex" style={{ color: 'var(--k-text-muted)' }}>
                        <span className="flex items-center gap-1"><span className="inline-block size-3 rounded-sm" style={{ background: 'var(--k-orange)' }} />Aktif</span>
                        <span className="flex items-center gap-1"><span className="inline-block size-3 rounded-sm" style={{ background: 'var(--k-navy)' }} />Dijawab</span>
                        <span className="flex items-center gap-1"><span className="inline-block size-3 rounded-sm" style={{ background: '#dde5ef' }} />Belum</span>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={finishQuiz}
                        className="k-btn-primary shrink-0 px-4 py-2 text-xs"
                      >
                        Selesaikan Ujian
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer ── */}
      {screen !== 'quiz' && (
        <footer className="mt-10 border-t" style={{ borderColor: 'var(--k-border)', background: 'var(--k-navy)' }}>
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <div className="flex items-center gap-3">
                <div className="grid size-7 place-items-center rounded" style={{ background: 'var(--k-orange)' }}>
                  <BookOpenCheck className="size-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>TKA Readiness Lab · MAKN Ende</span>
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>© 2025/2026 Madrasah Aliyah Keagamaan Negeri Ende</p>
            </div>
          </div>
        </footer>
      )}
    </main>
  )
}

export default App
