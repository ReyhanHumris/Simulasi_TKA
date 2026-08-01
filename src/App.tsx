import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Confetti from 'react-confetti'
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  Calculator,
  CheckCircle2,
  ClipboardList,
  Languages,
  Layers3,
  RotateCcw,
  ScrollText,
  Sparkles,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react'

const SUBJECTS = ['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris'] as const
const PAKETS = ['Paket 1', 'Paket 2', 'Paket 3', 'Paket 4', 'Paket 5'] as const
const DIFFICULTIES = ['Mudah', 'Sedang', 'Sulit'] as const

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

const subjectMeta: Record<Subject, { icon: LucideIcon; description: string; metric: string }> = {
  Matematika: {
    icon: Calculator,
    description: 'Bilangan, aljabar, geometri, dan penalaran kuantitatif.',
    metric: '25 soal',
  },
  'Bahasa Indonesia': {
    icon: ScrollText,
    description: 'Pemahaman bacaan, kata baku, dan struktur bahasa Indonesia.',
    metric: '25 soal',
  },
  'Bahasa Inggris': {
    icon: Languages,
    description: 'Kosakata, grammar, dan pemahaman teks singkat.',
    metric: '25 soal',
  },
}

const difficultyMeta: Record<Difficulty, { tone: string; description: string }> = {
  Mudah: {
    tone: 'Fondasi',
    description: 'Pemanasan konsep dasar dengan hitungan ringkas.',
  },
  Sedang: {
    tone: 'Aplikasi',
    description: 'Soal bertahap yang menuntut pemahaman dan ketelitian.',
  },
  Sulit: {
    tone: 'Analitis',
    description: 'Tantangan HOTS untuk menguji strategi dan konsistensi.',
  },
}

const paketDescriptions: Record<Paket, string> = {
  'Paket 1': 'Drill awal untuk membaca pola dan mengenali tipe soal.',
  'Paket 2': 'Variasi numerik dan konteks yang lebih rapat.',
  'Paket 3': 'Kombinasi konsep dengan jebakan pilihan jawaban.',
  'Paket 4': 'Simulasi ritme ujian dengan kasus lebih panjang.',
  'Paket 5': 'Paket pemantapan sebelum evaluasi akhir.',
}

const paiContexts = [
  {
    theme: 'Akidah dan tauhid',
    anchor: 'iman kepada Allah',
    virtue: 'keikhlasan',
    source: 'QS Al-Ikhlas',
    definition: 'mengesakan Allah dalam ibadah dan keyakinan',
    practice: 'menjaga niat belajar karena Allah',
    example: 'menolak mencontek walau tidak diawasi',
    hikmah: 'membentuk pribadi jujur dan bertanggung jawab',
  },
  {
    theme: 'Ibadah harian',
    anchor: 'salat tepat waktu',
    virtue: 'disiplin',
    source: 'QS Al-Baqarah ayat 43',
    definition: 'ketaatan menjalankan perintah Allah secara teratur',
    practice: 'menyusun jadwal belajar tanpa meninggalkan salat',
    example: 'bergegas ke masjid ketika azan berkumandang',
    hikmah: 'melatih keteraturan waktu dan ketenangan jiwa',
  },
  {
    theme: 'Akhlak sosial',
    anchor: 'adab terhadap sesama',
    virtue: 'empati',
    source: 'HR Bukhari tentang mencintai saudara',
    definition: 'perilaku mulia dalam berinteraksi dengan manusia',
    practice: 'mendengar pendapat teman sebelum memberi tanggapan',
    example: 'membantu teman memahami materi tanpa merendahkan',
    hikmah: 'menguatkan ukhuwah dan budaya saling menghargai',
  },
  {
    theme: 'Al-Qur’an Hadis',
    anchor: 'tadabbur ayat',
    virtue: 'ketelitian',
    source: 'QS Al-Alaq ayat 1-5',
    definition: 'membaca, memahami, dan mengamalkan petunjuk wahyu',
    practice: 'mencatat pesan ayat lalu mengaitkannya dengan perilaku harian',
    example: 'membaca Al-Qur’an dengan tartil dan memahami maknanya',
    hikmah: 'menjadikan ilmu sebagai jalan mendekat kepada Allah',
  },
  {
    theme: 'Muamalah dan amanah',
    anchor: 'transaksi yang jujur',
    virtue: 'amanah',
    source: 'QS An-Nisa ayat 58',
    definition: 'menunaikan hak dan kewajiban secara adil',
    practice: 'mengembalikan barang pinjaman tepat waktu',
    example: 'menulis laporan kas kelas secara transparan',
    hikmah: 'menumbuhkan kepercayaan dan keadilan sosial',
  },
]

const rotate = <T,>(items: T[], amount: number) => {
  const shift = ((amount % items.length) + items.length) % items.length
  return [...items.slice(shift), ...items.slice(0, shift)]
}

const createOptionSet = (correct: string, distractors: string[], seed: number): OptionSet => {
  const uniqueOptions = [correct, ...distractors].reduce<string[]>((accumulator, option) => {
    if (!accumulator.includes(option) && accumulator.length < 4) {
      accumulator.push(option)
    }
    return accumulator
  }, [])

  while (uniqueOptions.length < 4) {
    uniqueOptions.push(`Pilihan alternatif ${uniqueOptions.length + 1}`)
  }

  const options = rotate(uniqueOptions, seed)
  return {
    options,
    correctAnswer: options.indexOf(correct),
  }
}

const numericOptions = (answer: number, seed: number, spread = 3): OptionSet =>
  createOptionSet(
    String(answer),
    [answer + spread, answer - spread, answer + spread * 2, answer - spread * 2]
      .filter((value) => value !== answer)
      .map(String),
    seed,
  )

