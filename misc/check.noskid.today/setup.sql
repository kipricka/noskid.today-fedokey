-- execute this before running the application

CREATE TABLE cert_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    verification_key VARCHAR(255) NOT NULL UNIQUE,
    is_valid TINYINT(1) NOT NULL DEFAULT 0,
    certificate_number VARCHAR(10) NULL,
    username VARCHAR(255) NULL,
    percentage VARCHAR(10) NULL,
    creation_date VARCHAR(50) NULL,
    country VARCHAR(100) NULL,
    country_code VARCHAR(5) NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_verification_key (verification_key),
    INDEX idx_cached_at (cached_at),
    INDEX idx_valid_cache (is_valid, cached_at)
);