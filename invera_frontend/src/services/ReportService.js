// src/services/reportService.js
import api from './api'; // Votre api.js utilise déjà authHeader

class ReportService {
    constructor() {
        this.baseURL = '/reports';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // ============== RAPPORTS PRINCIPAUX ==============

    /**
     * Récupérer le rapport des ventes
     */
    async getSalesReport(filters = {}) {
        return this.getReport('sales', filters);
    }

    /**
     * Récupérer le rapport des factures
     */
    async getInvoicesReport(filters = {}) {
        return this.getReport('invoices', filters);
    }

    /**
     * Récupérer le rapport des clients
     */
    async getClientsReport(filters = {}) {
        return this.getReport('clients', filters);
    }

    /**
     * Récupérer un rapport avec gestion de cache
     */
    async getReport(type, filters = {}, forceRefresh = false) {
        const cacheKey = this.generateCacheKey(type, filters);

        // Vérifier le cache
        if (!forceRefresh && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`📦 Données chargées depuis le cache: ${type}`);
                return cached.data;
            }
            this.cache.delete(cacheKey);
        }

        try {
            console.log(`📡 Appel API: ${type} avec filtres:`, filters);

            // Nettoyer les filtres
            const cleanFilters = this.cleanFilters(filters);

            // Construire l'URL avec les paramètres
            const params = new URLSearchParams();
            
            Object.entries(cleanFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    params.append(key, value);
                }
            });

            const queryString = params.toString() ? `?${params.toString()}` : '';
            const url = `${this.baseURL}/${type}${queryString}`;

            // ✅ Appel API - authHeader est automatiquement ajouté par api.js
            const response = await api.get(url);

            // Mettre en cache
            this.cache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now()
            });

            return response.data;
        } catch (error) {
            console.error(`❌ Erreur chargement rapport ${type}:`, error);
            throw this.handleError(error);
        }
    }


    // ============== MÉTHODES UTILITAIRES ==============

    cleanFilters(filters) {
        const cleaned = {};
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '' && value !== 'all') {
                cleaned[key] = value;
            }
        });
        return cleaned;
    }

    generateCacheKey(type, filters) {
        return `${type}_${JSON.stringify(this.cleanFilters(filters))}`;
    }

    clearCache(type = null) {
        if (type) {
            for (const key of this.cache.keys()) {
                if (key.startsWith(type)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
        console.log('🧹 Cache vidé');
    }

    handleError(error) {
        if (error.response) {
            switch (error.response.status) {
                case 403:
                    return new Error('Session expirée. Veuillez vous reconnecter.');
                case 401:
                    return new Error('Non authentifié. Veuillez vous connecter.');
                case 404:
                    return new Error('Rapport non trouvé.');
                default:
                    return new Error(error.response.data?.message || 'Erreur serveur');
            }
        } else if (error.request) {
            return new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
        } else {
            return new Error('Erreur lors de la préparation de la requête.');
        }
    }

    getReportTitle(type) {
        const titles = {
            'sales': 'Rapport des Ventes',
            'invoices': 'Rapport des Factures',
            'clients': 'Rapport des Clients'
        };
        return titles[type] || 'Rapport';
    }

    // ============== UTILITAIRES API ==============

    async checkHealth() {
        try {
            const response = await api.get(`${this.baseURL}/health`);
            return response.data;
        } catch (error) {
            return { status: 'ERROR', message: 'Service indisponible' };
        }
    }

    async getReportTypes() {
        try {
            const response = await api.get(`${this.baseURL}/types`);
            return response.data;
        } catch (error) {
            console.error('Erreur chargement types:', error);
            return {
                types: { sales: 'Ventes', invoices: 'Factures', clients: 'Clients' },
                periods: { today: "Aujourd'hui", week: 'Cette semaine', month: 'Ce mois' }
            };
        }
    }
}

// Exporter une instance unique
export default new ReportService();