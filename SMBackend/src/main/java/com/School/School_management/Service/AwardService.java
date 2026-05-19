package com.School.School_management.Service;

import com.School.School_management.Dto.AwardDto;
import java.util.List;
import org.springframework.data.domain.Page;

public interface AwardService {
    List<AwardDto> list(Long headOfficeId, Long schoolId);

    Page<AwardDto> listPaginated(
            Long headOfficeId,
            Long schoolId,
            String userType,
            String title,
            String gift,
            String search,
            int page,
            int size
    );

    AwardDto create(AwardDto dto);

    AwardDto update(Long id, AwardDto dto);

    void delete(Long id);
}
