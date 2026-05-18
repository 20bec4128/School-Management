package com.School.School_management.Repository;

import com.School.School_management.Entity.Notice;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {
    List<Notice> findAllByIsDeletedFalseOrderByIdDesc();
    List<Notice> findBySchoolIdAndIsDeletedFalseOrderByIdDesc(Long schoolId);

    @Query(value = """
            select n from Notice n
            where n.schoolId = :schoolId
              and n.isDeleted = false
              and (:noticeFor is null or n.noticeFor = :noticeFor)
              and (:isViewOnWeb is null or n.isViewOnWeb = :isViewOnWeb)
              and (
                :search is null
                or lower(coalesce(n.title, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(n.notice, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(n.noticeFor, '')) like lower(concat('%', :search, '%'))
              )
            order by n.id desc
            """,
            countQuery = """
            select count(n) from Notice n
            where n.schoolId = :schoolId
              and n.isDeleted = false
              and (:noticeFor is null or n.noticeFor = :noticeFor)
              and (:isViewOnWeb is null or n.isViewOnWeb = :isViewOnWeb)
              and (
                :search is null
                or lower(coalesce(n.title, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(n.notice, '')) like lower(concat('%', :search, '%'))
                or lower(coalesce(n.noticeFor, '')) like lower(concat('%', :search, '%'))
              )
            """)
    Page<Notice> pageBySchoolId(
            @Param("schoolId") Long schoolId,
            @Param("search") String search,
            @Param("noticeFor") String noticeFor,
            @Param("isViewOnWeb") Boolean isViewOnWeb,
            Pageable pageable);
}
