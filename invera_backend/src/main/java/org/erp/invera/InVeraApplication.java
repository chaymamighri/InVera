package org.erp.invera;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class InVeraApplication {

    public static void main(String[] args) {
        SpringApplication.run(InVeraApplication.class, args);
    }

}
