package org.erp.invera.config.databaseConfig;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.orm.jpa.EntityManagerFactoryBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import javax.sql.DataSource;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableTransactionManagement
public class DatabaseConfig {

    // ========== BASE ERP ==========
    @Bean(name = {"erpDataSource", "dataSource"})
    public DataSource erpDataSource(
            @Value("${DB_URL}") String url,
            @Value("${DB_USERNAME}") String username,
            @Value("${DB_PASSWORD}") String password) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        config.setPoolName("ErpHikariPool");
        return new HikariDataSource(config);
    }

    @Bean(name = {"erpEntityManagerFactory", "entityManagerFactory"})
    public LocalContainerEntityManagerFactoryBean erpEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("erpDataSource") DataSource dataSource) {
        Map<String, Object> properties = new HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "update");
        properties.put("hibernate.show_sql", "true");

        return builder
                .dataSource(dataSource)
                .packages("org.erp.invera.model.erp")
                .persistenceUnit("erp")
                .properties(properties)
                .build();
    }

    @Primary
    @Bean(name = {"erpTransactionManager", "transactionManager"})
    public PlatformTransactionManager erpTransactionManager(
            @Qualifier("erpEntityManagerFactory") LocalContainerEntityManagerFactoryBean erpEntityManagerFactory) {
        return new JpaTransactionManager(erpEntityManagerFactory.getObject());
    }

    @Bean(name = "erpJdbcTemplate")
    public JdbcTemplate erpJdbcTemplate(@Qualifier("erpDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    // ========== BASE PLATFORM ==========
    @Primary
    @Bean(name = "platformDataSource")
    public DataSource platformDataSource(
            @Value("${PLATFORM_DB_URL}") String url,
            @Value("${PLATFORM_DB_USERNAME}") String username,
            @Value("${PLATFORM_DB_PASSWORD}") String password) {
        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        config.setPoolName("PlatformHikariPool");
        return new HikariDataSource(config);
    }

    @Bean(name = "platformEntityManagerFactory")
    public LocalContainerEntityManagerFactoryBean platformEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("platformDataSource") DataSource dataSource) {
        Map<String, Object> properties = new HashMap<>();
        properties.put("hibernate.hbm2ddl.auto", "update");
        properties.put("hibernate.show_sql", "true");

        return builder
                .dataSource(dataSource)
                .packages("org.erp.invera.model.platform")
                .persistenceUnit("platform")
                .properties(properties)
                .build();
    }

    @Bean(name = "platformTransactionManager")
    public PlatformTransactionManager platformTransactionManager(
            @Qualifier("platformEntityManagerFactory") LocalContainerEntityManagerFactoryBean platformEntityManagerFactory) {
        return new JpaTransactionManager(platformEntityManagerFactory.getObject());
    }

    @Bean(name = "platformJdbcTemplate")
    public JdbcTemplate platformJdbcTemplate(@Qualifier("platformDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}