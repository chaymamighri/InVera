-- =====================================================
-- TEMPLATE BASE INVERA - Structure ERP vide (Version mise à jour)
-- Basé sur la structure pg_dump du 2026-04-17
-- =====================================================

-- 1. Création de la base template
DROP DATABASE IF EXISTS template_invera;
CREATE DATABASE template_invera OWNER postgres;

-- Connexion à la base template
\c template_invera;

-- =====================================================
-- 2. CRÉATION DES TABLES (Structure mise à jour)
-- =====================================================

-- Table categorie
CREATE TABLE public.categorie (
    id_categorie integer NOT NULL,
    description character varying(255),
    nom_categorie character varying(255) NOT NULL,
    taux_tva numeric(5,2)
);

-- Table client
CREATE TABLE public.client (
    id_client integer NOT NULL,
    adresse character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    nom character varying(255) NOT NULL,
    prenom character varying(255),
    remise_client_fidele double precision,
    remise_client_professionnelle double precision,
    remise_client_vip double precision,
    telephone character varying(255) NOT NULL,
    type_client character varying(255) NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    CONSTRAINT client_type_client_check CHECK (((type_client)::text = ANY ((ARRAY['PARTICULIER'::character varying, 'VIP'::character varying, 'PROFESSIONNEL'::character varying, 'ENTREPRISE'::character varying, 'FIDELE'::character varying])::text[])))
);

-- Table client_type_discount
CREATE TABLE public.client_type_discount (
    type_client character varying(50) NOT NULL,
    remise double precision NOT NULL,
    CONSTRAINT client_type_discount_type_client_check CHECK (((type_client)::text = ANY ((ARRAY['PARTICULIER'::character varying, 'VIP'::character varying, 'PROFESSIONNEL'::character varying, 'ENTREPRISE'::character varying, 'FIDELE'::character varying])::text[])))
);

-- Table commande_client
CREATE TABLE public.commande_client (
    id_commande_client integer NOT NULL,
    date_commande timestamp(6) without time zone NOT NULL,
    reference_commande_client character varying(255) NOT NULL,
    sous_total numeric(19,2) NOT NULL,
    statut character varying(255) NOT NULL,
    taux_remise numeric(19,2) NOT NULL,
    total numeric(19,2) NOT NULL,
    client_id integer NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    CONSTRAINT commande_client_statut_check CHECK (((statut)::text = ANY ((ARRAY['EN_ATTENTE'::character varying, 'CONFIRMEE'::character varying, 'ANNULEE'::character varying])::text[])))
);

-- Table commandes_fournisseurs
CREATE TABLE public.commandes_fournisseurs (
    id_commande_fournisseur integer NOT NULL,
    actif boolean NOT NULL,
    created_at timestamp(6) without time zone,
    date_commande timestamp(6) without time zone NOT NULL,
    date_livraison_prevue timestamp(6) without time zone NOT NULL,
    date_livraison_reelle timestamp(6) without time zone,
    numero_commande character varying(50),
    statut character varying(20) NOT NULL,
    totalht numeric(10,3),
    totalttc numeric(10,3),
    totaltva numeric(10,3),
    updated_at timestamp(6) without time zone,
    created_by character varying(255),
    adresse_livraison character varying(500),
    taux_tva numeric(5,2),
    notes_reception text,
    numero_bon_livraison character varying(255),
    motif_rejet character varying(500) DEFAULT NULL::character varying,
    date_rejet timestamp without time zone,
    CONSTRAINT commandes_fournisseurs_statut_check CHECK (((statut)::text = ANY ((ARRAY['BROUILLON'::character varying, 'VALIDEE'::character varying, 'ENVOYEE'::character varying, 'RECUE'::character varying, 'FACTUREE'::character varying, 'ANNULEE'::character varying, 'REJETEE'::character varying])::text[])))
);

