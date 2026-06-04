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

app.post("/api/auth/register", async (req, res) => {
  try {
    const { ad, soyad, email, telefon, dogumTarihi, cinsiyet, sifre } = req.body || {};
    const createdUser = await db.createUser({ ad, soyad, email, telefon, dogumTarihi, cinsiyet, sifre });

    res.status(201).json({
      success: true,
      user: {
        id: createdUser.id,
        ad: createdUser.ad,
        soyad: createdUser.soyad,
        email: createdUser.email,
      },
    });
  } catch (error) {
    const statusCode = error?.statusCode === 400 ? 400 : 500;
    res.status(statusCode).json(authErrorPayload(error, "Kayit olusturulamadi."));
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

app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, sifre } = req.body || {};
    const user = await db.findUserByIdentifier(identifier, sifre);

    if (!user) {
      res.status(401).json({
        success: false,
        message: "E-posta/telefon veya sifre hatali.",
      });
      return;
    }

    setAuthCookie(res, createAuthToken(user));
    res.json({
      success: true,
      user: {
        id: user.id,
        ad: user.ad,
        soyad: user.soyad,
        email: user.email,
      },
    });
  } catch (error) {
    if (error?.statusCode === 401) {
      res.status(401).json({
        success: false,
        message: "E-posta/telefon veya sifre hatali.",
      });
      return;
    }

    res.status(error?.statusCode || 500).json(authErrorPayload(error, "Giris yapilamadi."));
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
  try {
    const pool = await sql.connect(config);
    await pool.request()
      .input("FilmID", sql.Int, req.params.id)
      .query("DELETE FROM Filmler WHERE FilmID = @FilmID");

    res.send("Film silindi.");
  } catch (error) {
    res.status(500).send("Film silinirken hata olustu.");
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
          OUTPUT INSERTED.*
          VALUES (@SeansID, @MusteriID, @KoltukNo, @SatisTarihi);

          UPDATE Salonlar
          SET Kapasite = CASE WHEN Kapasite > 0 THEN Kapasite - 1 ELSE Kapasite END
          WHERE SalonID = (SELECT TOP 1 SalonID FROM Seanslar WHERE SeansID = @SeansID);
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
