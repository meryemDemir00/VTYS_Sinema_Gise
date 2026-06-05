package com.example.sinemegisemobil;

import androidx.appcompat.app.AlertDialog;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import android.content.DialogInterface;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.GridLayout;
import android.widget.TextView;
import android.widget.Toast;

import java.util.List;

import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MainActivity extends AppCompatActivity {

    private Button btnTest;
    private TextView tvSonuc;
    private RecyclerView recyclerView; // ListView yerine RecyclerView geldi
    private Button btnRapor;

    private List<Film> filmListesi;
    private FilmAdapter adapter; // Yeni eklediğimiz köprü sınıfı

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        btnTest = findViewById(R.id.btnTest);
        tvSonuc = findViewById(R.id.tvSonuc);
        btnRapor = findViewById(R.id.btnRapor);
        // --- YETKİLENDİRME (AUTHORIZATION) KONTROLÜ ---
        // Hafızadaki e-postayı oku
        android.content.SharedPreferences prefs = getSharedPreferences("SinemaApp", MODE_PRIVATE);
        String girisYapanEmail = prefs.getString("MusteriEmail", "");

        // Eğer giriş yapan kişi PATRON DEĞİLSE, senin btnRapor butonunu SİL (Görünmez yap)
        if (!girisYapanEmail.equals("hasbekelif237@gmail.com")) {
            btnRapor.setVisibility(View.GONE);
        }

        // RecyclerView Tanımlaması
        recyclerView = findViewById(R.id.recyclerViewFilmler);
        recyclerView.setLayoutManager(new LinearLayoutManager(this));

        btnRapor.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                patronRaporunuGetir();
            }
        });

        filmleriGetir();

        btnTest.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                tvSonuc.setText("Sunucuya bağlanılıyor... ⏳");
                filmleriGetir();
            }
        });

        // Uygulama açılır açılmaz filmleri otomatik getirmesini istersen buraya filmleriGetir(); yazabilirsin.
    }

    // --- SENİN YAZDIĞIN BİLET KESME FONKSİYONLARI (Aynı Kaldı) ---
    // --- YENİ EKLENEN DEĞİŞKENLER ---
    private String secilenKoltukNo = "";
    private Button oncekiSecilenButon = null;

    // --- GÜNCELLENEN BİLET EKRANI FONKSİYONU ---
    private void biletEkraniGoster(Film film) {
        // Kendi oluşturduğumuz tasarımı (dialog_koltuk_secimi.xml) popup olarak açıyoruz
        AlertDialog.Builder builder = new AlertDialog.Builder(MainActivity.this);
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_koltuk_secimi, null);
        builder.setView(dialogView);

        AlertDialog dialog = builder.create();

        // Tasarımdaki elemanları kodla eşleştiriyoruz
        TextView tvFilmAdi = dialogView.findViewById(R.id.tvFilmAdiDialog);
        GridLayout gridLayout = dialogView.findViewById(R.id.gridLayoutKoltuklar);
        Button btnOnayla = dialogView.findViewById(R.id.btnKoltukOnayla);

        tvFilmAdi.setText(film.getAd() + " - Koltuk Seçimi");
        secilenKoltukNo = ""; // Her açılışta sıfırla
        oncekiSecilenButon = null;

        // Koltuk boyutlarını telefon ekranına göre ayarlıyoruz (dp to px)
        int boyut = (int) (45 * getResources().getDisplayMetrics().density);
        int margin = (int) (4 * getResources().getDisplayMetrics().density);

        // A'dan E'ye kadar 5 satır, 1'den 5'e kadar 5 sütun = 25 Koltuk
        String[] satirlar = {"A", "B", "C", "D", "E"};

        for (int i = 0; i < 5; i++) {
            for (int j = 1; j <= 5; j++) {
                String koltukIsmi = satirlar[i] + j; // Örn: A1, B3...

                Button koltukBtn = new Button(MainActivity.this);
                koltukBtn.setText(koltukIsmi);
                koltukBtn.setTextSize(12);
                koltukBtn.setBackgroundColor(android.graphics.Color.DKGRAY); // Boş koltuklar koyu gri
                koltukBtn.setTextColor(android.graphics.Color.WHITE);

                android.widget.GridLayout.LayoutParams params = new android.widget.GridLayout.LayoutParams();
                params.width = boyut;
                params.height = boyut;
                params.setMargins(margin, margin, margin, margin);
                koltukBtn.setLayoutParams(params);

                // Bir koltuğa tıklandığında çalışacak olay
                koltukBtn.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        // Eğer önceden seçili bir koltuk varsa, onu tekrar eski rengine (Gri) döndür
                        if (oncekiSecilenButon != null) {
                            oncekiSecilenButon.setBackgroundColor(android.graphics.Color.DKGRAY);
                            oncekiSecilenButon.setTextColor(android.graphics.Color.WHITE);
                        }

                        // Yeni tıklanan koltuğu seçili (Turkuaz/Yeşil) yap
                        koltukBtn.setBackgroundColor(android.graphics.Color.parseColor("#03DAC5"));
                        koltukBtn.setTextColor(android.graphics.Color.BLACK);

                        secilenKoltukNo = koltukIsmi;
                        oncekiSecilenButon = koltukBtn; // Hafızada tut
                    }
                });

                gridLayout.addView(koltukBtn);
            }
        }

        // Bileti Kes Butonuna Basıldığında...
        btnOnayla.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (!secilenKoltukNo.isEmpty()) {

                    // Android'in hafızasına kaydettiğimiz gerçek Müşteri ID'sini okuyoruz
                    android.content.SharedPreferences prefs = getSharedPreferences("SinemaApp", MODE_PRIVATE);
                    int gercekMusteriId = prefs.getInt("MusteriID", -1);

                    if (gercekMusteriId == -1) {
                        Toast.makeText(MainActivity.this, "Oturum hatası! Lütfen tekrar giriş yapın.", Toast.LENGTH_SHORT).show();
                        return;
                    }

                    // Bileti Node.js'e gönder
                    BiletIstek istek = new BiletIstek(1, gercekMusteriId, secilenKoltukNo);
                    biletKaydet(istek);
                    dialog.dismiss(); // İşlem bitince popup'ı kapat

                } else {
                    Toast.makeText(MainActivity.this, "Lütfen haritadan bir koltuk seçin!", Toast.LENGTH_SHORT).show();
                }
            }
        });

        // Popup penceresinin arka planını transparan yapıp kenarlarının yuvarlak görünmesini sağlar
        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        dialog.show();
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

    // --- SENİN YAZDIĞIN PATRON RAPORU (Aynı Kaldı) ---
    private void patronRaporunuGetir() {
        ApiService apiService = RetrofitClient.getService();
        Call<List<Rapor>> call = apiService.getHasilatRaporu();

        call.enqueue(new Callback<List<Rapor>>() {
            @Override
            public void onResponse(Call<List<Rapor>> call, Response<List<Rapor>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    StringBuilder sb = new StringBuilder();
                    int genelToplam = 0;

                    for (Rapor r : response.body()) {
                        sb.append("🎬 ").append(r.getFilmAdi()).append("\n");
                        sb.append("Satış: ").append(r.getSatilanBilet()).append(" Bilet | ");
                        sb.append("Ciro: ").append(r.getToplamHasilat()).append(" TL\n\n");
                        genelToplam += r.getToplamHasilat();
                    }

                    sb.append("💰 GENEL TOPLAM CİRO: ").append(genelToplam).append(" TL");

                    new AlertDialog.Builder(MainActivity.this)
                            .setTitle("📊 Günlük Hasılat Raporu")
                            .setMessage(sb.toString())
                            .setPositiveButton("Kapat", null)
                            .show();
                } else {
                    Toast.makeText(MainActivity.this, "Rapor alınamadı!", Toast.LENGTH_SHORT).show();
                }
            }
            @Override
            public void onFailure(Call<List<Rapor>> call, Throwable t) {
                Toast.makeText(MainActivity.this, "Bağlantı Hatası!", Toast.LENGTH_SHORT).show();
            }
        });
    }

    // --- GÜNCELLENEN FİLMLERİ GETİRME FONKSİYONU ---
    private void filmleriGetir() {
        ApiService apiService = RetrofitClient.getService();
        Call<List<Film>> call = apiService.getFilmler();

        call.enqueue(new Callback<List<Film>>() {
            @Override
            public void onResponse(Call<List<Film>> call, Response<List<Film>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    filmListesi = response.body();

                    // YENİ NESİL ADAPTER KULLANIMI VE TIKLAMA OLAYI
                    adapter = new FilmAdapter(filmListesi, new FilmAdapter.OnItemClickListener() {
                        @Override
                        public void onItemClick(Film film) {
                            // Karta tıklandığında senin bilet ekranın açılacak
                            biletEkraniGoster(film);
                        }
                    });

                    recyclerView.setAdapter(adapter);
                }
            }

            @Override
            public void onFailure(Call<List<Film>> call, Throwable t) {
                tvSonuc.setText("Bağlantı Hatası! Node.js açık mı? ❌");
            }
        });
    }
}