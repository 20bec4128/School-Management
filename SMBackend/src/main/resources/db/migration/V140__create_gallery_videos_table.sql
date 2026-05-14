CREATE TABLE IF NOT EXISTS gallery_videos (
    id BIGSERIAL PRIMARY KEY,
    school_id BIGINT NOT NULL,
    gallery_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    video_path TEXT NULL,
    caption TEXT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_gallery_videos_gallery
        FOREIGN KEY (gallery_id) REFERENCES galleries (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gallery_videos_school_id ON gallery_videos (school_id);
CREATE INDEX IF NOT EXISTS idx_gallery_videos_gallery_id ON gallery_videos (gallery_id);
CREATE INDEX IF NOT EXISTS idx_gallery_videos_school_deleted ON gallery_videos (school_id, is_deleted);
