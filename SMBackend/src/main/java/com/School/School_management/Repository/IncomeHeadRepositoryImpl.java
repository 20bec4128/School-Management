package com.School.School_management.Repository;

import com.School.School_management.Entity.IncomeHead;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class IncomeHeadRepositoryImpl implements IncomeHeadRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<IncomeHead> findAllActiveWithDetailsOrderByIdDesc() {
        return runListQuery(null, null);
    }

    @Override
    public List<IncomeHead> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId) {
        return runListQuery(schoolId, null);
    }

    @Override
    public Page<IncomeHead> findPageWithDetails(Long schoolId, String search, Pageable pageable) {
        CriteriaQuery<IncomeHead> dataQuery = buildDataQuery(schoolId, search);
        TypedQuery<IncomeHead> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<IncomeHead> content = typedQuery.getResultList();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<IncomeHead> countRoot = countQuery.from(IncomeHead.class);
        countQuery.select(cb.countDistinct(countRoot));
        countQuery.where(buildPredicates(cb, countRoot, schoolId, search));
        Long total = entityManager.createQuery(countQuery).getSingleResult();
        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public Optional<IncomeHead> findByIdWithDetails(Long id) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<IncomeHead> query = cb.createQuery(IncomeHead.class);
        Root<IncomeHead> root = query.from(IncomeHead.class);
        root.fetch("school", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(cb.equal(root.get("id"), id));
        return entityManager.createQuery(query).getResultList().stream().findFirst();
    }

    private List<IncomeHead> runListQuery(Long schoolId, String search) {
        return entityManager.createQuery(buildDataQuery(schoolId, search)).getResultList();
    }

    private CriteriaQuery<IncomeHead> buildDataQuery(Long schoolId, String search) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<IncomeHead> query = cb.createQuery(IncomeHead.class);
        Root<IncomeHead> root = query.from(IncomeHead.class);
        root.fetch("school", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(buildPredicates(cb, root, schoolId, search));
        query.orderBy(cb.desc(root.get("id")));
        return query;
    }

    private Predicate[] buildPredicates(CriteriaBuilder cb, Root<IncomeHead> root, Long schoolId, String search) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isFalse(root.get("deleted")));
        Join<IncomeHead, ?> schoolJoin = root.join("school", JoinType.LEFT);
        if (schoolId != null) {
            predicates.add(cb.equal(schoolJoin.get("id"), schoolId));
        }
        if (search != null) {
            Expression<String> expr = cb.concat(
                    cb.concat(
                            cb.concat(
                                    cb.coalesce(schoolJoin.get("schoolName").as(String.class), ""),
                                    " "),
                            cb.coalesce(root.get("incomeHead").as(String.class), "")),
                    " "
            );
            expr = cb.concat(expr, cb.coalesce(root.get("note").as(String.class), ""));
            predicates.add(cb.like(cb.lower(expr), "%" + search.toLowerCase() + "%"));
        }
        return predicates.toArray(new Predicate[0]);
    }
}
