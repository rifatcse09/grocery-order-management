--
-- PostgreSQL database dump
--

\restrict TDavPgdqp3oEGwEjUK01qS4kqEseddqkl6gEhK1IzKPLGG8SLSXqmcHBVwv4B3B

-- Dumped from database version 16.13 (Debian 16.13-1.pgdg13+1)
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id bigint NOT NULL,
    actor_user_id bigint NOT NULL,
    entity_type character varying(80) NOT NULL,
    entity_id bigint NOT NULL,
    action character varying(120) NOT NULL,
    before_json json,
    after_json json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: adjustments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.adjustments (
    id bigint NOT NULL,
    order_id bigint,
    type character varying(255) NOT NULL,
    amount numeric(14,2) NOT NULL,
    reason character varying(255) NOT NULL,
    created_by bigint,
    meta json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT adjustments_type_check CHECK (((type)::text = ANY ((ARRAY['purchase'::character varying, 'billing'::character varying])::text[])))
);


--
-- Name: adjustments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.adjustments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: adjustments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.adjustments_id_seq OWNED BY public.adjustments.id;


--
-- Name: auth_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_tokens (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    token_hash character varying(64) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: auth_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.auth_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: auth_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.auth_tokens_id_seq OWNED BY public.auth_tokens.id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration bigint NOT NULL
);


--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);


--
-- Name: catalog_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalog_items (
    id bigint NOT NULL,
    category_id bigint NOT NULL,
    code character varying(80) NOT NULL,
    name_bn character varying(180) NOT NULL,
    name_en character varying(180) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: catalog_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.catalog_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: catalog_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.catalog_items_id_seq OWNED BY public.catalog_items.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id bigint NOT NULL,
    code character varying(50) NOT NULL,
    name_bn character varying(180) NOT NULL,
    name_en character varying(180) NOT NULL,
    markup_percent numeric(8,2) DEFAULT '0'::numeric NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: challans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.challans (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    generated_by bigint,
    snapshot json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: challans_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.challans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: challans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.challans_id_seq OWNED BY public.challans.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection text NOT NULL,
    queue text NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    type character varying(255) NOT NULL,
    version_no integer DEFAULT 1 NOT NULL,
    generated_by bigint,
    subtotal numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    grand_total numeric(14,2) DEFAULT '0'::numeric NOT NULL,
    markup_percent numeric(8,2),
    snapshot json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT invoices_type_check CHECK (((type)::text = ANY ((ARRAY['purchase'::character varying, 'billing'::character varying])::text[])))
);


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoices_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: item_price_histories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_price_histories (
    id bigint NOT NULL,
    catalog_item_id bigint NOT NULL,
    old_price numeric(12,2),
    new_price numeric(12,2) NOT NULL,
    changed_by bigint,
    effective_from timestamp(0) with time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    order_id bigint,
    item_code character varying(80),
    unit_price numeric(12,2),
    line_total numeric(12,2)
);


--
-- Name: item_price_histories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.item_price_histories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_price_histories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.item_price_histories_id_seq OWNED BY public.item_price_histories.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: ledger_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ledger_entries (
    id bigint NOT NULL,
    order_id bigint,
    entry_type character varying(60) NOT NULL,
    direction character varying(255) NOT NULL,
    amount numeric(14,2) NOT NULL,
    ref_type character varying(60),
    ref_id bigint,
    meta json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT ledger_entries_direction_check CHECK (((direction)::text = ANY ((ARRAY['debit'::character varying, 'credit'::character varying])::text[])))
);


--
-- Name: ledger_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ledger_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ledger_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ledger_entries_id_seq OWNED BY public.ledger_entries.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    type character varying(80) NOT NULL,
    title character varying(190) NOT NULL,
    body text,
    data json,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: order_lines; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_lines (
    id bigint NOT NULL,
    order_id bigint NOT NULL,
    serial integer DEFAULT 1 NOT NULL,
    category_code character varying(50),
    item_code character varying(80),
    item_name_bn character varying(180) NOT NULL,
    item_name_en character varying(180) NOT NULL,
    kg numeric(10,3) DEFAULT '0'::numeric NOT NULL,
    gram numeric(10,3) DEFAULT '0'::numeric NOT NULL,
    piece numeric(10,3) DEFAULT '0'::numeric NOT NULL,
    instructions text,
    unit_price numeric(12,2),
    line_total numeric(12,2),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    markup_percent numeric(8,2) DEFAULT '0'::numeric NOT NULL,
    markup_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL,
    unit_price_after_markup numeric(12,2),
    line_total_after_markup numeric(12,2),
    profit_loss_amount numeric(12,2) DEFAULT '0'::numeric NOT NULL
);


--
-- Name: order_lines_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.order_lines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: order_lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.order_lines_id_seq OWNED BY public.order_lines.id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id bigint NOT NULL,
    owner_id bigint NOT NULL,
    order_no character varying(255) NOT NULL,
    order_date date NOT NULL,
    delivery_datetime timestamp(0) with time zone NOT NULL,
    delivery_time_window character varying(120),
    status character varying(255) DEFAULT 'draft'::character varying NOT NULL,
    billing_address text NOT NULL,
    delivery_address text NOT NULL,
    contact_person character varying(120) NOT NULL,
    phone character varying(40) NOT NULL,
    submitted_at timestamp(0) with time zone,
    is_active boolean DEFAULT true NOT NULL,
    is_delayed boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    signature_data_url text
);


