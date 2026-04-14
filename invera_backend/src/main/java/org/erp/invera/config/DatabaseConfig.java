package org.erp.invera.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;

@Configuration
@EnableTransactionManagement
@EnableJpaRepositories(
        basePackages = "org.erp.invera.repository.erp",  // Seulement ERP
        entityManagerFactoryRef = "erpEntityManagerFactory",
        transactionManagerRef = "erpTransactionManager"
)

public class DatabaseConfig {

    // ========== BASE ERP (invera) - PAR DÉFAUT ==========
    @Primary
    @Bean(name = "erpDataSource")
    public DataSource erpDataSource(
            @Value("${DB_URL:jdbc:postgresql://localhost:5433/invera}") String url,
            @Value("${DB_USERNAME:postgres}") String username,
            @Value("${DB_PASSWORD:96981311}") String password) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        return new HikariDataSource(config);
    }

    @Primary
    @Bean(name = "erpEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean erpEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("erpDataSource") DataSource dataSource) {
        return builder
                .dataSource(dataSource)
                .packages("org.erp.invera.model.erp")
                .persistenceUnit("erp")
                .build();
    }

    @Primary
    @Bean(name = "erpTransactionManager")
    public PlatformTransactionManager erpTransactionManager(
            @Qualifier("erpEntityManagerFactory") LocalContainerEntityManagerFactoryBean erpEntityManagerFactory) {
        return new JpaTransactionManager(erpEntityManagerFactory.getObject());
    }

    @Primary
    @Bean(name = "erpJdbcTemplate")
    public JdbcTemplate erpJdbcTemplate(@Qualifier("erpDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    // ========== BASE PLATEFORME (invera_platform) ==========
    @Bean(name = "platformDataSource")
    public DataSource platformDataSource(
            @Value("${PLATFORM_DB_URL:jdbc:postgresql://localhost:5433/invera_platform}") String url,
            @Value("${PLATFORM_DB_USERNAME:postgres}") String username,
            @Value("${PLATFORM_DB_PASSWORD:96981311}") String password) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        return new HikariDataSource(config);
    }

    @Bean(name = "platformEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean platformEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("platformDataSource") DataSource dataSource) {
        return builder
                .dataSource(dataSource)
                .packages("org.erp.invera.model.platform")
                .persistenceUnit("platform")
                .build();
    }

    @Bean(name = "platformJdbcTemplate")
    public JdbcTemplate platformJdbcTemplate(@Qualifier("platformDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}