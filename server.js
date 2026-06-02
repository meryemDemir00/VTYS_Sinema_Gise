import express from 'express';
import cors from 'cors';
import sql from 'mssql';

const app = express();
app.use(cors()); 
app.use(express.json()); // Gelen JSON verilerini okuyabilmek için gerekli

// MSSQL Bağlantı Ayarları
const config = {
    user: 'sa',
    password: '12345',
    server: 'localhost',
    database: 'SinematorDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// ==========================================
// 1. FİLMLER API (GET, POST, PUT, DELETE)
// ==========================================

// Filmleri Getir (Okuma)
app.get('/api/filmler', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT * FROM Filmler");
        res.json(result.recordset); 
    } catch (err) {
        res.status(500).send("Filmler çekilemedi.");
    }
});

// Yeni Film Ekle (Yazma)
app.post('/api/filmler', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('FilmAd', sql.NVarChar, req.body.FilmAd)
            .input('Tur', sql.NVarChar, req.body.Tur)
            .input('Sure', sql.Int, req.body.Sure)
            .query("INSERT INTO Filmler (FilmAd, Tur, Sure) VALUES (@FilmAd, @Tur, @Sure)");
        
        res.status(201).send("Film eklendi.");
    } catch (err) {
        console.error(err);
        res.status(500).send("Film eklenirken hata oluştu.");
    }
});

// Film Güncelle (Düzenleme)
app.put('/api/filmler/:id', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('FilmID', sql.Int, req.params.id)
            .input('FilmAd', sql.NVarChar, req.body.FilmAd)
            .input('Tur', sql.NVarChar, req.body.Tur)
            .input('Sure', sql.Int, req.body.Sure)
            .query("UPDATE Filmler SET FilmAd = @FilmAd, Tur = @Tur, Sure = @Sure WHERE FilmID = @FilmID");
        
        res.send("Film güncellendi.");
    } catch (err) {
        res.status(500).send("Film güncellenirken hata oluştu.");
    }
});

// Film Sil (Silme)
app.delete('/api/filmler/:id', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        await pool.request()
            .input('FilmID', sql.Int, req.params.id)
            .query("DELETE FROM Filmler WHERE FilmID = @FilmID");
        
        res.send("Film silindi.");
    } catch (err) {
        res.status(500).send("Film silinirken hata oluştu (Muhtemelen bu filme ait seans veya bilet var).");
    }
});


// ==========================================
// 2. DİĞER TABLOLAR İÇİN OKUMA (GET) API'LERİ
// ==========================================

// Salonları Getir
app.get('/api/salonlar', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT * FROM Salonlar");
        res.json(result.recordset); 
    } catch (err) {
        res.status(500).send("Salonlar çekilemedi.");
    }
});

// Müşterileri Getir
app.get('/api/musteriler', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT * FROM Musteriler");
        res.json(result.recordset); 
    } catch (err) {
        res.status(500).send("Müşteriler çekilemedi.");
    }
});

// Seansları Getir
app.get('/api/seanslar', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT * FROM Seanslar");
        res.json(result.recordset); 
    } catch (err) {
        res.status(500).send("Seanslar çekilemedi.");
    }
});

// Biletleri (Siparişleri) Getir
app.get('/api/biletler', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        let result = await pool.request().query("SELECT * FROM Biletler");
        res.json(result.recordset); 
    } catch (err) {
        res.status(500).send("Biletler çekilemedi.");
    }
});
// ==========================================
// 3. YENİ BİLET OLUŞTURMA (POST) API'Sİ
// ==========================================
app.post('/api/biletler', async (req, res) => {
    try {
        let pool = await sql.connect(config);
        
        // Ön yüzden gelen verileri Biletler tablosuna yazıyoruz
        await pool.request()
            .input('SeansID', sql.Int, req.body.SeansID)
            .input('MusteriID', sql.Int, req.body.MusteriID)
            .input('KoltukNo', sql.NVarChar, req.body.KoltukNo)
            .input('SatisTarihi', sql.DateTime, new Date()) // O anki tarihi otomatik atar
            .query("INSERT INTO Biletler (SeansID, MusteriID, KoltukNo, SatisTarihi) VALUES (@SeansID, @MusteriID, @KoltukNo, @SatisTarihi)");
        
        res.status(201).send("Bilet başarıyla oluşturuldu.");
    } catch (err) {
        console.error("Bilet ekleme hatası:", err);
        res.status(500).send("Bilet oluşturulurken hata meydana geldi.");
    }
});

// Sunucuyu Başlat
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Güçlü API Sunucusu çalışıyor! Tüm veritabanı kapıları açıldı.`);
});