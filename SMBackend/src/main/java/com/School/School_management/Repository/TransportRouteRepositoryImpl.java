package com.School.School_management.Repository;

import com.School.School_management.Entity.TransportRoute;
import com.School.School_management.Entity.TransportRouteStop;
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

public class TransportRouteRepositoryImpl implements TransportRouteRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<TransportRoute> findAllActiveWithDetailsOrderByIdDesc() {
        return runListQuery(null, null, null);
    }

    @Override
    public List<TransportRoute> findByHeadOfficeIdActiveWithDetailsOrderByIdDesc(Long headOfficeId) {
        return runListQuery(headOfficeId, null, null);
    }

    @Override
    public List<TransportRoute> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId) {
        return runListQuery(null, schoolId, null);
    }

    @Override
    public Page<TransportRoute> findPageWithDetails(Long headOfficeId, Long schoolId, String search, Pageable pageable) {
        CriteriaQuery<TransportRoute> dataQuery = buildDataQuery(headOfficeId, schoolId, search);
        TypedQuery<TransportRoute> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<TransportRoute> content = typedQuery.getResultList();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<TransportRoute> countRoot = countQuery.from(TransportRoute.class);
        countQuery.select(cb.countDistinct(countRoot));
        countQuery.where(buildPredicates(cb, countRoot, headOfficeId, schoolId, search));
        Long total = entityManager.createQuery(countQuery).getSingleResult();
        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public Optional<TransportRoute> findByIdWithDetails(Long id) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<TransportRoute> query = cb.createQuery(TransportRoute.class);
        Root<TransportRoute> root = query.from(TransportRoute.class);
        root.fetch("school", JoinType.LEFT);
        root.fetch("vehicle", JoinType.LEFT);
        root.fetch("stops", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(cb.equal(root.get("id"), id));
        return entityManager.createQuery(query).getResultList().stream().findFirst();
    }

    private List<TransportRoute> runListQuery(Long headOfficeId, Long schoolId, String search) {
        return entityManager.createQuery(buildDataQuery(headOfficeId, schoolId, search)).getResultList();
    }

    private CriteriaQuery<TransportRoute> buildDataQuery(Long headOfficeId, Long schoolId, String search) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<TransportRoute> query = cb.createQuery(TransportRoute.class);
        Root<TransportRoute> root = query.from(TransportRoute.class);
        root.fetch("school", JoinType.LEFT);
        root.fetch("vehicle", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(buildPredicates(cb, root, headOfficeId, schoolId, search));
        query.orderBy(cb.desc(root.get("id")));
        return query;
    }

    private Predicate[] buildPredicates(CriteriaBuilder cb, Root<TransportRoute> root, Long headOfficeId, Long schoolId, String search) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isFalse(root.get("deleted")));

        Join<TransportRoute, ?> schoolJoin = root.join("school", JoinType.LEFT);
        Join<TransportRoute, ?> vehicleJoin = root.join("vehicle", JoinType.LEFT);
        Join<TransportRoute, TransportRouteStop> stopJoin = root.join("stops", JoinType.LEFT);

        if (headOfficeId != null) {
            predicates.add(cb.equal(root.get("headOfficeId"), headOfficeId));
        }
        if (schoolId != null) {
            predicates.add(cb.equal(schoolJoin.get("id"), schoolId));
        }
        if (search != null) {
            Expression<String> expr = buildSearchExpression(cb, root, schoolJoin, vehicleJoin, stopJoin);
            predicates.add(cb.like(cb.lower(expr), "%" + search.toLowerCase() + "%"));
        }
        return predicates.toArray(new Predicate[0]);
    }

    private Expression<String> buildSearchExpression(
            CriteriaBuilder cb,
            Root<TransportRoute> root,
            Join<TransportRoute, ?> schoolJoin,
            Join<TransportRoute, ?> vehicleJoin,
            Join<TransportRoute, TransportRouteStop> stopJoin
    ) {
        Expression<String> expr = stringValue(schoolJoin.get("schoolName"));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("routeName")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("routeStart")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("routeEnd")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("note")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(vehicleJoin.get("vehicleNumber")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(vehicleJoin.get("vehicleModel")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(stopJoin.get("stopName")));
        return expr;
    }

    private Expression<String> stringValue(jakarta.persistence.criteria.Path<?> path) {
        return path.as(String.class);
    }
}
