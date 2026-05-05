-- =====================================================
-- TEMPLATE BASE INVERA - Structure ERP vide (Version SERIAL)
-- =====================================================

-- Connexion à la base template
\c template_invera;

-- =====================================================
-- 2. CRÉATION DES TABLES (avec SERIAL PRIMARY KEY)
-- =====================================================

-- Table categorie
CREATE TABLE public.categorie (
    id_categorie SERIAL PRIMARY KEY,
    description TEXT,
    nom_categorie VARCHAR(255) NOT NULL,
    taux_tva DECIMAL(5,2),
    CONSTRAINT uk_categorie_nom UNIQUE (nom_categorie)
);

-- Table client
CREATE TABLE public.client (
    id_client SERIAL PRIMARY KEY,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(255) NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    type_client VARCHAR(50) NOT NULL,
    remise_client_fidele DECIMAL(5,2) DEFAULT 0,
    remise_client_professionnelle DECIMAL(5,2) DEFAULT 0,
    remise_client_vip DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    CONSTRAINT uk_client_email UNIQUE (email),
    CONSTRAINT uk_client_telephone UNIQUE (telephone),
    CONSTRAINT check_client_type CHECK (type_client IN ('PARTICULIER', 'VIP', 'PROFESSIONNEL', 'ENTREPRISE', 'FIDELE'))
);

-- Table USERS
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    active BOOLEAN NOT NULL DEFAULT true,
    client_id INTEGER NOT NULL REFERENCES public.client(id_client) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    email VARCHAR(255) NOT NULL UNIQUE,
    last_login TIMESTAMP,
    mot_de_passe VARCHAR(255),
    nom VARCHAR(100),
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'FR',
    prenom VARCHAR(100),
    role VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (role IN ('ADMIN_CLIENT', 'COMMERCIAL', 'RESPONSABLE_ACHAT')),
    CONSTRAINT users_preferred_language_check CHECK (preferred_language IN ('FR', 'EN', 'AR'))
);

-- Index pour users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);

-- Table activation_tokens
CREATE TABLE public.activation_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    client_id INTEGER NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table password_reset_tokens
CREATE TABLE public.password_reset_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(10) NOT NULL,
    email VARCHAR(255) NOT NULL,
    client_id INTEGER NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table client_type_discount
CREATE TABLE public.client_type_discount (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL,
    type_client VARCHAR(50) NOT NULL,
    remise DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_client_type_discount_tenant_type UNIQUE (tenant_id, type_client),
    CONSTRAINT check_client_type_discount_type CHECK (type_client IN ('PARTICULIER', 'VIP', 'ENTREPRISE', 'FIDELE', 'PROFESSIONNEL'))
);

-- Table commande_client
CREATE TABLE public.commande_client (
    id_commande_client SERIAL PRIMARY KEY,
    reference_commande_client VARCHAR(255) NOT NULL UNIQUE,
    date_commande TIMESTAMP NOT NULL,
    sous_total DECIMAL(19,2) NOT NULL,
    taux_remise DECIMAL(19,2) NOT NULL,
    total DECIMAL(19,2) NOT NULL,
    statut VARCHAR(50) NOT NULL,
    client_id INTEGER NOT NULL REFERENCES public.client(id_client),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    CONSTRAINT check_commande_client_statut CHECK (statut IN ('EN_ATTENTE', 'CONFIRMEE', 'ANNULEE'))
);

