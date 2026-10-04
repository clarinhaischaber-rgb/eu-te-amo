
package com.example.eu_te_amo_api.config;

import com.example.eu_te_amo_api.repository.UserRepository;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserRepository userRepository;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthFilter,
            UserRepository userRepository
    ) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userRepository = userRepository;
    }

    // Configuração principal do Spring Security
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            .csrf(csrf -> csrf.disable())

            .authorizeHttpRequests(auth -> auth
                // Login e autenticação liberados
                .requestMatchers("/api/auth/**").permitAll()

                // LEITURA PÚBLICA (Qualquer pessoa pode ver fotos e cartas)
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/fotos/**").permitAll()// podem ver fotos
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/cartas/**").permitAll()// podem ver cartas
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/desenhos/**").permitAll()// podem ver desenhos

                // MODIFICAÇÕES (Exigem login com token JWT)
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/fotos/**").authenticated()//publicar foto
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/fotos/**").authenticated()//editar foto
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/fotos/**").authenticated()// deletar foto

                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/cartas/**").authenticated()// criar carta
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/api/cartas/**").authenticated()// editar carta
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/cartas/**").authenticated()// excluir carta

                .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/desenhos/**").authenticated()// criar desenho
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/api/desenhos/**").authenticated()// excluir desenho

                .anyRequest().authenticated()
            )

            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )

            .authenticationProvider(authenticationProvider())

            .addFilterBefore(
                jwtAuthFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    // Busca o usuário pelo e-mail
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByEmail(username)
            .orElseThrow(() ->
                new UsernameNotFoundException(
                    "Usuário não encontrado: " + username
                )
            );
    }

    // Codificação de senhas
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // Provedor de autenticação
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService());

        provider.setPasswordEncoder(passwordEncoder());

        return provider;
    }

    // Gerenciador de autenticação
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config
    ) throws Exception {
        return config.getAuthenticationManager();
    }

    // Configuração do CORS
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        // Origens explícitas
        configuration.setAllowedOrigins(List.of(
            "https://clarinhaischaber-rgb.github.io",
            "http://localhost:5500",
            "http://127.0.0.1:5500",
            "http://localhost:3000",
            "http://localhost:8081"
        ));

        configuration.setAllowedMethods(List.of(
            "GET", "POST", "PUT", "DELETE", "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of(
            "Authorization",
            "Content-Type",
            "X-Requested-With",
            "Accept"
        ));

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}