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

    // ============== EXPORTS ==============

    /**
     * Exporter en Excel
     */
    async exportToExcel(type, data, filename = null) {
        try {
            const XLSX = await import('xlsx');
            const wb = XLSX.utils.book_new();

            switch (type) {
                case 'sales':
                    this.createSalesExcelSheets(wb, data);
                    break;
                case 'invoices':
                    this.createInvoicesExcelSheets(wb, data);
                    break;
                case 'clients':
                    this.createClientsExcelSheets(wb, data);
                    break;
                default:
                    const ws = XLSX.utils.json_to_sheet(data);
                    XLSX.utils.book_append_sheet(wb, ws, 'Données');
            }

            const fileName = filename || `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            return { success: true, fileName };
        } catch (error) {
            console.error('Erreur export Excel:', error);
            throw new Error('Erreur lors de l\'export Excel');
        }
    }

    /**
     * Exporter en PDF
     */
    async exportToPDF(type, data, filename = null) {
        try {
            const [{ jsPDF }, autoTable] = await Promise.all([
                import('jspdf'),
                import('jspdf-autotable')
            ]);

            const doc = new jsPDF();

            // Titre
            doc.setFontSize(18);
            doc.setTextColor(33, 33, 33);
            doc.text(this.getReportTitle(type), 14, 22);

            // Date
            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);

            // Résumé
            if (data.summary) {
                this.addSummaryToPDF(doc, type, data.summary, 40);
            }

            // Détails
            this.addDetailsToPDF(doc, type, data);

            const fileName = filename || `${type}_report_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            return { success: true, fileName };
        } catch (error) {
            console.error('Erreur export PDF:', error);
            throw new Error('Erreur lors de l\'export PDF');
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

    // ============== MÉTHODES D'EXPORT SPÉCIFIQUES ==============

    createSalesExcelSheets(wb, data) {
        const XLSX = require('xlsx'); // Déjà importé

        // Feuille Résumé
        const summaryData = [
            ['RAPPORT DES VENTES', ''],
            ['Période', data.period || 'N/A'],
            ['Date début', data.startDate || 'N/A'],
            ['Date fin', data.endDate || 'N/A'],
            ['', ''],
            ['RÉSUMÉ', ''],
            ['CA Total', data.summary?.totalCA || 0],
            ['Nombre commandes', data.summary?.totalCommandes || 0],
            ['Panier moyen', data.summary?.panierMoyen || 0],
            ['Taux transformation', (data.summary?.tauxTransformation || 0) + '%']
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

        // Feuille Détail des ventes
        if (data.ventes?.length > 0) {
            const ventesForExcel = data.ventes.map(v => ({
                'Date': v.date,
                'Référence': v.reference,
                'Client': v.client,
                'Montant': v.montant,
                'Statut': v.statut,
                'Nb Produits': v.nbProduits
            }));
            const wsDetails = XLSX.utils.json_to_sheet(ventesForExcel);
            XLSX.utils.book_append_sheet(wb, wsDetails, 'Ventes');
        }
    }

    createInvoicesExcelSheets(wb, data) {
        const XLSX = require('xlsx');

        const summaryData = [
            ['RAPPORT DES FACTURES', ''],
            ['Période', data.period || 'N/A'],
            ['', ''],
            ['RÉSUMÉ', ''],
            ['Total factures', data.summary?.totalFactures || 0],
            ['Montant total', data.summary?.montantTotal || 0],
            ['Factures payées', data.summary?.payees || 0],
            ['Factures impayées', data.summary?.impayees || 0],
            ['Montant payé', data.summary?.montantPaye || 0],
            ['Montant impayé', data.summary?.montantImpaye || 0],
            ['Taux recouvrement', (data.summary?.tauxRecouvrement || 0) + '%']
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

        if (data.factures?.length > 0) {
            const facturesForExcel = data.factures.map(f => ({
                'N° Facture': f.numero,
                'Date': f.date,
                'Client': f.client,
                'Montant': f.montant,
                'Statut': f.statut
            }));
            const wsDetails = XLSX.utils.json_to_sheet(facturesForExcel);
            XLSX.utils.book_append_sheet(wb, wsDetails, 'Factures');
        }
    }

    createClientsExcelSheets(wb, data) {
        const XLSX = require('xlsx');

        const summaryData = [
            ['RAPPORT DES CLIENTS', ''],
            ['Période', data.period || 'N/A'],
            ['', ''],
            ['RÉSUMÉ', ''],
            ['Total clients', data.summary?.totalClients || 0],
            ['Nouveaux clients', data.summary?.nouveauxClients || 0],
            ['Clients actifs', data.summary?.clientsActifs || 0],
            ['CA total', data.summary?.caTotal || 0]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');

        if (data.topClients?.length > 0) {
            const wsTop = XLSX.utils.json_to_sheet(data.topClients);
            XLSX.utils.book_append_sheet(wb, wsTop, 'Top Clients');
        }
    }

    addSummaryToPDF(doc, type, summary, startY) {
        let y = startY;

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('RÉSUMÉ', 14, y);
        y += 8;

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);

        switch (type) {
            case 'sales':
                doc.text(`CA Total: ${summary.totalCA || 0} DT`, 20, y);
                doc.text(`Commandes: ${summary.totalCommandes || 0}`, 20, y + 6);
                doc.text(`Panier moyen: ${summary.panierMoyen || 0} DT`, 20, y + 12);
                break;
            case 'invoices':
                doc.text(`Total factures: ${summary.totalFactures || 0}`, 20, y);
                doc.text(`Montant total: ${summary.montantTotal || 0} DT`, 20, y + 6);
                doc.text(`Payées: ${summary.payees || 0}`, 20, y + 12);
                doc.text(`Impayées: ${summary.impayees || 0}`, 20, y + 18);
                break;
            case 'clients':
                doc.text(`Total clients: ${summary.totalClients || 0}`, 20, y);
                doc.text(`Nouveaux: ${summary.nouveauxClients || 0}`, 20, y + 6);
                doc.text(`Actifs: ${summary.clientsActifs || 0}`, 20, y + 12);
                break;
        }
    }

    addDetailsToPDF(doc, type, data) {
        let startY = 70;

        switch (type) {
            case 'sales':
                if (data.ventes?.length > 0) {
                    doc.autoTable({
                        startY: startY,
                        head: [['Date', 'Client', 'Montant', 'Statut']],
                        body: data.ventes.map(v => [
                            v.date,
                            v.client,
                            `${v.montant} DT`,
                            v.statut
                        ])
                    });
                }
                break;
            case 'invoices':
                if (data.factures?.length > 0) {
                    doc.autoTable({
                        startY: startY,
                        head: [['N° Facture', 'Client', 'Montant', 'Statut']],
                        body: data.factures.map(f => [
                            f.numero,
                            f.client,
                            `${f.montant} DT`,
                            f.statut
                        ])
                    });
                }
                break;
            case 'clients':
                if (data.topClients?.length > 0) {
                    doc.autoTable({
                        startY: startY,
                        head: [['Client', 'Type', 'Commandes', 'CA']],
                        body: data.topClients.map(c => [
                            c.nom,
                            c.type,
                            c.commandes,
                            `${c.ca} DT`
                        ])
                    });
                }
                break;
        }
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