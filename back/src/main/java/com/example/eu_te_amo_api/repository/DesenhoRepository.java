package com.example.eu_te_amo_api.repository;

import com.example.eu_te_amo_api.model.Desenho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repositório Spring Data JPA para operações de banco de dados na entidade Desenho.
 */
@Repository
public interface DesenhoRepository extends JpaRepository<Desenho, Long> {

    /**
     * Busca todos os desenhos ordenados da criação mais recente para a mais antiga.
     */
    List<Desenho> findAllByOrderByCriadoEmDesc();

    /**
     * Consulta leve que retorna apenas a lista de IDs de todos os desenhos salvos,
     * ordenados do mais recente para o mais antigo.
     */
    @Query("SELECT d.id FROM Desenho d ORDER BY d.id DESC")
    List<Long> findAllIds();
}