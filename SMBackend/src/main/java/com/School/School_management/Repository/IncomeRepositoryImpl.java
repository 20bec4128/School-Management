package com.School.School_management.Repository;

import com.School.School_management.Entity.Income;
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

public class IncomeRepositoryImpl implements IncomeRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Income> findAllActiveWithDetailsOrderByIdDesc() {
        return runListQuery(null, null, null, null);
    }

    @Override
    public List<Income> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId) {
        return runListQuery(schoolId, null, null, null);
    }

    @Override
    public Page<Income> findPageWithDetails(Long schoolId, Long incomeHeadId, String incomeMethod, String search, Pageable pageable) {
        CriteriaQuery<Income> dataQuery = buildDataQuery(schoolId, incomeHeadId, incomeMethod, search);
        TypedQuery<Income> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<Income> content = typedQuery.getResultList();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Income> countRoot = countQuery.from(Income.class);
        countQuery.select(cb.countDistinct(countRoot));
        countQuery.where(buildPredicates(cb, countRoot, schoolId, incomeHeadId, incomeMethod, search));
        Long total = entityManager.createQuery(countQuery).getSingleResult();
        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public Optional<Income> findByIdWithDetails(Long id) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Income> query = cb.createQuery(Income.class);
        Root<Income> root = query.from(Income.class);
        root.fetch("school", JoinType.LEFT);
        root.fetch("incomeHead", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(cb.equal(root.get("id"), id));
        return entityManager.createQuery(query).getResultList().stream().findFirst();
    }

    private List<Income> runListQuery(Long schoolId, Long incomeHeadId, String incomeMethod, String search) {
        return entityManager.createQuery(buildDataQuery(schoolId, incomeHeadId, incomeMethod, search)).getResultList();
    }

    private CriteriaQuery<Income> buildDataQuery(Long schoolId, Long incomeHeadId, String incomeMethod, String search) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Income> query = cb.createQuery(Income.class);
        Root<Income> root = query.from(Income.class);
        root.fetch("school", JoinType.LEFT);
        root.fetch("incomeHead", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(buildPredicates(cb, root, schoolId, incomeHeadId, incomeMethod, search));
        query.orderBy(cb.desc(root.get("id")));
        return query;
    }

    private Predicate[] buildPredicates(CriteriaBuilder cb, Root<Income> root, Long schoolId, Long incomeHeadId, String incomeMethod, String search) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isFalse(root.get("deleted")));
        Join<Income, ?> schoolJoin = root.join("school", JoinType.LEFT);
        Join<Income, ?> headJoin = root.join("incomeHead", JoinType.LEFT);
        if (schoolId != null) predicates.add(cb.equal(schoolJoin.get("id"), schoolId));
        if (incomeHeadId != null) predicates.add(cb.equal(headJoin.get("id"), incomeHeadId));
        if (incomeMethod != null) predicates.add(cb.equal(cb.lower(root.get("incomeMethod")), incomeMethod.toLowerCase()));
        if (search != null) {
            Expression<String> expr = cb.concat(
                    cb.concat(
                            cb.concat(
                                    cb.concat(cb.coalesce(schoolJoin.get("schoolName").as(String.class), ""), " "),
                                    cb.coalesce(headJoin.get("incomeHead").as(String.class), "")),
                            " "),
                    cb.coalesce(root.get("incomeMethod").as(String.class), "")
            );
            expr = cb.concat(expr, " ");
            expr = cb.concat(expr, cb.coalesce(root.get("note").as(String.class), ""));
            predicates.add(cb.like(cb.lower(expr), "%" + search.toLowerCase() + "%"));
        }
        return predicates.toArray(new Predicate[0]);
    }
}
