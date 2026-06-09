import express from "express";
import cors from "cors";
import sql from "mssql";
import * as db from "./auth-db.js";

const app = express();

// KAYNAK (REFERANS) BELİRTME: Express.js ve CORS Yapılandırması
// Farklı portlarda çalışan frontend ve backend'in haberleşebilmesi (Cross-Origin Resource Sharing) için
// CORS ayarları Express.js resmi dokümantasyonundan faydalanılarak yapılandırılmıştır.
// Kaynak URL: https://expressjs.com/en/resources/middleware/cors.html
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// KAYNAK (REFERANS) BELİRTME: MSSQL Veritabanı Bağlantı Ayarları
// Node.js üzerinden SQL Server'a bağlanmak için 'mssql' paketinin dokümantasyonundaki
// standart konfigürasyon (özellikle trustServerCertificate ayarı) kullanılmıştır.
// Kaynak URL: https://www.npmjs.com/package/mssql#configuration
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

// KAYNAK (REFERANS) BELİRTME: Base64 Token Üretimi
// Kullanıcı oturumunu yönetmek için JSON objesinin Base64url formatına çevrilmesi işlemi
// Node.js Buffer API dokümantasyonundan uyarlanmıştır.
// Kaynak URL: https://nodejs.org/api/buffer.html#buffers-and-character-encodings
function createAuthToken(user) {
  return Buffer.from(JSON.stringify({
    id: user.id,
    email: user.email,
    ad: user.ad,
    soyad: user.soyad,
  })).toString("base64url");
}

