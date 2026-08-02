import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './Home';
import FormInput from './FormInput';
import FormSP2B from './FormSP2B';
import FormReturn from './FormReturn';
import Login from './Login'; // Import komponen Login

// Komponen Pelindung Route (Proteksi agar harus login terlebih dahulu)
const ProtectedRoute = ({ children }) => {
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true'; // Ubah ke sessionStorage
  return isLoggedIn ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Login (Publik) */}
        <Route path="/login" element={<Login />} />

        {/* Halaman Utama / Homepage (Diproteksi) */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />

        {/* Halaman Form Input (Diproteksi) */}
        <Route
          path="/input"
          element={
            <ProtectedRoute>
              <>
                {/* Tombol Navigasi Kembali ke Beranda */}
                <div className="bg-gray-100 px-8 pt-4">
                  <Link
                    to="/"
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 max-w-6xl mx-auto"
                  >
                    <span>&larr;</span> Kembali ke Beranda
                  </Link>
                </div>

                {/* Komponen Form Utama */}
                <FormInput />
              </>
            </ProtectedRoute>
          }
        />

        {/* Halaman Form SP2B (Diproteksi) */}
        <Route
          path="/sp2b"
          element={
            <ProtectedRoute>
              <>
                <div className="bg-gray-100 px-8 pt-4">
                  <Link
                    to="/"
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 max-w-6xl mx-auto"
                  >
                    <span>&larr;</span> Kembali ke Beranda
                  </Link>
                </div>

                <FormSP2B />
              </>
            </ProtectedRoute>
          }
        />

        {/* Halaman Form Return (Diproteksi) */}
        <Route
          path="/return"
          element={
            <ProtectedRoute>
              <>
                <div className="bg-gray-100 px-8 pt-4">
                  <Link
                    to="/"
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 max-w-6xl mx-auto"
                  >
                    <span>&larr;</span> Kembali ke Beranda
                  </Link>
                </div>

                <FormReturn />
              </>
            </ProtectedRoute>
          }
        />

        {/* Jika rute tidak ditemukan, arahkan kembali ke beranda/login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}