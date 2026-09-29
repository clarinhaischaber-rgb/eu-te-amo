package com.example.eu_te_amo_api.repository;

import com.example.eu_te_amo_api.model.Foto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FotoRepository extends JpaRepository<Foto, Long> {

}