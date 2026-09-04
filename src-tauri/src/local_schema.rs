// Schema for the local SQLite database (settings/preferences, and future
// app-owned data such as shopping lists). Managed via Diesel migrations in
// `migrations/` — unlike src/schema.rs, which mirrors an external Firebird DB.

diesel::table! {
    connection_config (id) {
        id -> Integer,
        host -> Text,
        port -> Text,
        database -> Text,
        username -> Text,
        password -> Text,
    }
}

diesel::table! {
    preferences (id) {
        id -> Integer,
        sort_field -> Text,
        sort_dir -> Text,
    }
}
