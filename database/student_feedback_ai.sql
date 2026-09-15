--
-- PostgreSQL database dump
--

\restrict bNc2yHQIJ0bq4SSXeVQnSLGlAhtMsf1gcfaXva5N4UkITuJtVEYGM1VI7PyOfgl

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

-- Started on 2026-09-15 10:08:04

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
-- TOC entry 234 (class 1259 OID 24990)
-- Name: academic_terms; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.academic_terms (
    term_id integer NOT NULL,
    academic_year character varying(20) NOT NULL,
    semester integer NOT NULL,
    start_date date,
    end_date date,
    CONSTRAINT check_semester CHECK (((semester >= 1) AND (semester <= 8))),
    CONSTRAINT check_term_dates CHECK (((end_date IS NULL) OR (start_date IS NULL) OR (end_date > start_date)))
);


ALTER TABLE public.academic_terms OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 24989)
-- Name: academic_terms_term_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.academic_terms_term_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.academic_terms_term_id_seq OWNER TO postgres;

--
-- TOC entry 5221 (class 0 OID 0)
-- Dependencies: 233
-- Name: academic_terms_term_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.academic_terms_term_id_seq OWNED BY public.academic_terms.term_id;


--
-- TOC entry 224 (class 1259 OID 24866)
-- Name: batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.batches (
    batch_id integer NOT NULL,
    program_id integer NOT NULL,
    batch_name character varying(30) NOT NULL,
    start_year integer NOT NULL,
    end_year integer NOT NULL,
    CONSTRAINT check_batch_year CHECK ((end_year > start_year))
);


ALTER TABLE public.batches OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 24865)
-- Name: batches_batch_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.batches_batch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.batches_batch_id_seq OWNER TO postgres;

--
-- TOC entry 5222 (class 0 OID 0)
-- Dependencies: 223
-- Name: batches_batch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.batches_batch_id_seq OWNED BY public.batches.batch_id;


--
-- TOC entry 238 (class 1259 OID 25023)
-- Name: course_offerings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.course_offerings (
    offering_id integer NOT NULL,
    course_id integer NOT NULL,
    faculty_id integer NOT NULL,
    term_id integer NOT NULL,
    section_id integer
);


ALTER TABLE public.course_offerings OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 25022)
-- Name: course_offerings_offering_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.course_offerings_offering_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_offerings_offering_id_seq OWNER TO postgres;

--
-- TOC entry 5223 (class 0 OID 0)
-- Dependencies: 237
-- Name: course_offerings_offering_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.course_offerings_offering_id_seq OWNED BY public.course_offerings.offering_id;


--
-- TOC entry 236 (class 1259 OID 25004)
-- Name: courses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.courses (
    course_id integer NOT NULL,
    course_code character varying(30) NOT NULL,
    course_name character varying(150) NOT NULL,
    credits integer,
    department_id integer NOT NULL,
    CONSTRAINT courses_credits_check CHECK ((credits >= 0))
);


ALTER TABLE public.courses OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 25003)
-- Name: courses_course_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.courses_course_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_course_id_seq OWNER TO postgres;

--
-- TOC entry 5224 (class 0 OID 0)
-- Dependencies: 235
-- Name: courses_course_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.courses_course_id_seq OWNED BY public.courses.course_id;


--
-- TOC entry 220 (class 1259 OID 24835)
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    department_id integer NOT NULL,
    department_code character varying(20) NOT NULL,
    department_name character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 24834)
-- Name: departments_department_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.departments_department_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.departments_department_id_seq OWNER TO postgres;

--
-- TOC entry 5225 (class 0 OID 0)
-- Dependencies: 219
-- Name: departments_department_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.departments_department_id_seq OWNED BY public.departments.department_id;


--
-- TOC entry 240 (class 1259 OID 25054)
-- Name: enrollments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.enrollments (
    enrollment_id integer NOT NULL,
    student_id integer NOT NULL,
    offering_id integer NOT NULL,
    enrolled_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.enrollments OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 25053)
