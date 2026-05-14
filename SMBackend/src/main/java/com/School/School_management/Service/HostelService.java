package com.School.School_management.Service;

import com.School.School_management.Dto.HostelDto;
import org.springframework.data.domain.Page;

import java.util.List;

public interface HostelService {
    List<HostelDto> list(Long headOfficeId, Long schoolId);
    Page<HostelDto> listPaginated(Long headOfficeId, Long schoolId, String search, int page, int size);
    HostelDto create(HostelDto dto);
    HostelDto update(Long id, HostelDto dto);
    void delete(Long id);
    HostelDto getById(Long id);
}