--
-- Name: orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.orders_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.orders_id_seq OWNED BY public.orders.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id bigint NOT NULL,
    order_id bigint,
    invoice_id bigint,
    amount numeric(14,2) NOT NULL,
    note character varying(255),
    created_by bigint,
    meta json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    payment_type character varying(255),
    CONSTRAINT payments_payment_type_check CHECK (((payment_type)::text = ANY ((ARRAY['purchase'::character varying, 'billing'::character varying])::text[])))
);


--
-- Name: payments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payments_id_seq OWNED BY public.payments.id;


--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


--
-- Name: statement_cycles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.statement_cycles (
    id bigint NOT NULL,
    type character varying(255) NOT NULL,
    cycle_start date NOT NULL,
    cycle_end date NOT NULL,
    generated_by bigint,
    meta json,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT statement_cycles_type_check CHECK (((type)::text = ANY ((ARRAY['purchase'::character varying, 'billing'::character varying])::text[])))
);


--
-- Name: statement_cycles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.statement_cycles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: statement_cycles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.statement_cycles_id_seq OWNED BY public.statement_cycles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(255) DEFAULT ''::character varying NOT NULL,
    role character varying(255) DEFAULT 'user'::character varying NOT NULL,
    billing_address text DEFAULT ''::text NOT NULL,
    delivery_address text DEFAULT ''::text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: adjustments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjustments ALTER COLUMN id SET DEFAULT nextval('public.adjustments_id_seq'::regclass);


--
-- Name: auth_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_tokens ALTER COLUMN id SET DEFAULT nextval('public.auth_tokens_id_seq'::regclass);