-- Name: enrollments_enrollment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.enrollments_enrollment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.enrollments_enrollment_id_seq OWNER TO postgres;

--
-- TOC entry 5226 (class 0 OID 0)
-- Dependencies: 239
-- Name: enrollments_enrollment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.enrollments_enrollment_id_seq OWNED BY public.enrollments.enrollment_id;


--
-- TOC entry 232 (class 1259 OID 24965)
-- Name: faculty; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.faculty (
    faculty_id integer NOT NULL,
    user_id integer NOT NULL,
    employee_id character varying(50) NOT NULL,
    department_id integer NOT NULL,
    designation character varying(100)
);


ALTER TABLE public.faculty OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 24964)
-- Name: faculty_faculty_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.faculty_faculty_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.faculty_faculty_id_seq OWNER TO postgres;

--
-- TOC entry 5227 (class 0 OID 0)
-- Dependencies: 231
-- Name: faculty_faculty_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.faculty_faculty_id_seq OWNED BY public.faculty.faculty_id;


--
-- TOC entry 242 (class 1259 OID 25077)
-- Name: feedback; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback (
    feedback_id bigint NOT NULL,
    student_id integer NOT NULL,
    offering_id integer NOT NULL,
    feedback_text text NOT NULL,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    is_anonymous boolean DEFAULT true,
    CONSTRAINT feedback_status_check CHECK (((status)::text = ANY ((ARRAY['PENDING'::character varying, 'ANALYZED'::character varying, 'FAILED'::character varying])::text[])))
);


ALTER TABLE public.feedback OWNER TO postgres;

--
-- TOC entry 248 (class 1259 OID 25146)
-- Name: feedback_aspects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.feedback_aspects (
    aspect_id bigint NOT NULL,
    feedback_id bigint NOT NULL,
    aspect character varying(100) NOT NULL,
    aspect_sentiment character varying(20),
    confidence numeric(5,4),
    CONSTRAINT feedback_aspects_aspect_sentiment_check CHECK (((aspect_sentiment)::text = ANY ((ARRAY['POSITIVE'::character varying, 'NEUTRAL'::character varying, 'NEGATIVE'::character varying])::text[]))),
    CONSTRAINT feedback_aspects_confidence_check CHECK (((confidence IS NULL) OR ((confidence >= (0)::numeric) AND (confidence <= (1)::numeric))))
);


ALTER TABLE public.feedback_aspects OWNER TO postgres;

--
-- TOC entry 247 (class 1259 OID 25145)
-- Name: feedback_aspects_aspect_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.feedback_aspects_aspect_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_aspects_aspect_id_seq OWNER TO postgres;

--
-- TOC entry 5228 (class 0 OID 0)
-- Dependencies: 247
-- Name: feedback_aspects_aspect_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.feedback_aspects_aspect_id_seq OWNED BY public.feedback_aspects.aspect_id;


--
-- TOC entry 241 (class 1259 OID 25076)
-- Name: feedback_feedback_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.feedback_feedback_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feedback_feedback_id_seq OWNER TO postgres;

--
-- TOC entry 5229 (class 0 OID 0)
-- Dependencies: 241
-- Name: feedback_feedback_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.feedback_feedback_id_seq OWNED BY public.feedback.feedback_id;


--
-- TOC entry 244 (class 1259 OID 25104)
-- Name: model_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.model_versions (
    model_version_id integer NOT NULL,
    model_name character varying(100) NOT NULL,
    version character varying(50) NOT NULL,
    task character varying(50) NOT NULL,
    model_description text,
    is_active boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT model_versions_task_check CHECK (((task)::text = ANY ((ARRAY['SENTIMENT'::character varying, 'EMOTION'::character varying, 'BOTH'::character varying])::text[])))
);


ALTER TABLE public.model_versions OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 25103)
-- Name: model_versions_model_version_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.model_versions_model_version_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.model_versions_model_version_id_seq OWNER TO postgres;