-- Table fournisseurs
CREATE TABLE public.fournisseurs (
    id_fournisseur SERIAL PRIMARY KEY,
    nom_fournisseur VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    telephone VARCHAR(20),
    adresse VARCHAR(255),
    ville VARCHAR(50),
    pays VARCHAR(50),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table categorie (suite - déjà créée plus haut)
CREATE TABLE public.produit (
    id_produit SERIAL PRIMARY KEY,
    libelle VARCHAR(255) NOT NULL,
    prix_vente DECIMAL(10,2) NOT NULL,
    prix_achat DECIMAL(10,2) DEFAULT 0,
    quantite_stock INTEGER NOT NULL DEFAULT 0,
    seuil_minimum INTEGER NOT NULL DEFAULT 0,
    remise_temporaire DECIMAL(5,2),
    status VARCHAR(50) NOT NULL,
    unite_mesure VARCHAR(50) NOT NULL,
    image_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    categorie_id INTEGER NOT NULL REFERENCES public.categorie(id_categorie),
    fournisseur_id INTEGER REFERENCES public.fournisseurs(id_fournisseur),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    CONSTRAINT check_produit_status CHECK (status IN ('EN_STOCK', 'RUPTURE', 'FAIBLE', 'CRITIQUE'))
);

-- Table ligne_commande_client
CREATE TABLE public.ligne_commande_client (
    id_ligne_commande_client SERIAL PRIMARY KEY,
    quantite INTEGER NOT NULL,
    prix_unitaire DECIMAL(19,2) NOT NULL,
    sous_total DECIMAL(19,2) NOT NULL,
    commande_client_id INTEGER NOT NULL REFERENCES public.commande_client(id_commande_client),
    produit_id INTEGER NOT NULL REFERENCES public.produit(id_produit),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

-- Table commandes_fournisseurs
CREATE TABLE public.commandes_fournisseurs (
    id_commande_fournisseur SERIAL PRIMARY KEY,
    numero_commande VARCHAR(50),
    date_commande TIMESTAMP NOT NULL,
    date_livraison_prevue TIMESTAMP NOT NULL,
    date_livraison_reelle TIMESTAMP,
    statut VARCHAR(20) NOT NULL,
    totalht DECIMAL(10,2),
    totalttc DECIMAL(10,2),
    totaltva DECIMAL(10,2),
    taux_tva DECIMAL(5,2),
    adresse_livraison VARCHAR(500),
    notes_reception TEXT,
    numero_bon_livraison VARCHAR(255),
    motif_rejet VARCHAR(500),
    date_rejet TIMESTAMP,
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    CONSTRAINT check_commandes_fournisseurs_statut CHECK (statut IN ('BROUILLON', 'VALIDEE', 'ENVOYEE', 'RECUE', 'FACTUREE', 'ANNULEE', 'REJETEE'))
);

-- Table lignes_commande_fournisseurs
CREATE TABLE public.lignes_commande_fournisseurs (
    id_ligne_commande_fournisseur SERIAL PRIMARY KEY,
    quantite INTEGER NOT NULL,
    quantite_recue INTEGER DEFAULT 0,
    prix_unitaire DECIMAL(10,3),
    sous_total DECIMAL(10,2),
    sous_total_ht DECIMAL(10,2),
    sous_total_ttc DECIMAL(10,2),
    montant_tva DECIMAL(10,3),
    tauxtva DECIMAL(5,2),
    notes TEXT,
    actif BOOLEAN DEFAULT TRUE,
    commande_fournisseur_id INTEGER NOT NULL REFERENCES public.commandes_fournisseurs(id_commande_fournisseur),
    produit_id INTEGER REFERENCES public.produit(id_produit),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table facture_client
CREATE TABLE public.facture_client (
    id_facture_client SERIAL PRIMARY KEY,
    reference_facture_client VARCHAR(255) NOT NULL UNIQUE,
    date_facture TIMESTAMP NOT NULL,
    montant_total DECIMAL(38,2) NOT NULL,
    statut VARCHAR(50) NOT NULL,
    client_id INTEGER NOT NULL REFERENCES public.client(id_client),
    commande_id INTEGER NOT NULL UNIQUE REFERENCES public.commande_client(id_commande_client),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    CONSTRAINT check_facture_client_statut CHECK (statut IN ('PAYE', 'NON_PAYE'))
);

-- Table stock_movement
CREATE TABLE public.stock_movement (
    id SERIAL PRIMARY KEY,
    quantite INTEGER NOT NULL,
    stock_avant INTEGER NOT NULL,
    stock_apres INTEGER NOT NULL,
    prix_unitaire DECIMAL(38,2),
    valeur_totale DECIMAL(38,2),
    type_mouvement VARCHAR(20) NOT NULL,
    type_document VARCHAR(50),
    commentaire VARCHAR(500),
    date_mouvement TIMESTAMP NOT NULL,
    produit_id INTEGER NOT NULL REFERENCES public.produit(id_produit),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    CONSTRAINT check_stock_movement_type CHECK (type_mouvement IN ('ENTREE', 'SORTIE', 'INIT_STOCK'))
);

-- Table notifications
CREATE TABLE public.notifications (
    id SERIAL PRIMARY KEY,
    message VARCHAR(255) NOT NULL,
    type VARCHAR(255) NOT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    target_role VARCHAR(255),
    entity_id BIGINT,
    entity_reference VARCHAR(100),
    entity_type VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Table user_sessions
CREATE TABLE public.user_sessions (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.users(id),
    ip_address VARCHAR(255),
    user_agent VARCHAR(255),
    login_time TIMESTAMP NOT NULL,
    logout_time TIMESTAMP
);

-- Table fournisseurs_fournisseurs (table de liaison)
CREATE TABLE public.fournisseurs_fournisseurs (
    fournisseur_id_fournisseur INTEGER NOT NULL REFERENCES public.fournisseurs(id_fournisseur),
    fournisseurs_id_fournisseur INTEGER NOT NULL REFERENCES public.fournisseurs(id_fournisseur)
);

-- =====================================================
-- CRÉATION DES INDEX SUPPLÉMENTAIRES
-- =====================================================

CREATE INDEX idx_commande_client_client_id ON public.commande_client(client_id);
CREATE INDEX idx_commande_client_date ON public.commande_client(date_commande);
CREATE INDEX idx_commande_client_statut ON public.commande_client(statut);
CREATE INDEX idx_ligne_commande_client_commande ON public.ligne_commande_client(commande_client_id);
CREATE INDEX idx_ligne_commande_client_produit ON public.ligne_commande_client(produit_id);
CREATE INDEX idx_produit_categorie ON public.produit(categorie_id);
CREATE INDEX idx_produit_fournisseur ON public.produit(fournisseur_id);
CREATE INDEX idx_produit_is_active ON public.produit(is_active);
CREATE INDEX idx_facture_client_client ON public.facture_client(client_id);
CREATE INDEX idx_facture_client_statut ON public.facture_client(statut);
CREATE INDEX idx_facture_client_date ON public.facture_client(date_facture);
CREATE INDEX idx_stock_movement_produit ON public.stock_movement(produit_id);
CREATE INDEX idx_stock_movement_date ON public.stock_movement(date_mouvement);
CREATE INDEX idx_stock_movement_type ON public.stock_movement(type_mouvement);
CREATE INDEX idx_activation_tokens_token ON public.activation_tokens(token);
CREATE INDEX idx_activation_tokens_email ON public.activation_tokens(email);
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_client_type_discount_tenant ON public.client_type_discount(tenant_id);
CREATE INDEX idx_fournisseurs_actif ON public.fournisseurs(actif);
CREATE INDEX idx_commandes_fournisseurs_statut ON public.commandes_fournisseurs(statut);
CREATE INDEX idx_commandes_fournisseurs_date ON public.commandes_fournisseurs(date_commande);

-- =====================================================
-- VIDER TOUTES LES DONNÉES
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- =====================================================
-- DÉFINIR COMME TEMPLATE
-- =====================================================

UPDATE pg_database SET datistemplate = TRUE WHERE datname = 'template_invera';

-- =====================================================
-- MESSAGE DE CONFIRMATION
-- =====================================================

\echo '✅ Base template_invera créée avec succès !'
