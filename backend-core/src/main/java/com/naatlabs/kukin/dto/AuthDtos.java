package com.naatlabs.kukin.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public static class RegisterRequest {
        @NotBlank(message = "El nombre es obligatorio")
        private String name;

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El formato del correo es inválido")
        private String email;

        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 8, message = "La contraseña debe tener mínimo 8 caracteres")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Debe incluir al menos una letra y un número")
        private String password;

        private String typePlan; 

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getTypePlan() { return typePlan; }
        public void setTypePlan(String typePlan) { this.typePlan = typePlan; }
    }

    public static class LoginRequest {
        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "Formato de correo inválido")
        private String email;

        @NotBlank(message = "La contraseña es obligatoria")
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class AuthDataResponse {
        private Long idUser;
        private String name;
        private String email;
        private String typePlan;
        private String token;
        private long expiresIn;

        public AuthDataResponse(Long idUser, String name, String email, String typePlan, String token, long expiresIn) {
            this.idUser = idUser;
            this.name = name;
            this.email = email;
            this.typePlan = typePlan;
            this.token = token;
            this.expiresIn = expiresIn;
        }

        public Long getIdUser() { return idUser; }
        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getTypePlan() { return typePlan; }
        public String getToken() { return token; }
        public long getExpiresIn() { return expiresIn; }
    }
}