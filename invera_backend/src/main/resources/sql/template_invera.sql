-- =====================================================
-- TEMPLATE BASE INVERA - Structure ERP vide (Version complète)
-- =====================================================

-- Connexion à la base template
\c template_invera;

-- =====================================================
-- 2. CRÉATION DES TABLES
-- =====================================================

-- Table categorie
CREATE TABLE public.categorie (
    id_categorie INTEGER NOT NULL,
    description TEXT,
    nom_categorie VARCHAR(255) NOT NULL,
    taux_tva DECIMAL(5,2)
);

-- Table client
CREATE TABLE public.client (
    id_client INTEGER NOT NULL,
    nom VARCHAR(255) NOT NULL,
    prenom VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(255) NOT NULL,
    adresse VARCHAR(255) NOT NULL,
    type_client VARCHAR(50) NOT NULL,
    remise_client_fidele DECIMAL(5,2),
    remise_client_professionnelle DECIMAL(5,2),
    remise_client_vip DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

-- Table USERS (corrigée pour correspondre à l'entité Utilisateur)
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    active BOOLEAN NOT NULL DEFAULT true,                    -- Changé: est_actif → active, NOT NULL
    client_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT,
    email VARCHAR(255) NOT NULL UNIQUE,
    last_login TIMESTAMP,
    mot_de_passe VARCHAR(255),
    nom VARCHAR(100),
    preferred_language VARCHAR(5) NOT NULL DEFAULT 'FR',    -- Changé: NOT NULL
    prenom VARCHAR(100),
    role VARCHAR(50) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Contraintes
    CONSTRAINT users_role_check CHECK (role IN ('ADMIN_CLIENT', 'COMMERCIAL', 'RESPONSABLE_ACHAT')),
    CONSTRAINT users_preferred_language_check CHECK (preferred_language IN ('FR', 'EN', 'AR'))
);

-- Index
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_client_id ON users(client_id);
CREATE INDEX idx_users_role ON users(role);

-- Table activation_tokens
CREATE TABLE public.activation_tokens (
    id INTEGER NOT NULL,
    token VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    client_id INTEGER NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table password_reset_tokens
CREATE TABLE public.password_reset_tokens (
    id INTEGER NOT NULL,
    token VARCHAR(10) NOT NULL,
    email VARCHAR(255) NOT NULL,
    client_id INTEGER NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table client_type_discount
CREATE TABLE public.client_type_discount (
    id INTEGER NOT NULL,
    tenant_id VARCHAR(50) NOT NULL,
    type_client VARCHAR(50) NOT NULL,
    remise DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table commande_client
CREATE TABLE public.commande_client (
    id_commande_client INTEGER NOT NULL,
    reference_commande_client VARCHAR(255) NOT NULL,
    date_commande TIMESTAMP NOT NULL,
    sous_total DECIMAL(19,2) NOT NULL,
    taux_remise DECIMAL(19,2) NOT NULL,
    total DECIMAL(19,2) NOT NULL,
    statut VARCHAR(50) NOT NULL,
    client_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

-- Table produit
CREATE TABLE public.produit (
    id_produit INTEGER NOT NULL,
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
    categorie_id INTEGER NOT NULL,
    fournisseur_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

-- Table fournisseurs
CREATE TABLE public.fournisseurs (
    id_fournisseur INTEGER NOT NULL,
    nom_fournisseur VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    telephone VARCHAR(20),
    adresse VARCHAR(255),
    ville VARCHAR(50),
    pays VARCHAR(50),
    actif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table ligne_commande_client
CREATE TABLE public.ligne_commande_client (
    id_ligne_commande_client INTEGER NOT NULL,
    quantite INTEGER NOT NULL,
    prix_unitaire DECIMAL(19,2) NOT NULL,
    sous_total DECIMAL(19,2) NOT NULL,
    commande_client_id INTEGER NOT NULL,
    produit_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

-- Table commandes_fournisseurs
CREATE TABLE public.commandes_fournisseurs (
    id_commande_fournisseur INTEGER NOT NULL,
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
    created_by VARCHAR(255)
);

-- Table lignes_commande_fournisseurs
CREATE TABLE public.lignes_commande_fournisseurs (
    id_ligne_commande_fournisseur INTEGER NOT NULL,
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
    commande_fournisseur_id INTEGER NOT NULL,
    produit_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table facture_client
CREATE TABLE public.facture_client (
    id_facture_client INTEGER NOT NULL,
    reference_facture_client VARCHAR(255) NOT NULL,
    date_facture TIMESTAMP NOT NULL,
    montant_total DECIMAL(38,2) NOT NULL,
    statut VARCHAR(50) NOT NULL,
    client_id INTEGER NOT NULL,
    commande_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

-- Table stock_movement
CREATE TABLE public.stock_movement (
    id INTEGER NOT NULL,
    quantite INTEGER NOT NULL,
    stock_avant INTEGER NOT NULL,
    stock_apres INTEGER NOT NULL,
    prix_unitaire DECIMAL(38,2),
    valeur_totale DECIMAL(38,2),
    type_mouvement VARCHAR(20) NOT NULL,
    type_document VARCHAR(50),
    commentaire VARCHAR(500),
    date_mouvement TIMESTAMP NOT NULL,
    produit_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50)
);

-- Table notifications
CREATE TABLE public.notifications (
    id INTEGER NOT NULL,
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
    id INTEGER NOT NULL,
    user_id BIGINT NOT NULL,
    ip_address VARCHAR(255),
    user_agent VARCHAR(255),
    login_time TIMESTAMP NOT NULL,
    logout_time TIMESTAMP
);

-- Table fournisseurs_fournisseurs
CREATE TABLE public.fournisseurs_fournisseurs (
    fournisseur_id_fournisseur INTEGER NOT NULL,
    fournisseurs_id_fournisseur INTEGER NOT NULL
);

-- =====================================================
-- 3. CRÉATION DES SÉQUENCES
-- =====================================================

CREATE SEQUENCE public.categorie_id_categorie_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.categorie_id_categorie_seq OWNED BY public.categorie.id_categorie;

CREATE SEQUENCE public.client_id_client_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.client_id_client_seq OWNED BY public.client.id_client;

CREATE SEQUENCE public.users_id_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;

CREATE SEQUENCE public.activation_tokens_id_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.activation_tokens_id_seq OWNED BY public.activation_tokens.id;

CREATE SEQUENCE public.password_reset_tokens_id_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;

CREATE SEQUENCE public.client_type_discount_id_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.client_type_discount_id_seq OWNED BY public.client_type_discount.id;

CREATE SEQUENCE public.commande_client_id_commande_client_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.commande_client_id_commande_client_seq OWNED BY public.commande_client.id_commande_client;

CREATE SEQUENCE public.produit_id_produit_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.produit_id_produit_seq OWNED BY public.produit.id_produit;

CREATE SEQUENCE public.fournisseurs_id_fournisseur_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.fournisseurs_id_fournisseur_seq OWNED BY public.fournisseurs.id_fournisseur;

CREATE SEQUENCE public.ligne_commande_client_id_ligne_commande_client_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.ligne_commande_client_id_ligne_commande_client_seq OWNED BY public.ligne_commande_client.id_ligne_commande_client;

CREATE SEQUENCE public.commandes_fournisseurs_id_commande_fournisseur_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.commandes_fournisseurs_id_commande_fournisseur_seq OWNED BY public.commandes_fournisseurs.id_commande_fournisseur;

CREATE SEQUENCE public.lignes_commande_fournisseurs_id_ligne_commande_fournisseur_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.lignes_commande_fournisseurs_id_ligne_commande_fournisseur_seq OWNED BY public.lignes_commande_fournisseurs.id_ligne_commande_fournisseur;

CREATE SEQUENCE public.facture_client_id_facture_client_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.facture_client_id_facture_client_seq OWNED BY public.facture_client.id_facture_client;

CREATE SEQUENCE public.stock_movement_id_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.stock_movement_id_seq OWNED BY public.stock_movement.id;

CREATE SEQUENCE public.notifications_id_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;

CREATE SEQUENCE public.user_sessions_id_seq START WITH 1 INCREMENT BY 1;
ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;

-- =====================================================
-- 4. DÉFINITION DES DEFAULTS (SEQUENCES)
-- =====================================================

ALTER TABLE public.categorie ALTER COLUMN id_categorie SET DEFAULT nextval('public.categorie_id_categorie_seq');
ALTER TABLE public.client ALTER COLUMN id_client SET DEFAULT nextval('public.client_id_client_seq');
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq');
ALTER TABLE public.activation_tokens ALTER COLUMN id SET DEFAULT nextval('public.activation_tokens_id_seq');
ALTER TABLE public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq');
ALTER TABLE public.client_type_discount ALTER COLUMN id SET DEFAULT nextval('public.client_type_discount_id_seq');
ALTER TABLE public.commande_client ALTER COLUMN id_commande_client SET DEFAULT nextval('public.commande_client_id_commande_client_seq');
ALTER TABLE public.produit ALTER COLUMN id_produit SET DEFAULT nextval('public.produit_id_produit_seq');
ALTER TABLE public.fournisseurs ALTER COLUMN id_fournisseur SET DEFAULT nextval('public.fournisseurs_id_fournisseur_seq');
ALTER TABLE public.ligne_commande_client ALTER COLUMN id_ligne_commande_client SET DEFAULT nextval('public.ligne_commande_client_id_ligne_commande_client_seq');
ALTER TABLE public.commandes_fournisseurs ALTER COLUMN id_commande_fournisseur SET DEFAULT nextval('public.commandes_fournisseurs_id_commande_fournisseur_seq');
ALTER TABLE public.lignes_commande_fournisseurs ALTER COLUMN id_ligne_commande_fournisseur SET DEFAULT nextval('public.lignes_commande_fournisseurs_id_ligne_commande_fournisseur_seq');
ALTER TABLE public.facture_client ALTER COLUMN id_facture_client SET DEFAULT nextval('public.facture_client_id_facture_client_seq');
ALTER TABLE public.stock_movement ALTER COLUMN id SET DEFAULT nextval('public.stock_movement_id_seq');
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq');
ALTER TABLE public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq');

-- =====================================================
-- 5. CRÉATION DES CONTRAINTES PRIMARY KEY
-- =====================================================

ALTER TABLE ONLY public.categorie ADD CONSTRAINT categorie_pkey PRIMARY KEY (id_categorie);
ALTER TABLE ONLY public.client ADD CONSTRAINT client_pkey PRIMARY KEY (id_client);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.activation_tokens ADD CONSTRAINT activation_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.password_reset_tokens ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.client_type_discount ADD CONSTRAINT client_type_discount_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.commande_client ADD CONSTRAINT commande_client_pkey PRIMARY KEY (id_commande_client);
ALTER TABLE ONLY public.produit ADD CONSTRAINT produit_pkey PRIMARY KEY (id_produit);
ALTER TABLE ONLY public.fournisseurs ADD CONSTRAINT fournisseurs_pkey PRIMARY KEY (id_fournisseur);
ALTER TABLE ONLY public.ligne_commande_client ADD CONSTRAINT ligne_commande_client_pkey PRIMARY KEY (id_ligne_commande_client);
ALTER TABLE ONLY public.commandes_fournisseurs ADD CONSTRAINT commandes_fournisseurs_pkey PRIMARY KEY (id_commande_fournisseur);
ALTER TABLE ONLY public.lignes_commande_fournisseurs ADD CONSTRAINT lignes_commande_fournisseurs_pkey PRIMARY KEY (id_ligne_commande_fournisseur);
ALTER TABLE ONLY public.facture_client ADD CONSTRAINT facture_client_pkey PRIMARY KEY (id_facture_client);
ALTER TABLE ONLY public.stock_movement ADD CONSTRAINT stock_movement_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_sessions ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);

-- =====================================================
-- 6. CRÉATION DES CONTRAINTES UNIQUES
-- =====================================================

ALTER TABLE ONLY public.client ADD CONSTRAINT uk_client_email UNIQUE (email);
ALTER TABLE ONLY public.client ADD CONSTRAINT uk_client_telephone UNIQUE (telephone);
ALTER TABLE ONLY public.users ADD CONSTRAINT uk_users_email UNIQUE (email);
ALTER TABLE ONLY public.categorie ADD CONSTRAINT uk_categorie_nom UNIQUE (nom_categorie);
ALTER TABLE ONLY public.commande_client ADD CONSTRAINT uk_commande_client_reference UNIQUE (reference_commande_client);
ALTER TABLE ONLY public.facture_client ADD CONSTRAINT uk_facture_client_reference UNIQUE (reference_facture_client);
ALTER TABLE ONLY public.facture_client ADD CONSTRAINT uk_facture_client_commande UNIQUE (commande_id);
ALTER TABLE ONLY public.fournisseurs ADD CONSTRAINT uk_fournisseurs_email UNIQUE (email);
ALTER TABLE ONLY public.activation_tokens ADD CONSTRAINT uk_activation_tokens_token UNIQUE (token);
ALTER TABLE ONLY public.client_type_discount ADD CONSTRAINT uk_client_type_discount_tenant_type UNIQUE (tenant_id, type_client);

-- =====================================================
-- 7. CRÉATION DES CONTRAINTES CHECK
-- =====================================================

ALTER TABLE ONLY public.client ADD CONSTRAINT check_client_type CHECK (type_client IN ('PARTICULIER', 'VIP', 'PROFESSIONNEL', 'ENTREPRISE', 'FIDELE'));
ALTER TABLE ONLY public.users ADD CONSTRAINT check_users_role CHECK (role IN ('ADMIN_CLIENT', 'COMMERCIAL', 'RESPONSABLE_ACHAT'));
ALTER TABLE ONLY public.users ADD CONSTRAINT check_users_preferred_language CHECK (preferred_language IN ('FR', 'EN', 'AR'));
ALTER TABLE ONLY public.commande_client ADD CONSTRAINT check_commande_client_statut CHECK (statut IN ('EN_ATTENTE', 'CONFIRMEE', 'ANNULEE'));
ALTER TABLE ONLY public.produit ADD CONSTRAINT check_produit_status CHECK (status IN ('EN_STOCK', 'RUPTURE', 'FAIBLE', 'CRITIQUE'));
ALTER TABLE ONLY public.commandes_fournisseurs ADD CONSTRAINT check_commandes_fournisseurs_statut CHECK (statut IN ('BROUILLON', 'VALIDEE', 'ENVOYEE', 'RECUE', 'FACTUREE', 'ANNULEE', 'REJETEE'));
ALTER TABLE ONLY public.facture_client ADD CONSTRAINT check_facture_client_statut CHECK (statut IN ('PAYE', 'NON_PAYE'));
ALTER TABLE ONLY public.stock_movement ADD CONSTRAINT check_stock_movement_type CHECK (type_mouvement IN ('ENTREE', 'SORTIE', 'INIT_STOCK'));
ALTER TABLE ONLY public.client_type_discount ADD CONSTRAINT check_client_type_discount_type CHECK (type_client IN ('PARTICULIER', 'VIP', 'ENTREPRISE', 'FIDELE', 'PROFESSIONNEL'));

-- =====================================================
-- 8. CRÉATION DES CLÉS ÉTRANGÈRES (FOREIGN KEYS)
-- =====================================================

-- users -> client
ALTER TABLE ONLY public.users ADD CONSTRAINT fk_users_client FOREIGN KEY (client_id) REFERENCES public.client(id_client) ON DELETE CASCADE;

-- commande_client -> client
ALTER TABLE ONLY public.commande_client ADD CONSTRAINT fk_commande_client_client FOREIGN KEY (client_id) REFERENCES public.client(id_client);

-- facture_client -> client
ALTER TABLE ONLY public.facture_client ADD CONSTRAINT fk_facture_client_client FOREIGN KEY (client_id) REFERENCES public.client(id_client);

-- facture_client -> commande_client
ALTER TABLE ONLY public.facture_client ADD CONSTRAINT fk_facture_client_commande FOREIGN KEY (commande_id) REFERENCES public.commande_client(id_commande_client);

-- ligne_commande_client -> commande_client
ALTER TABLE ONLY public.ligne_commande_client ADD CONSTRAINT fk_ligne_commande_client_commande FOREIGN KEY (commande_client_id) REFERENCES public.commande_client(id_commande_client);

-- ligne_commande_client -> produit
ALTER TABLE ONLY public.ligne_commande_client ADD CONSTRAINT fk_ligne_commande_client_produit FOREIGN KEY (produit_id) REFERENCES public.produit(id_produit);

-- produit -> categorie
ALTER TABLE ONLY public.produit ADD CONSTRAINT fk_produit_categorie FOREIGN KEY (categorie_id) REFERENCES public.categorie(id_categorie);

-- produit -> fournisseurs
ALTER TABLE ONLY public.produit ADD CONSTRAINT fk_produit_fournisseur FOREIGN KEY (fournisseur_id) REFERENCES public.fournisseurs(id_fournisseur);

-- stock_movement -> produit
ALTER TABLE ONLY public.stock_movement ADD CONSTRAINT fk_stock_movement_produit FOREIGN KEY (produit_id) REFERENCES public.produit(id_produit);

-- user_sessions -> users
ALTER TABLE ONLY public.user_sessions ADD CONSTRAINT fk_user_sessions_users FOREIGN KEY (user_id) REFERENCES public.users(id);

-- lignes_commande_fournisseurs -> commandes_fournisseurs
ALTER TABLE ONLY public.lignes_commande_fournisseurs ADD CONSTRAINT fk_lignes_commande_fournisseurs_commande FOREIGN KEY (commande_fournisseur_id) REFERENCES public.commandes_fournisseurs(id_commande_fournisseur);

-- lignes_commande_fournisseurs -> produit
ALTER TABLE ONLY public.lignes_commande_fournisseurs ADD CONSTRAINT fk_lignes_commande_fournisseurs_produit FOREIGN KEY (produit_id) REFERENCES public.produit(id_produit);

-- fournisseurs_fournisseurs -> fournisseurs (première clé)
ALTER TABLE ONLY public.fournisseurs_fournisseurs ADD CONSTRAINT fk_fournisseurs_fournisseurs_f1 FOREIGN KEY (fournisseur_id_fournisseur) REFERENCES public.fournisseurs(id_fournisseur);

-- fournisseurs_fournisseurs -> fournisseurs (deuxième clé)
ALTER TABLE ONLY public.fournisseurs_fournisseurs ADD CONSTRAINT fk_fournisseurs_fournisseurs_f2 FOREIGN KEY (fournisseurs_id_fournisseur) REFERENCES public.fournisseurs(id_fournisseur);

-- =====================================================
-- 9. CRÉATION DES INDEX
-- =====================================================

CREATE INDEX idx_users_client_id ON public.users(client_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_est_actif ON public.users(est_actif);
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
-- 10. VIDER TOUTES LES DONNÉES
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
-- 11. DÉFINIR COMME TEMPLATE
-- =====================================================

UPDATE pg_database SET datistemplate = TRUE WHERE datname = 'template_invera';

-- =====================================================
-- 12. MESSAGE DE CONFIRMATION
-- =====================================================

\echo '✅ Base template_invera créée avec succès !'
\echo '   - 19 tables créées'
\echo '   - Toutes les clés primaires et étrangères définies'
\echo '   - Tous les index et contraintes créés'
\echo '   - Base prête à être utilisée comme template'