--
-- Name: catalog_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalog_items ALTER COLUMN id SET DEFAULT nextval('public.catalog_items_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: challans id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challans ALTER COLUMN id SET DEFAULT nextval('public.challans_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: item_price_histories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_price_histories ALTER COLUMN id SET DEFAULT nextval('public.item_price_histories_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: ledger_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries ALTER COLUMN id SET DEFAULT nextval('public.ledger_entries_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: order_lines id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_lines ALTER COLUMN id SET DEFAULT nextval('public.order_lines_id_seq'::regclass);


--
-- Name: orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders ALTER COLUMN id SET DEFAULT nextval('public.orders_id_seq'::regclass);


--
-- Name: payments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments ALTER COLUMN id SET DEFAULT nextval('public.payments_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: statement_cycles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statement_cycles ALTER COLUMN id SET DEFAULT nextval('public.statement_cycles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: adjustments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: auth_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.auth_tokens VALUES (1, 3, 'dd66308221355f3512f35ffeb00f4e8fec0aea8a1a77737ea42a19fe8d7428a3', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (2, 2, '52098f813d01c780f469d679eaa5c29334a1f4b145573c94e1c1c74dc82a10c3', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (3, 2, 'ed2356c49cc092510b35f97a3045249868c57b999b84ce63a9afb8e5670c66c5', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (4, 3, '319da9a979ced9ddb7fecdc65d49f41d634cdc14ad2e27f7aa8db89fdf85e546', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (5, 2, '0e321d2461d6c7b6c61b93583e0ad3ef8409a3e6eab3f12f84c449471f2e3e9b', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (6, 1, '17ab29546e1f5df6c6c5704d04279d4e1c36cada2851af1d27ef4417f0aec3f5', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (7, 3, '1557bcf63e709c9e1ce8182c5f0d7cc2e1d90699cba198c532f12204d4aec7f3', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (8, 2, '843932f77f6d2aeecbfb9dbea8151e869b6e407e8e97574413bc85e324916dbb', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (9, 2, '664ddcea3b52b78c77bd45076023c8f19d4dd2c520e3ec4d30a8afefb00a0057', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (10, 1, 'a38242080dd0eb673bcbd691f6eeb04d2df2c36105acea4c1e2b48faa9a8024d', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (11, 3, '4a3f119ce4d0ea60c5ea7db95775ecaceeececeba1694fe36648eb5a95fea6d2', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (12, 3, '3a2df7329c8902125d07bcde425e63ce2567aa095f80802849ec46018fc20fd7', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (13, 2, '5029f88a79e4ee547549a359be93584bb690167465805776f3efd46b688344cc', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (14, 1, '0f4e0f57aa4d47b3609701dc49c7f533f9dae1b08e245dfd98a31a33eb5df4b9', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (15, 3, '53423009116248de370ec6304d903ee5a965211e3d41db4815f56bbc8d76d962', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (16, 2, 'aaa62105b6603738c9ff4f955898491a7bd059a0309eade7284a4620fb09869b', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (17, 1, 'c522802af089e754fcff85758570c294ec072e585388d5b9376f4fe088f2ae08', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (18, 2, 'abce2688009576b15a66c3440c7ed73fb500a94ff1c88cf835a2c946d2de4541', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (19, 1, '5355e493fc77a04f22bad202dc8ff95b95468c1fb446773a2d1bac7eef0c6a42', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (20, 3, '23f5f5cc1a17c85aadac3bfaf4a6819c9bb76aeb9aafb9b5049467a91f3f98b4', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (21, 2, '8c8e58509c9a62b95895214a1dfb23884084ea642b2d469cfe8cd8927331d4ee', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (22, 2, '2ffc9250a325177f88a6b632c0a9bb90f1b8e62b6b11691bbeaadab9f60c2f8e', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (23, 1, '6ebd78825cebbda8d614d5030916ce097333756fb08167cb9d805370f0a3f696', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (24, 3, '3dada6fd4de2d3657c0ad8f17cd29691c11e97bd11acf05949c01e1a70d80214', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (25, 2, '7f73f4f9205822e2208adf5aca5fe7491581c40adc47dbf8c7ac36b8de624d28', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (26, 2, '719e9e1e2e2b3f5db1b7e0fab9b9d891b767b7192b04b92d99f67a7961464c78', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (27, 1, 'c1c3e6d1f6e1ad25a312046f8012c02401bef82d2fe10abf26784f1b0b0f7ddf', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (28, 3, 'd651eb157a9b6f8df6811ba85ef83cac3f55d7191f936ad9eec19cfeea318823', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (29, 2, '76f1c9167bf649520b230a1d563c3a7a7bb29a793da8e842764c9e1440f2f850', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (30, 2, '8ba8847ac83e1dfe592aca0a05208b5fdb42c9be6f7b80403d2d2175eb64922b', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (31, 1, '5099a823d58d3616e629217a679f61d06ef20b2d14a1844da2ee173f67419850', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (32, 3, '58a79de613e70b11cdaca833013fb91b6a7ad95ef012346649b970523ddbc486', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (33, 2, 'b7abe490563094a62ed694d0852574cc4a688e7aafd188b9472b47557bd5ff25', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (34, 3, '92606c7b3fa17d45ab0cf1dab9dc89f0137ea172bbab1a650b7e35ddc9362c77', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (35, 2, '436be44fe270d9e5256daf036f5bd124d12aaad04c1e8a1e2480fe6d0d0a1878', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (36, 2, '57eb0df9985c40a258d0d917efc896c16f42df1345c90cee5784db1721a35a39', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (37, 3, 'ceb9784e3e41ac1bdf27c079680110f70f0f6cf15fac2f0d3f6fd559f1676050', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (38, 2, '839b025a00b0cfd466f93abbb9664772ccb4bcafa6d2671d78325828fa43683f', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (39, 1, 'fddf36263b630d92606af714e65e0f36042c6a472555875b4c96cfb8c7118065', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (40, 3, '9a934cf7273343baf0c5c75822d2bd36c681b725ab0765dc864af1c870bf802c', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (41, 2, 'fb3d26a3023f11cfdcfa97312c900d85f9cbc0c5aae67a19e1b4d0f726d624bb', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (42, 1, 'e098a797782978faa7c2f4dba119bb5ff67de8881ae0730606de33d0c8bc7c5a', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (43, 3, '77b994fe293f4b2b8ef4c57cc58d303ff03e434985d6429541703b9586a68517', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (44, 2, '52816669d2cf8efc5678784ce252e086c68d14868d6d38a72c8b2ab1ed63b7ea', NULL, NULL);
INSERT INTO public.auth_tokens VALUES (45, 1, '030ad2c36cbe99b0500cfa522da680ff73899b41c60d51882ff11f13e9aa8cad', NULL, NULL);


--
-- Data for Name: cache; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: cache_locks; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: catalog_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.catalog_items VALUES (1, 1, 'fresh-1', 'ক্যাপসিকাম', 'Capsicum', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (2, 1, 'fresh-2', 'ধনিয়া পাতা', 'Coriander leaves', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (3, 1, 'fresh-3', 'টমেটো', 'Tomato', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (4, 1, 'fresh-4', 'বেগুন', 'Eggplant', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (5, 1, 'fresh-5', 'ফুলকপি', 'Cauliflower', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (6, 1, 'fresh-6', 'বাঁধাকপি', 'Cabbage', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (7, 2, 'dry-1', 'আলু', 'Potato', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (8, 2, 'dry-2', 'পিয়াজ', 'Onion', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (9, 2, 'dry-3', 'আদা', 'Ginger', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (10, 2, 'dry-4', 'রসুন', 'Garlic', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (11, 3, 'meat-1', 'ডিম', 'Eggs', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (12, 3, 'meat-2', 'মুরগি', 'Chicken', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (13, 3, 'meat-3', 'মাছ', 'Fish', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (14, 4, 'pantry-1', 'চাউল', 'Rice', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (15, 4, 'pantry-2', 'ডাল', 'Lentils', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (16, 4, 'pantry-3', 'আটা', 'Flour', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (17, 4, 'pantry-4', 'চিনি', 'Sugar', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (18, 4, 'pantry-5', 'লবণ', 'Salt', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (19, 4, 'pantry-6', 'তেল', 'Oil', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (20, 4, 'pantry-7', 'গুঁড়া দুধ', 'Powdered milk', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (21, 5, 'spice-1', 'মরিচ গুঁড়া', 'Chili powder', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (22, 5, 'spice-2', 'হলুদ গুঁড়া', 'Turmeric powder', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (23, 5, 'spice-3', 'ধনিয়া গুঁড়া', 'Coriander powder', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (24, 5, 'spice-4', 'মুরগির মসলা', 'Chicken spice mix', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (25, 5, 'spice-5', 'বিফের মসলা', 'Beef spice mix', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (26, 5, 'spice-6', 'মাছের মসলা', 'Fish spice mix', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (27, 5, 'spice-7', 'পাঁচফোড়ন মসলা', 'Panch phoron spice', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (28, 5, 'spice-8', 'এলাচ', 'Cardamom', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (29, 5, 'spice-9', 'লবঙ্গ', 'Clove', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (30, 5, 'spice-10', 'দারুচিনি', 'Cinnamon', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (31, 5, 'spice-11', 'জিরা', 'Cumin', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (32, 5, 'spice-12', 'শুকনা মরিচ', 'Dried Red Chili', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (33, 5, 'spice-13', 'তেজপাতা', 'Bay leaf', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (34, 6, 'hh-1', 'ভিম সাবান', 'Vim dishwashing soap', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (35, 6, 'hh-2', 'ছোট হ্যান্ড সাবান', 'Small hand soap', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.catalog_items VALUES (36, 6, 'hh-3', 'হ্যান্ড টাওয়েল টিস্যু', 'Hand towel tissue', true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.categories VALUES (1, 'fresh', 'তাজা শাকসবজি', 'Fresh Produce', 0.00, true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.categories VALUES (2, 'dry', 'শুকনো খাদ্য সামগ্রী', 'Dry Store', 0.00, true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.categories VALUES (3, 'meat', 'ডিম, মাংস ও মাছ', 'Egg, Meat & Poultry', 0.00, true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.categories VALUES (4, 'pantry', 'রান্নার উপকরণ (মসলা ছাড়া)', 'Pantry Goods (Non-spice)', 0.00, true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.categories VALUES (5, 'spice', 'মসলা ও স্বাদবর্ধক উপকরণ', 'Spices & Seasonings', 0.00, true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');
INSERT INTO public.categories VALUES (6, 'household', 'প্রয়োজনীয় সামগ্রী', 'Household Essentials', 0.00, true, '2026-05-02 14:59:04', '2026-05-02 14:59:04');


--
-- Data for Name: challans; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: item_price_histories; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: job_batches; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ledger_entries; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.migrations VALUES (1, '0001_01_01_000000_create_users_table', 1);
INSERT INTO public.migrations VALUES (2, '0001_01_01_000001_create_cache_table', 1);
INSERT INTO public.migrations VALUES (3, '0001_01_01_000002_create_jobs_table', 1);
INSERT INTO public.migrations VALUES (4, '2026_04_29_131006_create_personal_access_tokens_table', 1);
INSERT INTO public.migrations VALUES (5, '2026_04_29_131047_create_orders_table', 1);
INSERT INTO public.migrations VALUES (6, '2026_04_29_131943_create_order_lines_table', 1);
INSERT INTO public.migrations VALUES (7, '2026_04_29_131945_create_notifications_table', 1);
INSERT INTO public.migrations VALUES (8, '2026_04_29_131946_create_invoices_table', 1);
INSERT INTO public.migrations VALUES (9, '2026_04_29_131947_create_statement_cycles_table', 1);
INSERT INTO public.migrations VALUES (10, '2026_04_29_131948_create_ledger_entries_table', 1);
INSERT INTO public.migrations VALUES (11, '2026_04_29_131950_create_adjustments_table', 1);
INSERT INTO public.migrations VALUES (12, '2026_04_29_131951_create_challans_table', 1);
INSERT INTO public.migrations VALUES (13, '2026_04_29_131952_create_categories_table', 1);
INSERT INTO public.migrations VALUES (14, '2026_04_29_131953_create_catalog_items_table', 1);
INSERT INTO public.migrations VALUES (15, '2026_04_29_131954_create_item_price_histories_table', 1);
INSERT INTO public.migrations VALUES (16, '2026_04_29_145500_create_auth_tokens_table', 1);
INSERT INTO public.migrations VALUES (17, '2026_04_29_151500_add_signature_data_url_to_orders_table', 1);
INSERT INTO public.migrations VALUES (18, '2026_04_30_001700_add_markup_profit_columns_to_order_lines_table', 1);
INSERT INTO public.migrations VALUES (19, '2026_04_30_002200_extend_item_price_histories_for_order_tracking', 1);
INSERT INTO public.migrations VALUES (20, '2026_05_01_121700_create_activity_logs_table', 1);
INSERT INTO public.migrations VALUES (21, '2026_05_01_221800_create_payments_table', 1);
INSERT INTO public.migrations VALUES (22, '2026_05_01_225500_add_payment_type_to_payments_table', 1);
INSERT INTO public.migrations VALUES (23, '2026_05_03_000001_backfill_payment_type_on_payments', 2);


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: order_lines; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: statement_cycles; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES (1, 'Demo Admin', 'admin@demo.local', '+8801911000000', 'admin', 'Dhaka', 'Dhaka', true, NULL, '$2y$12$7LPKvVmS2x70et10aeJUP.BsH8j7zzfx/dLgv1JOVoZqfXCC/lx5q', NULL, '2026-05-02 14:59:04', '2026-05-02 14:59:41');
INSERT INTO public.users VALUES (2, 'Demo Moderator', 'moderator@demo.local', '+8801811000000', 'moderator', 'Dhaka', 'Dhaka', true, NULL, '$2y$12$PZQP84cH0TcSaGxobWBfpOcoHjcCjdJsPbOjTFXO2ULOSP.lW0hn2', NULL, '2026-05-02 14:59:04', '2026-05-02 14:59:41');
INSERT INTO public.users VALUES (3, 'Rafi Ahmed', 'user@demo.local', '+8801711000000', 'user', 'Dhanmondi, Dhaka-1209', 'Gulshan-2, Dhaka-1212', true, NULL, '$2y$12$1REaZ6w8LLCF032KCQp3ZupWh6QYEJ37iuQu1MC0yX332eay.RF8i', NULL, '2026-05-02 14:59:04', '2026-05-02 14:59:42');


--
-- Name: activity_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.activity_logs_id_seq', 23, true);


--
-- Name: adjustments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.adjustments_id_seq', 6, true);


--
-- Name: auth_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.auth_tokens_id_seq', 45, true);


--
-- Name: catalog_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.catalog_items_id_seq', 36, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_id_seq', 6, true);


--
-- Name: challans_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.challans_id_seq', 8, true);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 1, false);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 11, true);


--
-- Name: item_price_histories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.item_price_histories_id_seq', 9, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: ledger_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ledger_entries_id_seq', 42, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.migrations_id_seq', 23, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notifications_id_seq', 1, false);


--
-- Name: order_lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.order_lines_id_seq', 29, true);


--
-- Name: orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.orders_id_seq', 10, true);


--
-- Name: payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payments_id_seq', 25, true);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 1, false);


--
-- Name: statement_cycles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.statement_cycles_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 3, true);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: adjustments adjustments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjustments
    ADD CONSTRAINT adjustments_pkey PRIMARY KEY (id);


--
-- Name: auth_tokens auth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_tokens
    ADD CONSTRAINT auth_tokens_pkey PRIMARY KEY (id);


--
-- Name: auth_tokens auth_tokens_token_hash_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_tokens
    ADD CONSTRAINT auth_tokens_token_hash_unique UNIQUE (token_hash);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: catalog_items catalog_items_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalog_items
    ADD CONSTRAINT catalog_items_code_unique UNIQUE (code);


--
-- Name: catalog_items catalog_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalog_items
    ADD CONSTRAINT catalog_items_pkey PRIMARY KEY (id);


--
-- Name: categories categories_code_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_code_unique UNIQUE (code);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: challans challans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challans
    ADD CONSTRAINT challans_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: item_price_histories item_price_histories_order_item_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_price_histories
    ADD CONSTRAINT item_price_histories_order_item_unique UNIQUE (order_id, item_code);


--
-- Name: item_price_histories item_price_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_price_histories
    ADD CONSTRAINT item_price_histories_pkey PRIMARY KEY (id);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: ledger_entries ledger_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_lines order_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_lines
    ADD CONSTRAINT order_lines_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_no_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_no_unique UNIQUE (order_no);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: statement_cycles statement_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statement_cycles
    ADD CONSTRAINT statement_cycles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activity_logs_action_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_action_index ON public.activity_logs USING btree (action);


--
-- Name: activity_logs_entity_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_entity_id_index ON public.activity_logs USING btree (entity_id);


--
-- Name: activity_logs_entity_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activity_logs_entity_type_index ON public.activity_logs USING btree (entity_type);


--
-- Name: adjustments_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX adjustments_type_index ON public.adjustments USING btree (type);


--
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- Name: catalog_items_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX catalog_items_is_active_index ON public.catalog_items USING btree (is_active);


--
-- Name: categories_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX categories_is_active_index ON public.categories USING btree (is_active);


--
-- Name: invoices_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invoices_type_index ON public.invoices USING btree (type);


--
-- Name: item_price_histories_item_code_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX item_price_histories_item_code_index ON public.item_price_histories USING btree (item_code);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: ledger_entries_entry_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ledger_entries_entry_type_index ON public.ledger_entries USING btree (entry_type);


--
-- Name: notifications_is_read_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_is_read_index ON public.notifications USING btree (is_read);


--
-- Name: notifications_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_type_index ON public.notifications USING btree (type);


--
-- Name: order_lines_category_code_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_lines_category_code_index ON public.order_lines USING btree (category_code);


--
-- Name: order_lines_item_code_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX order_lines_item_code_index ON public.order_lines USING btree (item_code);


--
-- Name: orders_is_active_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_is_active_index ON public.orders USING btree (is_active);


--
-- Name: orders_is_delayed_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_is_delayed_index ON public.orders USING btree (is_delayed);


--
-- Name: orders_status_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX orders_status_index ON public.orders USING btree (status);


--
-- Name: payments_payment_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX payments_payment_type_index ON public.payments USING btree (payment_type);


--
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: statement_cycles_type_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX statement_cycles_type_index ON public.statement_cycles USING btree (type);


--
-- Name: users_role_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_role_index ON public.users USING btree (role);


--
-- Name: activity_logs activity_logs_actor_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_actor_user_id_foreign FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: adjustments adjustments_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjustments
    ADD CONSTRAINT adjustments_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: adjustments adjustments_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.adjustments
    ADD CONSTRAINT adjustments_order_id_foreign FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: auth_tokens auth_tokens_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_tokens
    ADD CONSTRAINT auth_tokens_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: catalog_items catalog_items_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalog_items
    ADD CONSTRAINT catalog_items_category_id_foreign FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: challans challans_generated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challans
    ADD CONSTRAINT challans_generated_by_foreign FOREIGN KEY (generated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: challans challans_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.challans
    ADD CONSTRAINT challans_order_id_foreign FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_generated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_generated_by_foreign FOREIGN KEY (generated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_order_id_foreign FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: item_price_histories item_price_histories_catalog_item_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_price_histories
    ADD CONSTRAINT item_price_histories_catalog_item_id_foreign FOREIGN KEY (catalog_item_id) REFERENCES public.catalog_items(id) ON DELETE CASCADE;


--
-- Name: item_price_histories item_price_histories_changed_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_price_histories
    ADD CONSTRAINT item_price_histories_changed_by_foreign FOREIGN KEY (changed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: item_price_histories item_price_histories_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_price_histories
    ADD CONSTRAINT item_price_histories_order_id_foreign FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: ledger_entries ledger_entries_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ledger_entries
    ADD CONSTRAINT ledger_entries_order_id_foreign FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_lines order_lines_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_lines
    ADD CONSTRAINT order_lines_order_id_foreign FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: orders orders_owner_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_owner_id_foreign FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: payments payments_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: payments payments_invoice_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_invoice_id_foreign FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


--
-- Name: payments payments_order_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_foreign FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;


--
-- Name: statement_cycles statement_cycles_generated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.statement_cycles
    ADD CONSTRAINT statement_cycles_generated_by_foreign FOREIGN KEY (generated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict TDavPgdqp3oEGwEjUK01qS4kqEseddqkl6gEhK1IzKPLGG8SLSXqmcHBVwv4B3B

