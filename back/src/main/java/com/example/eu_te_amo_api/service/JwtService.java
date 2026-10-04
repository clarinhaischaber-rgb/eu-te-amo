
package com.example.eu_te_amo_api.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    @Value("${application.security.jwt.expiration}")
    private long jwtExpiration;

    // Gera a chave secreta
    private SecretKey getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // Gera o token JWT
    public String generateToken(UserDetails userDetails) {
        return generateToken(Map.of(), userDetails);
    }

    // Gera o token com claims adicionais
    public String generateToken(
            Map<String, Object> extraClaims,
            UserDetails userDetails
    ) {
        long currentTime = System.currentTimeMillis();

        return Jwts.builder()
                .claims(extraClaims)
                .subject(userDetails.getUsername())
                .issuedAt(new Date(currentTime))
                .expiration(new Date(currentTime + jwtExpiration))
                .signWith(getSignInKey())
                .compact();
    }

    // Extrai o username (subject)
    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Extrai a data de expiração
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Extrai um claim específico
    public <T> T extractClaim(
            String token,
            Function<Claims, T> claimsResolver
    ) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Extrai todos os claims
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignInKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // Verifica se o token está expirado
    private boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (ExpiredJwtException | JwtException | IllegalArgumentException e) {
            return true;
        }
    }

    // Valida o token
    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            final String username = extractUsername(token);

            return username.equals(userDetails.getUsername())
                    && !isTokenExpired(token);

        } catch (ExpiredJwtException | JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}