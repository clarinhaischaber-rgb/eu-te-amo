package com.example.eu_te_amo_api.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.eu_te_amo_api.model.Foto;
import com.example.eu_te_amo_api.repository.FotoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class FotoService {

    private final FotoRepository fotoRepository;
    private final Cloudinary cloudinary;

    public FotoService(FotoRepository fotoRepository, Cloudinary cloudinary) {
        this.fotoRepository = fotoRepository;
        this.cloudinary = cloudinary;
    }

    @Transactional(readOnly = true)
    public List<Foto> listarTodas() {
        // REMOVIDO: chamadas automáticas a 'limparFotosInconsistentes()' e 'removerDuplicatas()'
        // para evitar lentidão extrema e excesso de requisições à API do Cloudinary.
        return fotoRepository.findAll();
    }

    public List<Long> listarIds() {
        return fotoRepository.findAllIds();
    }

    @SuppressWarnings("unchecked")
    public Foto uploadESalvar(MultipartFile arquivo) throws IOException {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IOException("Arquivo de imagem vazio");
        }

        String publicId = "foto_" + UUID.randomUUID().toString().replace("-", "");
        Path tempFile = Files.createTempFile(publicId + "-", ".jpg");

        try {
            Files.write(tempFile, arquivo.getBytes());

            Map<String, Object> options = new HashMap<>();
            options.put("public_id", publicId);
            options.put("overwrite", false);
            options.put("unique_filename", true);
            options.put("use_filename", false);
            options.put("resource_type", "image");
            options.put("filename_override", publicId + ".jpg");

            Map<String, Object> uploadResult = cloudinary.uploader().upload(tempFile.toFile(), options);

            String url = (String) uploadResult.get("secure_url");
            String cloudinaryPublicId = (String) uploadResult.get("public_id");

            if (url == null || cloudinaryPublicId == null) {
                throw new IOException("Upload para Cloudinary falhou: URL ou publicId nulo");
            }

            System.out.println("Upload Cloudinary OK - public_id=" + cloudinaryPublicId + " url=" + url);

            Foto foto = new Foto();
            foto.setUrl(url);
            foto.setPublicId(cloudinaryPublicId);
            return fotoRepository.save(foto);
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    // NOVO: Método para processar múltiplos uploads no backend
    @Transactional
    public List<Foto> uploadESalvarMultiplas(List<MultipartFile> arquivos) throws IOException {
        if (arquivos == null || arquivos.isEmpty()) {
            throw new IOException("Nenhum arquivo enviado");
        }

        List<Foto> fotosSalvas = new ArrayList<>();
        for (MultipartFile arquivo : arquivos) {
            if (arquivo != null && !arquivo.isEmpty()) {
                Foto foto = uploadESalvar(arquivo);
                fotosSalvas.add(foto);
            }
        }
        return fotosSalvas;
    }

    public void deletarFoto(Long id) throws IOException {
        Foto foto = fotoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Foto não encontrada com o id: " + id));

        String publicId = foto.getPublicId();
        long remainingWithSamePublicId = fotoRepository.countByPublicId(publicId);

        fotoRepository.delete(foto);

        if (remainingWithSamePublicId <= 1 && publicId != null && !publicId.isBlank()) {
            System.out.println("Deletando foto do Cloudinary: " + publicId);
            Map<String, Object> result = cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            System.out.println("Resultado do delete Cloudinary: " + result);
        }
    }

    // Mantido como utilitário manual (não chamado a cada requisição GET)
    public int limparFotosInconsistentes() {
        List<Foto> todasFotos = fotoRepository.findAll();
        int contador = 0;

        for (Foto foto : todasFotos) {
            try {
                cloudinary.api().resource(foto.getPublicId(), ObjectUtils.emptyMap());
            } catch (Exception e) {
                System.out.println("Removendo foto inconsistente ID: " + foto.getId()
                        + " - PublicId: " + foto.getPublicId() + " - Erro: " + e.getMessage());
                fotoRepository.delete(foto);
                contador++;
            }
        }

        return contador;
    }

    // Mantido como utilitário manual
    public int removerDuplicatas() {
        List<Foto> todasFotos = fotoRepository.findAll();
        Set<String> vistos = new HashSet<>();
        int removidas = 0;

        for (Foto foto : todasFotos) {
            String chave = foto.getPublicId();
            if (chave == null || chave.isBlank()) {
                chave = foto.getUrl();
            }
            if (!vistos.add(chave)) {
                System.out.println("Removendo duplicata ID: " + foto.getId() + " publicId=" + foto.getPublicId());
                fotoRepository.delete(foto);
                removidas++;
            }
        }

        return removidas;
    }
}