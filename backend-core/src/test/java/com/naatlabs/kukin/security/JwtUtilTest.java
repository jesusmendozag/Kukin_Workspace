package com.naatlabs.kukin.security;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilTest {

    private JwtUtil build(String secret, boolean allowRandom) {
        JwtUtil util = new JwtUtil();
        ReflectionTestUtils.setField(util, "secret", secret);
        ReflectionTestUtils.setField(util, "expirationSeconds", 3600L);
        ReflectionTestUtils.setField(util, "allowRandomSecret", allowRandom);
        util.init();
        return util;
    }

    @Test
    void generatesAndValidatesToken() {
        JwtUtil util = build("una-clave-secreta-de-al-menos-32-bytes!!", false);
        String token = util.generateToken("ana@kukin.app");
        assertThat(util.extractUsername(token)).isEqualTo("ana@kukin.app");
        assertThat(util.validateToken(token, "ana@kukin.app")).isTrue();
        assertThat(util.validateToken(token, "otra@kukin.app")).isFalse();
    }

    @Test
    void failsFastWhenSecretIsMissingOrShort() {
        assertThatThrownBy(() -> build("", false)).isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
        assertThatThrownBy(() -> build("corta", false)).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void demoProfileCanUseRandomSecret() {
        JwtUtil util = build("", true);
        assertThat(util.validateToken(util.generateToken("demo@kukin.app"), "demo@kukin.app")).isTrue();
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        JwtUtil a = build("clave-A-clave-A-clave-A-clave-A-1234", false);
        JwtUtil b = build("clave-B-clave-B-clave-B-clave-B-1234", false);
        String token = a.generateToken("ana@kukin.app");
        assertThatThrownBy(() -> b.extractUsername(token)).isInstanceOf(Exception.class);
    }
}
