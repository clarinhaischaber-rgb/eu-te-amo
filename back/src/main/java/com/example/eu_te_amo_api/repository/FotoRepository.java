package com.example.eu_te_amo_api.repository;

import com.example.eu_te_amo_api.model.Foto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FotoRepository extends JpaRepository<Foto, Long> {
    @Query("SELECT f.id FROM Foto f")
    List<Long> findAllIds();
}