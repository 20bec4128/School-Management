CREATE TABLE IF NOT EXISTS books (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    book_id VARCHAR(255) NOT NULL,
    isbn_no VARCHAR(255),
    edition VARCHAR(255),
    author VARCHAR(255),
    language VARCHAR(255),
    price NUMERIC(12,2),
    quantity INTEGER NOT NULL,
    almira_no VARCHAR(255),
    book_cover TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_books_head_office FOREIGN KEY (head_office_id) REFERENCES head_offices(id),
    CONSTRAINT fk_books_school FOREIGN KEY (school_id) REFERENCES schools(id)
);

CREATE INDEX IF NOT EXISTS idx_books_head_office_id ON books(head_office_id);
CREATE INDEX IF NOT EXISTS idx_books_school_id ON books(school_id);
CREATE INDEX IF NOT EXISTS idx_books_title ON books(title);
CREATE INDEX IF NOT EXISTS idx_books_book_id ON books(book_id);
