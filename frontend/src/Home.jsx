import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import bgImage from "./pln.jpeg";
import logoPLN from "./listrik.png";
import logoDanantara from "./danantara.png";
import logoMIMS from "./mimss.png";
import sazaImg from "./saza.png";
import beduaImg from "./bedua.png";
import gudangImg from "./gudang.png";
import soImg from './so.png';
import sirangkiang from './sirangkiang.png'

import sertif1 from "./sertif1.png";
import dirutImg from "./dirut.png"; 
import sertif2 from "./sertif2.png"; 
import sertif3 from "./sertif3.png"; 
import sertif4 from "./sertif4.png";

const heroImages = [
  bgImage,
  sazaImg,
  beduaImg,
  gudangImg,
];

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  
  // State Top Materials (Hanya dideklarasikan sekali di sini)
  const [topKeluarData, setTopKeluarData] = useState([]);
  const [topMasukData, setTopMasukData] = useState([]);
  const [topReturnData, setTopReturnData] = useState([]);

// State Bon Pinjam Realtime Spreadsheet & Filter
  const [bonList, setBonList] = useState([]);
  const [searchBonTerm, setSearchBonTerm] = useState('');
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState('all');
  const [rowsPerPage, setRowsPerPage] = useState('5');
  const [currentPage, setCurrentPage] = useState(1);
  const [isBonLoading, setIsBonLoading] = useState(true);
  const [bonErrorMsg, setBonErrorMsg] = useState('');

  // State untuk Modal Edit Bon Pinjam Menjadi TUG 9
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);
  const [formReservasi, setFormReservasi] = useState(''); // Ganti formSpk
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formPekerjaan, setFormPekerjaan] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // State Indikator Real-time Sinkron
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState('');

  // State untuk Modal Fullscreen Gambar
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTitle, setSelectedTitle] = useState("");

  // State untuk Floating Chatbot
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Halo! Saya Asisten Logisys PLN UP3 Padang. Ada yang bisa saya bantu terkait data material atau informasi sistem?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Fungsi Kirim Pesan ke Backend Gemini
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages((prev) => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await fetch('https://logysys-pln.vercel.app/api/login/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await response.json();
      
      setChatMessages((prev) => [...prev, { sender: 'bot', text: data.reply || 'Maaf, terjadi kesalahan pada respons.' }]);
    } catch (error) {
      setChatMessages((prev) => [...prev, { sender: 'bot', text: 'Gagal terhubung ke server AI.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ==========================================
  // FUNGSI LOGOUT
  // ==========================================
  const handleLogout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  // ==========================================
  // EFFECT: FETCH DATA ARTIKEL
  // ==========================================
  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const API_KEY = import.meta.env.VITE_CURRENTS_API_KEY;
        const url = `https://api.currentsapi.services/v1/search?keywords=PLN&language=id&apiKey=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.news) setArticles(data.news.slice(0, 3));
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  // ==========================================
  // EFFECT: SLIDESHOW GAMBAR
  // ==========================================
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // EFFECT: FETCH TOP MATERIALS (REAL-TIME POLLING)
  // ==========================================
  useEffect(() => {
    const fetchTopMaterials = async () => {
      setIsSyncing(true);
      try {
        const response = await fetch('https://logysys-pln.vercel.app/api/login/api/top-materials');
        const result = await response.json();
        if (result.status === 'success') {
          setTopKeluarData(result.data.keluar || []);
          setTopMasukData(result.data.masuk || []);
          setTopReturnData(result.data.return || []);

          const now = new Date();
          setLastUpdate(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      } catch (error) {
        console.error("Gagal menyinkronkan top materials:", error);
      } finally {
        setTimeout(() => setIsSyncing(false), 1000);
      }
    };

    fetchTopMaterials();
    const interval = setInterval(fetchTopMaterials, 15000); // Sinkronisasi otomatis real-time tiap 15 detik
    return () => clearInterval(interval);
  }, []);

  // ==========================================
  // EFFECT: FETCH TOP MATERIALS & BON PINJAM (REAL-TIME POLLING)
  // ==========================================
  useEffect(() => {
    const fetchData = async () => {
      setIsSyncing(true);
      try {
        // Fetch Top Materials
        const resTop = await fetch('https://logysys-pln.vercel.app/api/login/api/top-materials');
        const resultTop = await resTop.json();
        if (resultTop.status === 'success') {
          setTopKeluarData(resultTop.data.keluar || []);
          setTopMasukData(resultTop.data.masuk || []);
          setTopReturnData(resultTop.data.return || []);
        }

        // Fetch Bon Pinjam Realtime
        const resBon = await fetch('https://logysys-pln.vercel.app/api/login/api/bon-pinjam');
        const resultBon = await resBon.json();
        if (resultBon.status === 'success') {
          setBonList(resultBon.data || []);
          setBonErrorMsg('');
        } else {
          setBonErrorMsg('Gagal memuat data bon pinjam.');
        }

        const now = new Date();
        setLastUpdate(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (error) {
        console.error("Gagal menyinkronkan data:", error);
        setBonErrorMsg('Koneksi ke server gagal. Pastikan backend aktif.');
      } finally {
        setIsSyncing(false);
        setIsBonLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // Sinkronisasi otomatis real-time tiap 15 detik
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => setCurrentImageIndex((prev) => (prev + 1) % heroImages.length);
  const prevSlide = () => setCurrentImageIndex((prev) => (prev === 0 ? heroImages.length - 1 : prev - 1));

  // Filter pencarian data bon pinjam
  const filteredBon = bonList.filter((item) => 
    item.peminjam?.toLowerCase().includes(searchBonTerm.toLowerCase()) ||
    item.material?.toLowerCase().includes(searchBonTerm.toLowerCase()) ||
    item.noBon?.toLowerCase().includes(searchBonTerm.toLowerCase())
  );

  // Logika Pagination & Limit Data (5, 10, 20, All)
  const indexOfLastItem = currentPage * (rowsPerPage === 'all' ? filteredBon.length : parseInt(rowsPerPage));
  const indexOfFirstItem = indexOfLastItem - (rowsPerPage === 'all' ? filteredBon.length : parseInt(rowsPerPage));
  const currentBonData = filteredBon.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = rowsPerPage === 'all' ? 1 : Math.ceil(filteredBon.length / parseInt(rowsPerPage));

  // Fungsi untuk menyimpan perubahan (Reservasi, Keterangan, Pekerjaan)
const handleSaveEdit = async (e) => {
  e.preventDefault();
  if (!formReservasi || !formKeterangan || !formPekerjaan) {
    alert('Semua field (Reservasi, Keterangan, dan Pekerjaan) wajib diisi agar berubah menjadi TUG 9!');
    return;
  }

  setIsSubmittingEdit(true);
  try {
    const response = await fetch('https://logysys-pln.vercel.app/api/login/api/update-bon-pinjam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rowIndex: currentEditItem.rowIndex, 
        reservasi: formReservasi, // Mengirim data reservasi
        keterangan: formKeterangan,
        pekerjaan: formPekerjaan
      })
    });
    const result = await response.json();
    if (result.status === 'success') {
      alert('Data berhasil diperbarui dan dikonversi menjadi TUG 9!');
      setIsEditModalOpen(false);
      window.location.reload(); 
    } else {
      alert('Gagal memperbarui data: ' + result.message);
    }
  } catch (err) {
    alert('Koneksi ke server gagal.');
  } finally {
    setIsSubmittingEdit(false);
  }
};

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans scroll-smooth">
      
      {/* NAVBAR */}
      <nav className="bg-white/95 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 px-4 sm:px-8 py-3">
          <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center md:justify-start">
            <img src={logoDanantara} alt="Logo Danantara" className="h-10 sm:h-12 object-contain scale-150" />
            <img src={logoPLN} alt="Logo PLN" className="h-8 sm:h-10 object-contain" />
            <div className="hidden sm:block border-l border-gray-300 h-10"></div>
            <div className="text-center md:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-blue-900">LOGISYS</h1>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8 text-gray-600 font-bold text-sm tracking-wider">
            <a href="#beranda" className="hover:text-blue-600 transition-colors">HOME</a>
            <a href="#layanan" className="hover:text-blue-600 transition-colors">LAYANAN</a>
            <a href="#dashboard" className="hover:text-blue-600 transition-colors">DASHBOARD</a>
            <a href="#bon-pinjam" className="hover:text-blue-600 transition-colors">MONITORING BON PINJAM</a>
            <a href="#struktur" className="hover:text-blue-600 transition-colors">TIM LOGISTIK</a>
            <a href="#achievement" className="hover:text-blue-600 transition-colors">ACHIEVEMENT</a>
            <a href="#aplikasi" className="hover:text-blue-600 transition-colors">PORTAL</a>
            <a href="#artikel" className="hover:text-blue-600 transition-colors">ARTIKEL</a>
          </div>

          <div className="text-center md:text-right hidden md:block">
            <p className="text-blue-900 font-bold text-sm">PT PLN (Persero)</p>
            <p className="text-gray-500 text-xs">UP3 Padang</p>
          </div>
          {/* Tombol Logout */}
            <button 
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              LOGOUT
            </button>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="flex-1 min-h-[calc(100vh-5rem)]">
        
        {/* ================= SECTION 1: HERO (Auto-Slideshow) ================= */}
        <section id="beranda" className="relative w-full h-[calc(100vh-5rem)] md:h-[calc(100dvh-5rem)] max-w-[100vw] overflow-hidden group">
          {heroImages.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out scale-105 ${
                index === currentImageIndex ? "opacity-100 z-0" : "opacity-0 -z-10"
              }`}
              style={{ backgroundImage: `url(${img})` }}
            ></div>
          ))}
          <div className="absolute inset-0 bg-black/60 z-0"></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center px-4 sm:px-6 z-10">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-extrabold text-white text-center drop-shadow-lg mb-6 leading-tight transition-all">
              Platform Team Logistik <br />PLN UP3 Padang
            </h2>
            <p className="text-base sm:text-xl text-gray-200 text-center max-w-3xl leading-relaxed">
              Sistem terpadu untuk pengelolaan transaksi material, Bon Pinjam, TUG9 serta monitoring stok gudang secara realtime.
            </p>
            <div className="flex gap-2 mt-8">
              {heroImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    idx === currentImageIndex ? "w-8 bg-blue-500" : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          </div>
          <button 
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-blue-600 text-white rounded-full h-12 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-blue-600 text-white rounded-full h-12 w-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </button>
        </section>

        {/* ================= SECTION 2: LAYANAN UTAMA ================= */}
        <section id="layanan" className="min-h-[70vh] sm:min-h-screen flex items-center py-16 sm:py-24 scroll-mt-20 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Layanan Sistem</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Pilih menu layanan di bawah ini untuk memulai pengelolaan logistik.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
              <Link to="/input" className="group">
                <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-300 border border-gray-100 h-full">
                  <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                    <svg className="w-10 h-10 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Input Material Keluar</h3>
                  <p className="text-gray-600 leading-relaxed">Pencatatan material yang didistribusikan ke unit lapangan atau proyek pemeliharaan.</p>
                </div>
              </Link>

              <Link to="/sp2b" className="group">
                <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-300 border border-gray-100 h-full">
                  <div className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center mb-6 group-hover:bg-teal-600 transition-colors">
                    <svg className="w-10 h-10 text-teal-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18M13 7h4a3 3 0 013 3v10a3 3 0 01-3 3h-4" /></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Input Material Masuk</h3>
                  <p className="text-gray-600 leading-relaxed">Pencatatan penerimaan material baru dari vendor atau pusat ke gudang utama.</p>
                </div>
              </Link>

              <Link to="/return" className="group">
                <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:-translate-y-2 transition-all duration-300 border border-gray-100 h-full">
                  <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mb-6 group-hover:bg-amber-600 transition-colors">
                    <svg className="w-10 h-10 text-amber-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Input Material Return</h3>
                  <p className="text-gray-600 leading-relaxed">Pencatatan pengembalian material sisa atau rusak dari lapangan ke gudang.</p>
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= SECTION GRAFIK 3 KOLOM TOP 10 MATERIAL (PROFESIONAL & REAL-TIME) ================= */}
<section id="dashboard" className="py-20 px-4 bg-gray-50 border-t border-gray-200 scroll-mt-20">
  <div className="max-w-7xl mx-auto w-full">
    
    {/* Header Section dengan Desain Senada */}
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12 gap-6 bg-white rounded-3xl p-8 border border-gray-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
      <div>
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-3">
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
          Analytics & Monitoring Rantai Pasok
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
          Peringkat Material Teraktif
        </h2>
        <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-2xl">
          Visualisasi data 10 material teratas berdasarkan frekuensi transaksi Masuk, Keluar, dan Return secara real-time dari Google Spreadsheet.
        </p>
      </div>

      {/* Indikator Real-time Sinkron yang Elegan */}
      <div className="flex items-center bg-gray-50 border border-gray-200 px-5 py-3 rounded-2xl shadow-sm self-stretch lg:self-auto justify-between lg:justify-start">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3.5 w-3.5">
            {isSyncing && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${isSyncing ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
          </span>
          <div>
            <span className="block text-xs font-bold text-gray-800 uppercase tracking-wide">
              {isSyncing ? 'Menyinkronkan...' : 'Sistem Sinkron'}
            </span>
            <span className="text-[11px] text-gray-500">Update: {lastUpdate || '-'}</span>
          </div>
        </div>
      </div>
    </div>

    {/* Grid 3 Grafik Profesional */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* 1. Grafik Top Material Keluar */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Top 10 Material Keluar</h3>
              <p className="text-xs text-gray-500">Distribusi unit / proyek</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-700 px-2.5 py-1 rounded-lg border border-orange-100">Keluar</span>
        </div>

        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={topKeluarData}
              margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis 
                type="category" 
                dataKey="namaMaterial" 
                width={120} 
                tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', fontSize: '12px' }}
                formatter={(value, name, props) => [`${value} Transaksi (${props.payload.stn})`, 'Frekuensi']}
              />
              <Bar dataKey="frekuensi" fill="#F97316" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Grafik Top Material Masuk */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16l-4-4m0 0l4-4m-4 4h18M13 7h4a3 3 0 013 3v10a3 3 0 01-3 3h-4"/></svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Top 10 Material Masuk</h3>
              <p className="text-xs text-gray-500">Penerimaan gudang pusat/vendor</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 px-2.5 py-1 rounded-lg border border-teal-100">Masuk</span>
        </div>

        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={topMasukData}
              margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis 
                type="category" 
                dataKey="namaMaterial" 
                width={120} 
                tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', fontSize: '12px' }}
                formatter={(value, name, props) => [`${value} Transaksi (${props.payload.stn})`, 'Frekuensi']}
              />
              <Bar dataKey="frekuensi" fill="#0D9488" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Grafik Top Material Return */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-200/80 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Top 10 Material Return</h3>
              <p className="text-xs text-gray-500">Pengembalian sisa lapangan</p>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-100">Return</span>
        </div>

        <div className="h-[420px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={topReturnData}
              margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis 
                type="category" 
                dataKey="namaMaterial" 
                width={120} 
                tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)', fontSize: '12px' }}
                formatter={(value, name, props) => [`${value} Transaksi (${props.payload.stn})`, 'Frekuensi']}
              />
              <Bar dataKey="frekuensi" fill="#8B5CF6" radius={[0, 6, 6, 0]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  </div>
</section>

{/* ================= SECTION BARU: MONITORING BON PINJAM (DENGAN FITUR EDIT & KONVERSI TUG 9) ================= */}
        <section id="bon-pinjam" className="py-20 px-4 bg-white border-t border-gray-200 scroll-mt-20">
          <div className="max-w-7xl mx-auto w-full space-y-6">
            
            {/* Header Section Bon Pinjam */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-8 rounded-3xl border border-gray-200/80">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold tracking-wide uppercase mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Realtime Spreadsheet Sync
                </div>
                <h3 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  Monitoring Bon Pinjam Material
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Data peminjaman material yang otomatis disaring dari sheet Material Keluar.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setIsBonLoading(true); window.location.reload(); }}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Perbarui Data
                </button>
              </div>
            </div>

            {/* Error Message */}
            {bonErrorMsg && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <span>{bonErrorMsg}</span>
              </div>
            )}

            {/* Bar Kontrol: Search & Filter Tampilan Data */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                <svg className="w-5 h-5 text-gray-400 ml-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Cari No Bon, Vendor/Peminjam, atau Material..."
                  value={searchBonTerm}
                  onChange={(e) => { setSearchBonTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-transparent text-sm text-gray-900 focus:outline-none placeholder:text-gray-400"
                />
              </div>

              {/* Pilihan Filter Jumlah Data */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-200">
                <span className="text-xs font-bold text-gray-500 uppercase">Tampilkan:</span>
                <select 
                  value={rowsPerPage}
                  onChange={(e) => { setRowsPerPage(e.target.value); setCurrentPage(1); }}
                  className="bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm"
                >
                  <option value="5">5 Data</option>
                  <option value="10">10 Data</option>
                  <option value="20">20 Data</option>
                  <option value="all">Semua (All)</option>
                </select>
              </div>
            </div>

            {/* Tabel Data Bon Pinjam */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      <th className="py-4 px-6">No. Bon / Ref</th>
                      <th className="py-4 px-6">Tanggal</th>
                      <th className="py-4 px-6">Vendor / Penerima</th>
                      <th className="py-4 px-6">Material Dipinjam</th>
                      <th className="py-4 px-6 text-center">Jumlah</th>
                      <th className="py-4 px-6 text-center">Status / Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {isBonLoading ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-gray-400">
                          <div className="flex justify-center items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                            </svg>
                            <span>Memuat data bon pinjam dari spreadsheet...</span>
                          </div>
                        </td>
                      </tr>
                    ) : currentBonData.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-gray-400">
                          Tidak ada data bon pinjam yang ditemukan.
                        </td>
                      </tr>
                    ) : (
                      currentBonData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-4 px-6 font-bold text-gray-900">{item.noBon}</td>
                          <td className="py-4 px-6 text-gray-500">{item.tanggal}</td>
                          <td className="py-4 px-6 font-medium text-gray-900">{item.peminjam}</td>
                          <td className="py-4 px-6 text-gray-600">
                            <div>{item.material}</div>
                            {item.noSpk && item.noSpk !== '-' && (
                              <div className="text-[11px] text-gray-400 mt-0.5">
                                SPK: {item.noSpk} | Pekerjaan: {item.pekerjaan || '-'}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-gray-900">{item.jumlah}</td>
                          <td className="py-4 px-6 text-center space-y-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                              item.status === 'TUG 9' 
                                ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                                : 'bg-amber-50 text-amber-600 border border-amber-200'
                            }`}>
                              {item.status}
                            </span>
                            <div>
                              <button
                                onClick={() => {
                                  setCurrentEditItem(item);
                                  setFormReservasi(item.reservasi !== '-' ? item.reservasi : ''); // Perbaikan dari setFormSpk
                                  setFormKeterangan(item.keterangan !== '-' ? item.keterangan : '');
                                  setFormPekerjaan(item.pekerjaan !== '-' ? item.pekerjaan : '');
                                  setIsEditModalOpen(true);
                                }}
                                className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-2.5 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                              >
                                ✏️ Lengkapi / Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Tabel / Paginasi Sederhana */}
              {!isBonLoading && filteredBon.length > 0 && rowsPerPage !== 'all' && totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                  <span>
                    Menampilkan <strong>{indexOfFirstItem + 1}</strong> - <strong>{Math.min(indexOfLastItem, filteredBon.length)}</strong> dari <strong>{filteredBon.length}</strong> data
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-bold disabled:opacity-40 cursor-pointer shadow-sm hover:bg-gray-100 transition-colors"
                    >
                      Sebelumnya
                    </button>
                    <span className="font-bold px-2">Halaman {currentPage} dari {totalPages}</span>
                    <button 
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-bold disabled:opacity-40 cursor-pointer shadow-sm hover:bg-gray-100 transition-colors"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>

       {/* ================= MODAL EDIT BON PINJAM MENJADI TUG 9 ================= */}
{isEditModalOpen && (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
      <div className="flex justify-between items-center pb-3 border-b border-gray-100">
        <h4 className="text-base font-bold text-gray-900">Konversi Bon Pinjam ke TUG 9</h4>
        <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
      </div>

      <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Nomor Reservasi:</label> {/* Diubah dari Nomor SPK */}
          <input 
            type="text" 
            value={formReservasi} // Diubah dari formSpk
            onChange={(e) => setFormReservasi(e.target.value)} // Diubah dari setFormSpk
            placeholder="Contoh: RES/2026/001" 
            required
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Pekerjaan:</label>
          <input 
            type="text" 
            value={formPekerjaan} 
            onChange={(e) => setFormPekerjaan(e.target.value)}
            placeholder="Contoh: Pemeliharaan Jaringan Tegangan Menengah" 
            required
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Keterangan:</label>
          <textarea 
            value={formKeterangan} 
            onChange={(e) => setFormKeterangan(e.target.value)}
            placeholder="Masukkan keterangan lengkap..." 
            rows="3"
            required
            className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 text-blue-700 text-[11px]">
          💡 <strong>Catatan:</strong> Jika No. Reservasi, Pekerjaan, dan Keterangan terisi, status otomatis berubah menjadi **TUG 9**.
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            onClick={() => setIsEditModalOpen(false)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={isSubmittingEdit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50"
          >
            {isSubmittingEdit ? 'Menyimpan...' : 'Simpan & Ubah ke TUG 9'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

        {/* ================= SECTION 3: STRUKTUR ORGANISASI ================= */}
       {/* ================= SECTION 3: STRUKTUR ORGANISASI ================= */}
        <section id="struktur" className="py-24 px-4 bg-slate-50 relative overflow-hidden text-slate-900 border-t border-gray-200 scroll-mt-20">
          
          <div className="max-w-7xl mx-auto w-full relative z-10">
            
            {/* Header Section */}
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-3 shadow-sm">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                Manajemen & Komando Operasional
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 mb-3">
                Struktur Organisasi Tim Logistik
              </h2>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
                Dihuni oleh tim profesional bersertifikasi untuk memastikan rantai pasok material, tata kelola gudang, dan keandalan sistem kelistrikan UP3 Padang berjalan optimal.
              </p>
            </div>

            {/* Container Utama dengan Style Card Premium & Padding Luas */}
            <div className="bg-white rounded-3xl p-6 md:p-10 shadow-[0_10px_30px_rgb(0,0,0,0.06)] border border-gray-200 relative group transition-all duration-300">
              
              {/* Baris Atas di Dalam Card (Judul kecil & Tombol Zoom Interaktif) */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Bagan Resmi Tim Logistik UP3 Padang</span>
                </div>
                
                {/* Tombol Perbesar / Zoom */}
                <button 
                  onClick={() => { setSelectedImage(soImg); setSelectedTitle("Struktur Organisasi Tim Logistik - PT PLN (Persero) UP3 Padang"); }}
                  className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 shadow-sm cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
                  <span>Perbesar Bagan</span>
                </button>
              </div>

              {/* Area Gambar Bagan (Diberi Frame Abu-abu lembut agar rapi) */}
              <div 
                onClick={() => { setSelectedImage(soImg); setSelectedTitle("Struktur Organisasi Tim Logistik - PT PLN (Persero) UP3 Padang"); }}
                className="rounded-2xl overflow-hidden bg-slate-50 p-4 md:p-6 border border-gray-100 flex items-center justify-center cursor-pointer relative group/img shadow-inner"
              >
                <img 
                  src={soImg} 
                  alt="Struktur Organisasi Tim Logistik" 
                  className="w-full h-auto object-contain rounded-xl max-h-[650px] transition-transform duration-500 group-hover/img:scale-[1.01]"
                />
                
                {/* Overlay teks kecil saat kursor diarahkan ke gambar */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-2xl pointer-events-none">
                  <span className="bg-slate-900/80 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-sm shadow-md">
                    Klik untuk melihat layar penuh (Zoom)
                  </span>
                </div>
              </div>

              {/* Footer di dalam Card */}
              <div className="mt-6 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  <span>Pusat Kendali Pengelolaan Material & Pergudangan Terpadu</span>
                </div>
                <div className="font-extrabold text-gray-900 tracking-wider">
                  PT PLN (Persero) UP3 PADANG
                </div>
              </div>

            </div>

          </div>
        </section>
        
{/* ================= SECTION: ACHIEVEMENT & SPOTLIGHT DIREKSI PLN (MODERN CONTRAST DENGAN MODAL ZOOM) ================= */}
        <section id="achievement" className="py-24 px-4 bg-gray-100/90 relative overflow-hidden text-slate-900 border-t border-gray-200 scroll-mt-20">
          
          <div className="max-w-7xl mx-auto w-full relative z-10">
            
            {/* Header Section */}
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-gray-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mb-12 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider mb-3">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  Milestone & Penghargaan Resmi
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">
                  Pencapaian & Prestasi Tim Logistik
                </h2>
                <p className="text-gray-600 text-sm sm:text-base mt-2 max-w-2xl">
                  Dokumentasi eksklusif audiensi pimpinan bersama Direksi PLN serta sertifikasi mutu operasional logistik UP3 Padang. Klik pada gambar untuk memperbesar.
                </p>
              </div>
              <div className="flex-shrink-0 bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-sm text-center">
                <span className="block text-2xl font-black">4+</span>
                <span className="text-xs font-medium uppercase tracking-wider text-blue-100">Sertifikasi Resmi</span>
              </div>
            </div>

        {/* ================= SPOTLIGHT CARD: FOTO BERSAMA DIRUT PLN (BISA DIKLIK) ================= */}
<div className="mb-10 bg-white rounded-3xl p-6 md:p-10 border border-gray-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center group">
  
  {/* Sisi Kiri: Foto Bersama Dirut */}
  <div 
    onClick={() => { setSelectedImage(dirutImg); setSelectedTitle("Penyerahan Penghargaan Logistic Awards bersama Direktur Utama PT PLN (Persero)"); }}
    className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm h-[300px] md:h-[400px] bg-gray-50 cursor-pointer group/img"
  >
    <img 
      src={dirutImg} /* Menggunakan variabel import dirutImg */
      alt="Penyerahan Penghargaan Logistic Awards bersama Direktur Utama PLN" 
      className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700 ease-out"
    />
    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
      <span className="bg-black/60 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-sm flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"/></svg>
        Klik untuk Perbesar
      </span>
    </div>
    <div className="absolute top-4 left-4 bg-amber-500 text-slate-950 text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1.5">
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      <span>MOMENT EKSKLUSIF</span>
    </div>
  </div>

  {/* Sisi Kanan: Deskripsi Momen */}
  <div className="lg:col-span-5 flex flex-col justify-center">
    <span className="text-blue-600 text-xs font-bold uppercase tracking-widest mb-2">Awarding HKN PLN</span>
    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 leading-tight">
      Penyerahan Juara 2 Logistic Awards oleh Direktur Utama PT PLN (Persero)
    </h3>
    <p className="text-gray-600 text-sm leading-relaxed mb-6">
      Momen istimewa penyerahan penghargaan <strong>Juara 2 Gudang Distribusi Terbaik Regional Sumatera & Kalimantan</strong> dalam ajang Logistic Awards PT PLN (Persero) yang diserahkan langsung oleh Direktur Utama Bapak Darmawan Prasodjo.
    </p>
    <div className="flex items-center gap-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
      <div>
        <span className="block font-bold text-gray-900 text-sm">Jakarta, 27 Okt 2025</span>
        <span>Awarding Nasional</span>
      </div>
      <div className="h-8 w-px bg-gray-200"></div>
      <div>
        <span className="block font-bold text-emerald-600 text-sm">UP3 Padang</span>
        <span>Prestasi Regional</span>
      </div>
    </div>
  </div>

</div>
            {/* ================= GRID 4 SERTIFIKAT (BISA DIKLIK MASING-MASING) ================= */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
             
              {/* Sertifikat 1 */}
              <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
                <div>
                  <div 
                    onClick={() => { setSelectedImage(sertif1); setSelectedTitle("Juara 2 Gudang Distribusi Terbaik Regional Sumatera & Kalimantan"); }}
                    className="relative w-full h-48 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 mb-5 cursor-pointer group/img"
                  >
                    <img src={sertif1} alt="Sertifikat 1" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">Perbesar</span>
                    </div>
                    <span className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow-sm">OFFICIAL</span>
                  </div>
                  
                  {/* Judul disesuaikan dengan isi sertifikat */}
                  <h4 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">Juara 2 Gudang Distribusi Terbaik</h4>
                  
                  {/* Penjelasan disesuaikan dengan regional dan kategori Logistic Awards */}
                  <p className="text-gray-600 text-xs leading-relaxed">Regional Sumatera & Kalimantan dalam ajang Logistic Awards PT PLN (Persero).</p>
                </div>
                
                <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">UP3 Padang</span>
                  <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">27 Okt 2025</span>
                </div>
              </div>


              {/* Sertifikat 2 */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
            <div>
              <div 
                onClick={() => { setSelectedImage(sertif2); setSelectedTitle("Warehouse and Inventory Excellent"); }}
                className="relative w-full h-48 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 mb-5 cursor-pointer group/img"
              >
                <img src={sertif2} alt="Sertifikat 2" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">Perbesar</span>
                </div>
                <span className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow-sm">OFFICIAL</span>
              </div>
              
              {/* Judul disesuaikan dengan kategori penghargaan di sertifikat */}
              <h4 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">Warehouse & Inventory Excellent</h4>
              
              {/* Penjelasan disesuaikan dengan Juara 2 (2nd) tingkat unit induk */}
              <p className="text-gray-600 text-xs leading-relaxed">Penghargaan Juara 2 Kategori Warehouse and Inventory Excellent oleh PT PLN (Persero) UID Sumatera Barat.</p>
            </div>
            
            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">UP3 Padang</span>
              <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">06 Agu 2025</span>
            </div>
          </div>
             

            {/* Sertifikat 3 */}
        <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
          <div>
            <div 
              onClick={() => { setSelectedImage(sertif3); setSelectedTitle("Implementation of 5R Warehouse for UP3"); }}
              className="relative w-full h-48 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 mb-5 cursor-pointer group/img"
            >
              <img src={sertif3} alt="Sertifikat 3" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                <span className="bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">Perbesar</span>
              </div>
              <span className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow-sm">OFFICIAL</span>
            </div>
            
            {/* Judul disesuaikan dengan kategori di sertifikat */}
            <h4 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">The Best Implementation of 5R Warehouse</h4>
            
            {/* Penjelasan disesuaikan dengan isi penghargaan */}
            <p className="text-gray-600 text-xs leading-relaxed">Penghargaan kategori The Best Implementation of "5R Warehouse for UP3" dari PT PLN (Persero) UIW Sumatera Barat.</p>
          </div>
          
          <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500 font-medium">UP3 Padang</span>
            <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">23 Jul 2024</span>
          </div>
        </div>
           
            {/* Sertifikat 4 */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group">
        <div>
          <div 
            onClick={() => { setSelectedImage(sertif4); setSelectedTitle("Pengelolaan Gudang 5S UP Terbaik"); }}
            className="relative w-full h-48 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 mb-5 cursor-pointer group/img"
          >
            <img src={sertif4} alt="Sertifikat 4" className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-black/60 text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-sm">Perbesar</span>
            </div>
            <span className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow-sm">OFFICIAL</span>
          </div>
          
          {/* Judul disesuaikan dengan isi sertifikat */}
          <h4 className="text-base font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">Pengelolaan Gudang 5S UP Terbaik</h4>
          
          {/* Penjelasan disesuaikan dengan prestasi penerapan 5S */}
          <p className="text-gray-600 text-xs leading-relaxed">Penghargaan atas prestasi sebagai Pengelolaan Gudang 5S UP Terbaik dari PT PLN (Persero) UIW Sumatera Barat.</p>
        </div>
        
        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">UP3 Padang</span>
          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">18 Agu 2022</span>
        </div>
      </div>
            </div>

          </div>
        </section>

        {/* ================= MODAL / POPUP FULLSCREEN GAMBAR ================= */}
        {selectedImage && (
          <div 
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fadeIn"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col relative border border-gray-200"
            >
              {/* Header Modal */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">{selectedTitle}</h3>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-2 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Konten Gambar Full */}
              <div className="p-4 sm:p-6 bg-gray-50 flex items-center justify-center overflow-auto">
                <img 
                  src={selectedImage} 
                  alt={selectedTitle} 
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md border border-gray-200"
                />
              </div>

              {/* Footer Modal */}
              <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-end">
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
        

        {/* ================= SECTION 4: PORTAL APLIKASI ================= */}
        <section id="aplikasi" className="min-h-[60vh] sm:min-h-screen flex items-center py-16 sm:py-24 scroll-mt-20 bg-gray-50 relative px-4 overflow-hidden">
          <div className="w-full max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Portal Aplikasi Logistik</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Sistem pendukung terintegrasi untuk memaksimalkan efisiensi manajemen material Tim Logistik.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
              <a href="https://www.appsheet.com/start/d2b9dea6-701d-46a7-af68-9258fc7cd925?platform=desktop#appName=CALIAKSTOK-729383876&vss=H4sIAAAAAAAAA62PzQrCMBCEX0XmnCfIVTxIqRfFi_GwNlsIpqkkqVpC3t3UHwSPxePO8H3MJlwN37aRmjPkIX2vikdIJIXdeGEFqbDsXfS9VRAKG-peYU2RvSG7qNgO5BUy8lF8NJEDZJplkX_ZImA0u2haw35SToKieuOlnuAS_KDIAt0Q6WT5-UVBcy5Z2zdDYL0vw-YPCmu3ul_I6brXxdySDZwfEdJsYogBAAA=&view=Material%20Keluar" target="_blank" rel="noopener noreferrer" className="group">
                <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors">
                     <img src={sirangkiang} alt="Sirangkiang" className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">SIRANGKIANG</h3>
                    <p className="text-gray-600 text-sm">Aplikasi manajemen pergudangan dan tata kelola aset material.</p>
                  </div>
                </div>
              </a>

              <a href="https://mims.pln.co.id/mims/login" target="_blank" rel="noopener noreferrer" className="group">
                <div className="bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 flex items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center p-2 group-hover:border-indigo-300 transition-colors">
                    <img src={logoMIMS} alt="Logo MIMS" className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">MIMS</h3>
                    <p className="text-gray-600 text-sm">Material Information Management System untuk pelacakan distribusi.</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* ================= SECTION 5: ARTIKEL (Dinamis) ================= */}
        <section id="artikel" className="min-h-[85vh] flex items-center py-20 px-4 scroll-mt-20 bg-white relative overflow-hidden">
          <div className="w-full max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Kabar & Artikel PLN</h2>
              <p className="text-gray-600">Informasi, edukasi, dan berita terbaru seputar pelayanan kelistrikan.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {loading ? (
                [1, 2, 3].map((n) => (
                  <div key={n} className="bg-gray-200 animate-pulse h-80 rounded-2xl"></div>
                ))
              ) : (
                articles.map((art, index) => (
                  <a 
                    key={index} 
                    href={art.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col group"
                  >
                    <div className="h-52 bg-gray-200 overflow-hidden relative">
                      {art.image && art.image !== 'None' ? (
                        <img src={art.image} alt={art.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                      )}
                    </div>
                    <div className="p-6">
                      <p className="text-xs text-blue-600 font-bold mb-2 uppercase">{art.author || 'PLN News'}</p>
                      <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-700">{art.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-3">{art.description}</p>
                    </div>
                  </a>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
     {/* FOOTER */}
<footer className="bg-gray-900 text-white pt-12 pb-6 border-t border-gray-800 mt-auto">
  <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 items-center">
    <div>
      <h3 className="text-xl font-bold text-white mb-2">Logisys UP3 Padang</h3>
      <p className="text-gray-400 text-sm">Sistem Informasi Logistik Material Terpadu<br/>PT PLN (Persero)</p>
    </div>
    <div className="md:text-right flex flex-col md:items-end gap-1.5">
      <p className="text-gray-400 text-sm">Developed by <span className="font-bold text-white">Syadza Oktifani</span></p>
      <p className="text-gray-500 text-xs uppercase tracking-wider">
        Mahasiswa Informatika (23343019) • Universitas Negeri Padang
      </p>
      {/* Kontak Profesional (Email & GitHub) */}
      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
        <a 
          href="mailto:oktifanisyadza@gmail.com" 
          className="hover:text-white transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          oktifanisyadza@gmail.com
        </a>
        <span>•</span>
        <a 
          href="https://github.com/syadzaoktifani" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="hover:text-white transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>
          GitHub Profile
        </a>
      </div>
    </div>
  </div>
  <div className="text-center text-gray-500 text-xs border-t border-gray-800 pt-6">
    © {new Date().getFullYear()} Logisys - PT PLN (Persero). Hak Cipta Dilindungi Undang-Undang.
  </div>
</footer>


{/* ================= FLOATING CHATBOT WIDGET ================= */}
      <div className="fixed bottom-6 right-6 z-50 font-sans">
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 relative group"
            title="Asisten Logisys AI"
          >
            <span className="absolute top-1 right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </button>
        )}

        {isChatOpen && (
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-[350px] sm:w-[380px] h-[500px] flex flex-col overflow-hidden animate-fadeIn">
            <div className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">AI</div>
                <div>
                  <h4 className="font-bold text-sm">Asisten Logisys PLN</h4>
                  <p className="text-[10px] text-blue-100 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span> Online (Gemini AI)
                  </p>
                </div>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50 text-xs">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl leading-relaxed shadow-sm ${
                    msg.sender === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-500 p-3 rounded-2xl border border-gray-200 text-xs flex items-center gap-2 shadow-sm">
                    <span className="animate-pulse">●</span><span className="animate-pulse delay-150">●</span><span className="animate-pulse delay-300">●</span>
                    <span>Sedang mengetik...</span>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendChat} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tanyakan sesuatu..."
                className="flex-1 bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-800 focus:outline-none focus:border-blue-500"
              />
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center">
                <svg className="w-4 h-4 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>


    </div>
  );
}
