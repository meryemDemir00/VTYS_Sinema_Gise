package com.example.sinemegisemobil;
import com.google.gson.annotations.SerializedName;

public class Rapor {
    // SQL'deki kolon adını birebir yazıyoruz, Java'da istediğimiz ismi veriyoruz
    @SerializedName("Film Adı")
    private String filmAdi;

    @SerializedName("Satılan Toplam Bilet")
    private int satilanBilet;

    @SerializedName("Toplam Hasılat (TL)")
    private int toplamHasilat;

    // Getter Metotları
    public String getFilmAdi() { return filmAdi; }
    public int getSatilanBilet() { return satilanBilet; }
    public int getToplamHasilat() { return toplamHasilat; }
}