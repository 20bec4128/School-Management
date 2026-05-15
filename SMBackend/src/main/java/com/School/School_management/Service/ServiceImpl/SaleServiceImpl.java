package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.SaleDto;
import com.School.School_management.Dto.SaleItemDto;
import com.School.School_management.Entity.AdminUser;
import com.School.School_management.Entity.Category;
import com.School.School_management.Entity.Employee;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.IncomeHead;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Product;
import com.School.School_management.Entity.Sale;
import com.School.School_management.Entity.SaleItem;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.AdminUserRepository;
import com.School.School_management.Repository.CategoryRepository;
import com.School.School_management.Repository.EmployeeRepository;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.IncomeHeadRepository;
import com.School.School_management.Repository.ProductRepository;
import com.School.School_management.Repository.SaleItemRepository;
import com.School.School_management.Repository.SaleRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.SaleService;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
public class SaleServiceImpl implements SaleService {

    private final SaleRepository saleRepository;
    private final SaleItemRepository saleItemRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;
    private final IncomeHeadRepository incomeHeadRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final EmployeeRepository employeeRepository;
    private final AdminUserRepository adminUserRepository;

    public SaleServiceImpl(
            SaleRepository saleRepository,
            SaleItemRepository saleItemRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository,
            IncomeHeadRepository incomeHeadRepository,
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            EmployeeRepository employeeRepository,
            AdminUserRepository adminUserRepository
    ) {
        this.saleRepository = saleRepository;
        this.saleItemRepository = saleItemRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
        this.incomeHeadRepository = incomeHeadRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.employeeRepository = employeeRepository;
        this.adminUserRepository = adminUserRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SaleDto> list(Long headOfficeId, Long schoolId, String status, String search, int page, int size, CurrentUser user) {
        ResolvedScope scope = resolveListScope(user, headOfficeId, schoolId);
        String normalizedSearch = normalizeSearch(search);
        String normalizedStatus = normalizeStatusFilter(status);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        return saleRepository.searchSales(scope.headOfficeId(), scope.schoolId(), normalizedStatus, normalizedSearch, pageable).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public SaleDto getById(Long id, CurrentUser user) {
        Sale sale = saleRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(sale, user);
        return toDto(sale);
    }

    @Override
    public SaleDto create(SaleDto dto, CurrentUser user) {
        ResolvedWriteScope scope = resolveWriteScope(user, dto);
        Sale sale = new Sale();
        applyHeader(dto, sale);
        sale.setHeadOfficeId(scope.headOfficeId());
        sale.setSchoolId(scope.schoolId());
        sale.setIncomeHeadId(scope.incomeHeadId());
        sale.setIncomeHeadName(scope.incomeHeadName());
        sale.setUserType(scope.userType());
        sale.setSaleToId(scope.saleToId());
        sale.setSaleToName(scope.saleToName());
        sale.setInvoiceNumber(resolveInvoiceNumber(dto == null ? null : dto.getInvoiceNumber()));
        sale.setGrossAmount(scope.grossAmount());
        sale.setDiscountAmount(scope.discountAmount());
        sale.setNetAmount(scope.netAmount());
        sale.setStatus(scope.status());
        Sale saved = saleRepository.save(sale);
        persistItems(saved, scope.items());
        return toDto(saved);
    }

    @Override
    public SaleDto update(Long id, SaleDto dto, CurrentUser user) {
        Sale sale = saleRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(sale, user);
        saleItemRepository.deleteBySaleId(sale.getId());
        ResolvedWriteScope scope = resolveWriteScope(user, dto);
        applyHeader(dto, sale);
        sale.setHeadOfficeId(scope.headOfficeId());
        sale.setSchoolId(scope.schoolId());
        sale.setIncomeHeadId(scope.incomeHeadId());
        sale.setIncomeHeadName(scope.incomeHeadName());
        sale.setUserType(scope.userType());
        sale.setSaleToId(scope.saleToId());
        sale.setSaleToName(scope.saleToName());
        sale.setInvoiceNumber(resolveInvoiceNumber(dto == null ? null : dto.getInvoiceNumber(), sale.getInvoiceNumber()));
        sale.setGrossAmount(scope.grossAmount());
        sale.setDiscountAmount(scope.discountAmount());
        sale.setNetAmount(scope.netAmount());
        sale.setStatus(scope.status());
        Sale saved = saleRepository.save(sale);
        persistItems(saved, scope.items());
        return toDto(saved);
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        Sale sale = saleRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(sale, user);
        saleItemRepository.deleteBySaleId(sale.getId());
        saleRepository.delete(sale);
    }

    private void ensureVisibleToUser(Sale sale, CurrentUser user) {
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin()) return;
        if (user.isHeadOfficeScopedAdmin()) {
            if (!Objects.equals(user.headOfficeId(), sale.getHeadOfficeId())) throw new NotFoundException();
            return;
        }
        if (user.isSchoolScopedAdminUser()) {
            if (!Objects.equals(user.schoolId(), sale.getSchoolId())) throw new NotFoundException();
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

    private ResolvedWriteScope resolveWriteScope(CurrentUser user, SaleDto dto) {
        if (user == null) throw new ForbiddenException();

        Long requestedHeadOfficeId = normalizeId(dto == null ? null : dto.getHeadOfficeId());
        Long requestedSchoolId = normalizeId(dto == null ? null : dto.getSchoolId());
        Long requestedIncomeHeadId = normalizeId(dto == null ? null : dto.getIncomeHeadId());
        Long requestedSaleToId = normalizeId(dto == null ? null : dto.getSaleToId());
        String requestedUserType = normalizeText(dto == null ? null : dto.getUserType());

        if (user.isSuperAdmin()) {
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            validateSchoolScope(requestedHeadOfficeId, school);
            IncomeHead incomeHead = requireIncomeHead(requiredId(requestedIncomeHeadId, "Income head is required"), school.getId());
            Recipient recipient = requireRecipient(requiredId(requestedSaleToId, "Sale to is required"), requestedUserType, school.getId());
            List<SaleItemSpec> items = resolveItems(dto == null ? null : dto.getItems(), school);
            BigDecimal gross = calculateGross(items);
            BigDecimal discount = normalizeAmount(dto == null ? null : dto.getDiscountAmount());
            BigDecimal net = gross.subtract(discount);
            return new ResolvedWriteScope(school.getHeadOfficeId(), school.getId(), incomeHead.getId(), incomeHead.getIncomeHead(), recipient.role(), recipient.id(), recipient.name(), items, gross, discount, net, normalizeStatus(dto == null ? null : dto.getStatus()));
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                throw new BadRequestException("School does not belong to your head office");
            }
            validateSchoolScope(authHeadOfficeId, school);
            IncomeHead incomeHead = requireIncomeHead(requiredId(requestedIncomeHeadId, "Income head is required"), school.getId());
            Recipient recipient = requireRecipient(requiredId(requestedSaleToId, "Sale to is required"), requestedUserType, school.getId());
            List<SaleItemSpec> items = resolveItems(dto == null ? null : dto.getItems(), school);
            BigDecimal gross = calculateGross(items);
            BigDecimal discount = normalizeAmount(dto == null ? null : dto.getDiscountAmount());
            BigDecimal net = gross.subtract(discount);
            return new ResolvedWriteScope(authHeadOfficeId, school.getId(), incomeHead.getId(), incomeHead.getIncomeHead(), recipient.role(), recipient.id(), recipient.name(), items, gross, discount, net, normalizeStatus(dto == null ? null : dto.getStatus()));
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
            IncomeHead incomeHead = requireIncomeHead(requiredId(requestedIncomeHeadId, "Income head is required"), school.getId());
            Recipient recipient = requireRecipient(requiredId(requestedSaleToId, "Sale to is required"), requestedUserType, school.getId());
            List<SaleItemSpec> items = resolveItems(dto == null ? null : dto.getItems(), school);
            BigDecimal gross = calculateGross(items);
            BigDecimal discount = normalizeAmount(dto == null ? null : dto.getDiscountAmount());
            BigDecimal net = gross.subtract(discount);
            return new ResolvedWriteScope(school.getHeadOfficeId(), authSchoolId, incomeHead.getId(), incomeHead.getIncomeHead(), recipient.role(), recipient.id(), recipient.name(), items, gross, discount, net, normalizeStatus(dto == null ? null : dto.getStatus()));
        }

        throw new ForbiddenException();
    }

    private void validateSchoolScope(Long requestedHeadOfficeId, ManageSchool school) {
        if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
            throw new BadRequestException("School does not belong to the selected head office");
        }
    }

    private List<SaleItemSpec> resolveItems(List<SaleItemDto> items, ManageSchool school) {
        if (items == null || items.isEmpty()) throw new BadRequestException("At least one sale item is required");
        List<SaleItemSpec> resolved = new ArrayList<>();
        for (SaleItemDto item : items) {
            Long categoryId = requiredId(normalizeId(item == null ? null : item.getCategoryId()), "Category is required");
            Long productId = requiredId(normalizeId(item == null ? null : item.getProductId()), "Product is required");
            BigDecimal quantity = requiredAmount(item == null ? null : item.getQuantity(), "Quantity is required");
            BigDecimal unitPrice = requiredAmount(item == null ? null : item.getUnitPrice(), "Unit price is required");

            Category category = requireCategory(categoryId);
            Product product = requireProduct(productId);
            validateProductRelations(school, category, product);
            resolved.add(new SaleItemSpec(category.getId(), product.getId(), quantity, unitPrice, quantity.multiply(unitPrice)));
        }
        return resolved;
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

    private IncomeHead requireIncomeHead(Long incomeHeadId, Long schoolId) {
        if (incomeHeadId == null) throw new BadRequestException("incomeHeadId is required");
        IncomeHead incomeHead = incomeHeadRepository.findById(incomeHeadId).orElseThrow(NotFoundException::new);
        if (incomeHead.getSchool() == null || !Objects.equals(incomeHead.getSchool().getId(), schoolId)) {
            throw new BadRequestException("Income head does not belong to the selected school");
        }
        return incomeHead;
    }

    private Recipient requireRecipient(Long recipientId, String userType, Long schoolId) {
        String role = normalizeText(userType);
        if (role == null) throw new BadRequestException("User type is required");
        if (recipientId == null) throw new BadRequestException("Sale to is required");

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

        throw new BadRequestException("Sale to does not belong to the selected user type");
    }

    private SaleDto toDto(Sale sale) {
        SaleDto dto = new SaleDto();
        dto.setId(sale.getId());
        dto.setHeadOfficeId(sale.getHeadOfficeId());
        dto.setHeadOfficeName(resolveHeadOfficeName(sale.getHeadOfficeId()));
        dto.setSchoolId(sale.getSchoolId());
        dto.setSchoolName(resolveSchoolName(sale.getSchoolId()));
        dto.setInvoiceNumber(sale.getInvoiceNumber());
        dto.setUserType(sale.getUserType());
        dto.setSaleToId(sale.getSaleToId());
        dto.setSaleToName(sale.getSaleToName());
        dto.setIncomeHeadId(sale.getIncomeHeadId());
        dto.setIncomeHeadName(sale.getIncomeHeadName());
        dto.setSaleDate(sale.getSaleDate());
        dto.setGrossAmount(sale.getGrossAmount());
        dto.setDiscountAmount(sale.getDiscountAmount());
        dto.setNetAmount(sale.getNetAmount());
        dto.setStatus(sale.getStatus());
        dto.setNote(sale.getNote());
        dto.setItems(saleItemRepository.findBySaleIdOrderByIdAsc(sale.getId()).stream().map(this::toDto).collect(Collectors.toList()));
        dto.setCreatedAt(sale.getCreatedAt());
        dto.setUpdatedAt(sale.getUpdatedAt());
        return dto;
    }

    private SaleItemDto toDto(SaleItem item) {
        SaleItemDto dto = new SaleItemDto();
        dto.setId(item.getId());
        dto.setCategoryId(item.getCategoryId());
        dto.setCategoryName(resolveCategoryName(item.getCategoryId()));
        dto.setProductId(item.getProductId());
        dto.setProductName(resolveProductName(item.getProductId()));
        dto.setQuantity(item.getQuantity());
        dto.setUnitPrice(item.getUnitPrice());
        dto.setSubtotal(item.getSubtotal());
        return dto;
    }

    private void applyHeader(SaleDto dto, Sale sale) {
        if (dto == null) throw new BadRequestException("Sale data is required");
        sale.setSaleDate(requiredDate(dto.getSaleDate(), "Sale date is required"));
        sale.setNote(normalizeOptional(dto.getNote()));
    }

    private void persistItems(Sale sale, List<SaleItemSpec> items) {
        for (SaleItemSpec spec : items) {
            SaleItem item = new SaleItem();
            item.setSale(sale);
            item.setCategoryId(spec.categoryId());
            item.setProductId(spec.productId());
            item.setQuantity(spec.quantity());
            item.setUnitPrice(spec.unitPrice());
            item.setSubtotal(spec.subtotal());
            saleItemRepository.save(item);
        }
    }

    private String resolveInvoiceNumber(String requested) {
        return resolveInvoiceNumber(requested, null);
    }

    private String resolveInvoiceNumber(String requested, String fallback) {
        String normalized = normalizeOptional(requested);
        if (normalized != null) return normalized;
        if (fallback != null && !fallback.isBlank()) return fallback;
        return "SALE-" + LocalDateTime.now().toString().replaceAll("[^0-9]", "");
    }

    private String resolveHeadOfficeName(Long headOfficeId) {
        if (headOfficeId == null) return null;
        return headOfficeRepository.findById(headOfficeId).map(HeadOffice::getName).orElse("Head Office " + headOfficeId);
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId).map(ManageSchool::getSchoolName).orElse("School " + schoolId);
    }

    private String resolveCategoryName(Long categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId).map(Category::getCategoryName).orElse("Category " + categoryId);
    }

