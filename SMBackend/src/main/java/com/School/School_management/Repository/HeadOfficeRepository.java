package com.School.School_management.Repository;

import com.School.School_management.Entity.HeadOffice;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HeadOfficeRepository extends JpaRepository<HeadOffice, Long> {
    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndIdNot(String name, Long id);

    Optional<HeadOffice> findByNameIgnoreCase(String name);

    Optional<HeadOffice> findById(Long id);

    @Query(
            value = """
                    select *
                    from head_offices h
                    where (:status is null or lower(cast(h.status as text)) = lower(cast(:status as text)))
                      and (
                        :search is null
                        or lower(cast(h.name as text)) like lower(concat('%', cast(:search as text), '%'))
                      )
                    """,
            countQuery = """
                    select count(*)
                    from head_offices h
                    where (:status is null or lower(cast(h.status as text)) = lower(cast(:status as text)))
                      and (
                        :search is null
                        or lower(cast(h.name as text)) like lower(concat('%', cast(:search as text), '%'))
                      )
                    """,
            nativeQuery = true
    )
    Page<HeadOffice> search(@Param("search") String search, @Param("status") String status, Pageable pageable);
}
