package com.School.School_management.Repository;

import com.School.School_management.Entity.Vehicle;
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

public class VehicleRepositoryImpl implements VehicleRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Vehicle> findAllActiveWithDetailsOrderByIdDesc() {
        return runListQuery(null, null);
    }

    @Override
    public List<Vehicle> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId) {
        return runListQuery(schoolId, null);
    }

    @Override
    public Page<Vehicle> findPageWithDetails(Long schoolId, String search, Pageable pageable) {
        CriteriaQuery<Vehicle> dataQuery = buildDataQuery(schoolId, search);
        TypedQuery<Vehicle> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<Vehicle> content = typedQuery.getResultList();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Vehicle> countRoot = countQuery.from(Vehicle.class);
        countQuery.select(cb.countDistinct(countRoot));
        countQuery.where(buildPredicates(cb, countRoot, schoolId, search));
        Long total = entityManager.createQuery(countQuery).getSingleResult();
        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public Optional<Vehicle> findByIdWithDetails(Long id) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Vehicle> query = cb.createQuery(Vehicle.class);
        Root<Vehicle> root = query.from(Vehicle.class);
        root.fetch("school", JoinType.LEFT);
        root.fetch("driverEmployee", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(cb.equal(root.get("id"), id));
        return entityManager.createQuery(query).getResultList().stream().findFirst();
    }

    private List<Vehicle> runListQuery(Long schoolId, String search) {
        return entityManager.createQuery(buildDataQuery(schoolId, search)).getResultList();
    }

    private CriteriaQuery<Vehicle> buildDataQuery(Long schoolId, String search) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Vehicle> query = cb.createQuery(Vehicle.class);
        Root<Vehicle> root = query.from(Vehicle.class);
        root.fetch("school", JoinType.LEFT);
        root.fetch("driverEmployee", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(buildPredicates(cb, root, schoolId, search));
        query.orderBy(cb.desc(root.get("id")));
        return query;
    }

    private Predicate[] buildPredicates(CriteriaBuilder cb, Root<Vehicle> root, Long schoolId, String search) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isFalse(root.get("deleted")));

        Join<Vehicle, ?> schoolJoin = root.join("school", JoinType.LEFT);
        Join<Vehicle, ?> driverJoin = root.join("driverEmployee", JoinType.LEFT);

        if (schoolId != null) {
            predicates.add(cb.equal(schoolJoin.get("id"), schoolId));
        }
        if (search != null) {
            Expression<String> expr = buildSearchExpression(cb, root, schoolJoin, driverJoin);
            predicates.add(cb.like(cb.lower(expr), "%" + search.toLowerCase() + "%"));
        }
        return predicates.toArray(new Predicate[0]);
    }

    private Expression<String> buildSearchExpression(
            CriteriaBuilder cb,
            Root<Vehicle> root,
            Join<Vehicle, ?> schoolJoin,
            Join<Vehicle, ?> driverJoin
    ) {
        Expression<String> expr = stringValue(schoolJoin.get("schoolName"));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("vehicleNumber")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("vehicleModel")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(driverJoin.get("name")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("vehicleLicense")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("vehicleContactCountryCode")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("vehicleContactNumber")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("note")));
        return expr;
    }

    private Expression<String> stringValue(jakarta.persistence.criteria.Path<?> path) {
        return path.as(String.class);
    }
}