const buildMathQuestion = (paketNumber: number, difficulty: Difficulty, questionNumber: number) => {
  const seed = paketNumber * 11 + questionNumber
  const base = 6 + paketNumber * 3 + questionNumber

  if (difficulty === 'Mudah') {
    if (questionNumber === 1) {
      const a = base + 8
      const b = paketNumber * 4 + 9
      const answer = a + b
      return {
        stem: `Hasil dari ${a} + ${b} adalah ...`,
        ...numericOptions(answer, seed, 4),
        explanation: `${a} + ${b} = ${answer}.`,
      }
    }

    if (questionNumber === 2) {
      const a = paketNumber + 6
      const b = questionNumber + 5
      const answer = a * b
      return {
        stem: `Jika ${a} kelompok masing-masing berisi ${b} siswa, jumlah seluruh siswa adalah ...`,
        ...numericOptions(answer, seed, 5),
        explanation: `Jumlah total adalah ${a} × ${b} = ${answer}.`,
      }
    }

    if (questionNumber === 3) {
      const initial = 46 + paketNumber * 5
      const taken = 12 + questionNumber + paketNumber
      const answer = initial - taken
      return {
        stem: `Perpustakaan memiliki ${initial} buku latihan. Jika dipinjam ${taken} buku, sisa buku adalah ...`,
        ...numericOptions(answer, seed, 4),
        explanation: `${initial} - ${taken} = ${answer}.`,
      }
    }

    if (questionNumber === 4) {
      const value = 80 + paketNumber * 20
      const percent = 10 + paketNumber * 2
      const answer = (value * percent) / 100
      return {
        stem: `${percent}% dari ${value} adalah ...`,
        ...numericOptions(answer, seed, 6),
        explanation: `${percent}% × ${value} = ${answer}.`,
      }
    }

    const x = 12 + paketNumber
    const y = 16 + questionNumber
    const z = 20 + paketNumber + questionNumber
    const answer = Math.round((x + y + z) / 3)
    return {
      stem: `Rata-rata dari ${x}, ${y}, dan ${z} adalah ...`,
      ...numericOptions(answer, seed, 3),
      explanation: `Rata-rata = (${x} + ${y} + ${z}) ÷ 3 = ${answer}.`,
    }
  }

  if (difficulty === 'Sedang') {
    if (questionNumber === 1) {
      const answer = paketNumber + 7
      const constant = paketNumber * 3 + 5
      const total = answer + constant
      return {
        stem: `Nilai x yang memenuhi x + ${constant} = ${total} adalah ...`,
        ...numericOptions(answer, seed, 2),
        explanation: `x = ${total} - ${constant} = ${answer}.`,
      }
    }

    if (questionNumber === 2) {
      const price = 3_000 + paketNumber * 500
      const items = 4 + questionNumber
      const answer = (price * items) / 1000
      return {
        stem: `Harga 1 pulpen Rp${price.toLocaleString('id-ID')}. Harga ${items} pulpen adalah ... ribu rupiah.`,
        ...numericOptions(answer, seed, 3),
        explanation: `${items} × Rp${price.toLocaleString('id-ID')} = Rp${(answer * 1000).toLocaleString('id-ID')}.`,
      }
    }

    if (questionNumber === 3) {
      const length = 9 + paketNumber
      const width = 5 + questionNumber
      const answer = 2 * (length + width)
      return {
        stem: `Keliling persegi panjang dengan panjang ${length} cm dan lebar ${width} cm adalah ... cm.`,
        ...numericOptions(answer, seed, 4),
        explanation: `Keliling = 2 × (${length} + ${width}) = ${answer} cm.`,
      }
    }

    if (questionNumber === 4) {
      const first = 7 + paketNumber
      const difference = 3 + paketNumber
      const term = first + difference * 5
      return {
        stem: `Suku ke-6 dari barisan aritmetika ${first}, ${first + difference}, ${first + difference * 2}, ... adalah ...`,
        ...numericOptions(term, seed, 5),
        explanation: `Suku ke-6 = ${first} + 5 × ${difference} = ${term}.`,
      }
    }

    const total = 120 + paketNumber * 15
    const ratioA = 2 + paketNumber
    const ratioB = 3 + questionNumber
    const answer = Math.round((total * ratioA) / (ratioA + ratioB))
    return {
      stem: `Dana kegiatan Rp${total}.000 dibagi dengan rasio ${ratioA}:${ratioB}. Bagian pertama adalah ... ribu rupiah.`,
      ...numericOptions(answer, seed, 6),
      explanation: `Bagian pertama = ${ratioA}/(${ratioA}+${ratioB}) × ${total} = ${answer}.`,
    }
  }

  if (questionNumber === 1) {
    const rootA = paketNumber + 2
    const rootB = questionNumber + 5
    const sum = rootA + rootB
    const product = rootA * rootB
    return {
      stem: `Jika akar-akar persamaan x² - ${sum}x + ${product} = 0 adalah a dan b, maka a + b = ...`,
      ...numericOptions(sum, seed, 2),
      explanation: `Pada x² - (a+b)x + ab, jumlah akar adalah ${sum}.`,
    }
  }

  if (questionNumber === 2) {
    const red = paketNumber + 2
    const blue = 8 - paketNumber
    const denominator = red + blue
    const answer = `${red}/${denominator}`
    return {
      stem: `Sebuah kotak berisi ${red} bola merah dan ${blue} bola biru. Peluang mengambil bola merah sekali ambil adalah ...`,
      ...createOptionSet(answer, [`${blue}/${denominator}`, `${red}/${denominator + 1}`, `${red + 1}/${denominator}`], seed),
      explanation: `Peluang = banyak bola merah ÷ total bola = ${red}/${denominator}.`,
    }
  }

  if (questionNumber === 3) {
    const firstPower = paketNumber + 2
    const secondPower = questionNumber + 3
    const answer = firstPower + secondPower
    return {
      stem: `Bentuk sederhana dari 2^${firstPower} × 2^${secondPower} adalah 2^n. Nilai n adalah ...`,
      ...numericOptions(answer, seed, 2),
      explanation: `Pangkat dengan basis sama dijumlahkan: n = ${firstPower} + ${secondPower} = ${answer}.`,
    }
  }

  if (questionNumber === 4) {
    const x = paketNumber + 4
    const y = questionNumber + 3
    const sumEquation = x + y
    const diffEquation = x - y
    const answer = x * y
    return {
      stem: `Diketahui x + y = ${sumEquation} dan x - y = ${diffEquation}. Nilai x × y adalah ...`,
      ...numericOptions(answer, seed, 4),
      explanation: `Dari sistem persamaan diperoleh x = ${x} dan y = ${y}, sehingga x × y = ${answer}.`,
    }
  }

  const side = paketNumber + 5
  const height = questionNumber + 6
  const answer = side * side * height
  return {
    stem: `Volume balok beralas persegi dengan sisi ${side} cm dan tinggi ${height} cm adalah ... cm³.`,
    ...numericOptions(answer, seed, 12),
    explanation: `Volume = sisi × sisi × tinggi = ${side} × ${side} × ${height} = ${answer} cm³.`,
  }
}