--
-- TOC entry 5230 (class 0 OID 0)
-- Dependencies: 243
-- Name: model_versions_model_version_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.model_versions_model_version_id_seq OWNED BY public.model_versions.model_version_id;


--
-- TOC entry 246 (class 1259 OID 25122)
-- Name: predictions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.predictions (
    prediction_id bigint NOT NULL,
    feedback_id bigint NOT NULL,
    model_version_id integer NOT NULL,
    sentiment character varying(20),
    sentiment_confidence numeric(5,4),
    emotion character varying(50),
    emotion_confidence numeric(5,4),
    predicted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT predictions_emotion_confidence_check CHECK (((emotion_confidence IS NULL) OR ((emotion_confidence >= (0)::numeric) AND (emotion_confidence <= (1)::numeric)))),
    CONSTRAINT predictions_sentiment_check CHECK (((sentiment)::text = ANY ((ARRAY['POSITIVE'::character varying, 'NEUTRAL'::character varying, 'NEGATIVE'::character varying])::text[]))),
    CONSTRAINT predictions_sentiment_confidence_check CHECK (((sentiment_confidence IS NULL) OR ((sentiment_confidence >= (0)::numeric) AND (sentiment_confidence <= (1)::numeric))))
);


ALTER TABLE public.predictions OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 25121)
-- Name: predictions_prediction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.predictions_prediction_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.predictions_prediction_id_seq OWNER TO postgres;

--
-- TOC entry 5231 (class 0 OID 0)
-- Dependencies: 245
-- Name: predictions_prediction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.predictions_prediction_id_seq OWNED BY public.predictions.prediction_id;


--
-- TOC entry 222 (class 1259 OID 24848)
-- Name: programs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.programs (
    program_id integer NOT NULL,
    department_id integer NOT NULL,
    program_name character varying(100) NOT NULL,
    degree character varying(50) NOT NULL,
    duration_years integer NOT NULL,
    CONSTRAINT programs_duration_years_check CHECK ((duration_years > 0))
);


ALTER TABLE public.programs OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 24847)
-- Name: programs_program_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.programs_program_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.programs_program_id_seq OWNER TO postgres;

--
-- TOC entry 5232 (class 0 OID 0)
-- Dependencies: 221
-- Name: programs_program_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.programs_program_id_seq OWNED BY public.programs.program_id;


--
-- TOC entry 226 (class 1259 OID 24884)
-- Name: sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sections (
    section_id integer NOT NULL,
    batch_id integer NOT NULL,
    section_name character varying(20) NOT NULL
);


ALTER TABLE public.sections OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24883)
-- Name: sections_section_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sections_section_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sections_section_id_seq OWNER TO postgres;

--
-- TOC entry 5233 (class 0 OID 0)
-- Dependencies: 225
-- Name: sections_section_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sections_section_id_seq OWNED BY public.sections.section_id;


--
-- TOC entry 230 (class 1259 OID 24920)
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    student_id integer NOT NULL,
    user_id integer NOT NULL,
    roll_number character varying(50) NOT NULL,
    department_id integer NOT NULL,
    program_id integer NOT NULL,
    batch_id integer NOT NULL,
    section_id integer NOT NULL,
    current_year integer NOT NULL,
    CONSTRAINT students_current_year_check CHECK ((current_year > 0))
);


ALTER TABLE public.students OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 24919)
-- Name: students_student_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.students_student_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_student_id_seq OWNER TO postgres;

--
-- TOC entry 5234 (class 0 OID 0)
-- Dependencies: 229
-- Name: students_student_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.students_student_id_seq OWNED BY public.students.student_id;


--
-- TOC entry 228 (class 1259 OID 24901)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash text NOT NULL,
    role character varying(20) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['STUDENT'::character varying, 'FACULTY'::character varying, 'ADMIN'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 24900)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO postgres;

