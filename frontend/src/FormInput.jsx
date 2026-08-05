import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { materialData } from './materialData';
import logoPLN from "./listrik.png";
import logoDanantara from "./danantara.png";

const getCurrentDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
};

const initialFormState = {
  jenisTransaksi: 'TUG 9',            
  waktu: getCurrentDate(),           
  kodeMaterial: '',                  
  namaMaterial: '',                  
  stn: 'PCS',                               
  jumlah: '',                        
  unit: 'UP3 PADANG',                       
  vendor: '',                        
  noSpk: '',                         
  reservasi: '',                     
  keterangan: '',                    
  diambilOleh: '',                   
  pekerjaan: '',       
  lokasi: 'Padang'                          
};

// ============================================================================
// REUSABLE UI COMPONENTS (Sistem Design Enterprise)
// ============================================================================

const Label = ({ children, required }) => (
  <label className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
    {children} {required && <span className="text-red-500 font-bold">*</span>}
  </label>
);

const InputField = ({ label, required, icon, className = "", ...props }) => (
  <div className={`flex flex-col ${className}`}>
    <Label required={required}>{label}</Label>
    <div className="relative flex items-center">
      {icon && (
        <div className="absolute left-3 text-slate-400 pointer-events-none">
          {icon}
        </div>
      )}
      <input 
        className={`w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md px-3 py-2.5 shadow-sm transition-all duration-200 ease-in-out placeholder:text-slate-400 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 ${icon ? 'pl-9' : ''}`}
        {...props}
      />
    </div>
  </div>
);

