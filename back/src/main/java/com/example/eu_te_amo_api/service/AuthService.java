package com.example.eu_te_amo_api.service;

import com.example.eu_te_amo_api.dto.request.LoginRequestDTO;
import com.example.eu_te_amo_api.dto.response.LoginResponseDTO;
import com.example.eu_te_amo_api.model.User;
import com.example.eu_te_amo_api.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            JwtService jwtService,
            PasswordEncoder passwordEncoder
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
    }

    // Método temporário para redefinir as hashes das senhas no Supabase com o BCrypt nativo
    private void fixPasswords() {
        userRepository.findByEmail("limadeandradejoaopedro@gmail.com").ifPresent(user -> {
            user.setPassword(passwordEncoder.encode("Spop11pvp#"));
            userRepository.save(user);
        });

        userRepository.findByEmail("clarinha.ischaber@icloud.com").ifPresent(user -> {
                user.setDisplayName("Iamthecaosinhapolar"); // Nome de exibição
                user.setPassword(passwordEncoder.encode("Teoryofchaos2267")); // Senha real
                userRepository.save(user);
        });
    }

    public LoginResponseDTO login(LoginRequestDTO request) {
        // 0. Executa o ajuste automático das senhas no primeiro pedido de login
        fixPasswords();

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