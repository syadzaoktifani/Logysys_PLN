

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { google } from 'googleapis';
import bcrypt from 'bcrypt';
import { Mistral } from '@mistralai/mistralai';

const app = express();

// CORS hanya izinkan dari domain frontend (bukan semua origin)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// Inisialisasi Mistral otomatis membaca MISTRAL_API_KEY dari .env
const apiKey = process.env.MISTRAL_API_KEY;
const mistral = new Mistral({ apiKey: apiKey });

// Pindah nilai sensitif ke environment variable
const GAS_URL = process.env.GAS_URL;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

// Helper: buat GoogleAuth menggunakan env var GOOGLE_CREDENTIALS
// Tidak lagi membaca file credentials.json dari disk
const createGoogleAuth = (scopes) => {
    return new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS),
        scopes: scopes,
    });
};

// ==========================================
// ENDPOINT LOGIN DARI SHEET "Users" SPREADSHEET
// ==========================================
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ status: "error", message: "Username dan password wajib diisi." });
        }

        const auth = createGoogleAuth(['https://www.googleapis.com/auth/spreadsheets.readonly']);
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        // Tarik data dari Tab/Sheet "Users" (Kolom A sampai C: username, password, role)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Users!A2:C',
        });

        const rows = response.data.values || [];

        // Cari user yang cocok berdasarkan username
        let matchedUser = null;
        for (let row of rows) {
            const dbUsername = row[0];
            const dbPassword = row[1]; // Bisa berupa teks biasa atau hash bcrypt
            const dbRole = row[2] || 'Admin';

            if (dbUsername === username) {
                // Cek apakah password cocok (mendukung teks biasa atau bcrypt hash)
                let isPasswordValid = false;
                if (dbPassword.startsWith('$2b$') || dbPassword.startsWith('$2a$')) {
                    isPasswordValid = await bcrypt.compare(password, dbPassword);
                } else {
                    isPasswordValid = (dbPassword === password);
                }

                if (isPasswordValid) {
                    matchedUser = { username: dbUsername, role: dbRole };
                    break;
                }
            }
        }

        if (!matchedUser) {
            return res.status(401).json({ status: "error", message: "Username atau password salah!" });
        }

        res.json({
            status: "success",
            message: "Login berhasil",
            user: matchedUser
        });

    } catch (error) {
        console.error("Error Login:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

// ==========================================
// ENDPOINT INPUT MANUAL (KIRIM KE GOOGLE APPS SCRIPT)
// ==========================================
app.post('/api/input-manual', async (req, res) => {
    try {
        const payload = req.body;
        if (!payload.targetSheet) payload.targetSheet = "MaterialMasuk";

        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // Baca sebagai teks dulu untuk melihat apa yang sebenarnya dikirim Google
        const textResponse = await response.text();

        // Cek apakah balasan dimulai dengan '<' (tanda halaman HTML error)
        if (textResponse.trim().startsWith('<')) {
            throw new Error("Google Apps Script mengembalikan halaman HTML (Error/Login), cek URL dan Izin Akses.");
        }

        // Jika aman, baru parse ke JSON
        const result = JSON.parse(textResponse);
        res.json(result);

    } catch (error) {
        console.error("Error Input Manual:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

// ==========================================
// ENDPOINT UPLOAD & EKSTRAKSI PDF
// ==========================================
app.post('/api/upload-pdf', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ status: "error", message: "File PDF tidak terkirim." });

        const parsedPdf = await pdfParse(req.file.buffer);
        const text = parsedPdf.text;

        // Menggunakan regex yang fleksibel untuk dokumen resmi
        const hasilEkstraksi = {
            targetSheet: "MaterialMasuk",
            tanggal: (text.match(/Tanggal\s*:\s*([^\n\r]+)/i) || [])[1]?.trim() || new Date().toLocaleDateString('id-ID'),
            namaMaterial: (text.match(/Material\s*:\s*([^\n\r]+)/i) || [])[1]?.trim() || "N/A",
            jumlah: parseInt((text.match(/Jumlah\s*:\s*(\d+)/i) || [])[1]) || 0,
            vendor: (text.match(/Vendor\s*:\s*([^\n\r]+)/i) || [])[1]?.trim() || "Tanpa Vendor",
        };

        await fetch(GAS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(hasilEkstraksi)
        });

        res.json({ status: "success", data_terbaca: hasilEkstraksi });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// ==========================================
// ENDPOINT TOP 10 MATERIAL (MASUK, KELUAR, RETURN)
// ==========================================
app.get('/api/top-materials', async (req, res) => {
    try {
        const auth = createGoogleAuth(['https://www.googleapis.com/auth/spreadsheets.readonly']);
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        const [resKeluar, resMasuk, resReturn] = await Promise.all([
            sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'MaterialKeluarUnit!A2:N' }),
            sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'MaterialMasukSP2B!A2:N' }),
            sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'MaterialReturnGudang!A2:N' })
        ]);

        // Hitung frekuensi kemunculan baris transaksi per material
        const helperTopFrequency = (rows, idxNama, idxKode, idxStn) => {
            let counts = {};
            rows.forEach(row => {
                const nama = row[idxNama] ? row[idxNama].trim() : '';
                const kode = row[idxKode] ? row[idxKode].trim() : '-';
                const stn = row[idxStn] ? row[idxStn].trim().toUpperCase() : 'PCS';

                if (nama !== '' && nama !== '-') {
                    const key = `${kode}_${nama}_${stn}`;
                    if (!counts[key]) {
                        counts[key] = { kodeMaterial: kode, namaMaterial: nama, stn: stn, frekuensi: 0 };
                    }
                    counts[key].frekuensi += 1;
                }
            });
            return Object.values(counts)
                .sort((a, b) => b.frekuensi - a.frekuensi)
                .slice(0, 10);
        };

        res.json({
            status: "success",
            data: {
                keluar: helperTopFrequency(resKeluar.data.values || [], 3, 2, 4),
                masuk: helperTopFrequency(resMasuk.data.values || [], 2, 1, 3),
                return: helperTopFrequency(resReturn.data.values || [], 2, 1, 3)
            }
        });
    } catch (error) {
        console.error("Error Top Materials:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

// ==========================================
// ENDPOINT CHATBOT MISTRAL AI
// ==========================================
app.post('/api/gemini-chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ status: "error", message: "Pesan tidak boleh kosong." });
        }

        const chatResponse = await mistral.chat.complete({
            model: 'mistral-small-latest',
            messages: [{ role: 'user', content: message }],
        });

        const replyText = chatResponse.choices[0].message.content || "Maaf, saya tidak dapat memproses jawaban saat ini.";
        res.json({ status: "success", reply: replyText });

    } catch (error) {
        console.error("Error Mistral Chat:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

// ==========================================
// ENDPOINT GET BON PINJAM (URUTAN TERBARU KE TERLAMA)
// ==========================================
app.get('/api/bon-pinjam', async (req, res) => {
    try {
        const auth = createGoogleAuth(['https://www.googleapis.com/auth/spreadsheets.readonly']);
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        // Ubah range sampai M agar kolom Pekerjaan (Kolom M) terbaca
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'MaterialKeluarUnit!A2:M',
        });

        const rows = response.data.values || [];

        const formattedData = [];
        rows.forEach((row, index) => {
            const jenis = row[0] ? row[0].trim().toUpperCase() : '';

            // Hanya ambil data yang jenis transaksinya murni "BON PINJAM"
            if (jenis === 'BON PINJAM') {
                const actualRowIndex = index + 2;
                const reservasiVal = row[9] || '-';   // Kolom J (Reservasi)
                const keteranganVal = row[10] || '-'; // Kolom K (Keterangan)
                const pekerjaanVal = row[12] || '-';  // Kolom M (Pekerjaan yang benar, bukan nama orang)

                formattedData.push({
                    rowIndex: actualRowIndex,
                    noBon: row[8] || `#BON-${index + 1}`,
                    tanggal: row[1] || '-',
                    peminjam: row[7] || 'Vendor / Umum', // Kembali mengambil Kolom H (Vendor)
                    material: row[3] || 'Nama Material Tidak Ada',
                    jumlah: row[5] || '0',
                    reservasi: reservasiVal !== '-' ? reservasiVal : '', // Langsung membawa data reservasi dari spreadsheet
                    keterangan: keteranganVal !== '-' ? keteranganVal : '',
                    pekerjaan: pekerjaanVal !== '-' ? pekerjaanVal : '',  // Membawa data pekerjaan yang benar
                    status: 'Dipinjam'
                });
            }
        });

        // Urutkan dari terbaru ke terlama (rowIndex terbesar ke terkecil)
        formattedData.sort((a, b) => b.rowIndex - a.rowIndex);

        res.json({
            status: "success",
            data: formattedData
        });

    } catch (error) {
        console.error("Error Get Bon PINJAM:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

// ==========================================
// ENDPOINT UPDATE BON PINJAM KE TUG 9
// ==========================================
app.post('/api/update-bon-pinjam', async (req, res) => {
    try {
        const { rowIndex, reservasi, keterangan, pekerjaan } = req.body;

        if (!rowIndex || !reservasi || !keterangan || !pekerjaan) {
            return res.status(400).json({ status: "error", message: "Semua data (Reservasi, Keterangan, Pekerjaan) wajib diisi." });
        }

        const auth = createGoogleAuth(['https://www.googleapis.com/auth/spreadsheets']);
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client });

        // 1. Update Kolom A menjadi "TUG 9"
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `MaterialKeluarUnit!A${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['TUG 9']] }
        });

        // 2. Update Reservasi (Kolom J), Keterangan (Kolom K), Diambil Oleh (Kolom L - dibiarkan), dan Pekerjaan (Kolom M)
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `MaterialKeluarUnit!J${rowIndex}:M${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                // Kolom J (Reservasi), Kolom K (Keterangan), Kolom L (Dilewati/Biarkan), Kolom M (Pekerjaan)
                values: [[`'${reservasi}`, String(keterangan), '', String(pekerjaan)]]
            }
        });

        res.json({
            status: "success",
            message: "Data berhasil diperbarui menjadi TUG 9"
        });

    } catch (error) {
        console.error("Error Update Bon Pinjam:", error);
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Wajib agar bisa dibaca oleh Vercel Serverless
export default app;
