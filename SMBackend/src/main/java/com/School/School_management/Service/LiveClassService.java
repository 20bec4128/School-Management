package com.School.School_management.Service;

import com.School.School_management.Dto.LiveClassRequestDto;
import com.School.School_management.Dto.LiveClassJoinResponseDto;
import com.School.School_management.Dto.LiveClassEndResponseDto;
import com.School.School_management.Dto.LiveClassResponseDto;
import com.School.School_management.Dto.LiveClassStartResponseDto;
import java.util.List;

public interface LiveClassService {
    List<LiveClassResponseDto> getAll();
    LiveClassResponseDto getById(Long id);
    List<LiveClassResponseDto> getForStudent(Long classId, Long sectionId);
    LiveClassResponseDto create(LiveClassRequestDto dto);
    LiveClassResponseDto update(Long id, LiveClassRequestDto dto);
    void delete(Long id);

    LiveClassStartResponseDto start(Long id);
    LiveClassJoinResponseDto join(Long id);
    void leave(Long id);
    LiveClassEndResponseDto end(Long id);
}
