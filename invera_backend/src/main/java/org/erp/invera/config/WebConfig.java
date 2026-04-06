package org.erp.invera.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration des ressources statiques.
 *
 * Ce fichier permet d'exposer le dossier "uploads/" sur le disque
 * afin que les images et fichiers qu'il contient soient accessibles
 * via l'URL /uploads/**
 *
 * Exemple : un fichier uploads/produits/photo.jpg sera accessible par
 * http://localhost:8080/uploads/produits/photo.jpg
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Toute requête commençant par /uploads/ va chercher le fichier dans le dossier uploads/ (disque)
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/")
                .setCachePeriod(3600);  // Cache pendant 1 heure (3600 secondes)
    }
}