-- Table facture_client
CREATE TABLE public.facture_client (
    id_facture_client integer NOT NULL,
    date_facture timestamp(6) without time zone NOT NULL,
    montant_total numeric(38,2) NOT NULL,
    reference_facture_client character varying(255) NOT NULL,
    statut character varying(255) NOT NULL,
    client_id integer NOT NULL,
    commande_id integer NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    CONSTRAINT facture_client_statut_check CHECK (((statut)::text = ANY ((ARRAY['PAYE'::character varying, 'NON_PAYE'::character varying])::text[])))
);

-- Table fournisseurs
CREATE TABLE public.fournisseurs (
    id_fournisseur integer NOT NULL,
    actif boolean NOT NULL,
    adresse character varying(255),
    created_at timestamp(6) without time zone,
    email character varying(100),
    nom_fournisseur character varying(100) NOT NULL,
    pays character varying(50),
    telephone character varying(20),
    updated_at timestamp(6) without time zone,
    ville character varying(50)
);

-- Table fournisseurs_fournisseurs (Table de liaison pour relation many-to-many)
CREATE TABLE public.fournisseurs_fournisseurs (
    fournisseur_id_fournisseur integer NOT NULL,
    fournisseurs_id_fournisseur integer NOT NULL
);

-- Table ligne_commande_client
CREATE TABLE public.ligne_commande_client (
    id_ligne_commande_client integer NOT NULL,
    prix_unitaire numeric(19,2) NOT NULL,
    quantite integer NOT NULL,
    sous_total numeric(19,2) NOT NULL,
    commande_client_id integer NOT NULL,
    produit_id integer NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255)
);

-- Table lignes_commande_fournisseurs
CREATE TABLE public.lignes_commande_fournisseurs (
    id_ligne_commande_fournisseur integer NOT NULL,
    actif boolean NOT NULL,
    created_at timestamp(6) without time zone,
    prix_unitaire numeric(10,3),
    quantite integer NOT NULL,
    quantite_recue integer,
    sous_total numeric(10,2),
    updated_at timestamp(6) without time zone,
    commande_fournisseur_id integer NOT NULL,
    produit_id integer,
    notes character varying(500),
    montant_tva numeric(10,3),
    sous_total_ht numeric(10,3),
    sous_total_ttc numeric(10,3),
    tauxtva numeric(5,2)
);

-- Table notifications
CREATE TABLE public.notifications (
    id bigint NOT NULL,
    created_at timestamp(6) without time zone NOT NULL,
    message character varying(255) NOT NULL,
    read boolean NOT NULL,
    type character varying(255) NOT NULL,
    user_email character varying(255),
    user_name character varying(255),
    target_role character varying(255),
    entity_id bigint,
    entity_reference character varying(100),
    entity_type character varying(100)
);

-- Table password_reset_tokens
CREATE TABLE public.password_reset_tokens (
    id bigint NOT NULL,
    expiry_date timestamp(6) without time zone NOT NULL,
    token character varying(255) NOT NULL,
    user_id bigint NOT NULL
);

-- Table produit (Version mise à jour avec fournisseur_id et prix_achat)
CREATE TABLE public.produit (
    id_produit integer NOT NULL,
    image_url character varying(255),
    libelle character varying(255) NOT NULL,
    prix_vente double precision NOT NULL,
    quantite_stock integer NOT NULL,
    remise_temporaire double precision,
    seuil_minimum integer NOT NULL,
    status character varying(255) NOT NULL,
    unite_mesure character varying(255) NOT NULL,
    categorie_id integer NOT NULL,
    created_at timestamp(6) without time zone,
    created_by character varying(255),
    is_active boolean,
    fournisseur_id integer,
    prix_achat numeric(38,2) DEFAULT 100 NOT NULL,
    CONSTRAINT produit_status_check CHECK (((status)::text = ANY ((ARRAY['EN_STOCK'::character varying, 'RUPTURE'::character varying, 'FAIBLE'::character varying, 'CRITIQUE'::character varying])::text[])))
);

