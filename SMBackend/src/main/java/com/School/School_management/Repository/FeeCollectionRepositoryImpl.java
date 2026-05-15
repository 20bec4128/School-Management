package com.School.School_management.Repository;

import com.School.School_management.Entity.FeeCollection;
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

public class FeeCollectionRepositoryImpl implements FeeCollectionRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<FeeCollection> findAllActiveWithDetailsOrderByIdDesc() {
        return runListQuery(null, null, null, null, null, null);
    }

    @Override
    public List<FeeCollection> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId) {
        return runListQuery(schoolId, null, null, null, null, null);
    }

    @Override
    public Page<FeeCollection> findPageWithDetails(Long schoolId, Long classId, Long feeTypeId, String status, String month, String search, Pageable pageable) {
        CriteriaQuery<FeeCollection> dataQuery = buildDataQuery(schoolId, classId, feeTypeId, status, month, search);
        TypedQuery<FeeCollection> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<FeeCollection> content = typedQuery.getResultList();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<FeeCollection> countRoot = countQuery.from(FeeCollection.class);
        countQuery.select(cb.countDistinct(countRoot));
        countQuery.where(buildPredicates(cb, countRoot, schoolId, classId, feeTypeId, status, month, search));
        Long total = entityManager.createQuery(countQuery).getSingleResult();

        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public Optional<FeeCollection> findByIdWithDetails(Long id) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<FeeCollection> query = cb.createQuery(FeeCollection.class);
        Root<FeeCollection> root = query.from(FeeCollection.class);
        query.select(root).distinct(true);
        query.where(cb.equal(root.get("id"), id));
        return entityManager.createQuery(query).getResultList().stream().findFirst();
    }

    private List<FeeCollection> runListQuery(Long schoolId, Long classId, Long feeTypeId, String status, String month, String search) {
        return entityManager.createQuery(buildDataQuery(schoolId, classId, feeTypeId, status, month, search)).getResultList();
    }

    private CriteriaQuery<FeeCollection> buildDataQuery(Long schoolId, Long classId, Long feeTypeId, String status, String month, String search) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<FeeCollection> query = cb.createQuery(FeeCollection.class);
        Root<FeeCollection> root = query.from(FeeCollection.class);
        query.select(root).distinct(true);
        query.where(buildPredicates(cb, root, schoolId, classId, feeTypeId, status, month, search));
        query.orderBy(cb.desc(root.get("id")));
        return query;
    }

    private Predicate[] buildPredicates(CriteriaBuilder cb, Root<FeeCollection> root, Long schoolId, Long classId, Long feeTypeId, String status, String month, String search) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isFalse(root.get("deleted")));

        Join<FeeCollection, ?> schoolJoin = root.join("school", JoinType.LEFT);
        Join<FeeCollection, ?> classJoin = root.join("schoolClass", JoinType.LEFT);
        Join<FeeCollection, ?> studentJoin = root.join("student", JoinType.LEFT);
        Join<FeeCollection, ?> feeTypeJoin = root.join("feeType", JoinType.LEFT);

        if (schoolId != null) {
            predicates.add(cb.equal(schoolJoin.get("id"), schoolId));
        }
        if (classId != null) {
            predicates.add(cb.equal(classJoin.get("id"), classId));
        }
        if (feeTypeId != null) {
            predicates.add(cb.equal(feeTypeJoin.get("id"), feeTypeId));
        }
        if (status != null) {
            predicates.add(cb.equal(cb.lower(root.get("paidStatus")), status.toLowerCase()));
        }
        if (month != null) {
            predicates.add(cb.equal(cb.lower(root.get("month")), month.toLowerCase()));
        }
        if (search != null) {
            Expression<String> searchExpr = buildSearchExpression(cb, root, schoolJoin, classJoin, studentJoin, feeTypeJoin);
            predicates.add(cb.like(cb.lower(searchExpr), "%" + search.toLowerCase() + "%"));
        }
        return predicates.toArray(new Predicate[0]);
    }

    private Expression<String> buildSearchExpression(
            CriteriaBuilder cb,
            Root<FeeCollection> root,
            Join<FeeCollection, ?> schoolJoin,
            Join<FeeCollection, ?> classJoin,
            Join<FeeCollection, ?> studentJoin,
            Join<FeeCollection, ?> feeTypeJoin
    ) {
        Expression<String> expr = stringValue(schoolJoin.get("schoolName"));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("invoiceNumber")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(studentJoin.get("name")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(classJoin.get("className")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(feeTypeJoin.get("title")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("month")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("paidStatus")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("note")));
        return expr;
    }

    private Expression<String> stringValue(jakarta.persistence.criteria.Path<?> path) {
        return path.as(String.class);
    }
}
