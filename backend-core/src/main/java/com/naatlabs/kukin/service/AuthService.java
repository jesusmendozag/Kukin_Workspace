package com.naatlabs.kukin.service;

import com.naatlabs.kukin.dto.AuthDtos;
import com.naatlabs.kukin.entity.User;
import com.naatlabs.kukin.exception.KukinApiException;
import com.naatlabs.kukin.repository.UserRepository;
import com.naatlabs.kukin.security.JwtUtil;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtUtil jwtUtil, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthDtos.AuthDataResponse register(AuthDtos.RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new KukinApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "El correo ya está registrado");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        
        if (request.getTypePlan() != null && request.getTypePlan().equalsIgnoreCase("PREMIUM")) {
            user.setTypePlan(User.PlanType.PREMIUM);
        } else {
            user.setTypePlan(User.PlanType.FREE);
        }

        User savedUser = userRepository.save(user);
        String token = jwtUtil.generateToken(savedUser.getEmail());

        return new AuthDtos.AuthDataResponse(
                savedUser.getIdUser(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getTypePlan().name(),
                token,
                3600L
        );
    }

    public AuthDtos.AuthDataResponse login(AuthDtos.LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (Exception e) {
            throw new KukinApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Correo o contraseña incorrectos");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new KukinApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado"));

        String token = jwtUtil.generateToken(user.getEmail());

        return new AuthDtos.AuthDataResponse(
                user.getIdUser(),
                user.getName(),
                user.getEmail(),
                user.getTypePlan().name(),
                token,
                3600L
        );
    }
}