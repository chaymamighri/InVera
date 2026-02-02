package org.erp.invera.config;

import org.erp.invera.model.*;
import org.erp.invera.repository.UserRepo;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class DataInit {

    @Bean
    CommandLineRunner initUsers(UserRepo repo, BCryptPasswordEncoder encoder) {
        return args -> {
            if (repo.count() == 0) {
                repo.save(new User("Admin", "System",
                        "admin@gmail.com", encoder.encode("admin123"), Role.ADMIN));

                repo.save(new User("Achats", "Manager",
                        "achats@gmail.com", encoder.encode("achats123"), Role.ACHATS));

                repo.save(new User("Commercial", "Manager",
                        "commercial@gmail.com", encoder.encode("commercial123"), Role.COMMERCIAL));
            }
        };
    }
}