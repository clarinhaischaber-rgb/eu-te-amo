package com.example.eu_te_amo_api.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.eu_te_amo_api.model.Foto;
import com.example.eu_te_amo_api.repository.FotoRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
import java.io.IOException;
import java.util.Map;

@Service
public class FotoService {

    private final FotoRepository fotoRepository;
    private final Cloudinary cloudinary;

    public FotoService(FotoRepository fotoRepository, Cloudinary cloudinary) {
        this.fotoRepository = fotoRepository;
        this.cloudinary = cloudinary;
    }

    


    public List<Foto> listarTodas() {
        // Primeiro limpa fotos inconsistentes automaticamente
        System.out.println("Iniciando limpeza automática de fotos inconsistentes...");
        int removidas = limparFotosInconsistentes();
        System.out.println("Limpeza concluída. " + removidas + " fotos removidas.");
        return fotoRepository.findAll();
    }

    public List<Long> listarIds() {
        return fotoRepository.findAllIds();
    }
    /**
     * Faz upload para o Cloudinary e salva a URL e o publicId no PostgreSQL.
     */
    @SuppressWarnings("unchecked")
    public Foto uploadESalvar(MultipartFile arquivo) throws IOException {
        // Envia o ficheiro para o Cloudinary
        Map<String, Object> uploadResult = cloudinary.uploader().upload(
                arquivo.getBytes(),
                ObjectUtils.emptyMap()
        );

        // Extrai a URL pública e o public_id
        String url = (String) uploadResult.get("secure_url");
        String publicId = (String) uploadResult.get("public_id");

        // Valida se o upload funcionou corretamente
        if (url == null || publicId == null) {
            throw new IOException("Upload para Cloudinary falhou: URL ou publicId nulo");
        }

        // Instancia a entidade e persiste
        Foto foto = new Foto();
        foto.setUrl(url);
        foto.setPublicId(publicId);

        return fotoRepository.save(foto);
    }

    /**
     * Remove o ficheiro do Cloudinary e apaga do banco de dados.
     */
    public void deletarFoto(Long id) throws IOException {
        Foto foto = fotoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Foto não encontrada com o id: " + id));

        // Deleta no Cloudinary pelo public_id
        cloudinary.uploader().destroy(foto.getPublicId(), ObjectUtils.emptyMap());

        // Apaga a linha da tabela Fotos
        fotoRepository.delete(foto);
    }

    /**
     * Remove fotos do banco que não existem mais no Cloudinary (inconsistência)
     */
    public int limparFotosInconsistentes() {
        List<Foto> todasFotos = fotoRepository.findAll();
        int contador = 0;

        for (Foto foto : todasFotos) {
            try {
                // Tenta verificar se a imagem existe no Cloudinary via API
                cloudinary.api().resource(foto.getPublicId(), ObjectUtils.emptyMap());
                System.out.println("Foto OK - ID: " + foto.getId() + " - PublicId: " + foto.getPublicId());
            } catch (Exception e) {
                // Se der erro, a imagem não existe no Cloudinary, remove do banco
                System.out.println("Removendo foto inconsistente ID: " + foto.getId() + " - PublicId: " + foto.getPublicId() + " - Erro: " + e.getMessage());
                fotoRepository.delete(foto);
                contador++;
            }
        }

        return contador;
    }
}