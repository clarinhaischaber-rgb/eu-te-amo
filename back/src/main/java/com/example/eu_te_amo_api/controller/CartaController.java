package com.example.eu_te_amo_api.controller;

import com.example.eu_te_amo_api.model.Carta;
import com.example.eu_te_amo_api.service.CartaService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cartas")
public class CartaController {

    private final CartaService cartaService;

    public CartaController(CartaService cartaService) {
        this.cartaService = cartaService;
    }

    @GetMapping
    public ResponseEntity<List<Carta>> listarTodas() {
        return ResponseEntity.ok(cartaService.listarTodas());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Carta> buscarPorId(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(cartaService.buscarPorId(id));
        } catch (RuntimeException exception) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Carta> criar(@RequestBody Carta carta) {
        return ResponseEntity.status(HttpStatus.CREATED).body(cartaService.criar(carta));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Carta> atualizar(@PathVariable Long id, @RequestBody Carta carta) {
        try {
            return ResponseEntity.ok(cartaService.atualizar(id, carta));
        } catch (RuntimeException exception) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Long id) {
        try {
            cartaService.deletar(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException exception) {
            return ResponseEntity.notFound().build();
        }
    }
}
