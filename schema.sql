-- ============================================================
-- SISTEMA DE INCIDENCIAS — Schema para Turso (SQLite/libSQL)
-- BD: sistema_incidencias
-- Solo catálogos (sin datos de incidencias)
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- =================== CATÁLOGOS ===================

CREATE TABLE productos (
  ean              TEXT PRIMARY KEY,
  sku              TEXT UNIQUE NOT NULL,
  descripcion      TEXT,
  precio_unitario  REAL,
  proveedor        TEXT                          -- ← NUEVA COLUMNA
);
CREATE INDEX idx_productos_sku ON productos(sku);
CREATE INDEX idx_productos_proveedor ON productos(proveedor);

CREATE TABLE usuarios (
  usuario          TEXT PRIMARY KEY,
  password_hash    TEXT NOT NULL,          -- PBKDF2-SHA256
  nombre           TEXT NOT NULL,
  rol              TEXT NOT NULL,
  activo           INTEGER DEFAULT 1       -- SQLite no tiene BOOLEAN nativo
);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

CREATE TABLE usuarios_wms (
  conexion         TEXT PRIMARY KEY,
  nombre           TEXT NOT NULL
);

CREATE TABLE auxiliares (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre           TEXT NOT NULL,
  area             TEXT NOT NULL,
  UNIQUE(nombre, area)
);
CREATE INDEX idx_auxiliares_area ON auxiliares(area);

-- =================== INCIDENCIAS: DECANTING (AMR) ===================

CREATE TABLE incidencias_amr (
  id                   TEXT PRIMARY KEY,
  fecha                TEXT NOT NULL,            -- 'dd/MM/yyyy'
  hora                 TEXT NOT NULL,            -- 'HH:mm:ss'
  ts                   INTEGER,                  -- timestamp unix (para ordenar)
  area                 TEXT,
  lpn                  TEXT,
  tipo_incidencia      TEXT,
  reportado            TEXT,
  estacion             TEXT,
  articulo             TEXT,                     -- EAN/scan crudo
  codigo               TEXT,                     -- SKU normalizado
  lote                 TEXT,
  cantidad             REAL DEFAULT 0,
  um                   TEXT DEFAULT 'Unidad',
  observacion          TEXT,
  status               TEXT DEFAULT 'Pendiente',
  fecha_revision       TEXT,
  hora_revision        TEXT,
  usuario_revision     TEXT,
  n_semana             INTEGER,
  usuario_picking      TEXT,
  turno_picking        TEXT,
  ubicacion_picking    TEXT,
  fecha_modific_wms    TEXT,
  ubicacion_hallazgo   TEXT,
  obs_revision         TEXT,
  valorizado           REAL DEFAULT 0,
  tiempo_solucion      TEXT,
  usuario_cierre       TEXT,
  causa_raiz           TEXT,
  fecha_cierre         TEXT,
  hora_cierre          TEXT,
  hist_mod             TEXT,
  origen               TEXT DEFAULT 'PWA',
  usuario_registro     TEXT
);
CREATE INDEX idx_amr_status ON incidencias_amr(status);
CREATE INDEX idx_amr_fecha ON incidencias_amr(fecha);
CREATE INDEX idx_amr_ts ON incidencias_amr(ts DESC);
CREATE INDEX idx_amr_usuario_reg ON incidencias_amr(usuario_registro);

-- =================== INCIDENCIAS: AUDITORÍAS (AUD) ===================

