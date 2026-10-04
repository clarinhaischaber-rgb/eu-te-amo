package com.example.eu_te_amo_api.dto.response;

import com.example.eu_te_amo_api.model.Desenho;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTO para envio dos dados do desenho ao frontend de forma estruturada.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DesenhoResponseDTO {

    private Long id;
    private String url;
    private String publicId;
    private String titulo;
    private LocalDateTime criadoEm;

    /**
     * Método utilitário para converter a entidade Desenho no DTO de resposta.
     */
    public static DesenhoResponseDTO fromEntity(Desenho desenho) {
        return DesenhoResponseDTO.builder()
                .id(desenho.getId())
                .url(desenho.getUrl())
                .publicId(desenho.getPublicId())
                .titulo(desenho.getTitulo())
                .criadoEm(desenho.getCriadoEm())
                .build();
    }
}