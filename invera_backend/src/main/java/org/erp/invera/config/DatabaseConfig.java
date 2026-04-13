package org.erp.invera.config;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * Configuration pour connecter l'application à DEUX bases de données :
 *
 * 1. erpDataSource → Base ERP existante (template_invera)
 * 2. platformDataSource → Nouvelle base plateforme (invera_platform)
 *
 * Pourquoi ? Car l'architecture SaaS nécessite :
 * - Une base pour les données métier des clients (ERP)
 * - Une base pour gérer les clients, abonnements et paiements (Plateforme)
 */
/*@Configuration
public class DatabaseConfig {

    // ========== BASE ERP (existante) ==========

    /**
     * Connexion à la base ERP.
     * @Primary = c'est la base par défaut de l'application
     */
  /*  @Primary
    @Bean(name = "erpDataSource")
    @ConfigurationProperties(prefix = "spring.datasource")  // Lit les configs spring.datasource.*
    public DataSource erpDataSource() {
        return DataSourceBuilder.create().build();
    }

    /**
     * Exécute des requêtes SQL sur la base ERP.
     * Utile pour : CREATE DATABASE, INSERT, UPDATE, SELECT
     */
    /*@Primary
    @Bean(name = "erpJdbcTemplate")
    public JdbcTemplate erpJdbcTemplate(@Qualifier("erpDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }

    // ========== BASE PLATEFORME (nouvelle) ==========

    /**
     * Connexion à la base plateforme (invera_platform).
     * Pas de @Primary car ce n'est pas la base par défaut
     */
   /* @Bean(name = "platformDataSource")
    public DataSource platformDataSource(
            @Value("${platform.datasource.url}") String url,
            @Value("${platform.datasource.username}") String username,
            @Value("${platform.datasource.password}") String password) {
        return DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .driverClassName("org.postgresql.Driver")
                .build();
    }

    /**
     * Exécute des requêtes SQL sur la base plateforme.
     * Utile pour : inscrire un client, vérifier un paiement, gérer les abonnements
     */
  /*  @Bean(name = "platformJdbcTemplate")
    public JdbcTemplate platformJdbcTemplate(@Qualifier("platformDataSource") DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}*/