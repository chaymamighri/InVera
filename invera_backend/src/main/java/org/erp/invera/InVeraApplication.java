package org.erp.invera;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableJpaAuditing  // ← ADD THIS LINE
public class InVeraApplication {

    public static void main(String[] args) {
        SpringApplication.run(InVeraApplication.class, args);
    }

}
