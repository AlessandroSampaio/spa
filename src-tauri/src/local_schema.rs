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

diesel::table! {
    shopping_lists (id) {
        id -> Integer,
        name -> Text,
        created_at -> Text,
    }
}

diesel::table! {
    shopping_list_items (id) {
        id -> Integer,
        list_id -> Integer,
        product_code -> Text,
        added_at -> Text,
    }
}

diesel::table! {
    purchase_parameters (id) {
        id -> Integer,
        target_stock_days -> Integer,
    }
}

diesel::joinable!(shopping_list_items -> shopping_lists (list_id));
diesel::allow_tables_to_appear_in_same_query!(shopping_lists, shopping_list_items);
