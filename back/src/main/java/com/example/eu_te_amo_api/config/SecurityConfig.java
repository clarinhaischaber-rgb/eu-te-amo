package com.example.eu_te_amo_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
            // Desativa CSRF (necessário para receber requisições POST de ferramentas externas como Postman/Insomnia)
            .csrf(AbstractHttpConfigurer::disable)
            
            // Configura as regras de acesso aos endpoints
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/fotos/**").permitAll() // Libera os endpoints de fotos sem exigir login
                .anyRequest().authenticated()                 // Exige autenticação para o resto
            );

        return http.build();
    }
}