--
-- TOC entry 5235 (class 0 OID 0)
-- Dependencies: 227
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- TOC entry 4936 (class 2604 OID 24993)
-- Name: academic_terms term_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_terms ALTER COLUMN term_id SET DEFAULT nextval('public.academic_terms_term_id_seq'::regclass);


--
-- TOC entry 4929 (class 2604 OID 24869)
-- Name: batches batch_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batches ALTER COLUMN batch_id SET DEFAULT nextval('public.batches_batch_id_seq'::regclass);


--
-- TOC entry 4938 (class 2604 OID 25026)
-- Name: course_offerings offering_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_offerings ALTER COLUMN offering_id SET DEFAULT nextval('public.course_offerings_offering_id_seq'::regclass);


--
-- TOC entry 4937 (class 2604 OID 25007)
-- Name: courses course_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses ALTER COLUMN course_id SET DEFAULT nextval('public.courses_course_id_seq'::regclass);


--
-- TOC entry 4926 (class 2604 OID 24838)
-- Name: departments department_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments ALTER COLUMN department_id SET DEFAULT nextval('public.departments_department_id_seq'::regclass);


--
-- TOC entry 4939 (class 2604 OID 25057)
-- Name: enrollments enrollment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments ALTER COLUMN enrollment_id SET DEFAULT nextval('public.enrollments_enrollment_id_seq'::regclass);


--
-- TOC entry 4935 (class 2604 OID 24968)
-- Name: faculty faculty_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty ALTER COLUMN faculty_id SET DEFAULT nextval('public.faculty_faculty_id_seq'::regclass);


--
-- TOC entry 4941 (class 2604 OID 25080)
-- Name: feedback feedback_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback ALTER COLUMN feedback_id SET DEFAULT nextval('public.feedback_feedback_id_seq'::regclass);


--
-- TOC entry 4950 (class 2604 OID 25149)
-- Name: feedback_aspects aspect_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_aspects ALTER COLUMN aspect_id SET DEFAULT nextval('public.feedback_aspects_aspect_id_seq'::regclass);


--
-- TOC entry 4945 (class 2604 OID 25107)
-- Name: model_versions model_version_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.model_versions ALTER COLUMN model_version_id SET DEFAULT nextval('public.model_versions_model_version_id_seq'::regclass);


--
-- TOC entry 4948 (class 2604 OID 25125)
-- Name: predictions prediction_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions ALTER COLUMN prediction_id SET DEFAULT nextval('public.predictions_prediction_id_seq'::regclass);


--
-- TOC entry 4928 (class 2604 OID 24851)
-- Name: programs program_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs ALTER COLUMN program_id SET DEFAULT nextval('public.programs_program_id_seq'::regclass);


--
-- TOC entry 4930 (class 2604 OID 24887)
-- Name: sections section_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections ALTER COLUMN section_id SET DEFAULT nextval('public.sections_section_id_seq'::regclass);


--
-- TOC entry 4934 (class 2604 OID 24923)
-- Name: students student_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students ALTER COLUMN student_id SET DEFAULT nextval('public.students_student_id_seq'::regclass);


--
-- TOC entry 4931 (class 2604 OID 24904)
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- TOC entry 5201 (class 0 OID 24990)
-- Dependencies: 234
-- Data for Name: academic_terms; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.academic_terms (term_id, academic_year, semester, start_date, end_date) FROM stdin;
1	2026-27	5	2026-07-01	2026-12-31
\.


--
-- TOC entry 5191 (class 0 OID 24866)
-- Dependencies: 224
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.batches (batch_id, program_id, batch_name, start_year, end_year) FROM stdin;
1	1	2024-2028	2024	2028
2	2	2024-2028	2024	2028
3	3	2024-2028	2024	2028
\.


--
-- TOC entry 5205 (class 0 OID 25023)
-- Dependencies: 238
-- Data for Name: course_offerings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.course_offerings (offering_id, course_id, faculty_id, term_id, section_id) FROM stdin;
1	1	1	1	1
2	2	1	1	1
3	3	1	1	1
\.


