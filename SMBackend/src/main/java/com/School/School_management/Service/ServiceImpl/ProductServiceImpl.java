package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.ProductDto;
import com.School.School_management.Entity.Category;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.Product;
import com.School.School_management.Entity.Warehouse;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.CategoryRepository;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.ProductRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.WarehouseRepository;
import com.School.School_management.Service.ProductService;
import com.School.School_management.auth.CurrentUser;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;

@Service
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;
    private final CategoryRepository categoryRepository;
    private final WarehouseRepository warehouseRepository;

    public ProductServiceImpl(
            ProductRepository productRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository,
            CategoryRepository categoryRepository,
            WarehouseRepository warehouseRepository
    ) {
        this.productRepository = productRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
        this.categoryRepository = categoryRepository;
        this.warehouseRepository = warehouseRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductDto> list(Long headOfficeId, Long schoolId, Long categoryId, Long warehouseId, String search, int page, int size, CurrentUser user) {
        ResolvedScope scope = resolveListScope(user, headOfficeId, schoolId);
        validateListFilters(scope, categoryId, warehouseId);
        String normalizedSearch = normalizeSearch(search);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        return productRepository.searchProducts(scope.headOfficeId(), scope.schoolId(), normalizeId(categoryId), normalizeId(warehouseId), normalizedSearch, pageable).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDto getById(Long id, CurrentUser user) {
        Product product = productRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(product, user);
        return toDto(product);
    }

    @Override
    public ProductDto create(ProductDto dto, CurrentUser user) {
        ResolvedProductScope scope = resolveWriteScope(user, dto);
        Product product = new Product();
        applyDto(dto, product);
        product.setHeadOfficeId(scope.headOfficeId());
        product.setSchoolId(scope.schoolId());
        product.setCategoryId(scope.categoryId());
        product.setWarehouseId(scope.warehouseId());
        return toDto(productRepository.save(product));
    }

    @Override
    public ProductDto update(Long id, ProductDto dto, CurrentUser user) {
        Product product = productRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(product, user);
        ResolvedProductScope scope = resolveWriteScope(user, dto);
        applyDto(dto, product);
        product.setHeadOfficeId(scope.headOfficeId());
        product.setSchoolId(scope.schoolId());
        product.setCategoryId(scope.categoryId());
        product.setWarehouseId(scope.warehouseId());
        return toDto(productRepository.save(product));
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        Product product = productRepository.findById(id)
                .orElseThrow(NotFoundException::new);
        ensureVisibleToUser(product, user);
        productRepository.delete(product);
    }

    private void ensureVisibleToUser(Product product, CurrentUser user) {
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin()) return;
        if (user.isHeadOfficeScopedAdmin()) {
            if (!Objects.equals(user.headOfficeId(), product.getHeadOfficeId())) throw new NotFoundException();
            return;
        }
        if (user.isSchoolScopedAdminUser()) {
            if (!Objects.equals(user.schoolId(), product.getSchoolId())) throw new NotFoundException();
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

    private ResolvedProductScope resolveWriteScope(CurrentUser user, ProductDto dto) {
        if (user == null) throw new ForbiddenException();

        Long requestedHeadOfficeId = normalizeId(dto == null ? null : dto.getHeadOfficeId());
        Long requestedSchoolId = normalizeId(dto == null ? null : dto.getSchoolId());
        Long requestedCategoryId = normalizeId(dto == null ? null : dto.getCategoryId());
        Long requestedWarehouseId = normalizeId(dto == null ? null : dto.getWarehouseId());

        if (user.isSuperAdmin()) {
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            validateSchoolScope(requestedHeadOfficeId, school);
            Category category = requireCategory(requiredId(requestedCategoryId, "Category is required"));
            Warehouse warehouse = requireWarehouse(requiredId(requestedWarehouseId, "Warehouse is required"));
            validateProductRelations(school, category, warehouse);
            return new ResolvedProductScope(school.getHeadOfficeId(), school.getId(), category.getId(), warehouse.getId());
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                throw new BadRequestException("School does not belong to your head office");
            }
            validateSchoolScope(authHeadOfficeId, school);
            Category category = requireCategory(requiredId(requestedCategoryId, "Category is required"));
            Warehouse warehouse = requireWarehouse(requiredId(requestedWarehouseId, "Warehouse is required"));
            validateProductRelations(school, category, warehouse);
            return new ResolvedProductScope(authHeadOfficeId, school.getId(), category.getId(), warehouse.getId());
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
            Warehouse warehouse = requireWarehouse(requiredId(requestedWarehouseId, "Warehouse is required"));
            validateProductRelations(school, category, warehouse);
            return new ResolvedProductScope(school.getHeadOfficeId(), authSchoolId, category.getId(), warehouse.getId());
        }

        throw new ForbiddenException();
    }

    private void validateSchoolScope(Long requestedHeadOfficeId, ManageSchool school) {
        if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
            throw new BadRequestException("School does not belong to the selected head office");
        }
    }

    private void validateProductRelations(ManageSchool school, Category category, Warehouse warehouse) {
        if (!Objects.equals(category.getSchoolId(), school.getId())) {
            throw new BadRequestException("Category does not belong to the selected school");
        }
        if (!Objects.equals(warehouse.getSchoolId(), school.getId())) {
            throw new BadRequestException("Warehouse does not belong to the selected school");
        }
        if (!Objects.equals(category.getHeadOfficeId(), school.getHeadOfficeId())) {
            throw new BadRequestException("Category does not belong to the selected head office");
        }
        if (!Objects.equals(warehouse.getHeadOfficeId(), school.getHeadOfficeId())) {
            throw new BadRequestException("Warehouse does not belong to the selected head office");
        }
    }

    private void validateListFilters(ResolvedScope scope, Long categoryId, Long warehouseId) {
        if (categoryId != null) {
            Category category = requireCategory(categoryId);
            if (scope.schoolId() != null && !Objects.equals(category.getSchoolId(), scope.schoolId())) {
                throw new BadRequestException("Category does not belong to the selected school");
            }
            if (scope.headOfficeId() != null && !Objects.equals(category.getHeadOfficeId(), scope.headOfficeId())) {
                throw new BadRequestException("Category does not belong to the selected head office");
            }
        }

        if (warehouseId != null) {
            Warehouse warehouse = requireWarehouse(warehouseId);
            if (scope.schoolId() != null && !Objects.equals(warehouse.getSchoolId(), scope.schoolId())) {
                throw new BadRequestException("Warehouse does not belong to the selected school");
            }
            if (scope.headOfficeId() != null && !Objects.equals(warehouse.getHeadOfficeId(), scope.headOfficeId())) {
                throw new BadRequestException("Warehouse does not belong to the selected head office");
            }
        }
    }

    private ProductDto toDto(Product product) {
        ProductDto dto = new ProductDto();
        dto.setId(product.getId());
        dto.setHeadOfficeId(product.getHeadOfficeId());
        dto.setHeadOfficeName(resolveHeadOfficeName(product.getHeadOfficeId()));
        dto.setSchoolId(product.getSchoolId());
        dto.setSchoolName(resolveSchoolName(product.getSchoolId()));
        dto.setCategoryId(product.getCategoryId());
        dto.setCategoryName(resolveCategoryName(product.getCategoryId()));
        dto.setWarehouseId(product.getWarehouseId());
        dto.setWarehouseName(resolveWarehouseName(product.getWarehouseId()));
        dto.setProductName(product.getProductName());
        dto.setProductCode(product.getProductCode());
        dto.setNote(product.getNote());
        dto.setCreatedAt(product.getCreatedAt());
        dto.setUpdatedAt(product.getUpdatedAt());
        return dto;
    }

    private void applyDto(ProductDto dto, Product product) {
        if (dto == null) throw new BadRequestException("Product data is required");
        product.setProductName(required(dto.getProductName(), "Product name is required"));
        product.setProductCode(required(dto.getProductCode(), "Product code is required"));
        product.setNote(normalizeOptional(dto.getNote()));
    }

    private ManageSchool requireSchool(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .orElseThrow(NotFoundException::new);
    }

    private Category requireCategory(Long categoryId) {
        if (categoryId == null) throw new BadRequestException("categoryId is required");
        return categoryRepository.findById(categoryId)
                .orElseThrow(NotFoundException::new);
    }

    private Warehouse requireWarehouse(Long warehouseId) {
        if (warehouseId == null) throw new BadRequestException("warehouseId is required");
        return warehouseRepository.findById(warehouseId)
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

    private String required(String value, String message) {
        String trimmed = normalizeOptional(value);
        if (trimmed == null) throw new BadRequestException(message);
        return trimmed;
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
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

    private String resolveCategoryName(Long categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId)
                .map(Category::getCategoryName)
                .orElse("Category " + categoryId);
    }

    private String resolveWarehouseName(Long warehouseId) {
        if (warehouseId == null) return null;
        return warehouseRepository.findById(warehouseId)
                .map(Warehouse::getWarehouseName)
                .orElse("Warehouse " + warehouseId);
    }

    private record ResolvedScope(Long headOfficeId, Long schoolId) {
    }

    private record ResolvedProductScope(Long headOfficeId, Long schoolId, Long categoryId, Long warehouseId) {
    }
}
