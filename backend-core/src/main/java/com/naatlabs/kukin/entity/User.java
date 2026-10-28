package com.naatlabs.kukin.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "`user`")
public class User {

    public enum PlanType { FREE, PREMIUM }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_user")
    private Long idUser;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_plan", nullable = false)
    private PlanType typePlan = PlanType.FREE;

    @Column(name = "plan_expires_at")
    private Instant planExpiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public Long getIdUser() { return idUser; }
    public void setIdUser(Long idUser) { this.idUser = idUser; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public PlanType getTypePlan() { return typePlan; }
    public void setTypePlan(PlanType typePlan) { this.typePlan = typePlan; }
    public Instant getPlanExpiresAt() { return planExpiresAt; }
    public void setPlanExpiresAt(Instant planExpiresAt) { this.planExpiresAt = planExpiresAt; }
}