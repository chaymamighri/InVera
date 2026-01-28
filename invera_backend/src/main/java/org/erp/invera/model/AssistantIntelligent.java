package org.erp.invera.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "assistant_intelligent")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssistantIntelligent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer idAssistant;

    private String canal;
}




