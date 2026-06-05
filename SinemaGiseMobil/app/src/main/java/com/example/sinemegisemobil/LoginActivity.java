package com.example.sinemegisemobil;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import java.util.HashMap;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private EditText etIdentifier, etSifre;
    private Button btnLogin;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        // Arayüz elemanlarını bağlıyoruz
        etIdentifier = findViewById(R.id.etIdentifier);
        etSifre = findViewById(R.id.etSifre);
        btnLogin = findViewById(R.id.btnLogin);

        // Giriş butonuna tıklandığında...
        btnLogin.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                String identifier = etIdentifier.getText().toString().trim();
                String sifre = etSifre.getText().toString().trim();

                // Boş alan kontrolü
                if (identifier.isEmpty() || sifre.isEmpty()) {
                    Toast.makeText(LoginActivity.this, "Lütfen tüm alanları doldurun!", Toast.LENGTH_SHORT).show();
                    return;
                }

                // Node.js'e verileri gönder
                sunucuyaGirisYap(identifier, sifre);
            }
        });

        TextView tvKayitSayfasinaGit = findViewById(R.id.tvKayitSayfasinaGit);
        tvKayitSayfasinaGit.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(LoginActivity.this, RegisterActivity.class);
                startActivity(intent);
            }
        });
    }

    private void sunucuyaGirisYap(String identifier, String sifre) {
        HashMap<String, String> bilgiler = new HashMap<>();
        bilgiler.put("identifier", identifier);
        bilgiler.put("sifre", sifre);

        ApiService apiService = RetrofitClient.getService();
        Call<ResponseBody> call = apiService.girisYap(bilgiler);

        call.enqueue(new Callback<ResponseBody>() {
            @Override
            public void onResponse(Call<ResponseBody> call, Response<ResponseBody> response) {
                if (response.isSuccessful() && response.body() != null) {
                    try {
                        // Node.js'ten gelen JSON cevabını metin olarak okuyoruz
                        String jsonCevap = response.body().string();
                        org.json.JSONObject jsonObject = new org.json.JSONObject(jsonCevap);

                        // 1. "user" paketini açıp ID ve E-posta değerlerini alıyoruz
                        org.json.JSONObject userObjesi = jsonObject.getJSONObject("user");
                        int musteriId = userObjesi.getInt("id");
                        String musteriEmail = userObjesi.getString("email");

                        // 2. Android'in hafızasına (SharedPreferences) kaydediyoruz
                        android.content.SharedPreferences prefs = getSharedPreferences("SinemaApp", MODE_PRIVATE);
                        prefs.edit()
                                .putInt("MusteriID", musteriId)
                                .putString("MusteriEmail", musteriEmail)
                                .apply();

                        Toast.makeText(LoginActivity.this, "Giriş Başarılı! Hoş Geldiniz.", Toast.LENGTH_SHORT).show();

                        // Ana ekrana geçiş
                        Intent intent = new Intent(LoginActivity.this, MainActivity.class);
                        startActivity(intent);
                        finish();

                    } catch (Exception e) {
                        e.printStackTrace();
                        Toast.makeText(LoginActivity.this, "Veri okunurken hata oluştu!", Toast.LENGTH_SHORT).show();
                    }
                } else {
                    Toast.makeText(LoginActivity.this, "E-posta veya Şifre hatalı!", Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<ResponseBody> call, Throwable t) {
                Toast.makeText(LoginActivity.this, "Sunucu Bağlantı Hatası!", Toast.LENGTH_SHORT).show();
            }
        });
    }
}