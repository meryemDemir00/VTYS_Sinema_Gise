package com.example.sinemegisemobil;

import com.google.gson.annotations.SerializedName;

public class Film {
    @SerializedName("FilmID")
    private int id;

    @SerializedName("FilmAd")
    private String ad;

    @SerializedName("Tur")
    private String tur;

    @SerializedName("Sure")
    private int sure;

    public int getId() { return id; }
    public String getAd() { return ad; }
    public String getTur() { return tur; }
    public int getSure() { return sure; }
}