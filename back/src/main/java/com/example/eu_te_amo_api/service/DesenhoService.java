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
import java.util.stream.Collectors;

/**
 * Camada de serviço responsável pelas regras de negócio dos desenhos,
 * integrando upload/exclusão de mídia no Cloudinary e persistência no banco.
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
     * Faz o upload da imagem do desenho para o Cloudinary e salva os metadados no banco.
     */
    public DesenhoResponseDTO salvar(MultipartFile file, String titulo) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("O arquivo de imagem do desenho é obrigatório.");
        }

        // Upload do arquivo PNG do Canvas para o Cloudinary sob a pasta 'desenhos'
        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap("folder", "desenhos")
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
     * Remove a imagem hospedada no Cloudinary e deleta o registro correspondente do banco.
     */
    public void deletar(Long id) throws IOException {
        Desenho desenho = desenhoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Desenho não encontrado com o ID: " + id));

        // Exclui a imagem do armazenamento do Cloudinary usando o public_id registrado
        cloudinary.uploader().destroy(desenho.getPublicId(), ObjectUtils.emptyMap());

        // Remove o registro da tabela
        desenhoRepository.delete(desenho);
    }
}