-- 1. Filmler Tablosu
CREATE TABLE Filmler (
    FilmID INT PRIMARY KEY IDENTITY(1,1),
    FilmAd NVARCHAR(100) NOT NULL,
    Tur NVARCHAR(50),
    Sure INT
);

-- 2. Salonlar Tablosu
CREATE TABLE Salonlar (
    SalonID INT PRIMARY KEY IDENTITY(1,1),
    SalonAd NVARCHAR(50) NOT NULL,
    Kapasite INT DEFAULT 50
);

-- 3. Musteriler Tablosu
CREATE TABLE Musteriler (
    MusteriID INT PRIMARY KEY IDENTITY(1,1),
    Ad NVARCHAR(50) NOT NULL,
    Soyad NVARCHAR(50) NOT NULL,
    Email NVARCHAR(100)
);

-- 4. Seanslar Tablosu
CREATE TABLE Seanslar (
    SeansID INT PRIMARY KEY IDENTITY(1,1),
    FilmID INT FOREIGN KEY REFERENCES Filmler(FilmID) ON DELETE CASCADE,
    SalonID INT FOREIGN KEY REFERENCES Salonlar(SalonID),
    Tarih DATE NOT NULL,
    Saat TIME NOT NULL
);

-- 5. Biletler Tablosu
CREATE TABLE Biletler (
    BiletID INT PRIMARY KEY IDENTITY(1,1),
    SeansID INT FOREIGN KEY REFERENCES Seanslar(SeansID),
    MusteriID INT FOREIGN KEY REFERENCES Musteriler(MusteriID),
    KoltukNo INT NOT NULL,
    SatisTarihi DATETIME DEFAULT GETDATE()
);