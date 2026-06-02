package com.example.sinemegisemobil;

import android.os.StrictMode;
import android.util.Log;
import java.sql.Connection;
import java.sql.DriverManager;

public class ConnectionHelper {

    // Veritabanı Bilgileri
    String username = "sa";
    String password = "12345"; // SSMS'de belirlediğin şifre
    String database = "SinematorDB";

    // ÇOK KRİTİK NOT: Android Emülatörü 'localhost' kelimesini anlamaz (kendi içini arar).
    // Emülatörün senin bilgisayarına bağlanması için özel IP'si 10.0.2.2'dir.
    String ip = "10.0.2.2";
    String port = "1433";

    public Connection baglantiyiKur() {
        // Android'in ağ işlemlerini ana akışta yapmasına izin veren güvenlik ayarı
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        Connection connection = null;
        String connectionURL;

        try {
            // JTDS sürücüsünü çağırıyoruz
            Class.forName("net.sourceforge.jtds.jdbc.Driver");

            // MSSQL Bağlantı Cümlesi
            connectionURL = "jdbc:jtds:sqlserver://" + ip + ":" + port + ";" +
                    "databasename=" + database + ";user=" + username + ";password=" + password + ";";

            connection = DriverManager.getConnection(connectionURL);
            Log.d("DB_BILGI", "Müjde Emircan! Android uygulaması MSSQL'e bağlandı.");

        } catch (Exception ex) {
            Log.e("DB_HATA", "Bağlantı başarısız: " + ex.getMessage());
        }

        return connection;
    }
}