CREATE TABLE auditorias (
  id                   TEXT PRIMARY KEY,
  fecha                TEXT NOT NULL,
  hora                 TEXT NOT NULL,
  ts                   INTEGER,
  area                 TEXT,
  lpn                  TEXT,
  tipo_incidencia      TEXT,
  auditor              TEXT,                     -- ← diferencia con AMR
  estacion             TEXT,
  articulo             TEXT,
  codigo               TEXT,
  lote                 TEXT,
  cantidad             REAL DEFAULT 0,
  um                   TEXT DEFAULT 'Unidad',
  observacion          TEXT,
  status               TEXT DEFAULT 'Pendiente',
  fecha_revision       TEXT,
  hora_revision        TEXT,
  usuario_revision     TEXT,
  n_semana             INTEGER,
  usuario_picking      TEXT,
  turno_picking        TEXT,
  ubicacion_picking    TEXT,
  fecha_modific_wms    TEXT,
  ubicacion_hallazgo   TEXT,
  obs_revision         TEXT,
  valorizado           REAL DEFAULT 0,
  tiempo_solucion      TEXT,
  usuario_cierre       TEXT,
  causa_raiz           TEXT,
  fecha_cierre         TEXT,
  hora_cierre          TEXT,
  hist_mod             TEXT,
  origen               TEXT DEFAULT 'PWA',
  usuario_registro     TEXT
);
CREATE INDEX idx_aud_status ON auditorias(status);
CREATE INDEX idx_aud_fecha ON auditorias(fecha);
CREATE INDEX idx_aud_ts ON auditorias(ts DESC);

-- =================== INCIDENCIAS: APILADOR (API) ===================

CREATE TABLE incidencias_apilador (
  id                   TEXT PRIMARY KEY,
  fecha                TEXT NOT NULL,
  hora                 TEXT NOT NULL,
  ts                   INTEGER,
  area                 TEXT,
  cubeta               TEXT,
  tipo_incidencia      TEXT,
  articulo             TEXT,
  cantidad             REAL DEFAULT 0,
  observacion          TEXT,
  origen               TEXT DEFAULT 'PWA',
  usuario_registro     TEXT
);
CREATE INDEX idx_api_fecha ON incidencias_apilador(fecha);
CREATE INDEX idx_api_ts ON incidencias_apilador(ts DESC);

-- =================== INCIDENCIAS: AFRAME (AFR) ===================

CREATE TABLE incidencias_aframe (
  id                   TEXT PRIMARY KEY,
  fecha                TEXT NOT NULL,
  hora                 TEXT NOT NULL,
  ts                   INTEGER,
  area                 TEXT,
  cubeta               TEXT,
  tipo_incidencia      TEXT,
  articulo             TEXT,
  cantidad             REAL DEFAULT 0,
  observacion          TEXT,
  origen               TEXT DEFAULT 'PWA',
  usuario_registro     TEXT
);
CREATE INDEX idx_afr_fecha ON incidencias_aframe(fecha);
CREATE INDEX idx_afr_ts ON incidencias_aframe(ts DESC);

-- =================== INCIDENCIAS: PERSONAL (AUX) ===================

CREATE TABLE incidencias_auxiliar (
  id                   TEXT PRIMARY KEY,
  fecha                TEXT NOT NULL,
  hora                 TEXT NOT NULL,
  ts                   INTEGER,
  auxiliar             TEXT,                     -- nombre del auxiliar afectado
  lpn                  TEXT,
  tipo_incidencia      TEXT,
  articulo             TEXT,
  cantidad             REAL DEFAULT 0,
  observacion          TEXT,
  origen               TEXT DEFAULT 'PWA',
  usuario_registro     TEXT                      -- supervisor que registró
);
CREATE INDEX idx_aux_fecha ON incidencias_auxiliar(fecha);
CREATE INDEX idx_aux_ts ON incidencias_auxiliar(ts DESC);
CREATE INDEX idx_aux_auxiliar ON incidencias_auxiliar(auxiliar);

-- =================== TABLA AUXILIAR: SESIONES ===================

CREATE TABLE sesiones (
  token                TEXT PRIMARY KEY,
  usuario              TEXT NOT NULL,
  creado_en            TEXT NOT NULL,
  expira_en            TEXT NOT NULL,
  FOREIGN KEY(usuario) REFERENCES usuarios(usuario)
);
CREATE INDEX idx_sesiones_usuario ON sesiones(usuario);