// KAYNAK (REFERANS) BELİRTME: Güvenli Çerez (Cookie) Yönetimi
// Tarayıcıya HttpOnly ve SameSite özellikleriyle güvenli token bırakma işlemi 
// MDN Web Docs "Set-Cookie" başlığından referans alınarak yazılmıştır.
// Kaynak URL: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie
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

    // KAYNAK (REFERANS) BELİRTME: SQL Injection Koruması (Parameterized Queries)
    // Dışarıdan gelen verilerin doğrudan SQL sorgusuna yazılmasını engelleyerek
    // güvenliği sağlamak amacıyla .input() parametrik sorgu yapısı kullanılmıştır. (OWASP Standartları)
    // Kaynak URL: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
    const checkUser = await pool.request()
      .input("Email", sql.NVarChar, email)
      .input("Telefon", sql.NVarChar, telefon)
      .query("SELECT * FROM Musteriler WHERE Email = @Email OR Telefon = @Telefon");

    if (checkUser.recordset.length > 0) {
      return res.status(400).json(authErrorPayload(null, "Bu e-posta veya telefon zaten kayıtlı!"));
    }

    const insertResult = await pool.request()
      .input("Ad", sql.NVarChar, ad)
      .input("Soyad", sql.NVarChar, soyad)
      .input("Email", sql.NVarChar, email)
      .input("Telefon", sql.NVarChar, telefon)
      .input("Sifre", sql.NVarChar, sifre) // Gerçek projelerde şifreler bcrypt ile şifrelenerek saklanır
      .query(`
        INSERT INTO Musteriler (Ad, Soyad, Email, Telefon, Sifre)
        VALUES (@Ad, @Soyad, @Email, @Telefon, @Sifre);
        
        SELECT SCOPE_IDENTITY() AS MusteriID, @Ad AS Ad, @Soyad AS Soyad, @Email AS Email;
      `);

    const createdUser = insertResult.recordset[0];

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

    const result = await pool.request()
      .input("Identifier", sql.NVarChar, identifier)
      .input("Sifre", sql.NVarChar, sifre)
      .query(`
        SELECT * FROM Musteriler 
        WHERE (Email = @Identifier OR Telefon = @Identifier) 
        AND Sifre = @Sifre
      `);

    const user = result.recordset[0];

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
    console.log("[biletler] Incoming ticket sale payload:", JSON.stringify(req.body, null, 2));
    const pool = await sql.connect(config);
    const seansId = Number(req.body.SeansID || 1);
    const requestedMusteriId = Number(req.body.MusteriID || 1);
    const koltukNo = Number.parseInt(req.body.KoltukNo, 10) || 1;
    console.log("[biletler] Normalized params:", {
      SeansID: seansId,
      requestedMusteriId,
      KoltukNo: koltukNo,
    });

    const customerResult = await pool.request()
      .input("MusteriID", sql.Int, requestedMusteriId)
      .query(`
        SELECT TOP 1 MusteriID
        FROM Musteriler
        WHERE MusteriID = @MusteriID
          OR NOT EXISTS (SELECT 1 FROM Musteriler WHERE MusteriID = @MusteriID)
        ORDER BY CASE WHEN MusteriID = @MusteriID THEN 0 ELSE 1 END, MusteriID
      `);
    const musteriId = customerResult.recordset[0]?.MusteriID || 1;
    const saleDate = new Date();
    console.log("[biletler] Resolved customer:", { MusteriID: musteriId, saleDate });

    const procedureResult = await pool.request().query(`
      SELECT TOP 1 name
      FROM sys.procedures
      WHERE name IN ('BiletSat', 'SatisYap', 'sp_BiletSat', 'sp_SatisYap')
      ORDER BY CASE name
        WHEN 'BiletSat' THEN 1
        WHEN 'SatisYap' THEN 2
        WHEN 'sp_BiletSat' THEN 3
        ELSE 4
      END
    `);

    let result;
    let usedProcedure = false;
    const procedureName = procedureResult.recordset[0]?.name;
    console.log("[biletler] Stored procedure lookup:", {
      found: Boolean(procedureName),
      procedureName: procedureName || null,
    });

    if (procedureName) {
      try {
        console.log("[biletler] Calling stored procedure:", {
          procedureName,
          SeansID: seansId,
          MusteriID: musteriId,
          KoltukNo: koltukNo,
        });
        result = await pool.request()
          .input("SeansID", sql.Int, seansId)
          .input("MusteriID", sql.Int, musteriId)
          .input("KoltukNo", sql.Int, koltukNo)
          .query(`EXEC dbo.${procedureName} @SeansID = @SeansID, @MusteriID = @MusteriID, @KoltukNo = @KoltukNo`);
        usedProcedure = true;
        console.log("[biletler] Stored procedure completed:", {
          rowsAffected: result.rowsAffected,
          recordset: result.recordset,
        });
      } catch (procedureError) {
        console.error(`[biletler] ${procedureName} failed, falling back to direct insert.`);
        console.error(procedureError.stack || procedureError);
      }
    }

    if (usedProcedure && !result?.recordset?.length) {
      result = {
        recordset: [{
          SeansID: seansId,
          MusteriID: musteriId,
          KoltukNo: koltukNo,
          SatisTarihi: saleDate,
        }],
      };
    }

    if (!usedProcedure && !result?.recordset?.length) {
      console.log("[biletler] Running fallback direct insert:", {
        SeansID: seansId,
        MusteriID: musteriId,
        KoltukNo: koltukNo,
        SatisTarihi: saleDate,
      });
      result = await pool.request()
        .input("SeansID", sql.Int, seansId)
        .input("MusteriID", sql.Int, musteriId)
        .input("KoltukNo", sql.Int, koltukNo)
        .input("SatisTarihi", sql.DateTime, saleDate)
        .query(`
          INSERT INTO Biletler (SeansID, MusteriID, KoltukNo, SatisTarihi)
          VALUES (@SeansID, @MusteriID, @KoltukNo, @SatisTarihi);

          UPDATE Salonlar
          SET Kapasite = CASE WHEN Kapasite > 0 THEN Kapasite - 1 ELSE Kapasite END
          WHERE SalonID = (SELECT TOP 1 SalonID FROM Seanslar WHERE SeansID = @SeansID);

          SELECT SCOPE_IDENTITY() AS BiletID, @SeansID as SeansID, @MusteriID as MusteriID, @KoltukNo as KoltukNo, @SatisTarihi as SatisTarihi;
        `);
      console.log("[biletler] Fallback insert completed:", {
        rowsAffected: result.rowsAffected,
        recordset: result.recordset,
      });
    }

    res.status(201).json({
      success: true,
      ticket: result.recordset?.[0] || {
        SeansID: seansId,
        MusteriID: musteriId,
        KoltukNo: koltukNo,
        SatisTarihi: saleDate,
      },
    });
  } catch (error) {
    console.error("[biletler] Full ticket sale error stack:");
    console.error(error.stack || error);
    res.status(500).json({
      success: false,
      message: error?.message || "Bilet olusturulurken hata meydana geldi.",
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API sunucusu ${PORT} portunda calisiyor.`);
});