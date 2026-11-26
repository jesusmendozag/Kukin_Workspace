package com.naatlabs.kukin.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.function.Function;

@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);
    private static final int MIN_SECRET_BYTES = 32; // HS256 exige mínimo 256 bits

    @Value("${kukin.jwt.secret:}")
    private String secret;

    @Value("${kukin.jwt.expiration-seconds:3600}")
    private long expirationSeconds;

    @Value("${kukin.jwt.allow-random-secret:false}")
    private boolean allowRandomSecret;

    private Key signingKey;

    /**
     * Se valida el secreto al arrancar: así el servidor falla de inmediato con un mensaje claro
     * en lugar de fallar en el primer inicio de sesión.
     */
    @PostConstruct
    void init() {
        if (secret != null && secret.getBytes(StandardCharsets.UTF_8).length >= MIN_SECRET_BYTES) {
            signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
            return;
        }
        if (allowRandomSecret) {
            log.warn("JWT_SECRET no definido: se generó una clave aleatoria (solo válido para demo/pruebas).");
            signingKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
            return;
        }
        throw new IllegalStateException(
                "Falta la variable de entorno JWT_SECRET (mínimo 32 caracteres). "
                + "Defínela en backend-core/.env (ver .env.example).");
    }

    public long getExpirationSeconds() {
        return expirationSeconds;
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + (expirationSeconds * 1000)))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token, String userEmail) {
        final String username = extractUsername(token);
        return username.equals(userEmail) && !isTokenExpired(token);
    }
}
