package com.naatlabs.kukin.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "unit")
public class Unit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_unit")
    private Short idUnit;

    @Column(nullable = false, unique = true, length = 40)
    private String name;

    @Column(nullable = false, length = 10)
    private String symbol;

    public Short getIdUnit() { return idUnit; }
    public void setIdUnit(Short idUnit) { this.idUnit = idUnit; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getSymbol() { return symbol; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
}