--
-- TOC entry 5203 (class 0 OID 25004)
-- Dependencies: 236
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.courses (course_id, course_code, course_name, credits, department_id) FROM stdin;
1	AI501	Natural Language Processing	4	1
2	AI502	Machine Learning	4	1
3	CS501	Computer Networks	4	1
\.


--
-- TOC entry 5187 (class 0 OID 24835)
-- Dependencies: 220
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.departments (department_id, department_code, department_name, created_at) FROM stdin;
1	AIDS	Artificial Intelligence and Data Science	2026-09-15 10:02:24.693081
2	CSE	Computer Science and Engineering	2026-09-15 10:02:24.693081
3	ECE	Electronics and Communication Engineering	2026-09-15 10:02:24.693081
\.


--
-- TOC entry 5207 (class 0 OID 25054)
-- Dependencies: 240
-- Data for Name: enrollments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.enrollments (enrollment_id, student_id, offering_id, enrolled_at) FROM stdin;
1	1	1	2026-09-15 10:02:24.693081
2	1	2	2026-09-15 10:02:24.693081
3	1	3	2026-09-15 10:02:24.693081
\.


--
-- TOC entry 5199 (class 0 OID 24965)
-- Dependencies: 232
-- Data for Name: faculty; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.faculty (faculty_id, user_id, employee_id, department_id, designation) FROM stdin;
1	2	TEST-FAC-001	1	Assistant Professor
\.


--
-- TOC entry 5209 (class 0 OID 25077)
-- Dependencies: 242
-- Data for Name: feedback; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feedback (feedback_id, student_id, offering_id, feedback_text, submitted_at, status, is_anonymous) FROM stdin;
\.


--
-- TOC entry 5215 (class 0 OID 25146)
-- Dependencies: 248
-- Data for Name: feedback_aspects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.feedback_aspects (aspect_id, feedback_id, aspect, aspect_sentiment, confidence) FROM stdin;
\.


--
-- TOC entry 5211 (class 0 OID 25104)
-- Dependencies: 244
-- Data for Name: model_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.model_versions (model_version_id, model_name, version, task, model_description, is_active, created_at) FROM stdin;
1	DistilBERT	v1	BOTH	Transformer-based model for sentiment and emotion classification	t	2026-09-15 10:02:24.693081
\.


--
-- TOC entry 5213 (class 0 OID 25122)
-- Dependencies: 246
-- Data for Name: predictions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.predictions (prediction_id, feedback_id, model_version_id, sentiment, sentiment_confidence, emotion, emotion_confidence, predicted_at) FROM stdin;
\.


--
-- TOC entry 5189 (class 0 OID 24848)
-- Dependencies: 222
-- Data for Name: programs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.programs (program_id, department_id, program_name, degree, duration_years) FROM stdin;
1	1	Artificial Intelligence and Data Science	B.Tech	4
2	2	Computer Science and Engineering	B.Tech	4
3	3	Electronics and Communication Engineering	B.Tech	4
\.


--
-- TOC entry 5193 (class 0 OID 24884)
-- Dependencies: 226
-- Data for Name: sections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sections (section_id, batch_id, section_name) FROM stdin;
1	1	A
2	1	B
3	2	A
4	2	B
5	3	A
\.


--
-- TOC entry 5197 (class 0 OID 24920)
-- Dependencies: 230
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (student_id, user_id, roll_number, department_id, program_id, batch_id, section_id, current_year) FROM stdin;
1	1	TEST-AIDS-001	1	1	1	1	3
\.


--
-- TOC entry 5195 (class 0 OID 24901)
-- Dependencies: 228
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (user_id, name, email, password_hash, role, is_active, created_at) FROM stdin;
1	Test Student	student@test.com	TEST_HASH_STUDENT	STUDENT	t	2026-09-15 10:02:24.693081
2	Test Faculty	faculty@test.com	TEST_HASH_FACULTY	FACULTY	t	2026-09-15 10:02:24.693081
3	Test Admin	admin@test.com	TEST_HASH_ADMIN	ADMIN	t	2026-09-15 10:02:24.693081
\.


