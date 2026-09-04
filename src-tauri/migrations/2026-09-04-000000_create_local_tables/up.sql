-- Singleton settings tables: a single row (id = 1) holds the current value.
CREATE TABLE connection_config (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    host TEXT NOT NULL,
    port TEXT NOT NULL,
    database TEXT NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE preferences (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    sort_field TEXT NOT NULL,
    sort_dir TEXT NOT NULL
);
