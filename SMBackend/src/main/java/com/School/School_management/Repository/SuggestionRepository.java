package com.School.School_management.Repository;

import com.School.School_management.Entity.Suggestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;

import java.util.List;

public interface SuggestionRepository extends JpaRepository<Suggestion, Long> {
    List<Suggestion> findAllByOrderByIdDesc();

    List<Suggestion> findAll(Sort sort);
}
