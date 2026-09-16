import React, { createContext, useContext, useEffect, useState } from 'react'

// ── Constants ──
export const KELAS_OPTIONS = ['PPLG 1', 'PPLG 2', 'PPLG 3', 'DKV 1', 'DKV 2'] as const
export type Kelas = (typeof KELAS_OPTIONS)[number]

export type Role = 'siswa' | 'guru'

export type User = {
  id: string
  name: string
  email: string
  password: string
  role: Role
  kelas?: Kelas
}

export type CustomQuestion = {
  id: string
  subject: string
  paket: string
  difficulty: string
  stem: string
  options: [string, string, string, string]
  correctAnswer: number // 0-3
  explanation: string
  createdBy: string // guru user id
  createdAt: string
}

export type SimulationResult = {
  id: string
  studentName: string
  studentKelas: Kelas
  subject: string
  paket: string
  difficulty: string
  score: number
  correct: number
  incorrect: number
  total: number
  answeredCount: number
  status: string
  completedAt: string
}

export type Submission = {
  id: string
  studentId: string
  imageDataUrl: string
  note?: string
  createdAt: string
  grade?: string
  teacherComment?: string
}

// ── Storage Keys ──
const USERS_KEY = 'latihan_tka_users'
const CURRENT_USER_KEY = 'latihan_tka_current_user'
const SUBMISSIONS_KEY = 'latihan_tka_submissions'
const CUSTOM_QUESTIONS_KEY = 'latihan_tka_custom_questions'
const SIMULATION_RESULTS_KEY = 'latihan_tka_simulation_results'

// ── Demo Teacher ──
const demoTeacher: User = {
  id: 'guru-demo-1',
  name: 'Guru Demo',
  email: 'guru@demo',
  password: 'guru123',
  role: 'guru',
}

// ── Storage Helpers ──
function readUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return [demoTeacher]
    const parsed = JSON.parse(raw) as User[]
    if (!parsed.find((u) => u.email === demoTeacher.email)) parsed.unshift(demoTeacher)
    return parsed
  } catch {
    return [demoTeacher]
  }
}

function writeUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function readSubmissions(): Submission[] {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Submission[]
  } catch {
    return []
  }
}

function writeSubmissions(items: Submission[]) {
  localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(items))
}

function readCustomQuestions(): CustomQuestion[] {
  try {
    const raw = localStorage.getItem(CUSTOM_QUESTIONS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CustomQuestion[]
  } catch {
    return []
  }
}

function writeCustomQuestions(items: CustomQuestion[]) {
  localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(items))
}

function readSimulationResults(): SimulationResult[] {
  try {
    const raw = localStorage.getItem(SIMULATION_RESULTS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as SimulationResult[]
  } catch {
    return []
  }
}

function writeSimulationResults(items: SimulationResult[]) {
  localStorage.setItem(SIMULATION_RESULTS_KEY, JSON.stringify(items))
}

// ── Context Type ──
type AuthContextType = {
  user: User | null
  login: (email: string, password: string) => Promise<User | null>
  logout: () => void
  registerStudent: (name: string, email: string, password: string, kelas: Kelas) => Promise<User>

  // Submissions (legacy)
  addSubmission: (s: Omit<Submission, 'id' | 'createdAt'>) => Submission
  getSubmissionsForStudent: (studentId: string) => Submission[]
  getAllSubmissions: () => Submission[]

  // Custom Questions (guru)
  addCustomQuestion: (q: Omit<CustomQuestion, 'id' | 'createdAt' | 'createdBy'>) => CustomQuestion
  updateCustomQuestion: (id: string, q: Partial<Omit<CustomQuestion, 'id' | 'createdAt' | 'createdBy'>>) => void
  deleteCustomQuestion: (id: string) => void
  getCustomQuestions: () => CustomQuestion[]

  // Simulation Results
  saveSimulationResult: (r: Omit<SimulationResult, 'id'>) => SimulationResult
  getAllSimulationResults: () => SimulationResult[]
  getResultsByClass: (kelas: Kelas) => SimulationResult[]
  getResultsByStudent: (studentName: string, studentKelas: Kelas) => SimulationResult[]
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = localStorage.getItem(CURRENT_USER_KEY)
      return raw ? (JSON.parse(raw) as User) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const users = readUsers()
    writeUsers(users)
  }, [])

  const login = async (email: string, password: string) => {
    const users = readUsers()
    const found = users.find((u) => u.email === email && u.password === password)
    if (found) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(found))
      setUser(found)
      return found
    }
    return null
  }

  const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY)
    setUser(null)
  }

  const registerStudent = async (name: string, email: string, password: string, kelas: Kelas) => {
    const users = readUsers()
    if (users.find((u) => u.email === email)) {
      throw new Error('Email sudah terdaftar')
    }
    const newUser: User = {
      id: 'siswa-' + Date.now(),
      name,
      email,
      password,
      role: 'siswa',
      kelas,
    }
    users.push(newUser)
    writeUsers(users)
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser))
    setUser(newUser)
    return newUser
  }

  // ── Submissions (legacy) ──
  const addSubmission = (s: Omit<Submission, 'id' | 'createdAt'>) => {
    const items = readSubmissions()
    const entry: Submission = { ...s, id: 'sub-' + Date.now(), createdAt: new Date().toISOString() }
    items.unshift(entry)
    writeSubmissions(items)
    return entry
  }

  const getSubmissionsForStudent = (studentId: string) => readSubmissions().filter((s) => s.studentId === studentId)
  const getAllSubmissions = () => readSubmissions()

  // ── Custom Questions ──
  const addCustomQuestion = (q: Omit<CustomQuestion, 'id' | 'createdAt' | 'createdBy'>) => {
    const items = readCustomQuestions()
    const entry: CustomQuestion = {
      ...q,
      id: 'cq-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      createdBy: user?.id ?? 'unknown',
      createdAt: new Date().toISOString(),
    }
    items.unshift(entry)
    writeCustomQuestions(items)
    return entry
  }

  const updateCustomQuestion = (id: string, updates: Partial<Omit<CustomQuestion, 'id' | 'createdAt' | 'createdBy'>>) => {
    const items = readCustomQuestions()
    const idx = items.findIndex((q) => q.id === id)
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...updates }
      writeCustomQuestions(items)
    }
  }

  const deleteCustomQuestion = (id: string) => {
    const items = readCustomQuestions().filter((q) => q.id !== id)
    writeCustomQuestions(items)
  }

  const getCustomQuestions = () => readCustomQuestions()

  // ── Simulation Results ──
  const saveSimulationResult = (r: Omit<SimulationResult, 'id'>) => {
    const items = readSimulationResults()
    const entry: SimulationResult = {
      ...r,
      id: 'sim-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    }
    items.unshift(entry)
    writeSimulationResults(items)
    return entry
  }

  const getAllSimulationResults = () => readSimulationResults()

  const getResultsByClass = (kelas: Kelas) =>
    readSimulationResults().filter((r) => r.studentKelas === kelas)

  const getResultsByStudent = (studentName: string, studentKelas: Kelas) =>
    readSimulationResults().filter((r) => r.studentName === studentName && r.studentKelas === studentKelas)

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        registerStudent,
        addSubmission,
        getSubmissionsForStudent,
        getAllSubmissions,
        addCustomQuestion,
        updateCustomQuestion,
        deleteCustomQuestion,
        getCustomQuestions,
        saveSimulationResult,
        getAllSimulationResults,
        getResultsByClass,
        getResultsByStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export default AuthProvider
