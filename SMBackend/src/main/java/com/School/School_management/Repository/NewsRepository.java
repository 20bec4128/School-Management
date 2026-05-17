package com.School.School_management.Repository;

import com.School.School_management.Entity.News;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NewsRepository extends JpaRepository<News, Long> {
    List<News> findAllByIsDeletedFalseOrderByIdDesc();
    List<News> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId);

    @Query(value = """
            select n from News n
            where n.schoolId = :schoolId
              and n.isDeleted = false
              and (:isViewOnWeb is null or n.isViewOnWeb = :isViewOnWeb)
              and (
                :search is null
                or lower(coalesce(n.title, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(n.news, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(n.image, '')) like lower(concat('%', :search, '%'))
              )
            order by n.id desc
            """,
            countQuery = """
            select count(n) from News n
            where n.schoolId = :schoolId
              and n.isDeleted = false
              and (:isViewOnWeb is null or n.isViewOnWeb = :isViewOnWeb)
              and (
                :search is null
                or lower(coalesce(n.title, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(n.news, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(n.image, '')) like lower(concat('%', :search, '%'))
              )
            """)
    Page<News> pageBySchoolId(
            @Param("schoolId") Long schoolId,
            @Param("search") String search,
            @Param("isViewOnWeb") Boolean isViewOnWeb,
            Pageable pageable);
}