    private String resolveProductName(Long productId) {
        if (productId == null) return null;
        return productRepository.findById(productId).map(Product::getProductName).orElse("Product " + productId);
    }

    private BigDecimal calculateGross(List<SaleItemSpec> items) {
        BigDecimal gross = BigDecimal.ZERO;
        for (SaleItemSpec item : items) {
            gross = gross.add(item.subtotal());
        }
        return gross;
    }

    private LocalDate requiredDate(LocalDate value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }

    private BigDecimal requiredAmount(BigDecimal value, String message) {
        if (value == null) throw new BadRequestException(message);
        if (value.signum() < 0) throw new BadRequestException(message);
        return value;
    }

    private String normalizeStatus(String status) {
        String normalized = normalizeText(status);
        if (normalized == null) return "PAID";
        return normalized.toUpperCase();
    }

    private String normalizeStatusFilter(String status) {
        String normalized = normalizeOptional(status);
        return normalized == null ? null : normalized.toUpperCase();
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

    private String normalizeText(String value) {
        String normalized = normalizeOptional(value);
        return normalized == null ? null : normalized;
    }

    private BigDecimal normalizeAmount(BigDecimal amount) {
        return amount == null ? BigDecimal.ZERO : amount.max(BigDecimal.ZERO);
    }

    private Long normalizeId(Long value) {
        return value == null || value <= 0 ? null : value;
    }

    private Long requiredId(Long value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
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

    private record ResolvedScope(Long headOfficeId, Long schoolId) {
    }

    private record Recipient(Long id, String name, String role) {
    }

    private record SaleItemSpec(Long categoryId, Long productId, BigDecimal quantity, BigDecimal unitPrice, BigDecimal subtotal) {
    }

    private record ResolvedWriteScope(
            Long headOfficeId,
            Long schoolId,
            Long incomeHeadId,
            String incomeHeadName,
            String userType,
            Long saleToId,
            String saleToName,
            List<SaleItemSpec> items,
            BigDecimal grossAmount,
            BigDecimal discountAmount,
            BigDecimal netAmount,
            String status
    ) {
    }
}
