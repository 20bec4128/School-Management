package com.School.School_management.Repository;

import com.School.School_management.Entity.TransportRoute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TransportRouteRepository extends JpaRepository<TransportRoute, Long>, TransportRouteRepositoryCustom {
}
