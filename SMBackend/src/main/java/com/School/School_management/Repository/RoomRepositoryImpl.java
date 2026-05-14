package com.School.School_management.Repository;

import com.School.School_management.Entity.Room;
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

public class RoomRepositoryImpl implements RoomRepositoryCustom {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<Room> findAllActiveWithDetailsOrderByIdDesc() {
        return runListQuery(null, null, null, null);
    }

    @Override
    public List<Room> findBySchoolIdActiveWithDetailsOrderByIdDesc(Long schoolId) {
        return runListQuery(null, schoolId, null, null);
    }

    @Override
    public List<Room> findByHeadOfficeIdActiveWithDetailsOrderByIdDesc(Long headOfficeId) {
        return runListQuery(headOfficeId, null, null, null);
    }

    @Override
    public List<Room> findByFilters(Long headOfficeId, Long schoolId, Long hostelId, String roomType) {
        return entityManager.createQuery(buildDataQuery(headOfficeId, schoolId, hostelId, roomType, null)).getResultList();
    }

    @Override
    public Page<Room> findPageWithDetails(Long headOfficeId, Long schoolId, Long hostelId, String roomType, String search, Pageable pageable) {
        CriteriaQuery<Room> dataQuery = buildDataQuery(headOfficeId, schoolId, hostelId, roomType, search);
        TypedQuery<Room> typedQuery = entityManager.createQuery(dataQuery);
        typedQuery.setFirstResult((int) pageable.getOffset());
        typedQuery.setMaxResults(pageable.getPageSize());
        List<Room> content = typedQuery.getResultList();

        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Long> countQuery = cb.createQuery(Long.class);
        Root<Room> countRoot = countQuery.from(Room.class);
        countQuery.select(cb.countDistinct(countRoot));
        countQuery.where(buildPredicates(cb, countRoot, headOfficeId, schoolId, hostelId, roomType, search));
        Long total = entityManager.createQuery(countQuery).getSingleResult();
        return new PageImpl<>(content, pageable, total == null ? 0L : total);
    }

    @Override
    public Optional<Room> findByIdWithDetails(Long id) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Room> query = cb.createQuery(Room.class);
        Root<Room> root = query.from(Room.class);
        root.fetch("school", JoinType.LEFT);
        root.fetch("hostel", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(cb.equal(root.get("id"), id));
        return entityManager.createQuery(query).getResultList().stream().findFirst();
    }

    private List<Room> runListQuery(Long headOfficeId, Long schoolId, Long hostelId, String roomType) {
        return entityManager.createQuery(buildDataQuery(headOfficeId, schoolId, hostelId, roomType, null)).getResultList();
    }

    private CriteriaQuery<Room> buildDataQuery(Long headOfficeId, Long schoolId, Long hostelId, String roomType, String search) {
        CriteriaBuilder cb = entityManager.getCriteriaBuilder();
        CriteriaQuery<Room> query = cb.createQuery(Room.class);
        Root<Room> root = query.from(Room.class);
        root.fetch("school", JoinType.LEFT);
        root.fetch("hostel", JoinType.LEFT);
        query.select(root).distinct(true);
        query.where(buildPredicates(cb, root, headOfficeId, schoolId, hostelId, roomType, search));
        query.orderBy(cb.desc(root.get("id")));
        return query;
    }

    private Predicate[] buildPredicates(CriteriaBuilder cb, Root<Room> root, Long headOfficeId, Long schoolId, Long hostelId, String roomType, String search) {
        List<Predicate> predicates = new ArrayList<>();
        predicates.add(cb.isFalse(root.get("deleted")));

        Join<Room, ?> schoolJoin = root.join("school", JoinType.LEFT);
        Join<Room, ?> hostelJoin = root.join("hostel", JoinType.LEFT);

        if (headOfficeId != null) {
            predicates.add(cb.equal(root.get("headOfficeId"), headOfficeId));
        }
        if (schoolId != null) {
            predicates.add(cb.equal(schoolJoin.get("id"), schoolId));
        }
        if (hostelId != null) {
            predicates.add(cb.equal(hostelJoin.get("id"), hostelId));
        }
        if (roomType != null) {
            predicates.add(cb.equal(cb.lower(root.get("roomType")), roomType.toLowerCase()));
        }
        if (search != null) {
            Expression<String> expr = buildSearchExpression(cb, root, schoolJoin, hostelJoin);
            predicates.add(cb.like(cb.lower(expr), "%" + search.toLowerCase() + "%"));
        }
        return predicates.toArray(new Predicate[0]);
    }

    private Expression<String> buildSearchExpression(
            CriteriaBuilder cb,
            Root<Room> root,
            Join<Room, ?> schoolJoin,
            Join<Room, ?> hostelJoin
    ) {
        Expression<String> expr = stringValue(schoolJoin.get("schoolName"));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(hostelJoin.get("name")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("roomNo")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("roomType")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("seatTotal")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("costPerSeat")));
        expr = cb.concat(expr, " ");
        expr = cb.concat(expr, stringValue(root.get("note")));
        return expr;
    }

    private Expression<String> stringValue(jakarta.persistence.criteria.Path<?> path) {
        return path.as(String.class);
    }
}
