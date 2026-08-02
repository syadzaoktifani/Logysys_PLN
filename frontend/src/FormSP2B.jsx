import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logoPLN from "./listrik.png";
import logoDanantara from "./danantara.png";
import { materialData } from './materialData';

// ============================================================================
// REUSABLE UI COMPONENTS
// ============================================================================
const Label = ({ children, required }) => (
  <label className="block text-xs font-semibold text-slate-700 mb-1.5 tracking-wide">
    {children} {required && <span className="text-red-500 font-bold">*</span>}
  </label>
);

const InputField = ({ label, required, className = "", disabled, ...props }) => (
  <div className={`flex flex-col ${className}`}>
    <Label required={required}>{label}</Label>
    <input 
      disabled={disabled}
      className={`w-full border border-slate-300 text-slate-900 text-sm rounded-md px-3 py-2.5 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
        disabled ? "bg-slate-100 cursor-not-allowed text-slate-500" : "bg-white"
      }`}
      {...props}
    />
  </div>
);

const SelectField = ({ label, required, options, className = "", ...props }) => (
  <div className={`flex flex-col ${className}`}>
    <Label required={required}>{label}</Label>
    <select 
      className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md px-3 py-2.5 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
      {...props}
    >
      {options.map((opt, idx) => <option key={idx} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function FormMasukSP2B() {
  const initialFormState = {
    waktu: new Date().toISOString().split('T')[0],
    noMaterial: '',
    namaMaterial: '',
    stn: 'BH',
    jumlah: '',
    noSPB: '',
    vendor: '',
    diperiksa: '',
    dokumen: '',
    tglTug34: '', 
    tug3: 'sudah',
    tug4: 'sudah',
    pemilik: 'NIAGA'
  };

  const [form, setForm] = useState(initialFormState);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Sinkronisasi otomatis antara Kode Material & Nama Material berdasarkan materialData.js
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'noMaterial') {
      const found = materialData.find(m => m.kodeMaterial.toLowerCase() === value.toLowerCase());
      setForm({
        ...form,
        noMaterial: value,
        namaMaterial: found ? found.namaMaterial : form.namaMaterial
      });
    } else if (name === 'namaMaterial') {
      const found = materialData.find(m => m.namaMaterial.toLowerCase() === value.toLowerCase());
      setForm({
        ...form,
        namaMaterial: value,
        noMaterial: found ? found.kodeMaterial : form.noMaterial
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: 'loading', msg: 'Mengirim data...' });

    try {
      // 1. Ubah format tanggal dari YYYY-MM-DD menjadi DD/MM/YYYY (Tanpa jam)
      let formatTanggalBaru = form.waktu;
      if (form.waktu) {
        const parts = form.waktu.split('-'); 
        if (parts.length === 3) {
          formatTanggalBaru = `${parts[2]}/${parts[1]}/${parts[0]}`; 
        }
      }

      // 2. Sinkronisasi data tanggal
      let dataYangDikirim = { 
        ...form, 
        waktu: formatTanggalBaru, 
        tglTug34: formatTanggalBaru 
      };

      // 3. Loop semua data, jika ada yang kosong (""), ganti jadi strip ("-")
      Object.keys(dataYangDikirim).forEach(key => {
        if (dataYangDikirim[key] === "" || dataYangDikirim[key] === null) {
          dataYangDikirim[key] = "-";
        }
      });

      // 4. Tambahkan targetSheet untuk API Node.js
      const payload = { ...dataYangDikirim, targetSheet: 'MaterialMasukSP2B' };

      const res = await fetch('https://logysys-pln.vercel.app/api/login/api/input-manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      if (result.status === 'success') {
        setStatus({ type: 'success', msg: 'Data berhasil tercatat di sistem.' });
        setForm(initialFormState);
      } else {
        setStatus({ type: 'error', msg: 'Gagal: ' + result.message });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Server tidak merespons.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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

      {/* ================= AREA FORM ================= */}
      <div className="min-h-screen bg-slate-50 p-4 md:p-10 font-sans">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Input Material Masuk SP2B</h2>
          
          {status.msg && (
            <div className={`p-4 mb-6 rounded-md text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
              {status.msg}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField label="Tanggal" type="date" name="waktu" value={form.waktu} onChange={handleChange} required />
            
            {/* Input Kode Material dengan Datalist */}
            <div className="flex flex-col">
              <Label required>No / Kode Material</Label>
              <input 
                list="kode-list" 
                name="noMaterial" 
                value={form.noMaterial} 
                onChange={handleChange} 
                required 
                disabled={isLoading} 
                placeholder="Pilih atau ketik kode..." 
                className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md px-3 py-2.5 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
              />
              <datalist id="kode-list">
                {materialData.map((m, idx) => <option key={idx} value={m.kodeMaterial} />)}
              </datalist>
            </div>
            
            {/* Input Nama Material dengan Datalist */}
            <div className="flex flex-col">
              <Label required>Nama Material</Label>
              <input 
                list="nama-list" 
                name="namaMaterial" 
                value={form.namaMaterial} 
                onChange={handleChange} 
                required 
                disabled={isLoading} 
                placeholder="Pilih atau ketik nama..." 
                className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md px-3 py-2.5 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
              />
              <datalist id="nama-list">
                {materialData.map((m, idx) => <option key={idx} value={m.namaMaterial} />)}
              </datalist>
            </div>
            
            <InputField label="Jumlah" type="number" name="jumlah" value={form.jumlah} onChange={handleChange} required />
            <SelectField label="Satuan" name="stn" value={form.stn} onChange={handleChange}
              options={[
                      { value: "UNIT", label: "UNIT" }, { value: "PCS", label: "PCS" },
                      { value: "SET", label: "SET" }, { value: "BH", label: "BH" },
                      { value: "BTG", label: "BTG" }, { value: "M", label: "M" },
                      { value: "DUS", label: "DUS" }, { value: "L", label: "L" }
              ]}
            />
            
            {/* Input No SPB/PO */}
            <InputField label="No SPB/PO" name="noSPB" value={form.noSPB} onChange={handleChange} placeholder="Nomor SPB / PO" />
            
            {/* Input Vendor dengan Datalist Pilihan */}
            <div className="flex flex-col">
              <Label>Vendor / Pelaksana</Label>
              <input 
                list="vendor-list" 
                name="vendor" 
                value={form.vendor} 
                onChange={handleChange} 
                disabled={isLoading} 
                placeholder="Pilih atau ketik vendor..." 
                className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-md px-3 py-2.5 shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
              />
              <datalist id="vendor-list">
                <option value="PT.FACHRI" />
                <option value="PT.BAMBU SERUMPUN" />
                <option value="PT.YESTANINDO" />
                <option value="PT.NAFAZ" />
                <option value="PT.PADUAN BAKTI" />
                <option value="PT.PERMATA MITRA BERLIANO" />
                <option value="PT.PUTRA CHANIAGO" />
                <option value="PT.RIZAL PUTRA" />
                <option value="PT.HIDAYAT SUMBER ENERGI" />
                <option value="PT.ASRAFFI" />
                <option value="RAYMOND" />
                <option value="RIFAN" />
                <option value="RHYNAL" />
                <option value="PT.DIAN TIGA MAHKOTA" />
                <option value="NICO VAJRIN" />
                <option value="RHANGGA" />
                <option value="PT.TEKNIK PUTRA ANZALES" />
                <option value="PT.SATRINDO" />
                <option value="PT.CITRA MANDALA SURYA" />
                <option value="SANDY" />
                <option value="ZULFADRI" />
                <option value="MAIDODI" />
                <option value="ALFI HENDRI" />
                <option value="DANI DRIVER" />
                <option value="PT.JEFRI MITRA SURYA" />
                <option value="HARKON HP/HARIS" />
                <option value="PT.TONYOKI" />
                <option value="ACIAK OTO" />
                <option value="RASHAKI ITO" />
                <option value="PDKB" />
                <option value="PT.RENIZA JAYA TEKNIK" />
                <option value="PT.ELECTRICITY SERVICE" />
                <option value="PT. PLN NUSA DAYA" />
                <option value="MAHADITYA" />
                <option value="HARKONS HP/ANDEL" />
                <option value="PT. PMB" />
                <option value="UP3 PAYAKUMBUH" />
                <option value="ULP TABING" />
                <option value="PT.SUSPENSEN" />
                <option value="PT.PANEL GLOBAL ENERGI" />
                <option value="UP3 SOLOK" />
                <option value="UDIKLAT PADANG" />
                <option value="UP3 BUKITINGGI" />
                <option value="ULP PAINAN" />
                <option value="ULP BELANTI" />
                <option value="ULP LUBUK ALUNG" />
                <option value="ULP INDARUNG" />
                <option value="ULP PARIAMAN" />
                <option value="ULP SICINCIN" />
                <option value="ULP KURANJI" />
                <option value="ULP BALAI SELASA" />
                <option value="ULP MENTAWAI" />
              </datalist>
            </div>

            <InputField label="Diperiksa" name="diperiksa" value={form.diperiksa} onChange={handleChange} />
            <InputField label="Dokumen" name="dokumen" value={form.dokumen} onChange={handleChange} />
            
            <InputField 
              label="Tgl TUG 34 (Otomatis)" 
              type="date" 
              name="tglTug34" 
              value={form.waktu} 
              disabled={true} 
            />
            
            <SelectField label="TUG 3" name="tug3" value={form.tug3} onChange={handleChange}
              options={[{value:"sudah", label:"Sudah"}, {value:"belum", label:"Belum"}]}
            />
            <SelectField label="TUG 4" name="tug4" value={form.tug4} onChange={handleChange}
              options={[{value:"sudah", label:"Sudah"}, {value:"belum", label:"Belum"}]}
            />
            
            <div className="md:col-span-3">
              <InputField label="Pemilik / User" name="pemilik" value={form.pemilik} onChange={handleChange} />
            </div>
            
            <div className="md:col-span-3 pt-4">
              <button type="submit" disabled={isLoading} className="w-full bg-blue-600 text-white font-semibold py-3 rounded-md hover:bg-blue-700 transition-all shadow-sm">
                {isLoading ? 'Menyimpan...' : 'Simpan Transaksi SP2B'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
