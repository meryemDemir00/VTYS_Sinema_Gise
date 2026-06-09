package com.example.sinemegisemobil;
import com.google.gson.annotations.SerializedName;

public class Rapor {
    @SerializedName("Film Adı")
    private String filmAdi;

    @SerializedName("Satılan Toplam Bilet")
    private int satilanBilet;

    @SerializedName("Toplam Hasılat (TL)")
    private int toplamHasilat;

    public String getFilmAdi() { return filmAdi; }
    public int getSatilanBilet() { return satilanBilet; }
    public int getToplamHasilat() { return toplamHasilat; }
}