--
-- TOC entry 5236 (class 0 OID 0)
-- Dependencies: 233
-- Name: academic_terms_term_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.academic_terms_term_id_seq', 1, true);


--
-- TOC entry 5237 (class 0 OID 0)
-- Dependencies: 223
-- Name: batches_batch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.batches_batch_id_seq', 3, true);


--
-- TOC entry 5238 (class 0 OID 0)
-- Dependencies: 237
-- Name: course_offerings_offering_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.course_offerings_offering_id_seq', 3, true);


--
-- TOC entry 5239 (class 0 OID 0)
-- Dependencies: 235
-- Name: courses_course_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.courses_course_id_seq', 3, true);


--
-- TOC entry 5240 (class 0 OID 0)
-- Dependencies: 219
-- Name: departments_department_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.departments_department_id_seq', 3, true);


--
-- TOC entry 5241 (class 0 OID 0)
-- Dependencies: 239
-- Name: enrollments_enrollment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.enrollments_enrollment_id_seq', 3, true);


--
-- TOC entry 5242 (class 0 OID 0)
-- Dependencies: 231
-- Name: faculty_faculty_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.faculty_faculty_id_seq', 1, true);


--
-- TOC entry 5243 (class 0 OID 0)
-- Dependencies: 247
-- Name: feedback_aspects_aspect_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.feedback_aspects_aspect_id_seq', 1, false);


--
-- TOC entry 5244 (class 0 OID 0)
-- Dependencies: 241
-- Name: feedback_feedback_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.feedback_feedback_id_seq', 1, false);


--
-- TOC entry 5245 (class 0 OID 0)
-- Dependencies: 243
-- Name: model_versions_model_version_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.model_versions_model_version_id_seq', 1, true);


--
-- TOC entry 5246 (class 0 OID 0)
-- Dependencies: 245
-- Name: predictions_prediction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.predictions_prediction_id_seq', 1, false);


--
-- TOC entry 5247 (class 0 OID 0)
-- Dependencies: 221
-- Name: programs_program_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.programs_program_id_seq', 3, true);


--
-- TOC entry 5248 (class 0 OID 0)
-- Dependencies: 225
-- Name: sections_section_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sections_section_id_seq', 5, true);


--
-- TOC entry 5249 (class 0 OID 0)
-- Dependencies: 229
-- Name: students_student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_student_id_seq', 1, true);


--
-- TOC entry 5250 (class 0 OID 0)
-- Dependencies: 227
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_user_id_seq', 3, true);


--
-- TOC entry 4994 (class 2606 OID 25002)
-- Name: academic_terms academic_terms_academic_year_semester_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_terms
    ADD CONSTRAINT academic_terms_academic_year_semester_key UNIQUE (academic_year, semester);


--
-- TOC entry 4996 (class 2606 OID 25000)
-- Name: academic_terms academic_terms_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.academic_terms
    ADD CONSTRAINT academic_terms_pkey PRIMARY KEY (term_id);


--
-- TOC entry 4972 (class 2606 OID 24877)
-- Name: batches batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_pkey PRIMARY KEY (batch_id);


--
-- TOC entry 5002 (class 2606 OID 25032)
-- Name: course_offerings course_offerings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_offerings
    ADD CONSTRAINT course_offerings_pkey PRIMARY KEY (offering_id);


--
-- TOC entry 4998 (class 2606 OID 25016)
-- Name: courses courses_course_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_course_code_key UNIQUE (course_code);


--
-- TOC entry 5000 (class 2606 OID 25014)
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);


--
-- TOC entry 4966 (class 2606 OID 24846)
-- Name: departments departments_department_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_department_code_key UNIQUE (department_code);


--
-- TOC entry 4968 (class 2606 OID 24844)
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (department_id);


--
-- TOC entry 5004 (class 2606 OID 25063)
-- Name: enrollments enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_pkey PRIMARY KEY (enrollment_id);


