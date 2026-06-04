import express from "express";
import cors from "cors";
import sql from "mssql";
import * as db from "./auth-db.js";

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const config = {
  user: "sa",
  password: "12345",
  server: "localhost",
  database: "SinematorDB",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

function createAuthToken(user) {
  return Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    ad: user.ad,
    soyad: user.soyad,
  })).toString("base64url");
}

function setAuthCookie(res, token) {
  res.setHeader("Set-Cookie", `auth_token=${token}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`);
}

function clearAuthCookie(res) {
  res.setHeader("Set-Cookie", "auth_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax");
}

function authErrorPayload(error, fallbackMessage) {
  return {
    success: false,
    message: error?.message || fallbackMessage,
  };
}

// --- KULLANICI KAYIT OL (REGISTER) SQL BAĞLANTISI ---
app.post("/api/auth/register", async (req, res) => {
  try {
    const { ad, soyad, email, telefon, sifre } = req.body || {};
    const pool = await sql.connect(config);

    // 1. Bu e-posta veya telefonla zaten kayıt var mı kontrol et
    const checkUser = await pool.request()
      .input("Email", sql.NVarChar, email)
      .input("Telefon", sql.NVarChar, telefon)
      .query("SELECT * FROM Musteriler WHERE Email = @Email OR Telefon = @Telefon");

    if (checkUser.recordset.length > 0) {
      return res.status(400).json(authErrorPayload(null, "Bu e-posta veya telefon zaten kayıtlı!"));
    }

    // 2. Yeni kullanıcıyı SQL'e kaydet
    const insertResult = await pool.request()
      .input("Ad", sql.NVarChar, ad)
      .input("Soyad", sql.NVarChar, soyad)
      .input("Email", sql.NVarChar, email)
      .input("Telefon", sql.NVarChar, telefon)
      .input("Sifre", sql.NVarChar, sifre) // Gerçek projelerde şifreler bcrypt ile şifrelenerek saklanır
      .query(`
        INSERT INTO Musteriler (Ad, Soyad, Email, Telefon, Sifre)
        OUTPUT INSERTED.*
        VALUES (@Ad, @Soyad, @Email, @Telefon, @Sifre)
      `);

    const createdUser = insertResult.recordset[0];

    // 3. Başarılı mesajı dön
    res.status(201).json({
      success: true,
      user: {
        id: createdUser.MusteriID,
        ad: createdUser.Ad,
        soyad: createdUser.Soyad,
        email: createdUser.Email,
      },
    });
  } catch (error) {
    console.error("Kayıt Hatası:", error);
    res.status(500).json(authErrorPayload(error, "Kayıt oluşturulamadı."));
  }
});


// --- KULLANICI GİRİŞ YAP (LOGIN) SQL BAĞLANTISI ---
app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, sifre } = req.body || {};
    const pool = await sql.connect(config);

    // 1. E-posta veya Telefon numarasını ve şifreyi SQL'de ara
    const result = await pool.request()
      .input("Identifier", sql.NVarChar, identifier)
      .input("Sifre", sql.NVarChar, sifre)
      .query(`
        SELECT * FROM Musteriler 
        WHERE (Email = @Identifier OR Telefon = @Identifier) 
        AND Sifre = @Sifre
      `);

    const user = result.recordset[0];

    // 2. Kullanıcı bulunamadıysa hata ver
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "E-posta/telefon veya şifre hatalı.",
      });
    }

    // 3. Giriş başarılıysa Tarayıcıya Token (Kimlik) ver
    setAuthCookie(res, createAuthToken(user));
    res.json({
      success: true,
      user: {
        id: user.MusteriID,
        ad: user.Ad,
        soyad: user.Soyad,
        email: user.Email,
      },
    });
  } catch (error) {
    console.error("Giriş Hatası:", error);
    res.status(500).json(authErrorPayload(error, "Sunucu bağlantı hatası."));
  }
});

// Patron için Hasılat Raporu Rotası
app.get('/api/rapor/hasilat', async (req, res) => {
    try {
        // Veritabanına bağlan (config değişkenin önceden tanımlıysa direkt kullanır)
        const pool = await sql.connect(config); 
        
        // Uzun SQL kodları yazmak yerine sadece Stored Procedure'ü tetikliyoruz (EXEC)
        const result = await pool.request().query('EXEC sp_FilmHasilatRaporu');
        
        // Gelen tabloyu JSON formatında dışarı aktarıyoruz
        res.json(result.recordset);
    } catch (err) {
        console.error("Rapor hatası:", err);
        res.status(500).send("Sunucu Hatası: Rapor getirilemedi.");
    }
});

