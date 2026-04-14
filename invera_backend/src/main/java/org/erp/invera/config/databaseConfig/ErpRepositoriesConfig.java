package org.erp.invera.config.databaseConfig;


import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(
        basePackages = "org.erp.invera.repository.erp",
        entityManagerFactoryRef = "erpEntityManagerFactory",
        transactionManagerRef = "erpTransactionManager"
)
public class ErpRepositoriesConfig {
}