--
-- TOC entry 5006 (class 2606 OID 25065)
-- Name: enrollments enrollments_student_id_offering_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT enrollments_student_id_offering_id_key UNIQUE (student_id, offering_id);


--
-- TOC entry 4988 (class 2606 OID 24978)
-- Name: faculty faculty_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_employee_id_key UNIQUE (employee_id);


--
-- TOC entry 4990 (class 2606 OID 24974)
-- Name: faculty faculty_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_pkey PRIMARY KEY (faculty_id);


--
-- TOC entry 4992 (class 2606 OID 24976)
-- Name: faculty faculty_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT faculty_user_id_key UNIQUE (user_id);


--
-- TOC entry 5016 (class 2606 OID 25156)
-- Name: feedback_aspects feedback_aspects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_aspects
    ADD CONSTRAINT feedback_aspects_pkey PRIMARY KEY (aspect_id);


--
-- TOC entry 5008 (class 2606 OID 25092)
-- Name: feedback feedback_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT feedback_pkey PRIMARY KEY (feedback_id);


--
-- TOC entry 5010 (class 2606 OID 25120)
-- Name: model_versions model_versions_model_name_version_task_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.model_versions
    ADD CONSTRAINT model_versions_model_name_version_task_key UNIQUE (model_name, version, task);


--
-- TOC entry 5012 (class 2606 OID 25118)
-- Name: model_versions model_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.model_versions
    ADD CONSTRAINT model_versions_pkey PRIMARY KEY (model_version_id);


--
-- TOC entry 5014 (class 2606 OID 25134)
-- Name: predictions predictions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT predictions_pkey PRIMARY KEY (prediction_id);


--
-- TOC entry 4970 (class 2606 OID 24859)
-- Name: programs programs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT programs_pkey PRIMARY KEY (program_id);


--
-- TOC entry 4974 (class 2606 OID 24892)
-- Name: sections sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT sections_pkey PRIMARY KEY (section_id);


--
-- TOC entry 4982 (class 2606 OID 24934)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (student_id);


--
-- TOC entry 4984 (class 2606 OID 24938)
-- Name: students students_roll_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_roll_number_key UNIQUE (roll_number);


--
-- TOC entry 4986 (class 2606 OID 24936)
-- Name: students students_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_user_id_key UNIQUE (user_id);


--
-- TOC entry 4976 (class 2606 OID 24894)
-- Name: sections unique_batch_section; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT unique_batch_section UNIQUE (batch_id, section_name);


--
-- TOC entry 4978 (class 2606 OID 24918)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4980 (class 2606 OID 24916)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 5038 (class 2606 OID 25157)
-- Name: feedback_aspects fk_aspect_feedback; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_aspects
    ADD CONSTRAINT fk_aspect_feedback FOREIGN KEY (feedback_id) REFERENCES public.feedback(feedback_id) ON DELETE CASCADE;


--
-- TOC entry 5018 (class 2606 OID 24878)
-- Name: batches fk_batch_program; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT fk_batch_program FOREIGN KEY (program_id) REFERENCES public.programs(program_id) ON DELETE RESTRICT;


--
-- TOC entry 5027 (class 2606 OID 25017)
-- Name: courses fk_course_department; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT fk_course_department FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE RESTRICT;


--
-- TOC entry 5032 (class 2606 OID 25071)
-- Name: enrollments fk_enrollment_offering; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_enrollment_offering FOREIGN KEY (offering_id) REFERENCES public.course_offerings(offering_id) ON DELETE CASCADE;


--
-- TOC entry 5033 (class 2606 OID 25066)
-- Name: enrollments fk_enrollment_student; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.enrollments
    ADD CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;


--
-- TOC entry 5025 (class 2606 OID 24984)
-- Name: faculty fk_faculty_department; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT fk_faculty_department FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE RESTRICT;


