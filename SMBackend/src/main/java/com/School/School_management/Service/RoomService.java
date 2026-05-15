package com.School.School_management.Service;

import com.School.School_management.Dto.RoomDto;
import org.springframework.data.domain.Page;

import java.util.List;

public interface RoomService {
    List<RoomDto> list(Long headOfficeId, Long schoolId, Long hostelId, String roomType);
    Page<RoomDto> listPaginated(Long headOfficeId, Long schoolId, Long hostelId, String roomType, String search, int page, int size);
    RoomDto create(RoomDto dto);
    RoomDto update(Long id, RoomDto dto);
    void delete(Long id);
    RoomDto getById(Long id);
}
