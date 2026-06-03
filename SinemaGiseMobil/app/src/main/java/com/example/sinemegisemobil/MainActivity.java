package com.example.sinemegisemobil; // Kendi paket adın kalmalı!

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import android.content.DialogInterface;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ListView;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.List;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainActivity extends AppCompatActivity {

    private Button btnTest;
    private TextView tvSonuc;
    private ListView lvFilmler;

    // API'den gelen filmleri tutacağımız ana liste (Tıklanınca hangi filme tıklandığını bulmak için)
    private List<Film> filmListesi;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        btnTest = findViewById(R.id.btnTest);
        tvSonuc = findViewById(R.id.tvSonuc);
        lvFilmler = findViewById(R.id.lvFilmler);

        btnTest.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                tvSonuc.setText("Sunucuya bağlanılıyor... ⏳");
                filmleriGetir();
            }
        });

        // === YENİ: LİSTEDEKİ FİLMLERE TIKLAMA OLAYI ===
        lvFilmler.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                if (filmListesi != null) {
                    Film secilenFilm = filmListesi.get(position);
                    biletEkraniGoster(secilenFilm);
                }
            }
        });
    }

    private void biletEkraniGoster(Film film) {
        // Ekranda açılan küçük bir pencere (Dialog) tasarlıyoruz
        AlertDialog.Builder builder = new AlertDialog.Builder(MainActivity.this);
        builder.setTitle(film.getAd() + " - Bilet Al");
        builder.setMessage("Lütfen koltuk numarasını girin (Örn: C4):");

        // Kullanıcının koltuk numarası yazabileceği bir giriş alanı
        final EditText koltukGiris = new EditText(MainActivity.this);
        builder.setView(koltukGiris);

        // Satın Al Butonu
        builder.setPositiveButton("Bileti Kes", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                String koltukNo = koltukGiris.getText().toString().trim();

                if (!koltukNo.isEmpty()) {
                    // Veritabanı Foreign Key hatası vermesin diye demo olarak Seans:1 ve Musteri:1 gönderiyoruz
                    BiletIstek istek = new BiletIstek(1, 1, koltukNo);
                    biletKaydet(istek);
                } else {
                    Toast.makeText(MainActivity.this, "Koltuk numarası boş olamaz!", Toast.LENGTH_SHORT).show();
                }
            }
        });

        // İptal Butonu
        builder.setNegativeButton("İptal", null);
        builder.show();
    }

    private void biletKaydet(BiletIstek istek) {
        ApiService apiService = RetrofitClient.getService();
        Call<ResponseBody> call = apiService.biletAl(istek);

        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(MainActivity.this, "Bilet Başarıyla Kesildi! 🎉", Toast.LENGTH_LONG).show();
                } else {
                    Toast.makeText(MainActivity.this, "Ödeme reddedildi! Hata: " + response.code(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(MainActivity.this, "Bağlantı hatası: " + t.getMessage(), Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void filmleriGetir() {
        ApiService apiService = RetrofitClient.getService();
        Call<List<Film>> call = apiService.getFilmler();

        call.enqueue(new Callback<List<Film>>() {
            @Override
            public void onResponse(Call<List<Film>> call, Response<List<Film>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    filmListesi = response.body();

                    ArrayList<String> filmGorselListesi = new ArrayList<>();
                    for (Film film : filmListesi) {
                        filmGorselListesi.add("🎬 " + film.getAd() + "\nTür: " + film.getTur() + " | Süre: " + film.getSure() + " dk");
                    }

                    ArrayAdapter<String> adapter = new ArrayAdapter<>(MainActivity.this, android.R.layout.simple_list_item_1, filmGorselListesi);
                    lvFilmler.setAdapter(adapter);

                    tvSonuc.setText("Bağlantı Başarılı! " + filmListesi.size() + " film çekildi. ✅");
                }
            }

            @Override
            public void onFailure(Call<List<Film>> call, Throwable t) {
                tvSonuc.setText("Bağlantı Hatası! Node.js açık mı? ❌");
            }
        });
    }
}