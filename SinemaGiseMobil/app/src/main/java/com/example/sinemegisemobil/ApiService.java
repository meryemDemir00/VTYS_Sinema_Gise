package com.example.sinemegisemobil;

import java.util.List;
import okhttp3.ResponseBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;

public interface ApiService {

    // Okuma (GET) İşlemi
    @GET("api/filmler")
    Call<List<Film>> getFilmler();

    // Yazma (POST) İşlemi - Yeni bilet ekler
    @POST("api/biletler")
    Call<ResponseBody> biletAl(@Body BiletIstek bilet);

    // Patron Hasılat Raporunu Getirir
    @GET("api/rapor/hasilat")
    Call<List<Rapor>> getHasilatRaporu();
}