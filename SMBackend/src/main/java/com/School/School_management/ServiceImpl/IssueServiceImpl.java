package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.IssueDto;
import com.School.School_management.Dto.IssueRecipientDto;
import com.School.School_management.Entity.AdminUser;
import com.School.School_management.Entity.Category;
import com.School.School_management.Entity.Employee;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.Issue;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Product;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.AdminUserRepository;
import com.School.School_management.Repository.CategoryRepository;
import com.School.School_management.Repository.EmployeeRepository;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.IssueRepository;
import com.School.School_management.Repository.ProductRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.IssueService;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@Transactional
public class IssueServiceImpl implements IssueService {

    private final IssueRepository issueRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final EmployeeRepository employeeRepository;
    private final AdminUserRepository adminUserRepository;

    public IssueServiceImpl(
            IssueRepository issueRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository,
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            EmployeeRepository employeeRepository,
            AdminUserRepository adminUserRepository
    ) {
        this.issueRepository = issueRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.employeeRepository = employeeRepository;
        this.adminUserRepository = adminUserRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<IssueDto> list(Long headOfficeId, Long schoolId, String userType, String search, int page, int size, CurrentUser user) {
        ResolvedScope scope = resolveListScope(user, headOfficeId, schoolId);
        String normalizedSearch = normalizeSearch(search);
        String normalizedUserType = normalizeOptional(userType);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        return issueRepository.searchIssues(scope.headOfficeId(), scope.schoolId(), normalizedUserType, normalizedSearch, pageable).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public IssueDto getById(Long id, CurrentUser user) {
        Issue issue = issueRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(issue, user);
        return toDto(issue);
    }

    @Override
    public IssueDto create(IssueDto dto, CurrentUser user) {
        ResolvedWriteScope scope = resolveWriteScope(user, dto);
        Issue issue = new Issue();
        applyNote(dto, issue);
        issue.setHeadOfficeId(scope.headOfficeId());
        issue.setSchoolId(scope.schoolId());
        issue.setUserType(scope.userType());
        issue.setIssueToId(scope.issueToId());
        issue.setIssueToName(scope.issueToName());
        issue.setCategoryId(scope.categoryId());
        issue.setCategoryName(scope.categoryName());
        issue.setProductId(scope.productId());
        issue.setProductName(scope.productName());
        issue.setQuantity(scope.quantity());
        issue.setIssueDate(scope.issueDate());
        issue.setDueDate(scope.dueDate());
        issue.setReturnDate(scope.returnDate());
        return toDto(issueRepository.save(issue));
    }

    @Override
    public IssueDto update(Long id, IssueDto dto, CurrentUser user) {
        Issue issue = issueRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(issue, user);
        IssueDto effectiveDto = mergeIssueDto(issue, dto);
        ResolvedWriteScope scope = resolveWriteScope(user, effectiveDto);
        applyNote(effectiveDto, issue);
        issue.setHeadOfficeId(scope.headOfficeId());
        issue.setSchoolId(scope.schoolId());
        issue.setUserType(scope.userType());
        issue.setIssueToId(scope.issueToId());
        issue.setIssueToName(scope.issueToName());
        issue.setCategoryId(scope.categoryId());
        issue.setCategoryName(scope.categoryName());
        issue.setProductId(scope.productId());
        issue.setProductName(scope.productName());
        issue.setQuantity(scope.quantity());
        issue.setIssueDate(scope.issueDate());
        issue.setDueDate(scope.dueDate());
        issue.setReturnDate(scope.returnDate());
        return toDto(issueRepository.save(issue));
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        Issue issue = issueRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(issue, user);
        issueRepository.delete(issue);
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> roles(Long schoolId, CurrentUser user) {
        ManageSchool school = resolveSchoolForLookup(user, schoolId);
        TreeSet<String> roles = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        roles.addAll(employeeRepository.findDistinctRolesBySchoolId(school.getId()));
        roles.addAll(adminUserRepository.findDistinctRolesBySchoolId(school.getId()));
        return new ArrayList<>(roles);
    }

    @Override
    @Transactional(readOnly = true)
    public List<IssueRecipientDto> recipients(Long schoolId, String role, CurrentUser user) {
        ManageSchool school = resolveSchoolForLookup(user, schoolId);
        String normalizedRole = normalizeOptional(role);
        if (normalizedRole == null) return List.of();

        List<IssueRecipientDto> recipients = new ArrayList<>();
        for (Employee employee : employeeRepository.findBySchoolIdAndRoleIgnoreCaseOrderByIdDesc(school.getId(), normalizedRole)) {
            recipients.add(toRecipientDto(employee.getId(), employee.getName(), employee.getRole(), "EMPLOYEE"));
        }
        for (AdminUser admin : adminUserRepository.findBySchoolIdAndRoleIgnoreCaseOrderByIdDesc(school.getId(), normalizedRole)) {
            recipients.add(toRecipientDto(admin.getId(), admin.getUsername(), admin.getRole(), "ADMIN"));
        }
        return recipients;
    }

    private void ensureVisibleToUser(Issue issue, CurrentUser user) {
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin()) return;
        if (user.isHeadOfficeScopedAdmin()) {
            if (!Objects.equals(user.headOfficeId(), issue.getHeadOfficeId())) throw new NotFoundException();
            return;
        }
        if (user.isSchoolScopedAdminUser()) {
            if (!Objects.equals(user.schoolId(), issue.getSchoolId())) throw new NotFoundException();
            return;
        }
        throw new ForbiddenException();
    }

    private ResolvedScope resolveListScope(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user == null) throw new ForbiddenException();

        if (user.isSuperAdmin()) {
            if (requestedSchoolId != null) {
                ManageSchool school = requireSchool(requestedSchoolId);
                if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                    throw new BadRequestException("School does not belong to the selected head office");
                }
                return new ResolvedScope(school.getHeadOfficeId(), school.getId());
            }
            return new ResolvedScope(normalizeId(requestedHeadOfficeId), null);
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            if (requestedHeadOfficeId != null && !Objects.equals(authHeadOfficeId, requestedHeadOfficeId)) {
                throw new ForbiddenException();
            }
            if (requestedSchoolId != null) {
                ManageSchool school = requireSchool(requestedSchoolId);
                if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                    throw new BadRequestException("School does not belong to your head office");
                }
                return new ResolvedScope(authHeadOfficeId, school.getId());
            }
            return new ResolvedScope(authHeadOfficeId, null);
        }