app.post("/api/auth/logout", async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

app.get("/api/filmler", async (_req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM Filmler");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send("Filmler cekilemedi.");
  }
});

app.post("/api/filmler", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request()
      .input("FilmAd", sql.NVarChar, req.body.FilmAd)
      .input("Tur", sql.NVarChar, req.body.Tur)
      .input("Sure", sql.Int, req.body.Sure)
      .query(`
        INSERT INTO Filmler (FilmAd, Tur, Sure)
        OUTPUT INSERTED.*
        VALUES (@FilmAd, @Tur, @Sure)
      `);

    res.status(201).json(result.recordset[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Film eklenirken hata olustu.");
  }
});

app.put("/api/filmler/:id", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input("FilmID", sql.Int, req.params.id)
      .input("FilmAd", sql.NVarChar, req.body.FilmAd)
      .input("Tur", sql.NVarChar, req.body.Tur)
      .input("Sure", sql.Int, req.body.Sure)
      .query("UPDATE Filmler SET FilmAd = @FilmAd, Tur = @Tur, Sure = @Sure WHERE FilmID = @FilmID");

    res.send("Film guncellendi.");
  } catch (error) {
    res.status(500).send("Film guncellenirken hata olustu.");
  }
});

app.delete("/api/filmler/:id", async (req, res) => {
  // 1. AJAN: İstek sunucuya gerçekten ulaşıyor mu ve ID doğru mu geliyor?
  console.log("🚨 SİLME İSTEĞİ GELDİ! Gelen Film ID:", req.params.id);

  try {
    const pool = await sql.connect(config);
    const filmId = req.params.id;

    // BİLETLERİ SİL VE RAPORLA
    const biletSonuc = await pool.request()
      .input("FilmID", sql.Int, filmId)
      .query(`
        DELETE FROM Biletler 
        WHERE SeansID IN (SELECT SeansID FROM Seanslar WHERE FilmID = @FilmID)
      `);
    console.log("🗑️ Etkilenen (Silinen) Bilet Sayısı:", biletSonuc.rowsAffected[0]);

    // SEANSLARI SİL VE RAPORLA
    const seansSonuc = await pool.request()
      .input("FilmID", sql.Int, filmId)
      .query("DELETE FROM Seanslar WHERE FilmID = @FilmID");
    console.log("🗑️ Etkilenen (Silinen) Seans Sayısı:", seansSonuc.rowsAffected[0]);

    // FİLMİ SİL VE RAPORLA
    const filmSonuc = await pool.request()
      .input("FilmID", sql.Int, filmId)
      .query("DELETE FROM Filmler WHERE FilmID = @FilmID");
    console.log("🎬 Etkilenen (Silinen) Film Sayısı:", filmSonuc.rowsAffected[0]);

    res.status(200).send("İşlem tamamlandı.");
  } catch (error) {
    console.error("🚨 SİLME İŞLEMİNDE PATLAMA YAŞANDI:", error);
    res.status(500).send("Sunucu hatası.");
  }
});

app.get("/api/salonlar", async (_req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM Salonlar");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send("Salonlar cekilemedi.");
  }
});

app.get("/api/musteriler", async (_req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM Musteriler");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send("Musteriler cekilemedi.");
  }
});

app.get("/api/seanslar", async (_req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM Seanslar");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send("Seanslar cekilemedi.");
  }
});

app.get("/api/biletler", async (_req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query("SELECT * FROM Biletler");
    res.json(result.recordset);
  } catch (error) {
    res.status(500).send("Biletler cekilemedi.");
  }
});

app.post("/api/biletler", async (req, res) => {
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input("SeansID", sql.Int, req.body.SeansID)
      .input("MusteriID", sql.Int, req.body.MusteriID)
      .input("KoltukNo", sql.NVarChar, req.body.KoltukNo)
      .input("SatisTarihi", sql.DateTime, new Date())
      .query("INSERT INTO Biletler (SeansID, MusteriID, KoltukNo, SatisTarihi) VALUES (@SeansID, @MusteriID, @KoltukNo, @SatisTarihi)");

    res.status(201).send("Bilet basariyla olusturuldu.");
  } catch (error) {
    console.error("Bilet ekleme hatasi:", error);
    res.status(500).send("Bilet olusturulurken hata meydana geldi.");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API sunucusu ${PORT} portunda calisiyor.`);
});
