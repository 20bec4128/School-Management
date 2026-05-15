package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.SupplierDto;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Supplier;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.SupplierRepository;
import com.School.School_management.Service.SupplierService;
import com.School.School_management.auth.CurrentUser;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SupplierServiceImpl implements SupplierService {

    private final SupplierRepository supplierRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;

    public SupplierServiceImpl(
            SupplierRepository supplierRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository
    ) {
        this.supplierRepository = supplierRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
    }

    @Override
    public Page<SupplierDto> list(Long headOfficeId, Long schoolId, String search, int page, int size, CurrentUser user) {
        ResolvedScope scope = resolveListScope(user, headOfficeId, schoolId);
        String normalizedSearch = normalizeSearch(search);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        return supplierRepository.searchSuppliers(scope.headOfficeId(), scope.schoolId(), normalizedSearch, pageable).map(this::toDto);
    }

    @Override
    public SupplierDto getById(Long id, CurrentUser user) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        ensureVisibleToUser(supplier, user);
        return toDto(supplier);
    }

    @Override
    public SupplierDto create(SupplierDto dto, CurrentUser user) {
        ResolvedScope scope = resolveWriteScope(user, dto);
        Supplier supplier = new Supplier();
        applyDto(dto, supplier);
        supplier.setHeadOfficeId(scope.headOfficeId());
        supplier.setSchoolId(scope.schoolId());
        return toDto(supplierRepository.save(supplier));
    }

    @Override
    public SupplierDto update(Long id, SupplierDto dto, CurrentUser user) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        ensureVisibleToUser(supplier, user);
        ResolvedScope scope = resolveWriteScope(user, dto);
        applyDto(dto, supplier);
        supplier.setHeadOfficeId(scope.headOfficeId());
        supplier.setSchoolId(scope.schoolId());
        return toDto(supplierRepository.save(supplier));
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Supplier not found"));
        ensureVisibleToUser(supplier, user);
        supplierRepository.delete(supplier);
    }

    private void ensureVisibleToUser(Supplier supplier, CurrentUser user) {
        if (user == null) {
            throw new RuntimeException("Unauthorized");
        }
        if (user.isSuperAdmin()) {
            return;
        }
        if (user.isHeadOfficeScopedAdmin()) {
            if (!Objects.equals(user.headOfficeId(), supplier.getHeadOfficeId())) {
                throw new RuntimeException("Supplier not found");
            }
            return;
        }
        if (user.isSchoolScopedAdminUser()) {
            if (!Objects.equals(user.schoolId(), supplier.getSchoolId())) {
                throw new RuntimeException("Supplier not found");
            }
            return;
        }
        throw new RuntimeException("Forbidden");
    }

    private ResolvedScope resolveListScope(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user == null) {
            throw new RuntimeException("Unauthorized");
        }

        if (user.isSuperAdmin()) {
            if (requestedSchoolId != null) {
                ManageSchool school = requireSchool(requestedSchoolId);
                if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                    throw new RuntimeException("School does not belong to the selected head office");
                }
                return new ResolvedScope(school.getHeadOfficeId(), school.getId());
            }
            return new ResolvedScope(normalizeId(requestedHeadOfficeId), null);
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            if (requestedHeadOfficeId != null && !Objects.equals(authHeadOfficeId, requestedHeadOfficeId)) {
                throw new RuntimeException("Forbidden");
            }
            if (requestedSchoolId != null) {
                ManageSchool school = requireSchool(requestedSchoolId);
                if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                    throw new RuntimeException("School does not belong to the selected head office");
                }
                return new ResolvedScope(authHeadOfficeId, school.getId());
            }
            return new ResolvedScope(authHeadOfficeId, null);
        }

        if (user.isSchoolScopedAdminUser()) {
            ManageSchool school = requireSchool(user.schoolId());
            if (requestedSchoolId != null && !Objects.equals(user.schoolId(), requestedSchoolId)) {
                throw new RuntimeException("Forbidden");
            }
            if (requestedHeadOfficeId != null && !Objects.equals(school.getHeadOfficeId(), requestedHeadOfficeId)) {
                throw new RuntimeException("Forbidden");
            }
            return new ResolvedScope(school.getHeadOfficeId(), school.getId());
        }

        throw new RuntimeException("Forbidden");
    }

    private ResolvedScope resolveWriteScope(CurrentUser user, SupplierDto dto) {
        if (user == null) {
            throw new RuntimeException("Unauthorized");
        }

        Long requestedHeadOfficeId = normalizeId(dto.getHeadOfficeId());
        Long requestedSchoolId = normalizeId(dto.getSchoolId());

        if (user.isSuperAdmin()) {
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                throw new RuntimeException("School does not belong to the selected head office");
            }
            return new ResolvedScope(school.getHeadOfficeId(), school.getId());
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                throw new RuntimeException("School does not belong to your head office");
            }
            if (requestedHeadOfficeId != null && !Objects.equals(authHeadOfficeId, requestedHeadOfficeId)) {
                throw new RuntimeException("Forbidden");
            }
            return new ResolvedScope(authHeadOfficeId, school.getId());
        }

        if (user.isSchoolScopedAdminUser()) {
            ManageSchool school = requireSchool(user.schoolId());
            if (requestedSchoolId != null && !Objects.equals(requestedSchoolId, user.schoolId())) {
                throw new RuntimeException("Forbidden");
            }
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                throw new RuntimeException("Forbidden");
            }
            return new ResolvedScope(school.getHeadOfficeId(), school.getId());
        }

        throw new RuntimeException("Forbidden");
    }

    private ManageSchool requireSchool(Long schoolId) {
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .orElseThrow(() -> new RuntimeException("School not found"));
    }

    private HeadOffice requireHeadOffice(Long headOfficeId) {
        return headOfficeRepository.findById(headOfficeId)
                .orElseThrow(() -> new RuntimeException("Head office not found"));
    }

    private Long requiredId(Long value, String message) {
        if (value == null) {
            throw new RuntimeException(message);
        }
        return value;
    }

    private Long normalizeId(Long value) {
        return value == null || value <= 0 ? null : value;
    }

    private String normalizeSearch(String search) {
        String value = search == null ? "" : search.trim();
        return value.isEmpty() ? null : value;
    }

    private void applyDto(SupplierDto dto, Supplier supplier) {
        supplier.setSupplierName(safeTrim(dto.getSupplierName()));
        supplier.setContactName(safeTrim(dto.getContactName()));
        supplier.setEmail(safeTrim(dto.getEmail()));
        supplier.setPhone(safeTrim(dto.getPhone()));
        supplier.setAddress(safeTrim(dto.getAddress()));
        supplier.setNote(safeTrim(dto.getNote()));
    }

    private SupplierDto toDto(Supplier supplier) {
        SupplierDto dto = new SupplierDto();
        dto.setId(supplier.getId());
        dto.setHeadOfficeId(supplier.getHeadOfficeId());
        dto.setHeadOfficeName(resolveHeadOfficeName(supplier.getHeadOfficeId()));
        dto.setSchoolId(supplier.getSchoolId());
        dto.setSchoolName(resolveSchoolName(supplier.getSchoolId()));
        dto.setSupplierName(supplier.getSupplierName());
        dto.setContactName(supplier.getContactName());
        dto.setEmail(supplier.getEmail());
        dto.setPhone(supplier.getPhone());
        dto.setAddress(supplier.getAddress());
        dto.setNote(supplier.getNote());
        dto.setCreatedAt(supplier.getCreatedAt());
        dto.setUpdatedAt(supplier.getUpdatedAt());
        return dto;
    }

    private String resolveHeadOfficeName(Long headOfficeId) {
        if (headOfficeId == null) {
            return null;
        }
        return headOfficeRepository.findById(headOfficeId)
                .map(HeadOffice::getName)
                .orElse("Head Office " + headOfficeId);
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) {
            return null;
        }
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getSchoolName)
                .orElse("School " + schoolId);
    }

    private String safeTrim(String value) {
        return value == null ? null : value.trim();
    }

    private record ResolvedScope(Long headOfficeId, Long schoolId) {
    }
}
