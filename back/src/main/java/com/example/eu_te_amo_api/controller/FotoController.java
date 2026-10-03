package com.example.eu_te_amo_api.controller;

import com.example.eu_te_amo_api.model.Foto;
import com.example.eu_te_amo_api.service.FotoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@RestController
@RequestMapping("/api/fotos")
public class FotoController {

    private final FotoService fotoService;

    public FotoController(FotoService fotoService) {
        this.fotoService = fotoService;
    }

    @GetMapping
    public ResponseEntity<List<Foto>> listarTodasFotos() {
        List<Foto> fotos = fotoService.listarTodas();
        return ResponseEntity.ok(fotos);
    }

    @GetMapping("/ids")
    public ResponseEntity<List<Long>> listarIdsFotos() {
        List<Long> ids = fotoService.listarIds();
        return ResponseEntity.ok(ids);
    }

    // Endpoint para upload de arquivo único
    @PostMapping(value = "/upload", consumes = "multipart/form-data") 
    public ResponseEntity<Foto> uploadFoto(@RequestParam("foto") MultipartFile arquivo) {
        try {
            Foto fotoSalva = fotoService.uploadESalvar(arquivo);
            return ResponseEntity.status(HttpStatus.CREATED).body(fotoSalva);
        } catch (Exception e) {
            System.err.println("Erro no upload de foto: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // NOVO: Endpoint para envio de múltiplas fotos em lote único
    @PostMapping(value = "/upload-multiple", consumes = "multipart/form-data") 
    public ResponseEntity<List<Foto>> uploadFotos(@RequestParam("fotos") List<MultipartFile> arquivos) {
        try {
            List<Foto> fotosSalvas = fotoService.uploadESalvarMultiplas(arquivos);
            return ResponseEntity.status(HttpStatus.CREATED).body(fotosSalvas);
        } catch (Exception e) {
            System.err.println("Erro no upload múltiplo de fotos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletarFoto(@PathVariable Long id) {
        try {
            fotoService.deletarFoto(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}