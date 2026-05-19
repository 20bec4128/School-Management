package com.School.School_management.Repository;

import com.School.School_management.Entity.Expenditure;
import java.time.LocalDate;
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

public class ExpenditureRepositoryImpl implements ExpenditureRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Expenditure> findAllActiveWithDetailsOrderByIdDesc() {
        return runListQuery(null, null, null, null);
    }

    @Override
    public List<Expenditure> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId) {
        return runListQuery(schoolId, null, null, null);
    }

    @Override
    public Page<Expenditure> findPageWithDetails(
            Long schoolId,
            Long expenditureHeadId,
            String expenditureMethod,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            Pageable pageable
    ) {
        CriteriaQuery<Expenditure> dataQuery = buildDataQuery(schoolId, expenditureHeadId, expenditureMethod, startDate, endDate, search);
        TypedQuery<Expenditure> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<Expenditure> content = typedQuery.getResultList();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Expenditure> countRoot = countQuery.from(Expenditure.class);
        countQuery.select(cb.countDistinct(countRoot));
        countQuery.where(buildPredicates(cb, countRoot, schoolId, expenditureHeadId, expenditureMethod, startDate, endDate, search));
        Long total = entityManager.createQuery(countQuery).getSingleResult();
        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public Optional<Expenditure> findByIdWithDetails(Long id) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Expenditure> query = cb.createQuery(Expenditure.class);
        Root<Expenditure> root = query.from(Expenditure.class);
        root.fetch("school", JoinType.LEFT);
        root.fetch("expenditureHead", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(cb.equal(root.get("id"), id));
        return entityManager.createQuery(query).getResultList().stream().findFirst();
    }

    private List<Expenditure> runListQuery(Long schoolId, Long expenditureHeadId, String expenditureMethod, String search) {
        return entityManager.createQuery(buildDataQuery(schoolId, expenditureHeadId, expenditureMethod, null, null, search)).getResultList();
    }

    private CriteriaQuery<Expenditure> buildDataQuery(
            Long schoolId,
            Long expenditureHeadId,
            String expenditureMethod,
            LocalDate startDate,
            LocalDate endDate,
            String search
    ) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Expenditure> query = cb.createQuery(Expenditure.class);
        Root<Expenditure> root = query.from(Expenditure.class);
        root.fetch("school", JoinType.LEFT);
        root.fetch("expenditureHead", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(buildPredicates(cb, root, schoolId, expenditureHeadId, expenditureMethod, startDate, endDate, search));
        query.orderBy(cb.desc(root.get("id")));
        return query;
    }

    private Predicate[] buildPredicates(
            CriteriaBuilder cb,
            Root<Expenditure> root,
            Long schoolId,
            Long expenditureHeadId,
            String expenditureMethod,
            LocalDate startDate,
            LocalDate endDate,
            String search
    ) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isFalse(root.get("deleted")));
        Join<Expenditure, ?> schoolJoin = root.join("school", JoinType.LEFT);
        Join<Expenditure, ?> headJoin = root.join("expenditureHead", JoinType.LEFT);
        if (schoolId != null) {
            predicates.add(cb.equal(schoolJoin.get("id"), schoolId));
        }
        if (expenditureHeadId != null) {
            predicates.add(cb.equal(headJoin.get("id"), expenditureHeadId));
        }
        if (expenditureMethod != null) {
            predicates.add(cb.equal(cb.lower(root.get("expenditureMethod")), expenditureMethod.toLowerCase()));
        }
        if (startDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("expenditureDate"), startDate));
        }
        if (endDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("expenditureDate"), endDate));
        }
        if (search != null) {
            Expression<String> expr = cb.concat(
                    cb.concat(
                            cb.concat(
                                    cb.concat(
                                            cb.coalesce(schoolJoin.get("schoolName").as(String.class), ""),
                                            " "),
                                    cb.coalesce(headJoin.get("expenditureHead").as(String.class), "")),
                            " "),
                    cb.coalesce(root.get("reference").as(String.class), ""));
            expr = cb.concat(expr, " ");
            expr = cb.concat(expr, cb.coalesce(root.get("note").as(String.class), ""));
            predicates.add(cb.like(cb.lower(expr), "%" + search.toLowerCase() + "%"));
        }
        return predicates.toArray(new Predicate[0]);
    }
}
