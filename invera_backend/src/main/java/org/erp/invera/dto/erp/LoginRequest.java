package org.erp.invera.dto.erp;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    /* for email*/
    private String email;
    /* for password */
    private String password;
}