use diesel::r2d2::{self, ConnectionManager, CustomizeConnection};
use diesel::sqlite::SqliteConnection;
use diesel::RunQueryDsl;
use diesel_migrations::{embed_migrations, EmbeddedMigrations, MigrationHarness};
use std::path::Path;

pub const MIGRATIONS: EmbeddedMigrations = embed_migrations!("migrations");

pub type LocalDbPool = r2d2::Pool<ConnectionManager<SqliteConnection>>;

#[derive(Debug)]
struct ConnectionOptions;

impl CustomizeConnection<SqliteConnection, r2d2::Error> for ConnectionOptions {
    fn on_acquire(&self, conn: &mut SqliteConnection) -> Result<(), r2d2::Error> {
        diesel::sql_query("PRAGMA foreign_keys = ON")
            .execute(conn)
            .map_err(r2d2::Error::QueryError)?;
        diesel::sql_query("PRAGMA busy_timeout = 5000")
            .execute(conn)
            .map_err(r2d2::Error::QueryError)?;
        Ok(())
    }
}

/// Builds the pool for the local SQLite database and runs any pending
/// migrations against it. Unlike the Firebird pool (which points at an
/// existing external database), this file is created on first run.
pub fn build_local_pool(db_path: &Path) -> Result<LocalDbPool, String> {
    let manager = ConnectionManager::<SqliteConnection>::new(db_path.to_string_lossy());
    let pool = r2d2::Pool::builder()
        .max_size(5)
        .connection_customizer(Box::new(ConnectionOptions))
        .build(manager)
        .map_err(|e| e.to_string())?;

    let mut conn = pool.get().map_err(|e| e.to_string())?;
    conn.run_pending_migrations(MIGRATIONS)
        .map_err(|e| e.to_string())?;

    Ok(pool)
}
