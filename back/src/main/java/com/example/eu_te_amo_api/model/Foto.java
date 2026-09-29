package com.example.eu_te_amo_api.model;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "Fotos")
public class Foto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String url;

    @Column(nullable = false)
    private String publicId;
}