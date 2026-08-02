import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logoPLN from "./listrik.png";
import logoDanantara from "./danantara.png";
import { materialData } from "./materialData";

export default function FormReturn() {
  const initialFormState = {
    targetSheet: "MaterialReturnGudang",
    tanggal: new Date().toISOString().split('T')[0],
    noMaterial: "",
    namaMaterial: "",
    stn: "BH",
    jumlah: "",
    vendor: "",
    noKontrak: "",
    reservasi: "",
    tug9: "",        
    tug10: "",       
    baPemeriksa: "",  
    tug34: "",        
    pengambil: "",    
    keterangan: ""
  };

  const [formData, setFormData] = useState(initialFormState);
  const [status, setStatus] = useState({ loading: false, message: "", type: "" });

  // Validasi & Sinkronisasi otomatis berdasarkan materialData.js
  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "noMaterial") {
      const found = materialData.find(m => m.kodeMaterial.toLowerCase() === value.toLowerCase());
      setFormData({
        ...formData,
        noMaterial: value,
        namaMaterial: found ? found.namaMaterial : formData.namaMaterial
      });
    } else if (name === "namaMaterial") {
      const found = materialData.find(m => m.namaMaterial.toLowerCase() === value.toLowerCase());
      setFormData({
        ...formData,
        namaMaterial: value,
        noMaterial: found ? found.kodeMaterial : formData.noMaterial
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, message: "Menyimpan data ke server...", type: "info" });

    try {
      // 1. Format tanggal dari YYYY-MM-DD menjadi DD/MM/YYYY (Tanpa jam)
      let tanggalFormatBaru = formData.tanggal;
      if (formData.tanggal) {
        const parts = formData.tanggal.split('-'); 
        if (parts.length === 3) {
          tanggalFormatBaru = `${parts[2]}/${parts[1]}/${parts[0]}`; 
        }
      }

      // 2. Masukkan tanggal yang sudah diformat
      const dataProcessed = { 
        ...formData, 
        tanggal: tanggalFormatBaru 
      };

      // 3. Ubah field kosong menjadi "-"
      Object.keys(dataProcessed).forEach((key) => {
        if (dataProcessed[key] === "" && key !== "targetSheet") {
          dataProcessed[key] = "-";
        }
      });

      const response = await fetch("https://logysys-pln.vercel.app/api/login/api/input-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataProcessed),
      });

      const result = await response.json();

      if (result.status === "success") {
        setStatus({ loading: false, message: "Berhasil! Data return material telah disimpan.", type: "success" });
        setFormData(initialFormState);
      } else {
        setStatus({ loading: false, message: `Gagal: ${result.message}`, type: "error" });
      }
    } catch (error) {
      console.error("Error:", error);
      setStatus({ loading: false, message: "Gagal terhubung ke server Node.js.", type: "error" });
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
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">
            Form Return Material
          </h1>
          <p className="text-gray-600 mb-8">
            Silakan lengkapi seluruh data pengembalian material di bawah ini.
          </p>

          {status.message && (
            <div className={`p-4 mb-6 rounded-lg font-semibold ${
              status.type === 'success' ? 'bg-green-100 text-green-700' : 
              status.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {status.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Kolom Kiri */}
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-medium">Tanggal Return</label>
                <input type="date" name="tanggal" value={formData.tanggal} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" />
              </div>

              {/* No Material dengan Datalist */}
              <div>
                <label className="block mb-2 font-medium">No. Material</label>
                <input 
                  list="return-kode-list"
                  type="text" 
                  name="noMaterial" 
                  value={formData.noMaterial} 
                  onChange={handleChange} 
                  placeholder="Pilih atau ketik No Material" 
                  required 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" 
                />
                <datalist id="return-kode-list">
                  {materialData.map((m, idx) => <option key={idx} value={m.kodeMaterial} />)}
                </datalist>
              </div>

              {/* Nama Material dengan Datalist */}
              <div>
                <label className="block mb-2 font-medium">Nama Material</label>
                <input 
                  list="return-nama-list"
                  type="text" 
                  name="namaMaterial" 
                  value={formData.namaMaterial} 
                  onChange={handleChange} 
                  placeholder="Pilih atau ketik Nama Material" 
                  required 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" 
                />
                <datalist id="return-nama-list">
                  {materialData.map((m, idx) => <option key={idx} value={m.namaMaterial} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Satuan dengan Pilihan Dropdown (Select) */}
                <div>
                  <label className="block mb-2 font-medium">STN (Satuan)</label>
                  <select 
                    name="stn" 
                    value={formData.stn} 
                    onChange={handleChange} 
                    required 
                    className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="UNIT">UNIT</option>
                    <option value="PCS">PCS</option>
                    <option value="SET">SET</option>
                    <option value="BH">BH</option>
                    <option value="BTG">BTG</option>
                    <option value="M">M</option>
                    <option value="DUS">DUS</option>
                    <option value="L">L</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-2 font-medium">Jumlah</label>
                  <input type="number" name="jumlah" value={formData.jumlah} onChange={handleChange} placeholder="0" required className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Vendor dengan Datalist Pilihan */}
              <div>
                <label className="block mb-2 font-medium">Vendor (PT.)</label>
                <input 
                  list="return-vendor-list" 
                  type="text" 
                  name="vendor" 
                  value={formData.vendor} 
                  onChange={handleChange} 
                  placeholder="Pilih atau ketik Vendor" 
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" 
                />
                <datalist id="return-vendor-list">
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

              <div>
                <label className="block mb-2 font-medium">No. Kontrak</label>
                <input type="text" name="noKontrak" value={formData.noKontrak} onChange={handleChange} placeholder="Nomor Kontrak" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Kolom Kanan */}
            <div className="space-y-6">
              <div>
                <label className="block mb-2 font-medium">Reservasi</label>
                <input type="text" name="reservasi" value={formData.reservasi} onChange={handleChange} placeholder="Nomor Reservasi" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block mb-2 font-medium">TUG 9 Lama</label>
                <input type="text" name="tug9" value={formData.tug9} onChange={handleChange} placeholder="Nomor TUG 9 Lama" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block mb-2 font-medium">TUG 10 Sistem</label>
                <input type="text" name="tug10" value={formData.tug10} onChange={handleChange} placeholder="Nomor TUG 10 Sistem" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block mb-2 font-medium">No. BA Pemeriksa</label>
                <input type="text" name="baPemeriksa" value={formData.baPemeriksa} onChange={handleChange} placeholder="Nomor BA Pemeriksa" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block mb-2 font-medium">TUG 3/4 Sistem</label>
                <input type="text" name="tug34" value={formData.tug34} onChange={handleChange} placeholder="Nomor TUG 3/4 Sistem" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block mb-2 font-medium">Pengembali</label>
                <input type="text" name="pengambil" value={formData.pengambil} onChange={handleChange} placeholder="Nama Pengembali" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="md:col-span-2 mt-4">
              <label className="block mb-2 font-medium">Keterangan</label>
              <textarea 
                name="keterangan" 
                value={formData.keterangan} 
                onChange={handleChange} 
                placeholder="Tambahkan keterangan jika ada..." 
                rows="3"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <div className="md:col-span-2 flex justify-end mt-4">
              <button
                type="submit"
                disabled={status.loading}
                className={`text-white px-10 py-4 rounded-xl font-bold transition-all shadow-md ${
                  status.loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-700 hover:bg-blue-800 hover:-translate-y-1 hover:shadow-lg'
                }`}
              >
                {status.loading ? 'Menyimpan ke Sistem...' : 'Simpan Data Return'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </>
  );
}
