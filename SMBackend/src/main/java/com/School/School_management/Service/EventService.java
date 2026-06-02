package com.School.School_management.Service;

import com.School.School_management.Dto.EventDto;
import java.util.List;

public interface EventService {
    List<EventDto.Response> list(Long headOfficeId, Long schoolId);
    EventDto.Response create(EventDto.Request request);
    EventDto.Response update(Long id, EventDto.Request request);
    void delete(Long id);
}
