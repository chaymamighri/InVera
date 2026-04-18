package org.erp.invera.dto.platform.superAdmindto;// LoginRequestDTO.java
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequestDTO {
    private String email;

    @JsonProperty("motDePasse")  // Accepte "motDePasse" du backend
    @JsonAlias({"password", "motDePasse"})  // Accepte aussi "password" du frontend
    private String motDePasse;
}