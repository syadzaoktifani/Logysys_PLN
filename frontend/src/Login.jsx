import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoPLN from "./listrik.png";
import logoDanantara from "./danantara.png";
import gudangImg from "./gudang.png";

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await res.json();

      if (result.status === 'success') {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('user', JSON.stringify(result.user));
        navigate('/');
        navigate('/home');
      } else {
        setErrorMsg(result.message || 'Gagal login. Periksa kembali kredensial Anda.');
      }
    } catch (err) {
      setErrorMsg('Server tidak merespons. Pastikan backend aktif.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex bg-gray-50 text-gray-900 font-sans antialiased overflow-hidden"
      style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
    >
      {/* ============ PANEL KIRI — BRANDING & VISUAL GUDANG (DESKTOP) ============ */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between overflow-hidden p-12 lg:p-16">
        
        {/* Background Image Gudang dengan Overlay Terang & Elegan */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url(${gudangImg})` }}
        >
          {/* Overlay gradien terang agar gambar gudang tetap tampak bersih ala tema Home */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-blue-950/30" />
        </div>

        {/* Header Logo Korporat */}
        <div className="relative z-10 flex items-center gap-4">
          <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 flex items-center gap-3 shadow-md">
            <img src={logoDanantara} alt="Logo Danantara" className="h-7 object-contain" />
            <div className="h-5 w-px bg-gray-300" />
            <img src={logoPLN} alt="Logo PLN" className="h-6 object-contain" />
          </div>
        </div>

        {/* Konten Teks / Value Proposition di Panel Kiri */}
        <div className="relative z-10 max-w-lg my-auto py-12 text-white">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/20 border border-orange-400/40 text-orange-300 text-xs font-bold tracking-wide uppercase mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            Logistic Information System
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15]">
            Transformasi Digital <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-300">
              Pergudangan Material
            </span>
          </h1>
          <p className="mt-5 text-gray-200 text-sm xl:text-base leading-relaxed">
            Optimalisasi rantai pasok dan keandalan tata kelola aset material terpadu PT PLN (Persero) UP3 Padang dalam satu platform cerdas.
          </p>
        </div>

        {/* Footer Panel Kiri */}
        <div className="relative z-10 flex items-center justify-between text-xs text-gray-300 border-t border-white/20 pt-6">
          <span>&copy; {new Date().getFullYear()} PT PLN (Persero) UP3 Padang</span>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <span className="font-medium text-white">Secure Server Online</span>
          </div>
        </div>
      </div>

      {/* ============ PANEL KANAN — FORM LOGIN (CLEAN WHITE CARD SESUAI TEMA HOME) ============ */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 lg:px-12 bg-gray-50 relative">
        
        {/* Aksen Cahaya Lembut di Background Kanan */}
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_4px_25px_rgb(0,0,0,0.05)] border border-gray-200/80 p-8 sm:p-10 relative z-10">
          
          {/* Logo Mobile Only */}
          <div className="flex justify-center items-center gap-4 mb-8 lg:hidden">
            <div className="bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <img src={logoDanantara} alt="Logo Danantara" className="h-7 object-contain" />
              <div className="h-5 w-px bg-gray-200" />
              <img src={logoPLN} alt="Logo PLN" className="h-6 object-contain" />
            </div>
          </div>

          {/* Heading Form */}
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight text-gray-900">
              Selamat Datang
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Silakan masukkan kredensial akun LOGISYS Anda untuk masuk.
            </p>
          </div>

          {/* Alert Error */}
          {errorMsg && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-sm">
              <svg className="h-5 w-5 flex-shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zM9 6a1 1 0 112 0v4a1 1 0 11-2 0V6zm1 8a1.25 1.25 0 100-2.5A1.25 1.25 0 0010 14z" clipRule="evenodd" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Login Card Container */}
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-700">
                Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Masukkan username..."
                  autoComplete="username"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 py-3.5 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 shadow-inner"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-4 py-3.5 text-sm text-gray-900 transition-all placeholder:text-gray-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 shadow-inner"
                />
              </div>
            </div>

            {/* Tombol Utama dengan Warna Biru Korporat PLN */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 px-6 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && (
                <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              )}
              {isLoading ? 'Memproses Autentikasi...' : 'Masuk ke Sistem'}
            </button>
          </form>

          {/* Footer Card */}
          <div className="mt-10 text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
            &copy; {new Date().getFullYear()} PT PLN (Persero) UP3 Padang. All rights reserved.
          </div>

        </div>
      </div>
    </div>
  );
}