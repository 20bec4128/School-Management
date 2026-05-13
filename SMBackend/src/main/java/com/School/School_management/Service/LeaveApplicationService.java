package com.School.School_management.Service;

import com.School.School_management.Dto.LeaveApplicationDto;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface LeaveApplicationService {
    List<LeaveApplicationDto.Response> list(Long schoolId, String status);
    LeaveApplicationDto.Response create(LeaveApplicationDto.Request request, MultipartFile attachment);
    LeaveApplicationDto.Response update(Long id, LeaveApplicationDto.Request request, MultipartFile attachment);
    LeaveApplicationDto.Response updateStatus(Long id, String status);
    LeaveApplicationDto.Response getById(Long id);
    void delete(Long id);
}