const buildPaiQuestion = (paketNumber: number, difficulty: Difficulty, questionNumber: number) => {
  const context = paiContexts[paketNumber - 1]
  const seed = paketNumber * 17 + questionNumber

  if (difficulty === 'Mudah') {
    const easyQuestions = [
      {
        stem: `Pada tema ${context.theme}, makna utama dari ${context.anchor} adalah ...`,
        correct: context.definition,
        distractors: ['mengutamakan penilaian manusia', 'menunda kewajiban sampai lapang', 'mengabaikan nasihat guru'],
        explanation: `${context.anchor} mengarah pada ${context.definition}.`,
      },
      {
        stem: `Sikap sederhana yang sesuai dengan tema ${context.theme} ialah ...`,
        correct: context.practice,
        distractors: ['mencari pujian setelah berbuat baik', 'menghindari tanggung jawab kelas', 'menyalahkan teman ketika keliru'],
        explanation: `Praktik yang tepat adalah ${context.practice}.`,
      },
      {
        stem: `Nilai akhlak yang paling menonjol dalam materi ${context.theme} adalah ...`,
        correct: context.virtue,
        distractors: ['takabbur', 'lalai', 'hasad'],
        explanation: `Tema ini menekankan nilai ${context.virtue}.`,
      },
      {
        stem: `Contoh perilaku yang paling sesuai dengan ${context.anchor} adalah ...`,
        correct: context.example,
        distractors: ['mengabaikan jadwal piket', 'membiarkan teman kesulitan', 'mengambil hak orang lain'],
        explanation: `${context.example} merupakan contoh penerapan yang benar.`,
      },
      {
        stem: `Dalil atau rujukan yang relevan untuk tema ${context.theme} adalah ...`,
        correct: context.source,
        distractors: ['catatan media sosial tanpa sumber', 'pendapat populer yang tidak jelas', 'kebiasaan yang bertentangan dengan syariat'],
        explanation: `Rujukan yang tepat adalah ${context.source}.`,
      },
    ]

    const selected = easyQuestions[questionNumber - 1]
    return {
      stem: selected.stem,
      ...createOptionSet(selected.correct, selected.distractors, seed),
      explanation: selected.explanation,
    }
  }

  if (difficulty === 'Sedang') {
    const mediumQuestions = [
      {
        stem: `Seorang siswa memahami ${context.theme}, tetapi temannya melakukan kesalahan. Respons paling tepat adalah ...`,
        correct: `menasihati dengan santun sambil memberi contoh ${context.practice}`,
        distractors: ['mempermalukan teman di depan kelas', 'membiarkan karena bukan urusannya', 'menceritakan kesalahan itu ke semua orang'],
        explanation: `Nasihat dalam Islam dilakukan dengan hikmah dan akhlak baik.`,
      },
      {
        stem: `Mengapa ${context.virtue} penting saat menerapkan ${context.anchor}?`,
        correct: context.hikmah,
        distractors: ['agar terlihat paling hebat', 'agar tugas orang lain berpindah kepada kita', 'agar aturan dapat diabaikan saat sibuk'],
        explanation: `Hikmahnya adalah ${context.hikmah}.`,
      },
      {
        stem: `Dalam kegiatan madrasah, cara mengevaluasi pemahaman ${context.theme} yang paling tepat adalah ...`,
        correct: `mengamati konsistensi perilaku seperti ${context.example}`,
        distractors: ['hanya menghafal istilah tanpa praktik', 'menilai dari banyaknya bicara', 'mengukur dari popularitas di kelas'],
        explanation: `Pemahaman PAI tampak dari ilmu yang diamalkan.`,
      },
      {
        stem: `Jika ada dua pilihan baik, prinsip yang diprioritaskan pada tema ${context.theme} adalah ...`,
        correct: `memilih tindakan yang paling menjaga ${context.virtue} dan kemaslahatan`,
        distractors: ['memilih yang paling cepat walau merugikan', 'mengikuti mayoritas tanpa pertimbangan', 'mengambil manfaat pribadi terlebih dahulu'],
        explanation: `Keputusan terbaik menjaga nilai utama dan kemaslahatan bersama.`,
      },
      {
        stem: `Kesimpulan paling tepat dari ${context.source} dalam konteks belajar adalah ...`,
        correct: `ilmu harus mendorong amal nyata seperti ${context.practice}`,
        distractors: ['ilmu cukup disimpan untuk diri sendiri', 'belajar tidak berkaitan dengan akhlak', 'prestasi membolehkan meremehkan orang lain'],
        explanation: `Rujukan agama mengarahkan ilmu kepada amal saleh.`,
      },
    ]

    const selected = mediumQuestions[questionNumber - 1]
    return {
      stem: selected.stem,
      ...createOptionSet(selected.correct, selected.distractors, seed),
      explanation: selected.explanation,
    }
  }

  const hardQuestions = [
    {
      stem: `Pada studi kasus ${context.theme}, siswa mendapat manfaat pribadi tetapi berpotensi mengurangi hak teman. Keputusan paling sesuai maqashid akhlak adalah ...`,
      correct: `menolak manfaat yang tidak adil dan menjaga amanah sesuai ${context.anchor}`,
      distractors: ['mengambil manfaat itu selama tidak diketahui', 'membagi manfaat hanya kepada teman dekat', 'menunda keputusan sampai masalah dilupakan'],
      explanation: `Prinsip syariat menuntut keadilan, amanah, dan penjagaan hak orang lain.`,
    },
    {
      stem: `Urutan berpikir kritis yang tepat saat mengkaji ${context.source} adalah ...`,
      correct: 'membaca teks, memahami konteks, mengambil nilai, lalu menerapkan dalam perilaku',
      distractors: ['menghafal teks, mengabaikan makna, lalu berdebat', 'mencari pembenaran, memilih dalil, lalu menyalahkan', 'membaca terjemah sekilas, menyimpulkan, lalu berhenti'],
      explanation: `Kajian dalil perlu utuh: teks, konteks, nilai, dan amal.`,
    },
    {
      stem: `Indikator paling kuat bahwa siswa benar-benar memahami ${context.theme} adalah ...`,
      correct: `tetap melakukan ${context.practice} meski tidak diawasi`,
      distractors: ['berbicara paling keras saat diskusi', 'mengetahui istilah Arab tanpa adab', 'menunggu dipuji sebelum berbuat baik'],
      explanation: `Konsistensi tanpa pengawasan menunjukkan internalisasi nilai.`,
    },
    {
      stem: `Jika terjadi perbedaan pendapat dalam proyek kelas, penerapan terbaik dari ${context.virtue} adalah ...`,
      correct: 'mencari titik temu berdasarkan dalil, adab, dan kemaslahatan bersama',
      distractors: ['memutuskan sepihak agar cepat selesai', 'meninggalkan diskusi tanpa alasan', 'menganggap pendapat sendiri selalu benar'],
      explanation: `Perbedaan pendapat disikapi dengan adab, ilmu, dan musyawarah.`,
    },
    {
      stem: `Kesalahan nalar yang harus dihindari saat membahas ${context.theme} adalah ...`,
      correct: 'menilai kebenaran hanya dari siapa yang berbicara tanpa memeriksa dalil',
      distractors: ['memeriksa sumber sebelum menyimpulkan', 'membandingkan pendapat dengan adab', 'menghubungkan ilmu dengan perilaku nyata'],
      explanation: `Kebenaran perlu ditimbang dengan dalil dan argumentasi, bukan semata figur.`,
    },
  ]

  const selected = hardQuestions[questionNumber - 1]
  return {
    stem: selected.stem,
    ...createOptionSet(selected.correct, selected.distractors, seed),
    explanation: selected.explanation,
  }
}

