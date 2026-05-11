package com.School.School_management.Entity;

import jakarta.persistence.*;

@Entity
@Table(name = "lesson_plan")
public class LessonPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "lesson_id", nullable = false, unique = true)
    private Lesson lesson;

    @Enumerated(EnumType.STRING)
    @Column(name = "lesson_status", nullable = false, length = 30)
    private LessonProgressStatus lessonStatus = LessonProgressStatus.YET_TO_START;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Lesson getLesson() { return lesson; }
    public void setLesson(Lesson lesson) { this.lesson = lesson; }

    public LessonProgressStatus getLessonStatus() { return lessonStatus; }
    public void setLessonStatus(LessonProgressStatus lessonStatus) { this.lessonStatus = lessonStatus; }
}

