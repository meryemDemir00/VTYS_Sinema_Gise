package com.example.sinemegisemobil;

import android.os.StrictMode;
import android.util.Log;
import java.sql.Connection;
import java.sql.DriverManager;

public class ConnectionHelper {

    String username = "sa";
    String password = "12345";
    String database = "SinematorDB";

    String ip = "10.0.2.2";
    String port = "1433";

    public Connection baglantiyiKur() {
        StrictMode.ThreadPolicy policy = new StrictMode.ThreadPolicy.Builder().permitAll().build();
        StrictMode.setThreadPolicy(policy);

        Connection connection = null;
        String connectionURL;

        try {
            Class.forName("net.sourceforge.jtds.jdbc.Driver");

            connectionURL = "jdbc:jtds:sqlserver://" + ip + ":" + port + ";" +
                    "databasename=" + database + ";user=" + username + ";password=" + password + ";";

            connection = DriverManager.getConnection(connectionURL);
            Log.d("DB_BILGI", "Android uygulaması MSSQL'e bağlandı.");

        } catch (Exception ex) {
            Log.e("DB_HATA", "Bağlantı başarısız: " + ex.getMessage());
        }

        return connection;
    }
}