-- Table stock_movement (Version mise à jour avec prix_unitaire et valeur_totale)
CREATE TABLE public.stock_movement (
    id bigint NOT NULL,
    commentaire character varying(500),
    created_at timestamp(6) without time zone,
    created_by character varying(50),
    date_mouvement timestamp(6) without time zone NOT NULL,
    quantite integer NOT NULL,
    stock_apres integer NOT NULL,
    stock_avant integer NOT NULL,
    type_document character varying(50),
    type_mouvement character varying(20) NOT NULL,
    produit_id integer NOT NULL,
    prix_unitaire numeric(38,2),
    valeur_totale numeric(38,2),
    CONSTRAINT stock_movement_type_mouvement_check CHECK (((type_mouvement)::text = ANY ((ARRAY['ENTREE'::character varying, 'SORTIE'::character varying, 'INIT_STOCK'::character varying])::text[])))
);

-- Table user_sessions
CREATE TABLE public.user_sessions (
    id bigint NOT NULL,
    ip_address character varying(255),
    login_time timestamp(6) without time zone NOT NULL,
    logout_time timestamp(6) without time zone,
    user_agent character varying(255),
    user_id bigint NOT NULL
);

-- Table users (Version mise à jour avec last_login)
CREATE TABLE public.users (
    id bigint NOT NULL,
    active boolean NOT NULL,
    created_at timestamp(6) without time zone,
    email character varying(255) NOT NULL,
    nom character varying(255),
    password character varying(255),
    prenom character varying(255),
    role character varying(255) NOT NULL,
    last_login timestamp(6) without time zone,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['ADMIN'::character varying, 'COMMERCIAL'::character varying, 'RESPONSABLE_ACHAT'::character varying])::text[])))
);

-- =====================================================
-- 3. CRÉATION DES SÉQUENCES
-- =====================================================

-- Séquence pour categorie
CREATE SEQUENCE public.categorie_id_categorie_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.categorie_id_categorie_seq OWNED BY public.categorie.id_categorie;
ALTER TABLE public.categorie ALTER COLUMN id_categorie SET DEFAULT nextval('public.categorie_id_categorie_seq');

-- Séquence pour client
CREATE SEQUENCE public.client_id_client_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.client_id_client_seq OWNED BY public.client.id_client;
ALTER TABLE public.client ALTER COLUMN id_client SET DEFAULT nextval('public.client_id_client_seq');

-- Séquence pour commande_client
CREATE SEQUENCE public.commande_client_id_commande_client_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.commande_client_id_commande_client_seq OWNED BY public.commande_client.id_commande_client;
ALTER TABLE public.commande_client ALTER COLUMN id_commande_client SET DEFAULT nextval('public.commande_client_id_commande_client_seq');

-- Séquence pour commandes_fournisseurs
CREATE SEQUENCE public.commandes_fournisseurs_id_commande_fournisseur_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.commandes_fournisseurs_id_commande_fournisseur_seq OWNED BY public.commandes_fournisseurs.id_commande_fournisseur;
ALTER TABLE public.commandes_fournisseurs ALTER COLUMN id_commande_fournisseur SET DEFAULT nextval('public.commandes_fournisseurs_id_commande_fournisseur_seq');

-- Séquence pour facture_client
CREATE SEQUENCE public.facture_client_id_facture_client_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.facture_client_id_facture_client_seq OWNED BY public.facture_client.id_facture_client;
ALTER TABLE public.facture_client ALTER COLUMN id_facture_client SET DEFAULT nextval('public.facture_client_id_facture_client_seq');

-- Séquence pour fournisseurs
CREATE SEQUENCE public.fournisseurs_id_fournisseur_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.fournisseurs_id_fournisseur_seq OWNED BY public.fournisseurs.id_fournisseur;
ALTER TABLE public.fournisseurs ALTER COLUMN id_fournisseur SET DEFAULT nextval('public.fournisseurs_id_fournisseur_seq');

-- Séquence pour ligne_commande_client
CREATE SEQUENCE public.ligne_commande_client_id_ligne_commande_client_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.ligne_commande_client_id_ligne_commande_client_seq OWNED BY public.ligne_commande_client.id_ligne_commande_client;
ALTER TABLE public.ligne_commande_client ALTER COLUMN id_ligne_commande_client SET DEFAULT nextval('public.ligne_commande_client_id_ligne_commande_client_seq');

