use diesel::prelude::*;
use diesel::{sql_query, Connection, ConnectionError};
use rsfbclient_diesel::FbConnection;

pub struct DieselConnectionManager {
    connection_string: String,
}

impl DieselConnectionManager {
    pub fn new(database_url: &str) -> Self {
        Self {
            connection_string: database_url.to_string(),
        }
    }
}

impl r2d2::ManageConnection for DieselConnectionManager {
    type Connection = FbConnection;
    type Error = ConnectionError;

    fn connect(&self) -> Result<Self::Connection, Self::Error> {
        FbConnection::establish(&self.connection_string)
    }

    fn is_valid(&self, conn: &mut Self::Connection) -> Result<(), Self::Error> {
        sql_query("SELECT 1 FROM RDB$DATABASE")
            .execute(conn)
            .map(|_| ())
            .map_err(|_| {
                ConnectionError::BadConnection("Diesel pooled connection check failed.".into())
            })
    }

    fn has_broken(&self, _conn: &mut Self::Connection) -> bool {
        false
    }
}

pub type DbPool = r2d2::Pool<DieselConnectionManager>;

pub struct ConnectionConfig {
    pub host: String,
    pub port: u16,
    pub database: String,
    pub username: String,
    pub password: String,
}

impl ConnectionConfig {
    /// Builds the Firebird connection URL.
    /// Absolute database paths (starting with '/') produce a double-slash
    /// after the port: `firebird://user:pass@host:port//abs/path.fdb`
    pub fn url(&self) -> String {
        format!(
            "firebird://{}:{}@{}:{}/{}",
            self.username, self.password, self.host, self.port, self.database,
        )
    }
}

pub fn build_pool(config: &ConnectionConfig) -> Result<DbPool, r2d2::Error> {
    let url = config.url();
    let manager = DieselConnectionManager::new(&url);
    r2d2::Pool::builder().max_size(5).build(manager)
}
