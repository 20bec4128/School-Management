package com.School.School_management.Repository;

import com.School.School_management.Entity.Hostel;
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

public class HostelRepositoryImpl implements HostelRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Hostel> findAllActiveWithDetailsOrderByIdDesc() {
        return runListQuery(null, null, null);
    }

    @Override
    public List<Hostel> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId) {
        return runListQuery(null, schoolId, null);
    }

    @Override
    public List<Hostel> findByHeadOfficeIdActiveWithDetailsOrderByIdDesc(Long headOfficeId) {
        return runListQuery(headOfficeId, null, null);
    }

    @Override
    public Page<Hostel> findPageWithDetails(Long headOfficeId, Long schoolId, String search, Pageable pageable) {
        CriteriaQuery<Hostel> dataQuery = buildDataQuery(headOfficeId, schoolId, search);
        TypedQuery<Hostel> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<Hostel> content = typedQuery.getResultList();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Hostel> countRoot = countQuery.from(Hostel.class);
        countQuery.select(cb.countDistinct(countRoot));
        countQuery.where(buildPredicates(cb, countRoot, headOfficeId, schoolId, search));
        Long total = entityManager.createQuery(countQuery).getSingleResult();
        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public Optional<Hostel> findByIdWithDetails(Long id) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Hostel> query = cb.createQuery(Hostel.class);
        Root<Hostel> root = query.from(Hostel.class);
        root.fetch("school", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(cb.equal(root.get("id"), id));
        return entityManager.createQuery(query).getResultList().stream().findFirst();
    }

    private List<Hostel> runListQuery(Long headOfficeId, Long schoolId, String search) {
        return entityManager.createQuery(buildDataQuery(headOfficeId, schoolId, search)).getResultList();
    }

    private CriteriaQuery<Hostel> buildDataQuery(Long headOfficeId, Long schoolId, String search) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Hostel> query = cb.createQuery(Hostel.class);
        Root<Hostel> root = query.from(Hostel.class);
        root.fetch("school", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(buildPredicates(cb, root, headOfficeId, schoolId, search));
        query.orderBy(cb.desc(root.get("id")));
        return query;
    }

    private Predicate[] buildPredicates(CriteriaBuilder cb, Root<Hostel> root, Long headOfficeId, Long schoolId, String search) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isFalse(root.get("deleted")));
        Join<Hostel, ?> schoolJoin = root.join("school", JoinType.LEFT);

        if (headOfficeId != null) {
            predicates.add(cb.equal(root.get("headOfficeId"), headOfficeId));
        }
        if (schoolId != null) {
            predicates.add(cb.equal(schoolJoin.get("id"), schoolId));
        }
        if (search != null) {
            Expression<String> expr = buildSearchExpression(cb, root, schoolJoin);
            predicates.add(cb.like(cb.lower(expr), "%" + search.toLowerCase() + "%"));
        }
        return predicates.toArray(new Predicate[0]);
    }

    private Expression<String> buildSearchExpression(CriteriaBuilder cb, Root<Hostel> root, Join<Hostel, ?> schoolJoin) {
        Expression<String> expr = stringValue(schoolJoin.get("schoolName"));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("name")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("hostelType")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("address")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("note")));
        return expr;
    }

    private Expression<String> stringValue(jakarta.persistence.criteria.Path<?> path) {
        return path.as(String.class);
    }
}