const buildBahasaIndonesiaQuestion = (paketNumber: number, difficulty: Difficulty, questionNumber: number) => {
  const seed = paketNumber * 29 + questionNumber
  const templates = [
    {
      stem: 'Kata yang tepat untuk melengkapi kalimat "Para peserta didik ... tugas dengan sungguh-sungguh" adalah ...',
      correct: 'menyelesaikan',
      distractors: ['menyelesaikanlah', 'terselesaikan', 'diselesaikan'],
      explanation: 'Kata kerja aktif yang tepat adalah "menyelesaikan".',
    },
    {
      stem: 'Pernyataan berikut yang termasuk kalimat efektif adalah ...',
      correct: 'Kami mengerjakan tugas bersama-sama di perpustakaan.',
      distractors: ['Kami mengerjakan tugas bersama sama di perpustakaan', 'Kami mengerjakan tugas bersama-sama di perpustakaan tadi', 'Kami mengerjakan tugas bersama-sama di perpustakaan yang besar'],
      explanation: 'Kalimat efektif tidak mengandung unsur berlebihan atau tidak perlu.',
    },
    {
      stem: 'Makna kata "berkelanjutan" dalam konteks paragraf adalah ...',
      correct: 'terus berlangsung',
      distractors: ['berhenti sejenak', 'mengalami perubahan', 'terjadi sekali'],
      explanation: 'Berkelanjutan berarti berlangsung terus-menerus.',
    },
    {
      stem: 'Bagian teks yang berisi inti gagasan utama disebut ...',
      correct: 'ide pokok',
      distractors: ['penutup', 'detail contoh', 'data pendukung'],
      explanation: 'Ide pokok adalah gagasan utama yang dibahas dalam paragraf.',
    },
    {
      stem: 'Kalimat yang menggunakan tanda baca dengan benar adalah ...',
      correct: 'Ibu berkata, "Besok kita pergi ke museum."',
      distractors: ['Ibu berkata “Besok kita pergi ke museum”.', 'Ibu berkata, Besok kita pergi ke museum.', 'Ibu berkata: Besok kita pergi ke museum'],
      explanation: 'Penggunaan tanda baca pada kalimat langsung harus tepat.',
    },
  ]

  const template = templates[((questionNumber - 1) % templates.length)]
  return {
    stem: difficulty === 'Sulit' ? `${template.stem} (${questionNumber})` : template.stem,
    ...createOptionSet(template.correct, template.distractors, seed + (difficulty === 'Sulit' ? 3 : 0)),
    explanation: template.explanation,
  }
}

const buildEnglishQuestion = (paketNumber: number, difficulty: Difficulty, questionNumber: number) => {
  const seed = paketNumber * 31 + questionNumber
  const templates = [
    {
      stem: 'Choose the correct word: "She is very ___ and always helps others."',
      correct: 'kind',
      distractors: ['angry', 'lazy', 'noisy'],
      explanation: 'Kind fits the meaning of helping others.',
    },
    {
      stem: 'Choose the correct sentence.',
      correct: 'They have finished their homework.',
      distractors: ['They has finished their homework.', 'They finisheds their homework.', 'They have finish their homework.'],
      explanation: 'The correct present perfect form uses "have finished".',
    },
    {
      stem: 'The opposite of "difficult" is ...',
      correct: 'easy',
      distractors: ['hard', 'complex', 'challenging'],
      explanation: 'Easy is the antonym of difficult.',
    },
    {
      stem: 'Complete the sentence: "I ___ to school every day."',
      correct: 'go',
      distractors: ['goes', 'gone', 'going'],
      explanation: 'With I, the correct simple present form is go.',
    },
    {
      stem: 'Which word is a noun?',
      correct: 'book',
      distractors: ['run', 'beautiful', 'quickly'],
      explanation: 'Book is a noun because it names a thing.',
    },
  ]

  const template = templates[((questionNumber - 1) % templates.length)]
  return {
    stem: difficulty === 'Sulit' ? `${template.stem} (${questionNumber})` : template.stem,
    ...createOptionSet(template.correct, template.distractors, seed + (difficulty === 'Sulit' ? 2 : 0)),
    explanation: template.explanation,
  }
}

