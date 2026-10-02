package com.example.eu_te_amo_api.service;

import com.example.eu_te_amo_api.model.Carta;
import com.example.eu_te_amo_api.repository.CartaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CartaService {

    private final CartaRepository cartaRepository;

    public CartaService(CartaRepository cartaRepository) {
        this.cartaRepository = cartaRepository;
    }

    public List<Carta> listarTodas() {
        return cartaRepository.findAll();
    }

    public Carta buscarPorId(Long id) {
        return cartaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Carta não encontrada com o id: " + id));
    }

    public Carta criar(Carta carta) {
        carta.setId(null);
        return cartaRepository.save(carta);
    }

    public Carta atualizar(Long id, Carta dados) {
        Carta carta = buscarPorId(id);
        carta.setText(dados.getText());
        carta.setDestinatario(dados.getDestinatario());
        carta.setData(dados.getData());
        carta.setCorCarta(dados.getCorCarta());
        carta.setCorLetra(dados.getCorLetra());
        carta.setFonte(dados.getFonte());
        return cartaRepository.save(carta);
    }

    public void deletar(Long id) {
        Carta carta = buscarPorId(id);
        cartaRepository.delete(carta);
    }
}
