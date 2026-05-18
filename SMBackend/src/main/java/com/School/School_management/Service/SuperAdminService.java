package com.School.School_management.Service;

import com.School.School_management.Dto.SuperAdminDto;
import com.School.School_management.Entity.SuperAdmin;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

public interface SuperAdminService {
    Page<SuperAdmin> getSuperAdmins(String search, String name, String email, String phone, int page, int size);
    SuperAdmin getSuperAdminById(Long id);
    SuperAdmin createSuperAdmin(SuperAdminDto dto, MultipartFile photo, MultipartFile resume);
    SuperAdmin updateSuperAdmin(Long id, SuperAdminDto dto, MultipartFile photo, MultipartFile resume);
    void deleteSuperAdmin(Long id);
}