        if (user.isSchoolScopedAdminUser()) {
            Long authSchoolId = user.schoolId();
            if (authSchoolId == null) throw new ForbiddenException();
            ManageSchool school = requireSchool(authSchoolId);
            if (requestedSchoolId != null && !Objects.equals(requestedSchoolId, authSchoolId)) {
                throw new ForbiddenException();
            }
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                throw new ForbiddenException();
            }
            return new ResolvedScope(school.getHeadOfficeId(), authSchoolId);
        }

        throw new ForbiddenException();
    }

    private ResolvedWriteScope resolveWriteScope(CurrentUser user, IssueDto dto) {
        if (user == null) throw new ForbiddenException();

        Long requestedHeadOfficeId = normalizeId(dto == null ? null : dto.getHeadOfficeId());
        Long requestedSchoolId = normalizeId(dto == null ? null : dto.getSchoolId());
        Long requestedCategoryId = normalizeId(dto == null ? null : dto.getCategoryId());
        Long requestedProductId = normalizeId(dto == null ? null : dto.getProductId());
        Long requestedIssueToId = normalizeId(dto == null ? null : dto.getIssueToId());
        String requestedUserType = normalizeOptional(dto == null ? null : dto.getUserType());
        BigDecimal requestedQuantity = requiredPositiveQuantity(dto == null ? null : dto.getQuantity(), "Quantity is required");
        LocalDate issueDate = requiredDate(dto == null ? null : dto.getIssueDate(), "Issue date is required");
        LocalDate dueDate = requiredDate(dto == null ? null : dto.getDueDate(), "Due date is required");
        LocalDate returnDate = normalizeDate(dto == null ? null : dto.getReturnDate());
        if (dueDate.isBefore(issueDate)) {
            throw new BadRequestException("Due date cannot be before the issue date");
        }
        if (returnDate != null && returnDate.isBefore(issueDate)) {
            throw new BadRequestException("Return date cannot be before the issue date");
        }

        if (user.isSuperAdmin()) {
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            validateSchoolScope(requestedHeadOfficeId, school);
            Category category = requireCategory(requiredId(requestedCategoryId, "Category is required"));
            Product product = requireProduct(requiredId(requestedProductId, "Product is required"));
            validateProductRelations(school, category, product);
            Recipient recipient = requireRecipient(requiredId(requestedIssueToId, "Issue to is required"), requestedUserType, school.getId());
            return new ResolvedWriteScope(school.getHeadOfficeId(), school.getId(), recipient.role(), recipient.id(), recipient.name(), category.getId(), category.getCategoryName(), product.getId(), product.getProductName(), requestedQuantity, issueDate, dueDate, returnDate);
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                throw new BadRequestException("School does not belong to your head office");
            }
            validateSchoolScope(authHeadOfficeId, school);
            Category category = requireCategory(requiredId(requestedCategoryId, "Category is required"));
            Product product = requireProduct(requiredId(requestedProductId, "Product is required"));
            validateProductRelations(school, category, product);
            Recipient recipient = requireRecipient(requiredId(requestedIssueToId, "Issue to is required"), requestedUserType, school.getId());
            return new ResolvedWriteScope(authHeadOfficeId, school.getId(), recipient.role(), recipient.id(), recipient.name(), category.getId(), category.getCategoryName(), product.getId(), product.getProductName(), requestedQuantity, issueDate, dueDate, returnDate);
        }

        if (user.isSchoolScopedAdminUser()) {
            Long authSchoolId = user.schoolId();
            if (authSchoolId == null) throw new ForbiddenException();
            ManageSchool school = requireSchool(authSchoolId);
            if (requestedSchoolId != null && !Objects.equals(requestedSchoolId, authSchoolId)) {
                throw new ForbiddenException();
            }
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                throw new ForbiddenException();
            }
            Category category = requireCategory(requiredId(requestedCategoryId, "Category is required"));
            Product product = requireProduct(requiredId(requestedProductId, "Product is required"));
            validateProductRelations(school, category, product);
            Recipient recipient = requireRecipient(requiredId(requestedIssueToId, "Issue to is required"), requestedUserType, school.getId());
            return new ResolvedWriteScope(school.getHeadOfficeId(), authSchoolId, recipient.role(), recipient.id(), recipient.name(), category.getId(), category.getCategoryName(), product.getId(), product.getProductName(), requestedQuantity, issueDate, dueDate, returnDate);
        }

        throw new ForbiddenException();
    }

    private void validateSchoolScope(Long requestedHeadOfficeId, ManageSchool school) {
        if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
            throw new BadRequestException("School does not belong to the selected head office");
        }
    }

    private void validateProductRelations(ManageSchool school, Category category, Product product) {
        if (!Objects.equals(category.getSchoolId(), school.getId())) {
            throw new BadRequestException("Category does not belong to the selected school");
        }
        if (!Objects.equals(product.getSchoolId(), school.getId())) {
            throw new BadRequestException("Product does not belong to the selected school");
        }
        if (!Objects.equals(category.getHeadOfficeId(), school.getHeadOfficeId())) {
            throw new BadRequestException("Category does not belong to the selected head office");
        }
        if (!Objects.equals(product.getHeadOfficeId(), school.getHeadOfficeId())) {
            throw new BadRequestException("Product does not belong to the selected head office");
        }
        if (!Objects.equals(product.getCategoryId(), category.getId())) {
            throw new BadRequestException("Product does not belong to the selected category");
        }
    }

    private ManageSchool resolveSchoolForLookup(CurrentUser user, Long requestedSchoolId) {
        if (user == null) throw new ForbiddenException();

        if (user.isSuperAdmin()) {
            return requireSchool(requiredId(requestedSchoolId, "School is required"));
        }

        if (user.isHeadOfficeScopedAdmin()) {
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            if (!Objects.equals(user.headOfficeId(), school.getHeadOfficeId())) {
                throw new BadRequestException("School does not belong to your head office");
            }
            return school;
        }

        if (user.isSchoolScopedAdminUser()) {
            Long authSchoolId = user.schoolId();
            if (authSchoolId == null) throw new ForbiddenException();
            if (requestedSchoolId != null && !Objects.equals(requestedSchoolId, authSchoolId)) {
                throw new ForbiddenException();
            }
            return requireSchool(authSchoolId);
        }

        throw new ForbiddenException();
    }

    private Recipient requireRecipient(Long recipientId, String userType, Long schoolId) {
        String role = normalizeOptional(userType);
        if (role == null) throw new BadRequestException("User type is required");
        if (recipientId == null) throw new BadRequestException("Issue to is required");

        List<Employee> employees = employeeRepository.findBySchoolIdAndRoleIgnoreCaseOrderByIdDesc(schoolId, role);
        for (Employee employee : employees) {
            if (Objects.equals(employee.getId(), recipientId)) {
                return new Recipient(employee.getId(), employee.getName(), employee.getRole());
            }
        }

        List<AdminUser> admins = adminUserRepository.findBySchoolIdAndRoleIgnoreCaseOrderByIdDesc(schoolId, role);
        for (AdminUser admin : admins) {
            if (Objects.equals(admin.getId(), recipientId)) {
                return new Recipient(admin.getId(), admin.getUsername(), admin.getRole());
            }
        }

        throw new BadRequestException("Issue to does not belong to the selected user type");
    }

    private IssueDto toDto(Issue issue) {
        IssueDto dto = new IssueDto();
        dto.setId(issue.getId());
        dto.setHeadOfficeId(issue.getHeadOfficeId());
        dto.setHeadOfficeName(resolveHeadOfficeName(issue.getHeadOfficeId()));
        dto.setSchoolId(issue.getSchoolId());
        dto.setSchoolName(resolveSchoolName(issue.getSchoolId()));
        dto.setUserType(issue.getUserType());
        dto.setIssueToId(issue.getIssueToId());
        dto.setIssueToName(issue.getIssueToName());
        dto.setCategoryId(issue.getCategoryId());
        dto.setCategoryName(issue.getCategoryName());
        dto.setProductId(issue.getProductId());
        dto.setProductName(issue.getProductName());
        dto.setQuantity(issue.getQuantity());
        dto.setIssueDate(issue.getIssueDate());
        dto.setDueDate(issue.getDueDate());
        dto.setReturnDate(issue.getReturnDate());
        dto.setNote(issue.getNote());
        dto.setCreatedAt(issue.getCreatedAt());
        dto.setUpdatedAt(issue.getUpdatedAt());
        return dto;
    }

    private IssueRecipientDto toRecipientDto(Long id, String name, String role, String source) {
        IssueRecipientDto dto = new IssueRecipientDto();
        dto.setId(id);
        dto.setName(name);
        dto.setRole(role);
        dto.setSource(source);
        return dto;
    }

    private void applyNote(IssueDto dto, Issue issue) {
        if (dto == null) throw new BadRequestException("Issue data is required");
        issue.setNote(normalizeOptional(dto.getNote()));
    }

    private IssueDto mergeIssueDto(Issue issue, IssueDto dto) {
        if (issue == null) throw new BadRequestException("Issue data is required");
        IssueDto merged = new IssueDto();
        merged.setHeadOfficeId(issue.getHeadOfficeId());
        merged.setSchoolId(issue.getSchoolId());
        merged.setUserType(issue.getUserType());
        merged.setIssueToId(issue.getIssueToId());
        merged.setCategoryId(issue.getCategoryId());
        merged.setProductId(issue.getProductId());
        merged.setQuantity(issue.getQuantity());
        merged.setIssueDate(issue.getIssueDate());
        merged.setDueDate(issue.getDueDate());
        merged.setReturnDate(issue.getReturnDate());
        merged.setNote(issue.getNote());

        if (dto == null) return merged;
        if (dto.getHeadOfficeId() != null) merged.setHeadOfficeId(dto.getHeadOfficeId());
        if (dto.getSchoolId() != null) merged.setSchoolId(dto.getSchoolId());
        if (dto.getUserType() != null) merged.setUserType(dto.getUserType());
        if (dto.getIssueToId() != null) merged.setIssueToId(dto.getIssueToId());
        if (dto.getCategoryId() != null) merged.setCategoryId(dto.getCategoryId());
        if (dto.getProductId() != null) merged.setProductId(dto.getProductId());
        if (dto.getQuantity() != null) merged.setQuantity(dto.getQuantity());
        if (dto.getIssueDate() != null) merged.setIssueDate(dto.getIssueDate());
        if (dto.getDueDate() != null) merged.setDueDate(dto.getDueDate());
        if (dto.getReturnDate() != null) merged.setReturnDate(dto.getReturnDate());
        if (dto.getNote() != null) merged.setNote(dto.getNote());
        return merged;
    }

    private String resolveHeadOfficeName(Long headOfficeId) {
        if (headOfficeId == null) return null;
        return headOfficeRepository.findById(headOfficeId).map(HeadOffice::getName).orElse("Head Office " + headOfficeId);
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId).map(ManageSchool::getSchoolName).orElse("School " + schoolId);
    }

    private ManageSchool requireSchool(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId).orElseThrow(NotFoundException::new);
    }

    private Category requireCategory(Long categoryId) {
        if (categoryId == null) throw new BadRequestException("categoryId is required");
        return categoryRepository.findById(categoryId).orElseThrow(NotFoundException::new);
    }

    private Product requireProduct(Long productId) {
        if (productId == null) throw new BadRequestException("productId is required");
        return productRepository.findById(productId).orElseThrow(NotFoundException::new);
    }

    private LocalDate requiredDate(LocalDate value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }

    private BigDecimal requiredPositiveQuantity(BigDecimal value, String message) {
        if (value == null) throw new BadRequestException(message);
        if (value.signum() <= 0) throw new BadRequestException(message);
        return value;
    }

    private Long normalizeId(Long value) {
        return value == null || value <= 0 ? null : value;
    }

    private Long requiredId(Long value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }

    private String normalizeSearch(String search) {
        String value = search == null ? "" : search.trim();
        return value.isEmpty() ? null : value;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private LocalDate normalizeDate(LocalDate value) {
        return value;
    }

    private record ResolvedScope(Long headOfficeId, Long schoolId) {
    }

    private record Recipient(Long id, String name, String role) {
    }

    private record ResolvedWriteScope(
            Long headOfficeId,
            Long schoolId,
            String userType,
            Long issueToId,
            String issueToName,
            Long categoryId,
            String categoryName,
            Long productId,
            String productName,
            BigDecimal quantity,
            LocalDate issueDate,
            LocalDate dueDate,
            LocalDate returnDate
    ) {
    }
}
