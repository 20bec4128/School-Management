package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.CreateHeadOfficeWithAdminRequest;
import com.School.School_management.Dto.CreateHeadOfficeWithAdminResponse;
import com.School.School_management.Dto.HeadOfficeDto;
import com.School.School_management.Dto.HeadOfficeAdminCredentialsRequest;
import com.School.School_management.Dto.HeadOfficeAdminInfoResponse;
import com.School.School_management.Entity.AdminUser;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ConflictException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.AdminUserRepository;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.HeadOfficeService;
import com.School.School_management.auth.CurrentUser;
import java.time.LocalDateTime;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HeadOfficeServiceImpl implements HeadOfficeService {

    private static final String PERM = "HEAD_OFFICE_MANAGE";

    private final HeadOfficeRepository headOfficeRepository;
    private final AdminUserRepository adminUserRepository;
    private final SchoolRepository schoolRepository;
    private final PasswordEncoder passwordEncoder;

    public HeadOfficeServiceImpl(
            HeadOfficeRepository headOfficeRepository,
            AdminUserRepository adminUserRepository,
            SchoolRepository schoolRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.headOfficeRepository = headOfficeRepository;
        this.adminUserRepository = adminUserRepository;
        this.schoolRepository = schoolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public CreateHeadOfficeWithAdminResponse createWithAdmin(CreateHeadOfficeWithAdminRequest request, CurrentUser user) {
        ensureCanManage(user);

        if (request == null || request.getHeadOffice() == null || request.getAdmin() == null) {
            throw new BadRequestException("Head office and admin details are required");
        }

        String name = normalizeRequired(request.getHeadOffice().getName(), "Head office name is required");
        String username = normalizeRequired(request.getAdmin().getUsername(), "Admin username is required");
        String password = normalizeRequired(request.getAdmin().getPassword(), "Admin password is required");

        if (headOfficeRepository.existsByNameIgnoreCase(name)) {
            throw new ConflictException("Head office already exists");
        }
        adminUserRepository.findByUsername(username).ifPresent((existing) -> {
            String details = String.format(
                    " (id=%s, role=%s, headOfficeId=%s, schoolId=%s, active=%s)",
                    existing.getId(),
                    existing.getRole(),
                    existing.getHeadOfficeId(),
                    existing.getSchoolId(),
                    existing.getActive()
            );
            throw new ConflictException("Admin username already exists" + details);
        });

        HeadOffice headOffice = new HeadOffice();
        headOffice.setName(name);
        headOffice.setStatus(normalizeStatus(request.getHeadOffice().getStatus()));
        headOffice.setCreatedAt(LocalDateTime.now());
        headOffice.setUpdatedAt(LocalDateTime.now());

        HeadOffice saved = headOfficeRepository.save(headOffice);

        AdminUser admin = new AdminUser();
        admin.setUsername(username);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole("ADMIN");
        admin.setHeadOfficeId(saved.getId());
        admin.setSchoolId(null);
        admin.setActive(Boolean.TRUE);

        AdminUser savedAdmin = adminUserRepository.save(admin);

        return new CreateHeadOfficeWithAdminResponse(toDto(saved), savedAdmin.getId(), savedAdmin.getUsername());
    }

    @Override
    public Page<HeadOfficeDto> getAll(int page, int size, String search, String status, CurrentUser user) {
        ensureCanManage(user);
        Pageable pageable = size < 0
                ? Pageable.unpaged()
                : PageRequest.of(Math.max(0, page), Math.max(1, size), Sort.by(Sort.Direction.DESC, "id"));
        String q = search == null ? null : search.trim();
        if (q != null && q.isEmpty()) q = null;
        String s = status == null ? null : status.trim();
        if (s != null && (s.isEmpty() || "Select".equalsIgnoreCase(s) || "All".equalsIgnoreCase(s))) s = null;
        return headOfficeRepository.search(q, s, pageable).map(this::toDto);
    }

    @Override
    public HeadOfficeDto getById(Long id, CurrentUser user) {
        ensureCanManage(user);
        HeadOffice ho = headOfficeRepository.findById(id).orElseThrow(NotFoundException::new);
        return toDto(ho);
    }

    @Override
    @Transactional
    public HeadOfficeDto deactivate(Long id, CurrentUser user) {
        ensureCanManage(user);
        if (id == null) throw new BadRequestException("id is required");

        HeadOffice ho = headOfficeRepository.findById(id).orElseThrow(NotFoundException::new);
        if (!"INACTIVE".equalsIgnoreCase(ho.getStatus())) {
            ho.setStatus("INACTIVE");
            ho.setUpdatedAt(LocalDateTime.now());
            ho = headOfficeRepository.save(ho);
        }
        return toDto(ho);
    }

    @Override
    @Transactional
    public HeadOfficeDto activate(Long id, CurrentUser user) {
        ensureCanManage(user);
        if (id == null) throw new BadRequestException("id is required");

        HeadOffice ho = headOfficeRepository.findById(id).orElseThrow(NotFoundException::new);
        if (!"ACTIVE".equalsIgnoreCase(ho.getStatus())) {
            ho.setStatus("ACTIVE");
            ho.setUpdatedAt(LocalDateTime.now());
            ho = headOfficeRepository.save(ho);
        }
        return toDto(ho);
    }

    @Override
    @Transactional
    public HeadOfficeDto update(Long id, HeadOfficeDto dto, CurrentUser user) {
        ensureCanManage(user);
        if (id == null) throw new BadRequestException("id is required");
        if (dto == null) throw new BadRequestException("body is required");

        HeadOffice ho = headOfficeRepository.findById(id).orElseThrow(NotFoundException::new);

        String nextName = dto.getName() != null ? dto.getName().trim() : null;
        if (nextName != null && !nextName.isEmpty()) {
            if ("DEFAULT_HEAD_OFFICE".equalsIgnoreCase(ho.getName()) && !nextName.equalsIgnoreCase(ho.getName())) {
                throw new ForbiddenException();
            }
            if (headOfficeRepository.existsByNameIgnoreCaseAndIdNot(nextName, id)) {
                throw new ConflictException("Head office already exists");
            }
            ho.setName(nextName);
        }

        if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
            ho.setStatus(normalizeStatus(dto.getStatus()));
        }

        ho.setUpdatedAt(LocalDateTime.now());
        ho = headOfficeRepository.save(ho);
        return toDto(ho);
    }

    @Override
    public HeadOfficeAdminInfoResponse getAdminInfo(Long headOfficeId, CurrentUser user) {
        ensureCanManage(user);
        if (headOfficeId == null) throw new BadRequestException("id is required");

        headOfficeRepository.findById(headOfficeId).orElseThrow(NotFoundException::new);
        AdminUser admin = adminUserRepository
                .findFirstByHeadOfficeIdAndSchoolIdIsNullOrderByIdAsc(headOfficeId)
                .orElseThrow(NotFoundException::new);
        return new HeadOfficeAdminInfoResponse(admin.getId(), admin.getUsername());
    }

    @Override
    @Transactional
    public HeadOfficeAdminInfoResponse updateAdminCredentials(Long headOfficeId, HeadOfficeAdminCredentialsRequest request, CurrentUser user) {
        ensureCanManage(user);
        if (headOfficeId == null) throw new BadRequestException("id is required");
        if (request == null) throw new BadRequestException("body is required");

        headOfficeRepository.findById(headOfficeId).orElseThrow(NotFoundException::new);
        AdminUser admin = adminUserRepository
                .findFirstByHeadOfficeIdAndSchoolIdIsNullOrderByIdAsc(headOfficeId)
                .orElseThrow(NotFoundException::new);

        String nextUsername = request.getUsername() == null ? "" : request.getUsername().trim();
        String nextPassword = request.getPassword() == null ? "" : request.getPassword().trim();

        if (nextUsername.isEmpty() && nextPassword.isEmpty()) {
            throw new BadRequestException("username or password is required");
        }

        if (!nextUsername.isEmpty() && !nextUsername.equalsIgnoreCase(admin.getUsername())) {
            if (adminUserRepository.existsByUsernameAndIdNot(nextUsername, admin.getId())) {
                throw new ConflictException("Admin username already exists");
            }
            admin.setUsername(nextUsername);
        }

        if (!nextPassword.isEmpty()) {
            admin.setPasswordHash(passwordEncoder.encode(nextPassword));
        }

        AdminUser saved = adminUserRepository.save(admin);
        return new HeadOfficeAdminInfoResponse(saved.getId(), saved.getUsername());
    }

    @Override
    @Transactional
    public void delete(Long id, CurrentUser user) {
        ensureCanManage(user);
        if (id == null) throw new BadRequestException("id is required");

        HeadOffice ho = headOfficeRepository.findById(id).orElseThrow(NotFoundException::new);
        if ("DEFAULT_HEAD_OFFICE".equalsIgnoreCase(ho.getName())) {
            throw new ForbiddenException();
        }
        if (!"INACTIVE".equalsIgnoreCase(ho.getStatus())) {
            throw new BadRequestException("Deactivate head office before deleting");
        }
        if (schoolRepository.existsByIsDeletedFalseAndHeadOfficeId(id)) {
            throw new ConflictException("Cannot delete head office: schools exist under this head office");
        }
        // Remove dependent admin users first to satisfy FK constraints (only possible when no schools exist).
        adminUserRepository.deleteAll(adminUserRepository.findAllByHeadOfficeId(id));
        headOfficeRepository.delete(ho);
    }

    private void ensureCanManage(CurrentUser user) {
        if (user == null || !user.hasPermission(PERM)) throw new ForbiddenException();
    }

    private HeadOfficeDto toDto(HeadOffice ho) {
        HeadOfficeDto dto = new HeadOfficeDto();
        dto.setId(ho.getId());
        dto.setName(ho.getName());
        dto.setStatus(ho.getStatus());
        return dto;
    }

    private String normalizeRequired(String value, String message) {
        if (value == null) throw new BadRequestException(message);
        String trimmed = value.trim();
        if (trimmed.isEmpty()) throw new BadRequestException(message);
        return trimmed;
    }

    private String normalizeStatus(String value) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.isEmpty()) return "ACTIVE";
        return trimmed.toUpperCase();
    }
}
