package com.School.School_management.Service;

import com.School.School_management.Dto.TransportRouteDto;
import org.springframework.data.domain.Page;

import java.util.List;

public interface TransportRouteService {
    List<TransportRouteDto> list(Long headOfficeId, Long schoolId);
    Page<TransportRouteDto> listPaginated(Long headOfficeId, Long schoolId, String search, int page, int size);
    TransportRouteDto create(TransportRouteDto dto);
    TransportRouteDto update(Long id, TransportRouteDto dto);
    void delete(Long id);
    TransportRouteDto getById(Long id);
}
