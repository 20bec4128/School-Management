package com.School.School_management.Controller;

import com.School.School_management.Dto.SaleRecipientDto;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.auth.RequirePagePermission;
import com.School.School_management.Repository.AdminUserRepository;
import com.School.School_management.Repository.EmployeeRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/sales/lookups")
@RequirePagePermission(slug = "sale", action = "view")
public class SaleLookupController {

    private final EmployeeRepository employeeRepository;
    private final AdminUserRepository adminUserRepository;

    public SaleLookupController(EmployeeRepository employeeRepository, AdminUserRepository adminUserRepository) {
        this.employeeRepository = employeeRepository;
        this.adminUserRepository = adminUserRepository;
    }

    @GetMapping("/roles")
    public List<String> roles(@RequestParam(name = "schoolId", required = false) Long schoolId) {
        if (schoolId == null) {
            return List.of();
        }
        List<String> roles = new ArrayList<>();
        roles.addAll(employeeRepository.findDistinctRolesBySchoolId(schoolId));
        roles.addAll(adminUserRepository.findDistinctRolesBySchoolId(schoolId));
        return roles.stream()
                .filter(role -> role != null && !role.isBlank())
                .distinct()
                .sorted(String.CASE_INSENSITIVE_ORDER)
                .toList();
    }

    @GetMapping("/recipients")
    public List<SaleRecipientDto> recipients(
            @RequestParam(name = "schoolId", required = false) Long schoolId,
            @RequestParam(name = "role") String role
    ) {
        CurrentUser user = CurrentUserHolder.get();
        if (schoolId == null && user != null && user.isSchoolScopedAdminUser()) {
            schoolId = user.schoolId();
        }
        if (schoolId == null) {
            return List.of();
        }

        String normalizedRole = role == null ? "" : role.trim();
        List<SaleRecipientDto> recipients = new ArrayList<>();
        employeeRepository.findBySchoolIdAndRoleIgnoreCaseOrderByIdDesc(schoolId, normalizedRole).forEach(employee -> {
            SaleRecipientDto dto = new SaleRecipientDto();
            dto.setId(employee.getId());
            dto.setName(employee.getName());
            dto.setRole(employee.getRole());
            dto.setSource("EMPLOYEE");
            recipients.add(dto);
        });
        adminUserRepository.findBySchoolIdAndRoleIgnoreCaseOrderByIdDesc(schoolId, normalizedRole).forEach(admin -> {
            SaleRecipientDto dto = new SaleRecipientDto();
            dto.setId(admin.getId());
            dto.setName(admin.getUsername());
            dto.setRole(admin.getRole());
            dto.setSource("ADMIN_USER");
            recipients.add(dto);
        });
        return recipients;
    }
}
