package com.example.eu_te_amo_api.model;

import com.example.eu_te_amo_api.model.enums.CorCarta;
import com.example.eu_te_amo_api.model.enums.CorLetra;
import com.example.eu_te_amo_api.model.enums.FonteCarta;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDate;

@Data
@Entity
@Table(name = "Cartas")
public class Carta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String text;

    @Column(nullable = false)
    private String destinatario;

    @Column(name = "data_carta", nullable = false)
    private LocalDate data;

    @Enumerated(EnumType.STRING)
    @Column(name = "cor_carta", nullable = false)
    private CorCarta corCarta;

    @Enumerated(EnumType.STRING)
    @Column(name = "cor_letra", nullable = false)
    private CorLetra corLetra;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FonteCarta fonte;

    @PrePersist
    private void definirDataPadrao() {
        if (data == null) {
            data = LocalDate.now();
        }
    }
}
