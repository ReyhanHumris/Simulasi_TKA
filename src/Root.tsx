import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentHome from './pages/StudentHome'
import TeacherDashboard from './pages/TeacherDashboard'
import App from './App'

export default function Root() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/student" element={<StudentHome />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/app" element={<App />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
