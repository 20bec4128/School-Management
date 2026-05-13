package com.School.School_management.Service;

import com.School.School_management.Dto.LeaveTypeDto;
import java.util.List;

public interface LeaveTypeService {
    List<LeaveTypeDto.Response> list(Long schoolId, String applicantType, Long designationId);
    LeaveTypeDto.Response create(LeaveTypeDto.Request request);
    LeaveTypeDto.Response update(Long id, LeaveTypeDto.Request request);
    void delete(Long id);
}
