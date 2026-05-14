CREATE TABLE IF NOT EXISTS gallery_images (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    gallery_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    image_path TEXT NULL,
    caption TEXT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gallery_images_gallery
        FOREIGN KEY (gallery_id) REFERENCES galleries (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gallery_images_school_id ON gallery_images (school_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_gallery_id ON gallery_images (gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_images_school_deleted ON gallery_images (school_id, is_deleted);
