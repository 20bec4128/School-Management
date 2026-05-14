package com.School.School_management.Repository;

import com.School.School_management.Entity.ExpenditureHead;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

public class ExpenditureHeadRepositoryImpl implements ExpenditureHeadRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<ExpenditureHead> findAllActiveWithDetailsOrderByIdDesc() {
        return runListQuery(null, null);
    }

    @Override
    public List<ExpenditureHead> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId) {
        return runListQuery(schoolId, null);
    }

    @Override
    public Page<ExpenditureHead> findPageWithDetails(Long schoolId, String search, Pageable pageable) {
        CriteriaQuery<ExpenditureHead> dataQuery = buildDataQuery(schoolId, search);
        TypedQuery<ExpenditureHead> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<ExpenditureHead> content = typedQuery.getResultList();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<ExpenditureHead> countRoot = countQuery.from(ExpenditureHead.class);
        countQuery.select(cb.countDistinct(countRoot));
        countQuery.where(buildPredicates(cb, countRoot, schoolId, search));
        Long total = entityManager.createQuery(countQuery).getSingleResult();
        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public Optional<ExpenditureHead> findByIdWithDetails(Long id) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<ExpenditureHead> query = cb.createQuery(ExpenditureHead.class);
        Root<ExpenditureHead> root = query.from(ExpenditureHead.class);
        root.fetch("school", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(cb.equal(root.get("id"), id));
        return entityManager.createQuery(query).getResultList().stream().findFirst();
    }

    private List<ExpenditureHead> runListQuery(Long schoolId, String search) {
        return entityManager.createQuery(buildDataQuery(schoolId, search)).getResultList();
    }

    private CriteriaQuery<ExpenditureHead> buildDataQuery(Long schoolId, String search) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<ExpenditureHead> query = cb.createQuery(ExpenditureHead.class);
        Root<ExpenditureHead> root = query.from(ExpenditureHead.class);
        root.fetch("school", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(buildPredicates(cb, root, schoolId, search));
        query.orderBy(cb.desc(root.get("id")));
        return query;
    }

    private Predicate[] buildPredicates(CriteriaBuilder cb, Root<ExpenditureHead> root, Long schoolId, String search) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isFalse(root.get("deleted")));
        Join<ExpenditureHead, ?> schoolJoin = root.join("school", JoinType.LEFT);
        if (schoolId != null) {
            predicates.add(cb.equal(schoolJoin.get("id"), schoolId));
        }
        if (search != null) {
            Expression<String> expr = cb.concat(
                    cb.concat(
                            cb.concat(
                                    cb.coalesce(schoolJoin.get("schoolName").as(String.class), ""),
                                    " "),
                            cb.coalesce(root.get("expenditureHead").as(String.class), "")),
                    " ");
            expr = cb.concat(expr, cb.coalesce(root.get("note").as(String.class), ""));
            predicates.add(cb.like(cb.lower(expr), "%" + search.toLowerCase() + "%"));
        }
        return predicates.toArray(new Predicate[0]);
    }
}
