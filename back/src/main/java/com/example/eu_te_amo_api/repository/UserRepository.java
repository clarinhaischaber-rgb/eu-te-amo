package com.example.eu_te_amo_api.repository;

import com.example.eu_te_amo_api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Busca o usuário pelo e-mail para validar o login
    // O Optional evita o erro de NullPointerException se o e-mail não existir
    Optional<User> findByEmail(String email);

    // Verifica se já existe um utilizador cadastrado com o e-mail informado
    boolean existsByEmail(String email);
}