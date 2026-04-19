package org.erp.invera.security;

import lombok.Data;

import java.security.Principal;

@Data
public class SuperAdminPrincipal implements Principal {
    private Integer id;
    private String email;
    private String nom;

    @Override
    public String getName() {
        return email;
    }
}
