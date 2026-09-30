package com.example.eu_te_amo_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Ativa o CORS para ler as origens permitidas na WebConfig.java
            .cors(Customizer.withDefaults())
            
            // Desativa CSRF para APIs REST sem sessão de cookie
            .csrf(AbstractHttpConfigurer::disable)
            
            // Regras de autorização
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/fotos/**").permitAll() // Libera acesso público às fotos
                .anyRequest().permitAll()                     // Libera os demais endpoints públicos
            );

        return http.build();
    }
}