const generateQuestionBank = (): Question[] => {
  const bank: Question[] = []

  SUBJECTS.forEach((subject) => {
    PAKETS.forEach((paket, paketIndex) => {
      DIFFICULTIES.forEach((difficulty) => {
        Array.from({ length: 25 }, (_, questionIndex) => {
          const questionNumber = questionIndex + 1
          const builder =
            subject === 'Matematika'
              ? buildMathQuestion
              : subject === 'Bahasa Indonesia'
                ? buildBahasaIndonesiaQuestion
                : buildEnglishQuestion
          const generated = builder(paketIndex + 1, difficulty, questionNumber)

          bank.push({
            id: `${subject}-${paket}-${difficulty}-${questionNumber}`.toLowerCase().replace(/\s+/g, '-'),
            subject,
            paket,
            difficulty,
            ...generated,
          })
        })
      })
    })
  })

  return bank
}

const questionBank = generateQuestionBank()

const useWindowSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateSize = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return size
}

const screenVariants = {
  initial: { opacity: 0, y: 24, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -18, scale: 0.98 },
}

function App() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [selectedPaket, setSelectedPaket] = useState<Paket | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(50 * 60)
  const windowSize = useWindowSize()

  const filteredQuestions = useMemo(
    () =>
      questionBank.filter(
        (question) =>
          question.subject === selectedSubject &&
          question.paket === selectedPaket &&
          question.difficulty === selectedDifficulty,
      ),
    [selectedDifficulty, selectedPaket, selectedSubject],
  )

  const currentQuestion = filteredQuestions[currentIndex]
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
  const isSetupComplete = Boolean(selectedSubject && selectedPaket && selectedDifficulty)
  const progress = filteredQuestions.length ? ((currentIndex + 1) / filteredQuestions.length) * 100 : 0
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const result = useMemo(() => {
    const correct = filteredQuestions.filter((question) => answers[question.id] === question.correctAnswer).length
    const total = filteredQuestions.length
    const incorrect = Math.max(total - correct, 0)
    const score = total ? Math.round((correct / total) * 100) : 0
    return { correct, incorrect, total, score }
  }, [answers, filteredQuestions])

  useEffect(() => {
    if (screen !== 'quiz') return

    const timer = window.setInterval(() => {
      setTimeLeft((previousTime) => {
        if (previousTime <= 1) {
          window.clearInterval(timer)
          setScreen('result')
          return 0
        }

        return previousTime - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [screen])

  const startSimulation = () => {
    if (!isSetupComplete) return
    setAnswers({})
    setCurrentIndex(0)
    setTimeLeft(50 * 60)
    setScreen('quiz')
  }

  const chooseAnswer = (optionIndex: number) => {
    if (!currentQuestion) return
    setAnswers((previousAnswers) => ({ ...previousAnswers, [currentQuestion.id]: optionIndex }))
  }

  const goToNextQuestion = () => {
    if (selectedAnswer === undefined) return

    if (currentIndex === filteredQuestions.length - 1) {
      setScreen('result')
      return
    }

    setCurrentIndex((previousIndex) => previousIndex + 1)
  }

  const resetSimulation = () => {
    setSelectedSubject(null)
    setSelectedPaket(null)
    setSelectedDifficulty(null)
    setCurrentIndex(0)
    setAnswers({})
    setTimeLeft(50 * 60)
    setScreen('setup')
  }

  const passed = result.score >= 70

  return (
    <main className="min-h-screen overflow-x-hidden antialiased" style={{ background: 'var(--k-bg)', color: 'var(--k-text)', fontFamily: "'Open Sans', sans-serif" }}>

      {/* ── Kingster Top Bar ── */}
      <div className="k-topbar">
        <div className="mobile-topbar mx-auto flex max-w-7xl flex-col gap-1 px-4 py-2 text-center text-[0.7rem] sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0 lg:px-8">
          <span>📍 MAKN Ende, Nusa Tenggara Timur</span>
          <span>CBT Readiness Lab · Tahun Ajaran 2025/2026</span>
        </div>
      </div>

      {/* ── Kingster Main Header ── */}
      <header className="k-header sticky top-0 z-50">
        <div className="mobile-header mx-auto flex max-w-7xl flex-col items-start gap-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:px-6 sm:py-4 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, -4, 4, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              className="grid size-12 shrink-0 place-items-center rounded-lg"
              style={{ background: 'var(--k-navy)', color: '#fff' }}
            >
              <BookOpenCheck className="size-6" />
            </motion.div>
            <div>
              <p className="k-section-label" style={{ color: 'var(--k-orange)', fontSize: '0.6rem' }}>CBT Readiness Lab</p>
              <h1 className="text-base font-bold leading-tight sm:text-lg" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)', marginTop: '1px' }}>
                Simulasi TKA MAKN Ende
              </h1>
            </div>
          </div>

          {/* Stats badges */}
          <div className="hidden gap-2 sm:flex">
            {[
              { value: '3', label: 'Mapel' },
              { value: '25', label: 'Soal' },
              { value: '50m', label: 'Waktu' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-md px-4 py-2 text-center text-xs font-semibold"
                style={{ background: '#eef3fa', color: 'var(--k-navy)', border: '1px solid var(--k-border)' }}
              >
                <div className="text-xl font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}>{s.value}</div>
                {s.label}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">

          {/* ════════════════════════════════════════
              SETUP SCREEN
          ════════════════════════════════════════ */}
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
              {/* ── Hero Left Panel ── */}
              <div
                className="mobile-hero k-hero relative overflow-hidden rounded-xl p-4 text-white sm:p-10 lg:p-12"
                style={{ minHeight: 'auto' }}
              >
                {/* Decorative circle */}
                <div
                  className="pointer-events-none absolute -bottom-24 -right-24 size-72 rounded-full opacity-10"
                  style={{ background: 'var(--k-orange)' }}
                />
                <div
                  className="pointer-events-none absolute -top-16 -left-16 size-56 rounded-full opacity-5"
                  style={{ background: '#fff' }}
                />

                <div className="relative z-10">
                  {/* Section label */}
                  <div
                    className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
                    style={{ background: 'var(--k-orange)', color: '#fff' }}
                  >
                    <Sparkles className="size-3.5" />
                    Mode Latihan Adaptif
                  </div>

                  <h2
                    className="mb-4 text-2xl font-extrabold leading-tight sm:mb-5 sm:text-5xl"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    Simulasi TKA<br />
                    <span style={{ color: 'var(--k-orange-light)' }}>Pusmendik & Terukur.</span>
                  </h2>

                  <div className="mb-1 h-1 w-12 rounded-full" style={{ background: 'var(--k-orange)' }} />

                  <p className="mb-8 max-w-lg text-sm leading-7 text-white/75 sm:text-base sm:leading-8">
                    Pilih mata pelajaran, paket, dan tingkat kesulitan. Sistem akan menampilkan 25 soal dalam 50 menit untuk kombinasi yang dipilih.
                  </p>

                  {/* Feature cards */}
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { label: '25 Soal', icon: ClipboardList, desc: 'Satu paket ujian' },
                      { label: '50 Menit', icon: Layers3, desc: 'Durasi pengerjaan' },
                      { label: 'Skor Instan', icon: Trophy, desc: 'Evaluasi langsung' },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div
                          key={item.label}
                          className="rounded-lg p-4"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}
                        >
                          <div
                            className="mb-3 grid size-9 place-items-center rounded-md"
                            style={{ background: 'var(--k-orange)' }}
                          >
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

              {/* ── Form Panel Right ── */}
              <div className="mobile-card k-card k-card-accent space-y-6 rounded-xl p-4 sm:p-7">
                {/* 1. Mata Pelajaran */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)', fontSize: '1rem' }}>
                      1. Pilih Mata Pelajaran
                    </h3>
                    <span className="k-section-label text-[0.62rem]">Mapel</span>
                  </div>
                  <div className="mb-4 h-0.5 w-8 rounded-full" style={{ background: 'var(--k-orange)' }} />
                  <div className="grid gap-3">
                    {SUBJECTS.map((subject) => {
                      const Icon = subjectMeta[subject].icon
                      const isSelected = selectedSubject === subject
                      return (
                        <motion.button
                          key={subject}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedSubject(subject)}
                          className={`k-subject-card w-full p-3 text-left sm:p-4${isSelected ? ' selected' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="grid size-10 shrink-0 place-items-center rounded-md"
                              style={{
                                background: isSelected ? 'var(--k-orange)' : '#eef3fa',
                                color: isSelected ? '#fff' : 'var(--k-navy)',
                                transition: 'background 0.2s',
                              }}
                            >
                              <Icon className="size-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="font-bold text-sm" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}>{subject}</p>
                                {isSelected && <CheckCircle2 className="size-4 shrink-0" style={{ color: 'var(--k-orange)' }} />}
                              </div>
                              <p className="mt-0.5 text-xs leading-5" style={{ color: 'var(--k-text-muted)' }}>{subjectMeta[subject].description}</p>
                              <p
                                className="mt-1.5 text-[0.6rem] font-bold uppercase tracking-widest"
                                style={{ color: 'var(--k-orange)' }}
                              >
                                {subjectMeta[subject].metric}
                              </p>
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
                    <h3 className="font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)', fontSize: '1rem' }}>
                      2. Pilih Paket
                    </h3>
                    <span className="k-section-label text-[0.62rem]">Set</span>
                  </div>
                  <div className="mb-4 h-0.5 w-8 rounded-full" style={{ background: 'var(--k-orange)' }} />
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {PAKETS.map((paket) => {
                      const isSelected = selectedPaket === paket
                      return (
                        <motion.button
                          key={paket}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedPaket(paket)}
                          className="mobile-pill rounded-lg py-3 text-center text-xs font-bold transition"
                          style={{
                            fontFamily: 'Poppins, sans-serif',
                            background: isSelected ? 'var(--k-navy)' : '#eef3fa',
                            color: isSelected ? '#fff' : 'var(--k-navy)',
                            border: isSelected ? '2px solid var(--k-orange)' : '2px solid transparent',
                          }}
                        >
                          {paket.replace('Paket ', 'P')}
                        </motion.button>
                      )
                    })}
                  </div>
                  {selectedPaket && (
                    <p className="mt-2 text-xs" style={{ color: 'var(--k-text-muted)' }}>
                      📦 {paketDescriptions[selectedPaket]}
                    </p>
                  )}
                </div>

                {/* 3. Kesulitan */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <h3 className="font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)', fontSize: '1rem' }}>
                      3. Tingkat Kesulitan
                    </h3>
                    <span className="k-section-label text-[0.62rem]">Level</span>
                  </div>
                  <div className="mb-4 h-0.5 w-8 rounded-full" style={{ background: 'var(--k-orange)' }} />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {DIFFICULTIES.map((difficulty) => {
                      const isSelected = selectedDifficulty === difficulty
                      const colorMap: Record<string, string> = { Mudah: '#1a8c4e', Sedang: '#e8821a', Sulit: '#c0392b' }
                      return (
                        <motion.button
                          key={difficulty}
                          type="button"
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setSelectedDifficulty(difficulty)}
                          className="mobile-pill rounded-lg p-3 text-left transition"
                          style={{
                            background: isSelected ? colorMap[difficulty] : '#eef3fa',
                            color: isSelected ? '#fff' : 'var(--k-navy)',
                            border: isSelected ? `2px solid ${colorMap[difficulty]}` : '2px solid transparent',
                          }}
                        >
                          <p className="text-sm font-bold" style={{ fontFamily: 'Poppins, sans-serif' }}>{difficulty}</p>
                          <p className="mt-0.5 text-[0.62rem] font-semibold uppercase tracking-widest opacity-80">{difficultyMeta[difficulty].tone}</p>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>

                {/* Start Button */}
                <motion.button
                  type="button"
                  whileHover={isSetupComplete ? { y: -2 } : undefined}
                  whileTap={isSetupComplete ? { scale: 0.98 } : undefined}
                  onClick={startSimulation}
                  disabled={!isSetupComplete}
                  className="mobile-btn k-btn-primary flex w-full items-center justify-center gap-3 px-6 py-3.5 text-sm sm:py-4 sm:text-base"
                >
                  Mulai Simulasi
                  <ArrowRight className="size-5" />
                </motion.button>
              </div>
            </motion.section>
          )}

          {/* ════════════════════════════════════════
              QUIZ SCREEN
          ════════════════════════════════════════ */}
          {screen === 'quiz' && currentQuestion && (
            <motion.section
              key="quiz"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.38, ease: 'easeOut' }}
              className="mx-auto flex w-full max-w-4xl flex-col gap-5"
            >
              {/* Quiz info strip */}
              <div
                className="mobile-quiz-meta flex flex-col gap-2 rounded-lg px-4 py-3 text-sm text-white sm:flex-row sm:items-center sm:gap-3 sm:px-5"
                style={{ background: 'var(--k-navy)' }}
              >
                <span className="flex items-center gap-1.5 font-semibold">
                  <Brain className="size-4" style={{ color: 'var(--k-orange-light)' }} />
                  {selectedSubject}
                </span>
                <span className="opacity-40">·</span>
                <span>{selectedPaket}</span>
                <span className="opacity-40">·</span>
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-bold"
                  style={{
                    background: selectedDifficulty === 'Mudah' ? '#1a8c4e' : selectedDifficulty === 'Sedang' ? 'var(--k-orange)' : '#c0392b',
                    color: '#fff',
                  }}
                >
                  {selectedDifficulty}
                </span>
                <span className="ml-auto text-white/60">
                  Soal {currentIndex + 1} / {filteredQuestions.length}
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold">
                  ⏱ {formatTime(timeLeft)}
                </span>
              </div>

              {/* Progress */}
              <div>
                <div className="mb-2 flex justify-between text-xs font-semibold" style={{ color: 'var(--k-text-muted)' }}>
                  <span>Progress</span>
                  <span style={{ color: 'var(--k-orange)' }}>{Math.round(progress)}%</span>
                </div>
                <div className="k-progress-bar">
                  <motion.div
                    className="k-progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Question card */}
              <div className="k-card k-card-accent overflow-hidden rounded-xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentQuestion.id}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    {/* Question stem */}
                    <div className="p-4 sm:p-8" style={{ background: '#f8fbff', borderBottom: '1px solid var(--k-border)' }}>
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                          style={{ background: 'var(--k-navy)', color: '#fff' }}
                        >
                          <Target className="size-3.5" />
                          Soal {currentIndex + 1}
                        </span>
                        <span
                          className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                          style={{ background: 'var(--k-orange)', color: '#fff' }}
                        >
                          Pilih satu jawaban
                        </span>
                      </div>
                      <h2
                        className="text-lg font-bold leading-relaxed sm:text-2xl"
                        style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}
                      >
                        {currentQuestion.stem}
                      </h2>
                    </div>

                    {/* Options */}
                    <div className="grid gap-3 p-4 sm:p-8">
                      {currentQuestion.options.map((option, optionIndex) => {
                        const optionLetter = String.fromCharCode(65 + optionIndex)
                        const isSelected = selectedAnswer === optionIndex
                        return (
                          <motion.button
                            key={`${currentQuestion.id}-${option}`}
                            type="button"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: optionIndex * 0.05, duration: 0.22 }}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => chooseAnswer(optionIndex)}
                            className={`mobile-option k-option-card flex w-full items-start gap-3 p-3 sm:gap-4 sm:p-4${isSelected ? ' selected' : ''}`}
                          >
                            <span
                              className="grid size-8 shrink-0 place-items-center rounded-md text-sm font-extrabold sm:size-9"
                              style={{
                                fontFamily: 'Poppins, sans-serif',
                                background: isSelected ? 'var(--k-navy)' : '#eef3fa',
                                color: isSelected ? '#fff' : 'var(--k-navy)',
                                transition: 'background 0.2s',
                              }}
                            >
                              {optionLetter}
                            </span>
                            <span
                              className="option-text pt-1 text-sm font-medium leading-6 sm:pt-1.5 sm:text-base"
                              style={{ color: isSelected ? 'var(--k-navy)' : 'var(--k-text)' }}
                            >
                              {option}
                            </span>
                          </motion.button>
                        )
                      })}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Footer */}
                <div
                  className="flex flex-col-reverse items-stretch justify-between gap-3 border-t px-4 py-4 sm:flex-row sm:items-center sm:px-8"
                  style={{ borderColor: 'var(--k-border)', background: '#fafcff' }}
                >
                  <p className="text-center text-sm sm:text-left" style={{ color: 'var(--k-text-muted)' }}>
                    {selectedAnswer === undefined
                      ? '⬆ Pilih jawaban untuk mengaktifkan tombol berikutnya.'
                      : '✅ Jawaban tersimpan. Lanjutkan saat sudah yakin.'}
                  </p>
                  <motion.button
                    type="button"
                    whileHover={selectedAnswer !== undefined ? { y: -2 } : undefined}
                    whileTap={selectedAnswer !== undefined ? { scale: 0.98 } : undefined}
                    onClick={goToNextQuestion}
                    disabled={selectedAnswer === undefined}
                    className="mobile-btn k-btn-primary inline-flex w-full items-center justify-center gap-2 px-7 py-3 text-sm sm:w-auto"
                  >
                    {currentIndex === filteredQuestions.length - 1 ? 'Selesai' : 'Selanjutnya'}
                    <ArrowRight className="size-4" />
                  </motion.button>
                </div>
              </div>
            </motion.section>
          )}

          {/* ════════════════════════════════════════
              RESULT SCREEN
          ════════════════════════════════════════ */}
          {screen === 'result' && (
            <motion.section
              key="result"
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.38, ease: 'easeOut' }}
              className="mx-auto grid w-full max-w-6xl items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]"
            >
              {passed && windowSize.width > 0 && (
                <Confetti
                  width={windowSize.width}
                  height={windowSize.height}
                  recycle={false}
                  numberOfPieces={420}
                  gravity={0.18}
                  colors={['#1e3a5f', '#e8821a', '#f5c518', '#2a4f80', '#f5a94e']}
                />
              )}

              {/* Score panel */}
              <div className="mobile-card k-card rounded-xl p-5 text-center sm:p-8" style={{ borderTop: `4px solid ${passed ? 'var(--k-orange)' : '#c0392b'}` }}>
                <div
                  className="mx-auto mb-4 grid size-20 place-items-center rounded-xl"
                  style={{ background: passed ? 'var(--k-navy)' : '#fdecea', color: passed ? '#fff' : '#c0392b' }}
                >
                  {passed ? <Trophy className="size-10" /> : <Target className="size-10" />}
                </div>

                <p className="k-section-label mb-1">Skor Akhir</p>

                {/* Score ring */}
                <div
                  className="k-score-ring mx-auto mt-4 size-44"
                  style={{ '--score-deg': `${result.score * 3.6}deg` } as React.CSSProperties}
                >
                  <div className="k-score-inner">
                    <span
                      className="text-5xl font-extrabold leading-none"
                      style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}
                    >
                      {result.score}
                    </span>
                    <span className="mt-1 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--k-text-muted)' }}>
                      / 100
                    </span>
                  </div>
                </div>

                <h2
                  className="mt-5 text-2xl font-extrabold"
                  style={{ fontFamily: 'Poppins, sans-serif', color: passed ? 'var(--k-navy)' : '#c0392b' }}
                >
                  {passed ? '🎉 Lulus! Pertahankan!' : '💪 Belum Lulus, Tetap Semangat!'}
                </h2>
                <p className="mt-2 text-sm leading-7" style={{ color: 'var(--k-text-muted)' }}>
                  {passed
                    ? 'Skor sudah memenuhi KKM 70. Pertahankan konsistensi dan ulangi paket lain untuk memperkuat kesiapan.'
                    : 'Nilai belum mencapai KKM 70. Tinjau kembali konsep dasar, lalu coba kombinasi paket dan level yang berbeda.'}
                </p>

                {/* Stats row */}
                <div className="mobile-stats mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: 'Benar', value: result.correct, color: 'var(--k-correct)' },
                    { label: 'Salah', value: result.incorrect, color: 'var(--k-wrong)' },
                    { label: 'Total', value: result.total, color: 'var(--k-navy)' },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-lg py-3"
                      style={{ background: '#f4f7fb', border: '1px solid var(--k-border)' }}
                    >
                      <div className="text-2xl font-extrabold" style={{ fontFamily: 'Poppins, sans-serif', color: s.color }}>{s.value}</div>
                      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--k-text-muted)' }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={resetSimulation}
                  className="k-btn-navy mt-6 flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm"
                >
                  <RotateCcw className="size-4" />
                  Kembali ke Beranda
                </motion.button>
              </div>

              {/* Review panel */}
              <div className="mobile-card k-card k-card-accent rounded-xl p-5 sm:p-8">
                <p className="k-section-label mb-1">Ringkasan Ujian</p>
                <div className="mb-1 h-0.5 w-10 rounded-full" style={{ background: 'var(--k-orange)' }} />
                <h3
                  className="mt-2 text-2xl font-extrabold"
                  style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}
                >
                  {selectedSubject} · {selectedPaket}
                </h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--k-text-muted)' }}>
                  Level {selectedDifficulty} · {result.total} soal terfilter · KKM{' '}
                  <span className="font-bold" style={{ color: 'var(--k-navy)' }}>70</span>
                </p>

                {/* Review list */}
                <div className="mt-5 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--k-text-muted)' }}>
                    Review Cepat
                  </p>
                  <div className="max-h-none space-y-2 overflow-y-auto pr-1 sm:max-h-[420px]">
                    {filteredQuestions.map((question, index) => {
                      const isCorrect = answers[question.id] === question.correctAnswer
                      return (
                        <div
                          key={question.id}
                          className="rounded-lg p-4"
                          style={{
                            background: isCorrect ? '#f0faf5' : '#fef4f3',
                            border: `1px solid ${isCorrect ? '#a7e3c0' : '#f5c6c2'}`,
                            borderLeft: `4px solid ${isCorrect ? 'var(--k-correct)' : 'var(--k-wrong)'}`,
                          }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: 'var(--k-navy)' }}>
                              Soal {index + 1}
                            </p>
                            <span
                              className="rounded-full px-3 py-0.5 text-xs font-bold"
                              style={{
                                background: isCorrect ? 'var(--k-correct)' : 'var(--k-wrong)',
                                color: '#fff',
                              }}
                            >
                              {isCorrect ? '✓ Benar' : '✗ Salah'}
                            </span>
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs leading-5" style={{ color: 'var(--k-text-muted)' }}>
                            {question.explanation}
                          </p>
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

      {/* ── Kingster Footer ── */}
      <footer className="mt-10 border-t sm:mt-12" style={{ borderColor: 'var(--k-border)', background: 'var(--k-navy)' }}>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-3">
              <div className="grid size-8 place-items-center rounded" style={{ background: 'var(--k-orange)' }}>
                <BookOpenCheck className="size-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white" style={{ fontFamily: 'Poppins, sans-serif' }}>
                CBT Readiness Lab · MAKN Ende
              </span>
            </div>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              © 2025/2026 Madrasah Aliyah Keagamaan Negeri Ende · Simulasi TKA
            </p>
          </div>
        </div>
      </footer>

    </main>
  )
}

export default App