-- Séquence pour lignes_commande_fournisseurs
CREATE SEQUENCE public.lignes_commande_fournisseurs_id_ligne_commande_fournisseur_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.lignes_commande_fournisseurs_id_ligne_commande_fournisseur_seq OWNED BY public.lignes_commande_fournisseurs.id_ligne_commande_fournisseur;
ALTER TABLE public.lignes_commande_fournisseurs ALTER COLUMN id_ligne_commande_fournisseur SET DEFAULT nextval('public.lignes_commande_fournisseurs_id_ligne_commande_fournisseur_seq');

-- Séquence pour notifications
CREATE SEQUENCE public.notifications_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq');

-- Séquence pour password_reset_tokens
CREATE SEQUENCE public.password_reset_tokens_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;
ALTER TABLE public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq');

-- Séquence pour produit
CREATE SEQUENCE public.produit_id_produit_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.produit_id_produit_seq OWNED BY public.produit.id_produit;
ALTER TABLE public.produit ALTER COLUMN id_produit SET DEFAULT nextval('public.produit_id_produit_seq');

-- Séquence pour stock_movement
CREATE SEQUENCE public.stock_movement_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.stock_movement_id_seq OWNED BY public.stock_movement.id;
ALTER TABLE public.stock_movement ALTER COLUMN id SET DEFAULT nextval('public.stock_movement_id_seq');

-- Séquence pour user_sessions
CREATE SEQUENCE public.user_sessions_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;
ALTER TABLE public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq');

-- Séquence pour users
CREATE SEQUENCE public.users_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq');

-- =====================================================
-- 4. CRÉATION DES CONTRAINTES (Primary Keys)
-- =====================================================

ALTER TABLE ONLY public.categorie ADD CONSTRAINT categorie_pkey PRIMARY KEY (id_categorie);
ALTER TABLE ONLY public.client ADD CONSTRAINT client_pkey PRIMARY KEY (id_client);
ALTER TABLE ONLY public.client_type_discount ADD CONSTRAINT client_type_discount_pkey PRIMARY KEY (type_client);
ALTER TABLE ONLY public.commande_client ADD CONSTRAINT commande_client_pkey PRIMARY KEY (id_commande_client);
ALTER TABLE ONLY public.commandes_fournisseurs ADD CONSTRAINT commandes_fournisseurs_pkey PRIMARY KEY (id_commande_fournisseur);
ALTER TABLE ONLY public.facture_client ADD CONSTRAINT facture_client_pkey PRIMARY KEY (id_facture_client);
ALTER TABLE ONLY public.fournisseurs ADD CONSTRAINT fournisseurs_pkey PRIMARY KEY (id_fournisseur);
ALTER TABLE ONLY public.ligne_commande_client ADD CONSTRAINT ligne_commande_client_pkey PRIMARY KEY (id_ligne_commande_client);
ALTER TABLE ONLY public.lignes_commande_fournisseurs ADD CONSTRAINT lignes_commande_fournisseurs_pkey PRIMARY KEY (id_ligne_commande_fournisseur);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.password_reset_tokens ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.produit ADD CONSTRAINT produit_pkey PRIMARY KEY (id_produit);
ALTER TABLE ONLY public.stock_movement ADD CONSTRAINT stock_movement_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_sessions ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

-- =====================================================
-- 5. CRÉATION DES CONTRAINTES UNIQUES
-- =====================================================

ALTER TABLE ONLY public.client ADD CONSTRAINT uk1rxa00yetw8yyqg6eus42k6ig UNIQUE (telephone);
ALTER TABLE ONLY public.facture_client ADD CONSTRAINT uk6d9q9rheppftb9ursam62pdyh UNIQUE (reference_facture_client);
ALTER TABLE ONLY public.users ADD CONSTRAINT uk6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);
ALTER TABLE ONLY public.categorie ADD CONSTRAINT ukd5fxf7y6in52pcv8vf3pcbrem UNIQUE (nom_categorie);
ALTER TABLE ONLY public.facture_client ADD CONSTRAINT ukmmiv1fs9q4tbfajjsft29ra4o UNIQUE (commande_id);
ALTER TABLE ONLY public.commande_client ADD CONSTRAINT ukpq3269e8snx4peb0anmxvdygv UNIQUE (reference_commande_client);
ALTER TABLE ONLY public.fournisseurs ADD CONSTRAINT uksnmjs7pdn7kkcf10wtlqtnnq3 UNIQUE (email);

