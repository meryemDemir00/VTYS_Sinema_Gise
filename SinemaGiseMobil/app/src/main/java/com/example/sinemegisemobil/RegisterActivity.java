package com.example.sinemegisemobil;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import java.util.HashMap;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RegisterActivity extends AppCompatActivity {

    private EditText etAd, etSoyad, etTelefon, etEmail, etKayitSifre;
    private Button btnKayitOl;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_register);

        etAd = findViewById(R.id.etAd);
        etSoyad = findViewById(R.id.etSoyad);
        etTelefon = findViewById(R.id.etTelefon);
        etEmail = findViewById(R.id.etEmail);
        etKayitSifre = findViewById(R.id.etKayitSifre);
        btnKayitOl = findViewById(R.id.btnKayitOl);

        btnKayitOl.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String ad = etAd.getText().toString().trim();
                String soyad = etSoyad.getText().toString().trim();
                String telefon = etTelefon.getText().toString().trim();
                String email = etEmail.getText().toString().trim();
                String sifre = etKayitSifre.getText().toString().trim();

                // KAYNAK (REFERANS) BELİRTME: Temel Form Doğrulama (Validation)
                // Kullanıcı girdilerinin boş olup olmadığını kontrol eden bu standart algoritma yapısı
                // Android UI form dizayn standartları ve Java String API dökümantasyonundan referans alınmıştır.
                // Kaynak URL: https://developer.android.com/training/adding-an-app-bar/action-views
                if (ad.isEmpty() || soyad.isEmpty() || telefon.isEmpty() || email.isEmpty() || sifre.isEmpty()) {
                    Toast.makeText(RegisterActivity.this, "Tüm alanları doldurunuz!", Toast.LENGTH_SHORT).show();
                    return;
                }

                sunucuyaKayitOl(ad, soyad, telefon, email, sifre);
            }
        });
    }

    private void sunucuyaKayitOl(String ad, String soyad, String telefon, String email, String sifre) {
        // KAYNAK (REFERANS) BELİRTME: HashMap ile Dinamik İstek Gövdesi Oluşturma
        // Retrofit servislerine post verilerini anahtar-değer (Key-Value) çiftleri halinde göndermek için
        // kullanılan bu yöntem, Java Collections ve Retrofit dökümantasyonlarından uyarlanmıştır.
        // Kaynak URL: https://square.github.io/retrofit/
        HashMap<String, String> bilgiler = new HashMap<>();
        bilgiler.put("ad", ad);
        bilgiler.put("soyad", soyad);
        bilgiler.put("telefon", telefon);
        bilgiler.put("email", email);
        bilgiler.put("sifre", sifre);

        ApiService apiService = RetrofitClient.getService();
        Call<ResponseBody> call = apiService.kayitOl(bilgiler);

        // KAYNAK (REFERANS) BELİRTME: Retrofit Asenkron İstek Mekanizması (Callback)
        // Ağ operasyonlarının Android ana arayüz iş parçacığını (Main Thread) kilitlememesi için
        // arka planda kuyruğa alınması (enqueue) işlemi Retrofit kütüphanesinin standart şablonudur.
        // Kaynak URL: https://futurestud.io/tutorials/retrofit-2-how-to-run-network-requests-synchronously-or-asynchronously
        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful()) {
                    Toast.makeText(RegisterActivity.this, "Kayıt Başarılı! Giriş yapabilirsiniz.", Toast.LENGTH_LONG).show();

                    // KAYNAK (REFERANS) BELİRTME: Aktivite Yaşam Döngüsü ve Ekran Kapatma (finish)
                    // Başarılı bir kayıttan sonra mevcut kayıt ekranının Android bellek yığınından (Backstack)
                    // temizlenerek kapatılması Android Activity Lifecycle dökümantasyonuna dayanmaktadır.
                    // Kaynak URL: https://developer.android.com/guide/components/activities/activity-lifecycle
                    finish();
                } else {
                    Toast.makeText(RegisterActivity.this, "Kayıt başarısız oldu: " + response.code(), Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(RegisterActivity.this, "Bağlantı Hatası!", Toast.LENGTH_SHORT).show();
            }
        });
    }
}