--
-- TOC entry 5026 (class 2606 OID 24979)
-- Name: faculty fk_faculty_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.faculty
    ADD CONSTRAINT fk_faculty_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- TOC entry 5034 (class 2606 OID 25098)
-- Name: feedback fk_feedback_offering; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT fk_feedback_offering FOREIGN KEY (offering_id) REFERENCES public.course_offerings(offering_id) ON DELETE CASCADE;


--
-- TOC entry 5035 (class 2606 OID 25093)
-- Name: feedback fk_feedback_student; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback
    ADD CONSTRAINT fk_feedback_student FOREIGN KEY (student_id) REFERENCES public.students(student_id) ON DELETE CASCADE;


--
-- TOC entry 5028 (class 2606 OID 25033)
-- Name: course_offerings fk_offering_course; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_offerings
    ADD CONSTRAINT fk_offering_course FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE RESTRICT;


--
-- TOC entry 5029 (class 2606 OID 25038)
-- Name: course_offerings fk_offering_faculty; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_offerings
    ADD CONSTRAINT fk_offering_faculty FOREIGN KEY (faculty_id) REFERENCES public.faculty(faculty_id) ON DELETE RESTRICT;


--
-- TOC entry 5030 (class 2606 OID 25048)
-- Name: course_offerings fk_offering_section; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_offerings
    ADD CONSTRAINT fk_offering_section FOREIGN KEY (section_id) REFERENCES public.sections(section_id) ON DELETE RESTRICT;


--
-- TOC entry 5031 (class 2606 OID 25043)
-- Name: course_offerings fk_offering_term; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.course_offerings
    ADD CONSTRAINT fk_offering_term FOREIGN KEY (term_id) REFERENCES public.academic_terms(term_id) ON DELETE RESTRICT;


--
-- TOC entry 5036 (class 2606 OID 25135)
-- Name: predictions fk_prediction_feedback; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT fk_prediction_feedback FOREIGN KEY (feedback_id) REFERENCES public.feedback(feedback_id) ON DELETE CASCADE;


--
-- TOC entry 5037 (class 2606 OID 25140)
-- Name: predictions fk_prediction_model; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.predictions
    ADD CONSTRAINT fk_prediction_model FOREIGN KEY (model_version_id) REFERENCES public.model_versions(model_version_id) ON DELETE RESTRICT;


--
-- TOC entry 5017 (class 2606 OID 24860)
-- Name: programs fk_program_department; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.programs
    ADD CONSTRAINT fk_program_department FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE RESTRICT;


--
-- TOC entry 5019 (class 2606 OID 24895)
-- Name: sections fk_section_batch; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sections
    ADD CONSTRAINT fk_section_batch FOREIGN KEY (batch_id) REFERENCES public.batches(batch_id) ON DELETE CASCADE;


--
-- TOC entry 5020 (class 2606 OID 24954)
-- Name: students fk_student_batch; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_student_batch FOREIGN KEY (batch_id) REFERENCES public.batches(batch_id) ON DELETE RESTRICT;


--
-- TOC entry 5021 (class 2606 OID 24944)
-- Name: students fk_student_department; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_student_department FOREIGN KEY (department_id) REFERENCES public.departments(department_id) ON DELETE RESTRICT;


--
-- TOC entry 5022 (class 2606 OID 24949)
-- Name: students fk_student_program; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_student_program FOREIGN KEY (program_id) REFERENCES public.programs(program_id) ON DELETE RESTRICT;


--
-- TOC entry 5023 (class 2606 OID 24959)
-- Name: students fk_student_section; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_student_section FOREIGN KEY (section_id) REFERENCES public.sections(section_id) ON DELETE RESTRICT;


--
-- TOC entry 5024 (class 2606 OID 24939)
-- Name: students fk_student_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT fk_student_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


-- Completed on 2026-09-15 10:08:04

--
-- PostgreSQL database dump complete
--

\unrestrict bNc2yHQIJ0bq4SSXeVQnSLGlAhtMsf1gcfaXva5N4UkITuJtVEYGM1VI7PyOfgl