-- =====================================================
-- 6. CRÉATION DES CLÉS ÉTRANGÈRES
-- =====================================================

ALTER TABLE ONLY public.facture_client ADD CONSTRAINT fk3p36rbmo4go676bdv64vvj21i FOREIGN KEY (commande_id) REFERENCES public.commande_client(id_commande_client);
ALTER TABLE ONLY public.lignes_commande_fournisseurs ADD CONSTRAINT fk3tjxk3f89b0taynq5xsbrlj4l FOREIGN KEY (produit_id) REFERENCES public.produit(id_produit);
ALTER TABLE ONLY public.produit ADD CONSTRAINT fk52xhp55kbbl6u4rbluxm3g9hw FOREIGN KEY (categorie_id) REFERENCES public.categorie(id_categorie);
ALTER TABLE ONLY public.ligne_commande_client ADD CONSTRAINT fk7m5mc02qlflt7obpm4tq2fbrx FOREIGN KEY (produit_id) REFERENCES public.produit(id_produit);
ALTER TABLE ONLY public.user_sessions ADD CONSTRAINT fk8klxsgb8dcjjklmqebqp1twd5 FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.lignes_commande_fournisseurs ADD CONSTRAINT fk9bakesrg95aior6pmp80dt756 FOREIGN KEY (commande_fournisseur_id) REFERENCES public.commandes_fournisseurs(id_commande_fournisseur);
ALTER TABLE ONLY public.facture_client ADD CONSTRAINT fkiube76wr4nkhqut4mgky7mi4b FOREIGN KEY (client_id) REFERENCES public.client(id_client);
ALTER TABLE ONLY public.password_reset_tokens ADD CONSTRAINT fkk3ndxg5xp6v7wd4gjyusp15gq FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.commande_client ADD CONSTRAINT fkkjj3vhf49o1chiq3mpuxk42vx FOREIGN KEY (client_id) REFERENCES public.client(id_client);
ALTER TABLE ONLY public.stock_movement ADD CONSTRAINT fkkuevb4vj96xlaq980829gt4jq FOREIGN KEY (produit_id) REFERENCES public.produit(id_produit);
ALTER TABLE ONLY public.ligne_commande_client ADD CONSTRAINT fkqb6qgo2gc0vye7ym03mub661u FOREIGN KEY (commande_client_id) REFERENCES public.commande_client(id_commande_client);
ALTER TABLE ONLY public.produit ADD CONSTRAINT fkqdcckamj0qj07dqg3s9op7qj7 FOREIGN KEY (fournisseur_id) REFERENCES public.fournisseurs(id_fournisseur);
ALTER TABLE ONLY public.fournisseurs_fournisseurs ADD CONSTRAINT fk3cxoe2s4malqxvy4su91qcdw2 FOREIGN KEY (fournisseur_id_fournisseur) REFERENCES public.fournisseurs(id_fournisseur);
ALTER TABLE ONLY public.fournisseurs_fournisseurs ADD CONSTRAINT fko4ihpgtf0xd7jxmkcx931tvwr FOREIGN KEY (fournisseurs_id_fournisseur) REFERENCES public.fournisseurs(id_fournisseur);

-- =====================================================
-- 7. VIDER TOUTES LES DONNÉES (Garder structure vide)
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
-- 8. DÉFINIR COMME TEMPLATE
-- =====================================================

UPDATE pg_database SET datistemplate = TRUE WHERE datname = 'template_invera';

-- =====================================================
-- 9. MESSAGE DE CONFIRMATION
-- =====================================================

\echo '✅ Base template_invera créée avec succès avec la structure mise à jour !'
