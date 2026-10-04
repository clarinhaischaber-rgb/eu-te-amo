package com.example.eu_te_amo_api.service;

import com.example.eu_te_amo_api.dto.request.LoginRequestDTO;
import com.example.eu_te_amo_api.dto.response.LoginResponseDTO;
import com.example.eu_te_amo_api.model.User;
import com.example.eu_te_amo_api.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            JwtService jwtService
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public LoginResponseDTO login(LoginRequestDTO request) {
        // Limpa espaços extras e padroniza para minúsculas
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";

        // 1. O Spring Security valida as credenciais
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        cleanEmail,
                        request.getPassword()
                )
        );

        // 2. Procura o utilizador na base de dados
        User user = userRepository.findByEmail(cleanEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Utilizador não encontrado"));

        // 3. Gera o token JWT para o utilizador
        String jwtToken = jwtService.generateToken(user);

        // 4. Retorna a resposta completa com o token e os dados básicos
        return LoginResponseDTO.builder()
                .token(jwtToken)
                .id(user.getId())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .build();
    }
}