package com.School.School_management.Service;

import com.School.School_management.Dto.VehicleDto;
import org.springframework.data.domain.Page;

import java.util.List;

public interface VehicleService {
    List<VehicleDto> list(Long schoolId);
    Page<VehicleDto> listPaginated(Long schoolId, String search, int page, int size);
    VehicleDto create(VehicleDto dto);
    VehicleDto update(Long id, VehicleDto dto);
    void delete(Long id);
    VehicleDto getById(Long id);
}
