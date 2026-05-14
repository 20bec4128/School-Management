CREATE TABLE IF NOT EXISTS transport_routes (
    id BIGSERIAL PRIMARY KEY,
    head_office_id BIGINT NOT NULL,
    school_id BIGINT NOT NULL,
    vehicle_id BIGINT NOT NULL,
    route_name VARCHAR(255) NOT NULL,
    route_start VARCHAR(255) NOT NULL,
    route_end VARCHAR(255) NOT NULL,
    note TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_transport_routes_school FOREIGN KEY (school_id) REFERENCES schools(id),
    CONSTRAINT fk_transport_routes_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE INDEX IF NOT EXISTS idx_transport_routes_school_id ON transport_routes(school_id);
CREATE INDEX IF NOT EXISTS idx_transport_routes_head_office_id ON transport_routes(head_office_id);
CREATE INDEX IF NOT EXISTS idx_transport_routes_vehicle_id ON transport_routes(vehicle_id);

CREATE TABLE IF NOT EXISTS transport_route_stops (
    id BIGSERIAL PRIMARY KEY,
    route_id BIGINT NOT NULL,
    stop_order INTEGER NOT NULL,
    stop_name VARCHAR(255) NOT NULL,
    stop_km NUMERIC(12,2),
    stop_fare NUMERIC(12,2),
    created_at TIMESTAMP,
    CONSTRAINT fk_transport_route_stops_route FOREIGN KEY (route_id) REFERENCES transport_routes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transport_route_stops_route_id ON transport_route_stops(route_id);
