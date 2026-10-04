package com.example.eu_te_amo_api.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.eu_te_amo_api.dto.response.DesenhoResponseDTO;
import com.example.eu_te_amo_api.model.Desenho;
import com.example.eu_te_amo_api.repository.DesenhoRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Camada de serviço responsável pelas regras de negócio dos desenhos.
 */
@Service
public class DesenhoService {

    private final DesenhoRepository desenhoRepository;
    private final Cloudinary cloudinary;

    public DesenhoService(DesenhoRepository desenhoRepository, Cloudinary cloudinary) {
        this.desenhoRepository = desenhoRepository;
        this.cloudinary = cloudinary;
    }

    /**
     * Retorna a lista completa de desenhos para a galeria, ordenados do mais recente ao mais antigo.
     */
    public List<DesenhoResponseDTO> listarTodos() {
        return desenhoRepository.findAllByOrderByCriadoEmDesc()
                .stream()
                .map(DesenhoResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Retorna apenas a lista de IDs de todos os desenhos para validação leve de cache no frontend.
     */
    public List<Long> listarTodosIds() {
        return desenhoRepository.findAllIds();
    }

    /**
     * Faz o upload da imagem do desenho para o Cloudinary e salva os metadados no banco.
     * Define um public_id único baseado em UUID para evitar colisões e sobrescritas.
     */
    public DesenhoResponseDTO salvar(MultipartFile file, String titulo) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de imagem do desenho é obrigatório.");
        }

        // Geração de um identificador único exclusivo para cada imagem do desenho
        String publicIdUnico = "desenhos/desenho_" + UUID.randomUUID();

        // Upload do arquivo do Canvas utilizando o upload_preset 'desenhos'
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                        "public_id", publicIdUnico,
                        "upload_preset", "desenhos",
                        "overwrite", true
                )
        );

        String url = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");

        // Criação e salvamento da entidade
        Desenho novoDesenho = Desenho.builder()
                .url(url)
                .publicId(publicId)
                .titulo(titulo != null && !titulo.isBlank() ? titulo.trim() : "Sem título")
                .build();

        Desenho desenhoSalvo = desenhoRepository.save(novoDesenho);
        return DesenhoResponseDTO.fromEntity(desenhoSalvo);
    }

    /**
     * Remove a imagem do Cloudinary e deleta o registro no banco.
     */
    public void deletar(Long id) throws IOException {
        Desenho desenho = desenhoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Desenho não encontrado com o ID: " + id));

        // Exclui a imagem do armazenamento do Cloudinary usando o public_id único registrado
        cloudinary.uploader().destroy(desenho.getPublicId(), ObjectUtils.emptyMap());

        // Remove o registro da tabela
        desenhoRepository.delete(desenho);
    }
}