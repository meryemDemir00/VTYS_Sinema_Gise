package com.example.sinemegisemobil;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import java.util.List;

public class FilmAdapter extends RecyclerView.Adapter<FilmAdapter.FilmViewHolder> {

    private List<Film> filmListesi;
    private OnItemClickListener listener; // Tıklama dinleyicisi eklendi

    // --- Tıklama için özel arayüz (Interface) ---
    public interface OnItemClickListener {
        void onItemClick(Film film);
    }

    // Constructor güncellendi
    public FilmAdapter(List<Film> filmListesi, OnItemClickListener listener) {
        this.filmListesi = filmListesi;
        this.listener = listener;
    }

    @NonNull
    @Override
    public FilmViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_film, parent, false);
        return new FilmViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull FilmViewHolder holder, int position) {
        Film siradakiFilm = filmListesi.get(position);

        holder.textFilmAd.setText(siradakiFilm.getAd());
        holder.textFilmTur.setText("Tür: " + siradakiFilm.getTur());
        holder.textFilmSure.setText("Süre: " + siradakiFilm.getSure() + " dk");

        // --- DİNAMİK AFİŞ KONTROLÜ ---
        // Veritabanından gelen film ismini küçük harfe çevirip içinde geçen kelimeyi arıyoruz
        String filmAdi = siradakiFilm.getAd().toLowerCase();
        int gorselId = R.mipmap.ic_launcher; // Bulamazsa varsayılan yeşil ikon

        // Senin drawable klasöründeki isimlerle eşleştiriyoruz
        if (filmAdi.contains("matrix")) gorselId = R.drawable.matrix;
        else if (filmAdi.contains("iron man")) gorselId = R.drawable.iron_man_afis;
        else if (filmAdi.contains("truman")) gorselId = R.drawable.thetrumanshow;
        else if (filmAdi.contains("it")) gorselId = R.drawable.it;
        else if (filmAdi.contains("devri")) gorselId = R.drawable.buz_devri_4_afis;
        else if (filmAdi.contains("dernek")) gorselId = R.drawable.dugun_dernek_afis;
        else if (filmAdi.contains("gilmore")) gorselId = R.drawable.gilmore_girls;

        // Seçilen afişi ekrandaki resim kutusuna yerleştir
        holder.imgAfis.setImageResource(gorselId);

        // --- KARTA TIKLANDIĞINDA ÇALIŞACAK KOD ---
        holder.itemView.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                listener.onItemClick(siradakiFilm);
            }
        });
    }

    @Override
    public int getItemCount() {
        return filmListesi != null ? filmListesi.size() : 0;
    }

    public static class FilmViewHolder extends RecyclerView.ViewHolder {
        TextView textFilmAd, textFilmTur, textFilmSure;
        ImageView imgAfis;

        public FilmViewHolder(@NonNull View itemView) {
            super(itemView);
            textFilmAd = itemView.findViewById(R.id.textFilmAd);
            textFilmTur = itemView.findViewById(R.id.textFilmTur);
            textFilmSure = itemView.findViewById(R.id.textFilmSure);
            imgAfis = itemView.findViewById(R.id.imgAfis);
        }
    }
}