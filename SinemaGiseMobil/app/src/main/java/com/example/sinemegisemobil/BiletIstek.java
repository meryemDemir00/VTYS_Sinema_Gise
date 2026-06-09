package com.example.sinemegisemobil;

public class BiletIstek {
    private int SeansID;
    private int MusteriID;
    private String KoltukNo;

    public BiletIstek(int seansID, int musteriID, String koltukNo) {
        this.SeansID = seansID;
        this.MusteriID = musteriID;
        this.KoltukNo = koltukNo;
    }
}