package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.BookDto;
import com.School.School_management.Entity.Book;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.BookRepository;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Service.BookService;
import com.School.School_management.auth.CurrentUser;
import java.math.BigDecimal;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class BookServiceImpl implements BookService {

    private final BookRepository bookRepository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;

    public BookServiceImpl(
            BookRepository bookRepository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository
    ) {
        this.bookRepository = bookRepository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
    }

    @Override
    public Page<BookDto> list(Long headOfficeId, Long schoolId, String language, String edition, String almiraNo, String search, int page, int size, CurrentUser user) {
        ResolvedScope scope = resolveListScope(user, headOfficeId, schoolId);
        String normalizedSearch = normalizeSearch(search);
        String normalizedLanguage = normalizeLanguage(language);
        String normalizedEdition = normalizeOptional(edition);
        String normalizedAlmiraNo = normalizeOptional(almiraNo);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        return bookRepository.searchBooks(scope.headOfficeId(), scope.schoolId(), normalizedLanguage, normalizedEdition, normalizedAlmiraNo, normalizedSearch, pageable).map(this::toDto);
    }

    @Override
    public BookDto create(BookDto dto, CurrentUser user) {
        ResolvedWriteScope scope = resolveWriteScope(user, dto);
        Book book = new Book();
        applyDto(book, scope);
        return toDto(bookRepository.save(book));
    }

    @Override
    public BookDto update(Long id, BookDto dto, CurrentUser user) {
        Book book = bookRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(book, user);
        BookDto merged = merge(book, dto);
        ResolvedWriteScope scope = resolveWriteScope(user, merged);
        applyDto(book, scope);
        return toDto(bookRepository.save(book));
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        Book book = bookRepository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(book, user);
        bookRepository.delete(book);
    }

    private ResolvedScope resolveListScope(CurrentUser user, Long requestedHeadOfficeId, Long requestedSchoolId) {
        if (user == null) {
            throw new ForbiddenException();
        }

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
                    throw new BadRequestException("School does not belong to the selected head office");
                }
                return new ResolvedScope(authHeadOfficeId, school.getId());
            }
            return new ResolvedScope(authHeadOfficeId, null);
        }

        if (user.isSchoolScopedAdminUser()) {
            ManageSchool school = requireSchool(user.schoolId());
            if (requestedSchoolId != null && !Objects.equals(user.schoolId(), requestedSchoolId)) {
                throw new ForbiddenException();
            }
            if (requestedHeadOfficeId != null && !Objects.equals(school.getHeadOfficeId(), requestedHeadOfficeId)) {
                throw new ForbiddenException();
            }
            return new ResolvedScope(school.getHeadOfficeId(), school.getId());
        }

        throw new ForbiddenException();
    }

    private ResolvedWriteScope resolveWriteScope(CurrentUser user, BookDto dto) {
        if (user == null) throw new ForbiddenException();

        Long requestedHeadOfficeId = normalizeId(dto == null ? null : dto.getHeadOfficeId());
        Long requestedSchoolId = normalizeId(dto == null ? null : dto.getSchoolId());
        Long schoolId = requiredId(requestedSchoolId, "School is required");
        ManageSchool school = requireSchool(schoolId);
        validateSchoolScope(requestedHeadOfficeId, school);

        String title = requiredText(dto == null ? null : dto.getTitle(), "Title is required");
        String bookId = requiredText(dto == null ? null : dto.getBookId(), "Book ID is required");
        Integer quantity = requiredQuantity(dto == null ? null : dto.getQuantity());

        if (user.isSuperAdmin()) {
            return buildWriteScope(school, title, bookId, dto, quantity);
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                throw new BadRequestException("School does not belong to your head office");
            }
            return buildWriteScope(school, title, bookId, dto, quantity);
        }

        if (user.isSchoolScopedAdminUser()) {
            Long authSchoolId = user.schoolId();
            if (!Objects.equals(authSchoolId, school.getId())) {
                throw new ForbiddenException();
            }
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                throw new ForbiddenException();
            }
            return buildWriteScope(school, title, bookId, dto, quantity);
        }

        throw new ForbiddenException();
    }

    private ResolvedWriteScope buildWriteScope(ManageSchool school, String title, String bookId, BookDto dto, Integer quantity) {
        return new ResolvedWriteScope(
                school.getHeadOfficeId(),
                school.getId(),
                title,
                bookId,
                normalizeOptional(dto == null ? null : dto.getIsbnNo()),
                normalizeOptional(dto == null ? null : dto.getEdition()),
                normalizeOptional(dto == null ? null : dto.getAuthor()),
                normalizeOptional(dto == null ? null : dto.getLanguage()),
                dto == null ? null : dto.getPrice(),
                quantity,
                normalizeOptional(dto == null ? null : dto.getAlmiraNo()),
                normalizeOptional(dto == null ? null : dto.getBookCover())
        );
    }

    private void applyDto(Book book, ResolvedWriteScope scope) {
        book.setHeadOfficeId(scope.headOfficeId());
        book.setSchoolId(scope.schoolId());
        book.setTitle(scope.title());
        book.setBookId(scope.bookId());
        book.setIsbnNo(scope.isbnNo());
        book.setEdition(scope.edition());
        book.setAuthor(scope.author());
        book.setLanguage(scope.language());
        book.setPrice(scope.price());
        book.setQuantity(scope.quantity());
        book.setAlmiraNo(scope.almiraNo());
        book.setBookCover(scope.bookCover());
    }

    private void ensureVisibleToUser(Book book, CurrentUser user) {
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin()) return;
        if (user.isHeadOfficeScopedAdmin()) {
            if (!Objects.equals(user.headOfficeId(), book.getHeadOfficeId())) throw new NotFoundException();
            return;
        }
        if (user.isSchoolScopedAdminUser()) {
            if (!Objects.equals(user.schoolId(), book.getSchoolId())) throw new NotFoundException();
            return;
        }
        throw new ForbiddenException();
    }

    private BookDto merge(Book book, BookDto dto) {
        BookDto merged = new BookDto();
        merged.setHeadOfficeId(book.getHeadOfficeId());
        merged.setSchoolId(book.getSchoolId());
        merged.setTitle(book.getTitle());
        merged.setBookId(book.getBookId());
        merged.setIsbnNo(book.getIsbnNo());
        merged.setEdition(book.getEdition());
        merged.setAuthor(book.getAuthor());
        merged.setLanguage(book.getLanguage());
        merged.setPrice(book.getPrice());
        merged.setQuantity(book.getQuantity());
        merged.setAlmiraNo(book.getAlmiraNo());
        merged.setBookCover(book.getBookCover());
        if (dto == null) return merged;
        if (dto.getHeadOfficeId() != null) merged.setHeadOfficeId(dto.getHeadOfficeId());
        if (dto.getSchoolId() != null) merged.setSchoolId(dto.getSchoolId());
        if (dto.getTitle() != null) merged.setTitle(dto.getTitle());
        if (dto.getBookId() != null) merged.setBookId(dto.getBookId());
        if (dto.getIsbnNo() != null) merged.setIsbnNo(dto.getIsbnNo());
        if (dto.getEdition() != null) merged.setEdition(dto.getEdition());
        if (dto.getAuthor() != null) merged.setAuthor(dto.getAuthor());
        if (dto.getLanguage() != null) merged.setLanguage(dto.getLanguage());
        if (dto.getPrice() != null) merged.setPrice(dto.getPrice());
        if (dto.getQuantity() != null) merged.setQuantity(dto.getQuantity());
        if (dto.getAlmiraNo() != null) merged.setAlmiraNo(dto.getAlmiraNo());
        if (dto.getBookCover() != null) merged.setBookCover(dto.getBookCover());
        return merged;
    }

    private ManageSchool requireSchool(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId).orElseThrow(NotFoundException::new);
    }

    private Long normalizeId(Long value) {
        return value == null || value <= 0 ? null : value;
    }

    private String normalizeSearch(String search) {
        String value = search == null ? "" : search.trim();
        return value.isEmpty() ? null : value;
    }

    private String normalizeLanguage(String language) {
        String value = language == null ? "" : language.trim();
        return value.isEmpty() ? null : value;
    }

    private String normalizeOptional(String value) {
        String trimmed = value == null ? "" : value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String requiredText(String value, String message) {
        String trimmed = normalizeOptional(value);
        if (trimmed == null) throw new BadRequestException(message);
        return trimmed;
    }

    private Integer requiredQuantity(Integer quantity) {
        if (quantity == null || quantity <= 0) throw new BadRequestException("Quantity is required");
        return quantity;
    }

    private Long requiredId(Long value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }

    private void validateSchoolScope(Long requestedHeadOfficeId, ManageSchool school) {
        if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
            throw new BadRequestException("School does not belong to the selected head office");
        }
    }

    private BookDto toDto(Book book) {
        BookDto dto = new BookDto();
        dto.setId(book.getId());
        dto.setHeadOfficeId(book.getHeadOfficeId());
        dto.setHeadOfficeName(resolveHeadOfficeName(book.getHeadOfficeId()));
        dto.setSchoolId(book.getSchoolId());
        dto.setSchoolName(resolveSchoolName(book.getSchoolId()));
        dto.setTitle(book.getTitle());
        dto.setBookId(book.getBookId());
        dto.setIsbnNo(book.getIsbnNo());
        dto.setEdition(book.getEdition());
        dto.setAuthor(book.getAuthor());
        dto.setLanguage(book.getLanguage());
        dto.setPrice(book.getPrice());
        dto.setQuantity(book.getQuantity());
        dto.setAlmiraNo(book.getAlmiraNo());
        dto.setBookCover(book.getBookCover());
        dto.setCreatedAt(book.getCreatedAt());
        dto.setUpdatedAt(book.getUpdatedAt());
        return dto;
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) {
            return null;
        }
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId)
                .map(ManageSchool::getSchoolName)
                .orElse("School " + schoolId);
    }

    private String resolveHeadOfficeName(Long headOfficeId) {
        if (headOfficeId == null) {
            return null;
        }
        return headOfficeRepository.findById(headOfficeId)
                .map(HeadOffice::getName)
                .orElse("Head Office " + headOfficeId);
    }

    private record ResolvedScope(Long headOfficeId, Long schoolId) {
    }

    private record ResolvedWriteScope(
            Long headOfficeId,
            Long schoolId,
            String title,
            String bookId,
            String isbnNo,
            String edition,
            String author,
            String language,
            BigDecimal price,
            Integer quantity,
            String almiraNo,
            String bookCover
    ) {
    }
}
