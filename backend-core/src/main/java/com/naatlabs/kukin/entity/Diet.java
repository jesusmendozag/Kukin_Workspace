package com.naatlabs.kukin.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "diet")
public class Diet {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_diet")
    private Short idDiet;

    @Column(nullable = false, unique = true, length = 40)
    private String name;

    public Short getIdDiet() { return idDiet; }
    public void setIdDiet(Short idDiet) { this.idDiet = idDiet; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}