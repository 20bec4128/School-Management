package com.School.School_management.Dto;

import java.util.ArrayList;
import java.util.List;

public class LessonStatusPageDataDto {
    private List<LessonStatusLessonDto> lessons = new ArrayList<>();

    public List<LessonStatusLessonDto> getLessons() { return lessons; }
    public void setLessons(List<LessonStatusLessonDto> lessons) { this.lessons = lessons; }
}

