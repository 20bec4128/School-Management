package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.PurchaseDto;
import com.School.School_management.Entity.Category;
import com.School.School_management.Entity.Employee;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Product;
import com.School.School_management.Entity.Purchase;
import com.School.School_management.Entity.Supplier;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.CategoryRepository;
import com.School.School_management.Repository.EmployeeRepository;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.ProductRepository;
import com.School.School_management.Repository.PurchaseRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.SupplierRepository;
import com.School.School_management.Service.PurchaseService;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.Set;

@Service
@Transactional
public class PurchaseServiceImpl implements PurchaseService {

    private static final Set<String> UNIT_TYPES = Set.of("BOX", "LITER", "KG", "PIECE", "SET", "OTHER");

    private final PurchaseRepository purchaseRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;
    private final SupplierRepository supplierRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final EmployeeRepository employeeRepository;

    public PurchaseServiceImpl(
            PurchaseRepository purchaseRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository,
            SupplierRepository supplierRepository,
            CategoryRepository categoryRepository,
            ProductRepository productRepository,
            EmployeeRepository employeeRepository
    ) {
        this.purchaseRepository = purchaseRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
        this.supplierRepository = supplierRepository;
        this.categoryRepository = categoryRepository;
        this.productRepository = productRepository;
        this.employeeRepository = employeeRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PurchaseDto> list(Long headOfficeId, Long schoolId, Long supplierId, Long categoryId, Long productId, String search, int page, int size, CurrentUser user) {
        ResolvedScope scope = resolveListScope(user, headOfficeId, schoolId);
        validateListFilters(scope, supplierId, categoryId, productId);
        String normalizedSearch = normalizeSearch(search);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        return purchaseRepository.searchPurchases(
                scope.headOfficeId(),
                scope.schoolId(),
                normalizeId(supplierId),
                normalizeId(categoryId),
                normalizeId(productId),
                normalizedSearch,
                pageable
        ).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public PurchaseDto getById(Long id, CurrentUser user) {
        Purchase purchase = purchaseRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(purchase, user);
        return toDto(purchase);
    }

    @Override
    public PurchaseDto create(PurchaseDto dto, CurrentUser user) {
        ResolvedPurchaseScope scope = resolveWriteScope(user, dto);
        Purchase purchase = new Purchase();
        applyDto(dto, purchase);
        purchase.setHeadOfficeId(scope.headOfficeId());
        purchase.setSchoolId(scope.schoolId());
        purchase.setSupplierId(scope.supplierId());
        purchase.setCategoryId(scope.categoryId());
        purchase.setProductId(scope.productId());
        purchase.setPurchaseById(scope.purchaseById());
        purchase.setPurchaseByName(scope.purchaseByName());
        return toDto(purchaseRepository.save(purchase));
    }

    @Override
    public PurchaseDto update(Long id, PurchaseDto dto, CurrentUser user) {
        Purchase purchase = purchaseRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(purchase, user);
        ResolvedPurchaseScope scope = resolveWriteScope(user, dto);
        applyDto(dto, purchase);
        purchase.setHeadOfficeId(scope.headOfficeId());
        purchase.setSchoolId(scope.schoolId());
        purchase.setSupplierId(scope.supplierId());
        purchase.setCategoryId(scope.categoryId());
        purchase.setProductId(scope.productId());
        purchase.setPurchaseById(scope.purchaseById());
        purchase.setPurchaseByName(scope.purchaseByName());
        return toDto(purchaseRepository.save(purchase));
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        Purchase purchase = purchaseRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(purchase, user);
        purchaseRepository.delete(purchase);
    }

    private void ensureVisibleToUser(Purchase purchase, CurrentUser user) {
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin()) return;
        if (user.isHeadOfficeScopedAdmin()) {
            if (!Objects.equals(user.headOfficeId(), purchase.getHeadOfficeId())) throw new NotFoundException();
            return;
        }
        if (user.isSchoolScopedAdminUser()) {
            if (!Objects.equals(user.schoolId(), purchase.getSchoolId())) throw new NotFoundException();
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

    private ResolvedPurchaseScope resolveWriteScope(CurrentUser user, PurchaseDto dto) {
        if (user == null) throw new ForbiddenException();

        Long requestedHeadOfficeId = normalizeId(dto == null ? null : dto.getHeadOfficeId());
        Long requestedSchoolId = normalizeId(dto == null ? null : dto.getSchoolId());
        Long requestedSupplierId = normalizeId(dto == null ? null : dto.getSupplierId());
        Long requestedCategoryId = normalizeId(dto == null ? null : dto.getCategoryId());
        Long requestedProductId = normalizeId(dto == null ? null : dto.getProductId());
        Long requestedPurchaseById = normalizeId(dto == null ? null : dto.getPurchaseById());

        if (user.isSuperAdmin()) {
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            validateSchoolScope(requestedHeadOfficeId, school);
            Supplier supplier = requireSupplier(requiredId(requestedSupplierId, "Supplier is required"));
            Category category = requireCategory(requiredId(requestedCategoryId, "Category is required"));
            Product product = requireProduct(requiredId(requestedProductId, "Product is required"));
            Employee employee = requireEmployee(requiredId(requestedPurchaseById, "Purchase by is required"));
            validatePurchaseRelations(school, supplier, category, product, employee);
            return new ResolvedPurchaseScope(school.getHeadOfficeId(), school.getId(), supplier.getId(), category.getId(), product.getId(), employee.getId(), employee.getName());
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                throw new BadRequestException("School does not belong to your head office");
            }
            validateSchoolScope(authHeadOfficeId, school);
            Supplier supplier = requireSupplier(requiredId(requestedSupplierId, "Supplier is required"));
            Category category = requireCategory(requiredId(requestedCategoryId, "Category is required"));
            Product product = requireProduct(requiredId(requestedProductId, "Product is required"));
            Employee employee = requireEmployee(requiredId(requestedPurchaseById, "Purchase by is required"));
            validatePurchaseRelations(school, supplier, category, product, employee);
            return new ResolvedPurchaseScope(authHeadOfficeId, school.getId(), supplier.getId(), category.getId(), product.getId(), employee.getId(), employee.getName());
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
            Supplier supplier = requireSupplier(requiredId(requestedSupplierId, "Supplier is required"));
            Category category = requireCategory(requiredId(requestedCategoryId, "Category is required"));
            Product product = requireProduct(requiredId(requestedProductId, "Product is required"));
            Employee employee = requireEmployee(requiredId(requestedPurchaseById, "Purchase by is required"));
            validatePurchaseRelations(school, supplier, category, product, employee);
            return new ResolvedPurchaseScope(school.getHeadOfficeId(), authSchoolId, supplier.getId(), category.getId(), product.getId(), employee.getId(), employee.getName());
        }

        throw new ForbiddenException();
    }

    private void validateListFilters(ResolvedScope scope, Long supplierId, Long categoryId, Long productId) {
        if (supplierId != null) {
            Supplier supplier = requireSupplier(supplierId);
            if (scope.schoolId() != null && !Objects.equals(supplier.getSchoolId(), scope.schoolId())) {
                throw new BadRequestException("Supplier does not belong to the selected school");
            }
            if (scope.headOfficeId() != null && !Objects.equals(supplier.getHeadOfficeId(), scope.headOfficeId())) {
                throw new BadRequestException("Supplier does not belong to the selected head office");
            }
        }

        if (categoryId != null) {
            Category category = requireCategory(categoryId);
            if (scope.schoolId() != null && !Objects.equals(category.getSchoolId(), scope.schoolId())) {
                throw new BadRequestException("Category does not belong to the selected school");
            }
            if (scope.headOfficeId() != null && !Objects.equals(category.getHeadOfficeId(), scope.headOfficeId())) {
                throw new BadRequestException("Category does not belong to the selected head office");
            }
        }

        if (productId != null) {
            Product product = requireProduct(productId);
            if (scope.schoolId() != null && !Objects.equals(product.getSchoolId(), scope.schoolId())) {
                throw new BadRequestException("Product does not belong to the selected school");
            }
            if (scope.headOfficeId() != null && !Objects.equals(product.getHeadOfficeId(), scope.headOfficeId())) {
                throw new BadRequestException("Product does not belong to the selected head office");
            }
        }
    }

    private void validateSchoolScope(Long requestedHeadOfficeId, ManageSchool school) {
        if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
            throw new BadRequestException("School does not belong to the selected head office");
        }
    }

    private void validatePurchaseRelations(ManageSchool school, Supplier supplier, Category category, Product product, Employee employee) {
        if (!Objects.equals(supplier.getSchoolId(), school.getId())) {
            throw new BadRequestException("Supplier does not belong to the selected school");
        }
        if (!Objects.equals(category.getSchoolId(), school.getId())) {
            throw new BadRequestException("Category does not belong to the selected school");
        }
        if (!Objects.equals(product.getSchoolId(), school.getId())) {
            throw new BadRequestException("Product does not belong to the selected school");
        }
        if (!Objects.equals(employee.getSchoolId(), school.getId())) {
            throw new BadRequestException("Purchase by employee does not belong to the selected school");
        }
        if (!Objects.equals(supplier.getHeadOfficeId(), school.getHeadOfficeId())) {
            throw new BadRequestException("Supplier does not belong to the selected head office");
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

    private PurchaseDto toDto(Purchase purchase) {
        PurchaseDto dto = new PurchaseDto();
        dto.setId(purchase.getId());
        dto.setHeadOfficeId(purchase.getHeadOfficeId());
        dto.setHeadOfficeName(resolveHeadOfficeName(purchase.getHeadOfficeId()));
        dto.setSchoolId(purchase.getSchoolId());
        dto.setSchoolName(resolveSchoolName(purchase.getSchoolId()));
        dto.setSupplierId(purchase.getSupplierId());
        dto.setSupplierName(resolveSupplierName(purchase.getSupplierId()));
        dto.setCategoryId(purchase.getCategoryId());
        dto.setCategoryName(resolveCategoryName(purchase.getCategoryId()));
        dto.setProductId(purchase.getProductId());
        dto.setProductName(resolveProductName(purchase.getProductId()));
        dto.setPurchaseById(purchase.getPurchaseById());
        dto.setPurchaseByName(resolvePurchaseByName(purchase.getPurchaseById(), purchase.getPurchaseByName()));
        dto.setQuantity(purchase.getQuantity());
        dto.setUnitType(purchase.getUnitType());
        dto.setCustomUnitType(purchase.getCustomUnitType());
        dto.setUnitPrice(purchase.getUnitPrice());
        dto.setTotalPrice(resolveTotalPrice(purchase.getQuantity(), purchase.getUnitPrice()));
        dto.setPurchaseDate(purchase.getPurchaseDate());
        dto.setExpireDate(purchase.getExpireDate());
        dto.setNote(purchase.getNote());
        dto.setCreatedAt(purchase.getCreatedAt());
        dto.setUpdatedAt(purchase.getUpdatedAt());
        return dto;
    }

    private void applyDto(PurchaseDto dto, Purchase purchase) {
        if (dto == null) throw new BadRequestException("Purchase data is required");
        purchase.setQuantity(requiredQuantity(dto.getQuantity()));
        String unitType = requiredUnitType(dto.getUnitType());
        purchase.setUnitType(unitType);
        purchase.setCustomUnitType("OTHER".equals(unitType) ? requiredCustomUnitType(dto.getCustomUnitType()) : null);
        purchase.setUnitPrice(requiredAmount(dto.getUnitPrice(), "Unit price is required"));
        purchase.setPurchaseDate(requiredDate(dto.getPurchaseDate(), "Purchase date is required"));
        purchase.setExpireDate(normalizeDate(dto.getExpireDate()));
        purchase.setNote(normalizeOptional(dto.getNote()));
    }

    private BigDecimal requiredQuantity(BigDecimal value) {
        if (value == null) throw new BadRequestException("Quantity is required");
        if (value.signum() <= 0) throw new BadRequestException("Quantity must be greater than 0");
        return value;
    }

    private BigDecimal requiredAmount(BigDecimal value, String message) {
        if (value == null) throw new BadRequestException(message);
        if (value.signum() < 0) throw new BadRequestException(message);
        return value;
    }

    private String requiredUnitType(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) throw new BadRequestException("Unit type is required");
        String upper = normalized.toUpperCase();
        if (!UNIT_TYPES.contains(upper)) throw new BadRequestException("Invalid unit type");
        return upper;
    }

    private String requiredCustomUnitType(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) throw new BadRequestException("Custom unit type is required");
        return normalized;
    }

    private java.time.LocalDate requiredDate(java.time.LocalDate value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }

    private java.time.LocalDate normalizeDate(java.time.LocalDate value) {
        return value;
    }

    private ManageSchool requireSchool(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .orElseThrow(NotFoundException::new);
    }

    private Supplier requireSupplier(Long supplierId) {
        if (supplierId == null) throw new BadRequestException("supplierId is required");
        return supplierRepository.findById(supplierId)
                .orElseThrow(NotFoundException::new);
    }

    private Category requireCategory(Long categoryId) {
        if (categoryId == null) throw new BadRequestException("categoryId is required");
        return categoryRepository.findById(categoryId)
                .orElseThrow(NotFoundException::new);
    }

    private Product requireProduct(Long productId) {
        if (productId == null) throw new BadRequestException("productId is required");
        return productRepository.findById(productId)
                .orElseThrow(NotFoundException::new);
    }

    private Employee requireEmployee(Long employeeId) {
        if (employeeId == null) throw new BadRequestException("purchaseById is required");
        return employeeRepository.findById(employeeId)
                .orElseThrow(NotFoundException::new);
    }

    private Long requiredId(Long value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }

    private Long normalizeId(Long value) {
        return value == null || value <= 0 ? null : value;
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

    private BigDecimal resolveTotalPrice(BigDecimal quantity, BigDecimal unitPrice) {
        if (quantity == null || unitPrice == null) return null;
        return quantity.multiply(unitPrice);
    }

    private String resolveHeadOfficeName(Long headOfficeId) {
        if (headOfficeId == null) return null;
        return headOfficeRepository.findById(headOfficeId)
                .map(HeadOffice::getName)
                .orElse("Head Office " + headOfficeId);
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getSchoolName)
                .orElse("School " + schoolId);
    }

    private String resolveSupplierName(Long supplierId) {
        if (supplierId == null) return null;
        return supplierRepository.findById(supplierId)
                .map(Supplier::getSupplierName)
                .orElse("Supplier " + supplierId);
    }

    private String resolveCategoryName(Long categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId)
                .map(Category::getCategoryName)
                .orElse("Category " + categoryId);
    }

    private String resolveProductName(Long productId) {
        if (productId == null) return null;
        return productRepository.findById(productId)
                .map(Product::getProductName)
                .orElse("Product " + productId);
    }

    private String resolvePurchaseByName(Long employeeId, String storedName) {
        if (storedName != null && !storedName.isBlank()) return storedName;
        if (employeeId == null) return null;
        return employeeRepository.findById(employeeId)
                .map(Employee::getName)
                .orElse("Employee " + employeeId);
    }

    private record ResolvedScope(Long headOfficeId, Long schoolId) {
    }

    private record ResolvedPurchaseScope(Long headOfficeId, Long schoolId, Long supplierId, Long categoryId, Long productId, Long purchaseById, String purchaseByName) {
    }
}
