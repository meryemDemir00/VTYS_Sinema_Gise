package com.example.sinemegisemobil;

import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class RetrofitClient {

    // Emulator'den kendi bilgisayarımızın localhost'una erişmek için 10.0.2.2 kullanıyoruz
    private static final String BASE_URL = "http://10.0.2.2:3000/";
    private static Retrofit retrofit = null;

    public static ApiService getService() {
        if (retrofit == null) {
            retrofit = new Retrofit.Builder()
                    .baseUrl(BASE_URL)
                    .addConverterFactory(GsonConverterFactory.create()) // JSON verisini Java objesine çevirir
                    .build();
        }
        return retrofit.create(ApiService.class);
    }
}