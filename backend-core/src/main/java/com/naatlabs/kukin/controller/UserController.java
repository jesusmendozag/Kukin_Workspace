package com.naatlabs.kukin.controller;

import com.naatlabs.kukin.dto.ApiResponse;
import com.naatlabs.kukin.dto.CatalogDtos;
import com.naatlabs.kukin.entity.User;
import com.naatlabs.kukin.exception.KukinApiException;
import com.naatlabs.kukin.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Datos del usuario autenticado (para la pantalla de Perfil). */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CatalogDtos.UserProfileResponse>> me(Authentication authentication) {
        return ResponseEntity.ok(new ApiResponse<>(toProfile(currentUser(authentication))));
    }

    /** Guarda el objetivo de Dietas en la cuenta (así se conserva al cambiar de celular). */
    @PutMapping("/me/diet-goal")
    @Transactional
    public ResponseEntity<ApiResponse<CatalogDtos.UserProfileResponse>> setDietGoal(
            @Valid @RequestBody CatalogDtos.DietGoalRequest request, Authentication authentication) {
        User user = currentUser(authentication);
        user.setDietGoal(request.goal());
        return ResponseEntity.ok(new ApiResponse<>(toProfile(userRepository.save(user))));
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new KukinApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "Usuario no encontrado"));
    }

    private static CatalogDtos.UserProfileResponse toProfile(User user) {
        return new CatalogDtos.UserProfileResponse(
                user.getIdUser(), user.getName(), user.getEmail(), user.getTypePlan().name(), user.getDietGoal());
    }
}
