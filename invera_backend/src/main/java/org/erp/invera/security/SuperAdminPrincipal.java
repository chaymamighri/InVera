package org.erp.invera.security;

import lombok.Data;

@Data
public class SuperAdminPrincipal {
    private Integer id;
    private String email;
    private String nom;
}