package com.example.sinemegisemobil;

import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ListView;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    Button btnTest;
    TextView tvSonuc;
    ListView lvFilmler;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Ekrandaki elemanları tanıtıyoruz
        btnTest = findViewById(R.id.btnTest);
        tvSonuc = findViewById(R.id.tvSonuc);
        lvFilmler = findViewById(R.id.lvFilmler);

        btnTest.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                tvSonuc.setText("Veriler çekiliyor, lütfen bekleyin...");
                tvSonuc.setTextColor(getResources().getColor(android.R.color.darker_gray));

                ConnectionHelper baglantiSinifi = new ConnectionHelper();
                Connection dbBaglantisi = baglantiSinifi.baglantiyiKur();

                if (dbBaglantisi != null) {
                    try {
                        // SQL Sorgumuzu oluşturuyoruz
                        String sorgu = "SELECT * FROM Filmler";
                        Statement komut = dbBaglantisi.createStatement();
                        ResultSet gelenVeri = komut.executeQuery(sorgu);

                        // Gelen filmleri tutacağımız liste
                        List<String> filmListesi = new ArrayList<>();

                        // Veritabanındaki satırları tek tek dönüyoruz
                        while (gelenVeri.next()) {
                            String film = gelenVeri.getString("FilmAd");
                            filmListesi.add(film);
                        }

                        // Listemizi ekrandaki ListView'e bağlıyoruz
                        ArrayAdapter<String> adapter = new ArrayAdapter<>(MainActivity.this, android.R.layout.simple_list_item_1, filmListesi);
                        lvFilmler.setAdapter(adapter);

                        tvSonuc.setText("MÜJDE: Veriler başarıyla çekildi! 🎉");
                        tvSonuc.setTextColor(getResources().getColor(android.R.color.holo_green_dark));

                    } catch (Exception ex) {
                        tvSonuc.setText("Sorgu Hatası: " + ex.getMessage());
                        tvSonuc.setTextColor(getResources().getColor(android.R.color.holo_red_dark));
                    }
                } else {
                    tvSonuc.setText("HATA: Bağlantı Kurulamadı! ❌");
                    tvSonuc.setTextColor(getResources().getColor(android.R.color.holo_red_dark));
                }
            }
        });
    }
}