package com.example.eu_te_amo_api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Entidade que representa um desenho feito no Canvas e salvo na galeria.
 * Mapeia os dados armazenados na tabela 'desenhos' do PostgreSQL.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "desenhos")
public class Desenho {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // URL da imagem gerada e hospedada no Cloudinary
    @Column(nullable = false)
    private String url;

    // Identificador público do Cloudinary para permitir a exclusão da imagem do servidor de mídia
    @Column(nullable = false)
    private String publicId;

    // Título opcional atribuído ao desenho
    private String titulo;

    // Data e hora em que o desenho foi criado/salvo
    @Column(nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    /**
     * Define automaticamente a data de criação antes de persistir o registro no banco de dados.
     */
    @PrePersist
    public void prePersist() {
        this.criadoEm = LocalDateTime.now();
    }
}