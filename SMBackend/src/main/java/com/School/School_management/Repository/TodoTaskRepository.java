package com.School.School_management.Repository;

import com.School.School_management.Entity.TodoTask;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TodoTaskRepository extends JpaRepository<TodoTask, Long> {
    List<TodoTask> findAllByDeletedFalseOrderByIdDesc();
    List<TodoTask> findBySchoolIdAndDeletedFalseOrderByIdDesc(Long schoolId);
    List<TodoTask> findBySchoolIdInAndDeletedFalseOrderByIdDesc(Collection<Long> schoolIds);
    Optional<TodoTask> findByIdAndDeletedFalse(Long id);
}
