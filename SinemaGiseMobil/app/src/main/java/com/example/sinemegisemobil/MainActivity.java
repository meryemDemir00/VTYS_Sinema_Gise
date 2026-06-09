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
    private RecyclerView recyclerView;
    private Button btnRapor;

    private List<Film> filmListesi;
    private FilmAdapter adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        btnTest = findViewById(R.id.btnTest);
        tvSonuc = findViewById(R.id.tvSonuc);
        btnRapor = findViewById(R.id.btnRapor);

        // KAYNAK (REFERANS) BELİRTME: SharedPreferences ile Oturum Kontrolü
        // Kullanıcının cihaza kaydettiği oturum verilerini (MusteriEmail vb.) okuma işlemi
        // Android Developers resmi dokümantasyonundan uyarlanmıştır.
        // Kaynak URL: https://developer.android.com/training/data-storage/shared-preferences
        android.content.SharedPreferences prefs = getSharedPreferences("SinemaApp", MODE_PRIVATE);
        String girisYapanEmail = prefs.getString("MusteriEmail", "");

        if (!girisYapanEmail.equals("hasbekelif237@gmail.com")) {
            btnRapor.setVisibility(View.GONE);
        }

        // KAYNAK (REFERANS) BELİRTME: RecyclerView ve LayoutManager Yapılandırması
        // Dinamik liste gösterimi için standart RecyclerView bağlama işlemi kullanılmıştır.
        // Kaynak URL: https://developer.android.com/guide/topics/ui/layout/recyclerview
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
    }
    private String secilenKoltukNo = "";
    private Button oncekiSecilenButon = null;

    private void biletEkraniGoster(Film film) {
        // KAYNAK (REFERANS) BELİRTME: Custom AlertDialog Kullanımı
        // Varsayılan diyalog penceresi yerine özel bir XML (dialog_koltuk_secimi) yükleme (inflate)
        // işlemi StackOverflow "How to implement a custom AlertDialog view" başlığından uyarlanmıştır.
        // Kaynak URL: https://stackoverflow.com/questions/13627252/how-to-create-a-custom-alertdialog
        AlertDialog.Builder builder = new AlertDialog.Builder(MainActivity.this);
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_koltuk_secimi, null);
        builder.setView(dialogView);

        AlertDialog dialog = builder.create();

        TextView tvFilmAdi = dialogView.findViewById(R.id.tvFilmAdiDialog);
        GridLayout gridLayout = dialogView.findViewById(R.id.gridLayoutKoltuklar);
        Button btnOnayla = dialogView.findViewById(R.id.btnKoltukOnayla);

        tvFilmAdi.setText(film.getAd() + " - Koltuk Seçimi");
        secilenKoltukNo = "";
        oncekiSecilenButon = null;

        // KAYNAK (REFERANS) BELİRTME: DP'den Pixel'e (PX) Dönüşüm Formülü
        // Java kodunda dinamik olarak oluşturulan butonların ekran çözünürlüğüne (density) göre
        // doğru boyutlanması (dp -> px çevirisi) için standart Android metodu kullanılmıştır.
        // Kaynak URL: https://stackoverflow.com/questions/8309354/formula-px-to-dp-dp-to-px-android
        int boyut = (int) (45 * getResources().getDisplayMetrics().density);
        int margin = (int) (4 * getResources().getDisplayMetrics().density);

        String[] satirlar = {"A", "B", "C", "D", "E"};

        // Dinamik Koltuk (Buton) Üretimi
        for (int i = 0; i < 5; i++) {
            for (int j = 1; j <= 5; j++) {
                String koltukIsmi = satirlar[i] + j;

                Button koltukBtn = new Button(MainActivity.this);
                koltukBtn.setText(koltukIsmi);
                koltukBtn.setTextSize(12);
                koltukBtn.setBackgroundColor(android.graphics.Color.DKGRAY);
                koltukBtn.setTextColor(android.graphics.Color.WHITE);

                android.widget.GridLayout.LayoutParams params = new android.widget.GridLayout.LayoutParams();
                params.width = boyut;
                params.height = boyut;
                params.setMargins(margin, margin, margin, margin);
                koltukBtn.setLayoutParams(params);

                koltukBtn.setOnClickListener(new View.OnClickListener() {
                    @Override
                    public void onClick(View v) {
                        if (oncekiSecilenButon != null) {
                            oncekiSecilenButon.setBackgroundColor(android.graphics.Color.DKGRAY);
                            oncekiSecilenButon.setTextColor(android.graphics.Color.WHITE);
                        }

                        koltukBtn.setBackgroundColor(android.graphics.Color.parseColor("#03DAC5"));
                        koltukBtn.setTextColor(android.graphics.Color.BLACK);

                        secilenKoltukNo = koltukIsmi;
                        oncekiSecilenButon = koltukBtn; // Hafızada tut
                    }
                });

                gridLayout.addView(koltukBtn);
            }
        }

        btnOnayla.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (!secilenKoltukNo.isEmpty()) {
                    android.content.SharedPreferences prefs = getSharedPreferences("SinemaApp", MODE_PRIVATE);
                    int gercekMusteriId = prefs.getInt("MusteriID", -1);

                    if (gercekMusteriId == -1) {
                        Toast.makeText(MainActivity.this, "Oturum hatası! Lütfen tekrar giriş yapın.", Toast.LENGTH_SHORT).show();
                        return;
                    }

                    BiletIstek istek = new BiletIstek(1, gercekMusteriId, secilenKoltukNo);
                    biletKaydet(istek);
                    dialog.dismiss();
                } else {
                    Toast.makeText(MainActivity.this, "Lütfen haritadan bir koltuk seçin!", Toast.LENGTH_SHORT).show();
                }
            }
        });

        if (dialog.getWindow() != null) {
            dialog.getWindow().setBackgroundDrawableResource(android.R.color.transparent);
        }

        dialog.show();
    }

    private void biletKaydet(BiletIstek istek) {
        // KAYNAK (REFERANS) BELİRTME: Retrofit Asenkron İstek (Enqueue Callback) Mimarisi
        // Backend API'sine JSON verisi göndermek ve sonucu arka planda dinlemek için
        // Square Retrofit kütüphanesinin standart Callback yapısı kullanılmıştır.
        // Kaynak URL: https://square.github.io/retrofit/
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

    private void filmleriGetir() {
        ApiService apiService = RetrofitClient.getService();
        Call<List<Film>> call = apiService.getFilmler();

        call.enqueue(new Callback<List<Film>>() {
            @Override
            public void onResponse(Call<List<Film>> call, Response<List<Film>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    filmListesi = response.body();

                    adapter = new FilmAdapter(filmListesi, new FilmAdapter.OnItemClickListener() {
                        @Override
                        public void onItemClick(Film film) {
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