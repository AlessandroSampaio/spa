use diesel::r2d2;
use r2d2_firebird::DieselConnectionManager;

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

pub fn build_pool(config: &ConnectionConfig) -> Result<DbPool, r2d2::PoolError> {
    let url = config.url();
    let manager = DieselConnectionManager::new(&url);
    r2d2::Pool::builder().max_size(5).build(manager)
}