const SelectField = ({ label, required, options, className = "", ...props }) => (
  <div className={`flex flex-col ${className}`}>
    <Label required={required}>{label}</Label>
    <select 
      className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md px-3 py-2.5 shadow-sm transition-all duration-200 ease-in-out hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer appearance-none"
      {...props}
    >
      {options.map((opt, idx) => (
        <option key={idx} value={opt.value} disabled={opt.disabled}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FormInput() {
  const [activeTab, setActiveTab] = useState('manual');
  const [manualForm, setManualForm] = useState(initialFormState);
  const [selectedFile, setSelectedFile] = useState(null);
  const [status, setStatus] = useState({ type: '', msg: '' });
  // PASTIKAN BARIS INI ADA DI DALAM KOMPONEN
  const [top10Data, setTop10Data] = useState([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  const handleManualChange = (e) => {
    const { name, value } = e.target;
    let newForm = { ...manualForm, [name]: value };

    // Autofill Logic Master Data
    if (name === 'kodeMaterial') {
      const found = materialData.find(item => item.kodeMaterial === value);
      if (found) newForm.namaMaterial = found.namaMaterial;
    } 
    else if (name === 'namaMaterial') {
      const found = materialData.find(item => item.namaMaterial === value);
      if (found) newForm.kodeMaterial = found.kodeMaterial;
    }

    setManualForm(newForm);
  };

  const handleManualSubmit = async (e) => {
  e.preventDefault();
  setStatus({ type: 'loading', msg: 'Mengirim data ke Spreadsheet...' });

  try {
    // Pastikan payload sesuai dengan urutan kolom di Excel
    const payload = {
      ...manualForm,
      targetSheet: 'MaterialKeluarUnit' // PENTING: Identitas agar masuk ke sheet yang benar
    };

    const res = await fetch('https://logysys-pln.vercel.app/api/input-manual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const result = await res.json();
    
    if (result.status === 'success') {
      setStatus({ type: 'success', msg: 'Data berhasil tercatat di sistem Material Keluar.' });
      setManualForm(initialFormState); // Reset form
    } else {
      setStatus({ type: 'error', msg: 'Gagal menyimpan: ' + result.message });
    }
  } catch (err) {
    setStatus({ type: 'error', msg: 'Server tidak merespons. Pastikan server.js aktif.' });
  }
};
  const handlePdfSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return alert("Pilih berkas PDF terlebih dahulu!");
    
    setStatus({ type: 'loading', msg: 'Sistem sedang memindai dokumen PDF...' });
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch('http://localhost:5000/api/upload-pdf', { method: 'POST', body: formData });
      const result = await res.json();
      if (result.status === 'success') {
        setStatus({ type: 'success', msg: `Ekstraksi sukses. Material "${result.data_terbaca.namaMaterial}" telah direkam.` });
        setSelectedFile(null);
        e.target.reset();
      } else {
        setStatus({ type: 'error', msg: 'Format dokumen PDF tidak sesuai standar template.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Terjadi kesalahan pemrosesan pada server.' });
    }
  };

  const isLoading = status.type === 'loading';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* ================= NAVBAR ENTERPRISE ================= */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-8 py-3">
          
          {/* Kiri: Tombol Back & Branding */}
          <div className="flex items-center gap-4">
            <Link to="/" title="Kembali ke Beranda" className="p-2 rounded-md bg-slate-50 border border-slate-200 text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </Link>
            
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            
            <div className="flex items-center gap-3">
              <img src={logoPLN} alt="Logo PLN" className="h-8 object-contain" />
              <img src={logoDanantara} alt="Logo Danantara" className="h-6 object-contain hidden sm:block" />
              <div className="hidden lg:block ml-2">
                <h1 className="text-sm font-extrabold text-slate-800 tracking-wide">LOGISYS</h1>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Sistem Logistik</p>
              </div>
            </div>
          </div>
          
          {/* Kanan: Info User / Avatar */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-xs font-bold text-slate-700">Admin Gudang</span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5 border border-emerald-100">Aktif</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-offset-1 ring-slate-100 cursor-pointer hover:bg-blue-700 transition-colors text-sm">
              AG
            </div>
          </div>

        </div>
      </nav>

      {/* ================= WORKSPACE AREA ================= */}
      <main className="flex-grow px-4 sm:px-6 py-8 md:py-10">
        <div className="max-w-[1000px] mx-auto"> 
          
          {/* HEADER & SEGMENTED CONTROL */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Pencatatan Transaksi</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-lg leading-relaxed">
                Masukkan detail mutasi material secara manual atau unggah dokumen TUG9/Bon Pinjam untuk ekstraksi otomatis.
              </p>
            </div>

            {/* Segmented Control (iOS / Fiori Style) */}
            <div className="flex bg-slate-200/70 p-1 rounded-lg w-full md:w-auto border border-slate-200/50 shadow-inner">
              <button
                type="button"
                onClick={() => !isLoading && setActiveTab('manual')}
                disabled={isLoading}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md font-semibold text-sm transition-all duration-200 ease-out ${
                  activeTab === 'manual' 
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-900/5' 
                  : 'text-slate-500 hover:text-slate-700'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                Entry Manual
              </button>
              <button
                type="button"
                onClick={() => !isLoading && setActiveTab('pdf')}
                disabled={isLoading}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md font-semibold text-sm transition-all duration-200 ease-out ${
                  activeTab === 'pdf' 
                  ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-900/5' 
                  : 'text-slate-500 hover:text-slate-700'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Ekstraksi PDF
              </button>

              <button
  type="button"
  onClick={() => !isLoading && setActiveTab('dashboard')}
  disabled={isLoading}
  className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md font-semibold text-sm transition-all duration-200 ease-out ${
    activeTab === 'dashboard' 
    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-900/5' 
    : 'text-slate-500 hover:text-slate-700'
  }`}
>
  
 
</button>
            </div>
          </div>

          {/* SYSTEM ALERT (Enterprise Styling) */}
          {status.msg && (
            <div className={`flex items-start gap-3 p-4 rounded-r-lg border-l-4 shadow-sm mb-8 transition-all duration-300 animate-fadeIn ${
              status.type === 'loading' ? 'bg-blue-50 border-blue-500 text-blue-800' : 
              status.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 
              'bg-rose-50 border-rose-500 text-rose-800'
            }`}>
              <div className="flex-shrink-0 mt-0.5">
                {status.type === 'loading' && <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {status.type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                {status.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
              </div>
              <div className="text-sm font-medium leading-relaxed">
                {status.msg}
              </div>
            </div>
          )}

          {/* ================= OPSI A: FORM MANUAL ================= */}
          {activeTab === 'manual' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <form onSubmit={handleManualSubmit}>
                
                {/* SECTION 1: Identifikasi Transaksi */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-800">Detail Material & Transaksi</h3>
                </div>
                
                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
                  <SelectField 
                    label="Jenis Transaksi" required className="md:col-span-4"
                    name="jenisTransaksi" value={manualForm.jenisTransaksi} onChange={handleManualChange} disabled={isLoading}
                    options={[
                      { value: "TUG 9", label: "TUG 9" },
                      { value: "BON PINJAM", label: "BON PINJAM" },
                      { value: "SLIP TF POSTING", label: "SLIP TF POSTING" },
                      { value: "TUG 9 MANUAL", label: "TUG 9 MANUAL" },
                      { value: "TUG 8", label: "TUG 8" },
                      { value: "TUG 10", label: "TUG 10" },
                      { value: "KIRIM ANTAR UP3", label: "KIRIM ANTAR UP3" },
                      { value: "PROSES MIMS", label: "PROSES MIMS" },
                    ]}
                  />
                  <InputField 
                    label="Tanggal Transaksi" required className="md:col-span-4"
                    name="waktu" value={manualForm.waktu} onChange={handleManualChange} disabled={isLoading}
                    placeholder="DD/MM/YYYY"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>}
                  />
                  <InputField 
                    label="Jumlah" type="number" required className="md:col-span-4" min="1"
                    name="jumlah" value={manualForm.jumlah} onChange={handleManualChange} disabled={isLoading} placeholder="0" 
                  />

                  <div className="md:col-span-3">
                    <Label>Kode Material</Label>
                    <input list="kode-list" name="kodeMaterial" value={manualForm.kodeMaterial} onChange={handleManualChange} disabled={isLoading} placeholder="Pilih kode..." className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md px-3 py-2.5 shadow-sm transition-all duration-200 ease-in-out hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    <datalist id="kode-list">{materialData.map((m, idx) => <option key={idx} value={m.kodeMaterial} />)}</datalist>
                  </div>
                  
                  <div className="md:col-span-6">
                    <Label required>Nama Material</Label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-slate-400 pointer-events-none"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>
                      <input list="nama-list" name="namaMaterial" value={manualForm.namaMaterial} onChange={handleManualChange} required disabled={isLoading} placeholder="Ketik nama material..." className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md pl-9 pr-3 py-2.5 shadow-sm transition-all duration-200 ease-in-out hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <datalist id="nama-list">{materialData.map((m, idx) => <option key={idx} value={m.namaMaterial} />)}</datalist>
                  </div>

                  <SelectField 
                    label="Satuan" required className="md:col-span-3"
                    name="stn" value={manualForm.stn} onChange={handleManualChange} disabled={isLoading}
                    options={[
                      { value: "", label: "-- Pilih --", disabled: true },
                      { value: "UNIT", label: "UNIT" }, { value: "PCS", label: "PCS" },
                      { value: "SET", label: "SET" }, { value: "BH", label: "BH" },
                      { value: "BTG", label: "BTG" }, { value: "M", label: "M" },
                      { value: "DUS", label: "DUS" }, { value: "L", label: "L" }
                    ]}
                  />
                </div>

                <div className="w-full h-px bg-slate-200"></div>

                {/* SECTION 2: Administrasi Pelaksanaan */}
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-slate-800">Administrasi Pelaksanaan</h3>
                </div>

                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  <div className="md:col-span-6">
                    <Label>Unit / ULP</Label>
                    <input list="unit-list" name="unit" value={manualForm.unit} onChange={handleManualChange} disabled={isLoading} placeholder="Pilih unit kerja..." className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md px-3 py-2.5 shadow-sm transition-all duration-200 ease-in-out hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    <datalist id="unit-list">
                      <option value="UP3 PADANG" /><option value="ULP KURANJI" /><option value="ULP BELANTI" />
                      <option value="ULP TABING" /><option value="ULP INDARUNG" /><option value="ULP SICINCIN" /><option value="ULP LUBUK ALUNG" />
                    </datalist>
                  </div>

                  <div className="md:col-span-6">
                    <Label>Vendor Pelaksana</Label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 text-slate-400 pointer-events-none"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>
                      <input list="vendor-list" name="vendor" value={manualForm.vendor} onChange={handleManualChange} disabled={isLoading} placeholder="Pilih vendor..." className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md pl-9 pr-3 py-2.5 shadow-sm transition-all duration-200 ease-in-out hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <datalist id="vendor-list">
                     <option value="">Pilih Vendor/Pelaksana</option>
                      <option value="PT.FACHRI">PT.FACHRI</option>
                      <option value="PT.BAMBU SERUMPUN">PT.BAMBU SERUMPUN</option>
                      <option value="PT.YESTANINDO">PT.YESTANINDO</option>
                      <option value="PT.NAFAZ">PT.NAFAZ</option>
                      <option value="PT.PADUAN BAKTI">PT.PADUAN BAKTI</option>
                      <option value="PT.PERMATA MITRA BERLIANO">PT.PERMATA MITRA BERLIANO</option>
                      <option value="PT.PUTRA CHANIAGO">PT.PUTRA CHANIAGO</option>
                      <option value="PT.RIZAL PUTRA">PT.RIZAL PUTRA</option>
                      <option value="PT.HIDAYAT SUMBER ENERGI">PT.HIDAYAT SUMBER ENERGI</option>
                      <option value="PT.ASRAFFI">PT.ASRAFFI</option>
                      <option value="RAYMOND">RAYMOND</option>
                      <option value="RIFAN">RIFAN</option>
                      <option value="RHYNAL">RHYNAL</option>
                      <option value="PT.DIAN TIGA MAHKOTA">PT.DIAN TIGA MAHKOTA</option>
                      <option value="NICO VAJRIN">NICO VAJRIN</option>
                      <option value="RHANGGA">RHANGGA</option>
                      <option value="PT.TEKNIK PUTRA ANZALES">PT.TEKNIK PUTRA ANZALES</option>
                      <option value="PT.SATRINDO">PT.SATRINDO</option>
                      <option value="PT.CITRA MANDALA SURYA">PT.CITRA MANDALA SURYA</option>
                      <option value="SANDY">SANDY</option>
                      <option value="ZULFADRI">ZULFADRI</option>
                      <option value="MAIDODI">MAIDODI</option>
                      <option value="ALFI HENDRI">ALFI HENDRI</option>
                      <option value="DANI DRIVER">DANI DRIVER</option>
                      <option value="PT.JEFRI MITRA SURYA">PT.JEFRI MITRA SURYA</option>
                      <option value="HARKON HP/HARIS">HARKON HP/HARIS</option>
                      <option value="PT.TONYOKI">PT.TONYOKI</option>
                      <option value="ACIAK OTO">ACIAK OTO</option>
                      <option value="RASHAKI ITO">RASHAKI ITO</option>
                      <option value="PDKB">PDKB</option>
                      <option value="PT.RENIZA JAYA TEKNIK">PT.RENIZA JAYA TEKNIK</option>
                      <option value="PT.ELECTRICITY SERVICE">PT.ELECTRICITY SERVICE</option>
                      <option value="PT. PLN NUSA DAYA">PT. PLN NUSA DAYA</option>
                      <option value="MAHADITYA">MAHADITYA</option>
                      <option value="HARKONS HP/ANDEL">HARKONS HP/ANDEL</option>
                      <option value="PT. PMB">PT. PMB</option>
                      <option value="UP3 PAYAKUMBUH">UP3 PAYAKUMBUH</option>
                      <option value="ULP TABING">ULP TABING</option>
                      <option value="PT.SUSPENSEN">PT.SUSPENSEN</option>
                      <option value="PT.PANEL GLOBAL ENERGI">PT.PANEL GLOBAL ENERGI</option>
                      <option value="UP3 SOLOK">UP3 SOLOK</option>
                      <option value="UDIKLAT PADANG">UDIKLAT PADANG</option>
                      <option value="UP3 BUKITINGGI">UP3 BUKITINGGI</option>
                      <option value="ULP PAINAN">ULP PAINAN</option>
                      <option value="ULP BELANTI">ULP BELANTI</option>
                      <option value="ULP LUBUK ALUNG">ULP LUBUK ALUNG</option>
                      <option value="ULP INDARUNG">ULP INDARUNG</option>
                      <option value="ULP PARIAMAN">ULP PARIAMAN</option>
                      <option value="ULP SICINCIN">ULP SICINCIN</option>
                      <option value="ULP KURANJI">ULP KURANJI</option>
                      <option value="ULP BALAI SELASA">ULP BALAI SELASA</option>
                      <option value="ULP MENTAWAI">ULP MENTAWAI</option>
                    </datalist>
                  </div>

                  <InputField label="No. Surat Perintah Kerja (SPK)" name="noSpk" value={manualForm.noSpk} onChange={handleManualChange} disabled={isLoading} placeholder="Contoh: SPK/001/..." className="md:col-span-6" />
                  <InputField label="No. Reservasi Material" name="reservasi" value={manualForm.reservasi} onChange={handleManualChange} disabled={isLoading} placeholder="Contoh: RES-9988..." className="md:col-span-6" />
                  
                  <InputField 
                    label="Diambil Oleh (Petugas)" name="diambilOleh" value={manualForm.diambilOleh} onChange={handleManualChange} disabled={isLoading} placeholder="Nama lengkap petugas" className="md:col-span-6" 
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>}
                  />
                  
                  <div className="md:col-span-6">
                    <Label>Kategori Pekerjaan</Label>
                    <input list="pekerjaan-list" name="pekerjaan" value={manualForm.pekerjaan} onChange={handleManualChange} disabled={isLoading} placeholder="Pilih atau ketik pekerjaan..." className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md px-3 py-2.5 shadow-sm transition-all duration-200 ease-in-out hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    <datalist id="pekerjaan-list">
                      <option value="Pemeliharaan Jaringan" /><option value="Pasang Baru (PB)" /><option value="Tambah Daya (TD)" />
                      <option value="Penanganan Gangguan" /><option value="Perluasan Jaringan" />
                    </datalist>
                  </div>

                  <InputField 
                    label="Lokasi Pemasangan" name="lokasi" value={manualForm.lokasi} onChange={handleManualChange} disabled={isLoading} placeholder="Alamat atau nama gardu..." className="md:col-span-12 lg:col-span-6" 
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>}
                  />
                  <InputField label="Keterangan" name="keterangan" value={manualForm.keterangan} onChange={handleManualChange} disabled={isLoading} placeholder="Catatan tambahan bila ada..." className="md:col-span-12 lg:col-span-6" />

                </div>

                {/* FORM FOOTER ACTION */}
                <div className="bg-slate-50 px-6 py-5 border-t border-slate-200 flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-6 rounded-md transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                        Simpan Transaksi
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ================= OPSI B: PDF READER ================= */}
          {activeTab === 'pdf' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
              <div className="p-8 sm:p-12 flex flex-col items-center justify-center min-h-[500px]">
                
                <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                
                <h2 className="text-xl font-bold text-slate-800 mb-2">Unggah Dokumen Logistik</h2>
                <p className="text-slate-500 text-sm max-w-md text-center mb-8 leading-relaxed">
                  Sistem OCR akan secara otomatis membaca dan mengekstrak 13 data wajib dari file TUG9 atau Bon Pinjam Anda.
                </p>
                
                <form onSubmit={handlePdfSubmit} className="w-full max-w-md flex flex-col items-center">
                  <div className="w-full relative group cursor-pointer bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl p-8 transition-all duration-200 flex flex-col items-center justify-center mb-6">
                    <input 
                      type="file" accept=".pdf" required disabled={isLoading}
                      onChange={(e) => setSelectedFile(e.target.files[0])} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed" 
                    />
                    <svg className={`w-10 h-10 mb-3 transition-colors duration-200 ${selectedFile ? 'text-blue-500' : 'text-slate-400 group-hover:text-blue-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                    <p className="font-semibold text-slate-700 text-sm text-center transition-colors duration-200">
                      {selectedFile ? <span className="text-blue-700">{selectedFile.name}</span> : "Klik atau seret PDF ke area ini"}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Maksimal ukuran file 5 MB</p>
                  </div>

                  <button 
                    type="submit" disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-md transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Mengekstrak Data...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        Proses & Simpan
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

       {/* ================= OPSI C: DASHBOARD TOP 10 REAL-TIME ================= */}
          {activeTab === 'dashboard' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn p-6 md:p-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Top 10 Material Paling Banyak Keluar</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Sinkronisasi data real-time langsung dari Google Spreadsheet</p>
                </div>
                <div className="flex items-center gap-3">
                  {isLoadingDashboard && <span className="text-xs text-blue-600 animate-pulse font-semibold">Memperbarui...</span>}
                  <button 
                    onClick={fetchTop10Data}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                  >
                    Muat Ulang
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase tracking-wider bg-slate-50/50">
                      <th className="py-3 px-4 font-semibold rounded-l-lg">Peringkat</th>
                      <th className="py-3 px-4 font-semibold">Kode Material</th>
                      <th className="py-3 px-4 font-semibold">Nama Material</th>
                      <th className="py-3 px-4 font-semibold text-center">Satuan</th>
                      <th className="py-3 px-4 font-semibold text-right rounded-r-lg">Total Keluar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {top10Data.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-slate-400">
                          {isLoadingDashboard ? "Memuat data dari Spreadsheet..." : "Belum ada data material keluar yang tercatat."}
                        </td>
                      </tr>
                    ) : (
                      top10Data.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-500">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-extrabold ${
                              index === 0 ? 'bg-amber-100 text-amber-800' :
                              index === 1 ? 'bg-slate-200 text-slate-700' :
                              index === 2 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-600">{item.kodeMaterial}</td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">{item.namaMaterial}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-md">{item.stn}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-blue-600">{item.totalJumlah.toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ================= FOOTER ENTERPRISE ================= */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-4">
            <p className="text-slate-500 text-xs font-medium">
              &copy; {new Date().getFullYear()} PT PLN (Persero) UP3 Padang.
            </p>
            <div className="hidden md:block h-3 w-px bg-slate-300"></div>
            <p className="hidden md:block text-slate-400 text-xs">Versi 1.0.2</p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <a href="#" className="hover:text-blue-600 transition-colors">Bantuan Sistem</a>
            <span className="text-slate-300">•</span>
            <p>Developed by <span className="font-bold text-slate-700">Syadza Oktifani</span></p>
          </div>

        </div>
      </footer>

      {/* Global CSS for Animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}} />
    </div>
  );
}
