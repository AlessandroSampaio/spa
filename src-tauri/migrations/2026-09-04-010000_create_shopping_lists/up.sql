CREATE TABLE shopping_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE shopping_list_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    product_code TEXT NOT NULL,
    added_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (list_id, product_code)
);

CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(list_id);

CREATE TABLE purchase_parameters (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    target_stock_days INTEGER NOT NULL DEFAULT 30
);
