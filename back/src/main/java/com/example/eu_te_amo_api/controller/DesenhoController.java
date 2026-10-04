package com.example.eu_te_amo_api.controller;

import com.example.eu_te_amo_api.dto.response.DesenhoResponseDTO;
import com.example.eu_te_amo_api.service.DesenhoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * Endpoints REST para gerenciamento dos desenhos da galeria.
 */
@RestController
@RequestMapping("/api/desenhos")
public class DesenhoController {

    private final DesenhoService desenhoService;

    public DesenhoController(DesenhoService desenhoService) {
        this.desenhoService = desenhoService;
    }

    /**
     * Endpoint público para listar todos os desenhos salvos (Acessível por Visitantes e Logados).
     */
    @GetMapping
    public ResponseEntity<List<DesenhoResponseDTO>> listarTodos() {
        List<DesenhoResponseDTO> desenhos = desenhoService.listarTodos();
        return ResponseEntity.ok(desenhos);
    }

    /**
     * Endpoint protegido para criar e salvar um novo desenho enviando imagem multipart/form-data.
     */
    @PostMapping
    public ResponseEntity<DesenhoResponseDTO> salvar(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "titulo", required = false) String titulo) throws IOException {
        DesenhoResponseDTO novoDesenho = desenhoService.salvar(file, titulo);
        return ResponseEntity.status(HttpStatus.CREATED).body(novoDesenho);
    }

    /**
     * Endpoint protegido para deletar um desenho existente por seu ID.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) throws IOException {
        desenhoService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}