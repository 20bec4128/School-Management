package com.School.School_management.Service.ServiceImpl;

import com.School.School_management.Dto.LibraryIssueDto;
import com.School.School_management.Entity.Book;
import com.School.School_management.Entity.Employee;
import com.School.School_management.Entity.HeadOffice;
import com.School.School_management.Entity.LibraryIssue;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.SchoolClass;
import com.School.School_management.Entity.Student;
import com.School.School_management.Exception.BadRequestException;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.BookRepository;
import com.School.School_management.Repository.EmployeeRepository;
import com.School.School_management.Repository.HeadOfficeRepository;
import com.School.School_management.Repository.LibraryIssueRepository;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Service.LibraryIssueService;
import com.School.School_management.auth.CurrentUser;
import java.time.LocalDate;
import java.util.Objects;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class LibraryIssueServiceImpl implements LibraryIssueService {

    private static final String BORROWER_TYPE_STUDENT = "STUDENT";
    private static final String BORROWER_TYPE_EMPLOYEE = "EMPLOYEE";

    private final LibraryIssueRepository repository;
    private final SchoolRepository schoolRepository;
    private final HeadOfficeRepository headOfficeRepository;
    private final BookRepository bookRepository;
    private final StudentRepository studentRepository;
    private final EmployeeRepository employeeRepository;
    private final SchoolClassRepository schoolClassRepository;

    public LibraryIssueServiceImpl(
            LibraryIssueRepository repository,
            SchoolRepository schoolRepository,
            HeadOfficeRepository headOfficeRepository,
            BookRepository bookRepository,
            StudentRepository studentRepository,
            EmployeeRepository employeeRepository,
            SchoolClassRepository schoolClassRepository
    ) {
        this.repository = repository;
        this.schoolRepository = schoolRepository;
        this.headOfficeRepository = headOfficeRepository;
        this.bookRepository = bookRepository;
        this.studentRepository = studentRepository;
        this.employeeRepository = employeeRepository;
        this.schoolClassRepository = schoolClassRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<LibraryIssueDto> list(Long headOfficeId, Long schoolId, String status, String search, int page, int size, CurrentUser user) {
        ResolvedScope scope = resolveListScope(user, headOfficeId, schoolId);
        String normalizedSearch = normalizeSearch(search);
        String normalizedStatus = normalizeOptional(status);
        PageRequest pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id"));
        return repository.searchLibraryIssues(scope.headOfficeId(), scope.schoolId(), normalizedStatus, normalizedSearch, pageable).map(this::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public LibraryIssueDto getById(Long id, CurrentUser user) {
        LibraryIssue issue = repository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(issue, user);
        return toDto(issue);
    }

    @Override
    public LibraryIssueDto create(LibraryIssueDto dto, CurrentUser user) {
        ResolvedWriteScope scope = resolveWriteScope(user, dto, null);
        LibraryIssue issue = new LibraryIssue();
        applyDto(issue, scope, dto);
        adjustBookQuantity(scope.book(), -1);
        return toDto(repository.save(issue));
    }

    @Override
    public LibraryIssueDto update(Long id, LibraryIssueDto dto, CurrentUser user) {
        LibraryIssue issue = repository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(issue, user);
        LibraryIssueDto merged = merge(issue, dto);
        ResolvedWriteScope scope = resolveWriteScope(user, merged, issue);

        boolean wasReturned = issue.getReturnDate() != null || "RETURNED".equalsIgnoreCase(issue.getStatus());
        boolean willBeReturned = scope.returnDate() != null;

        if (!Objects.equals(issue.getBookId(), scope.book().getId())) {
            if (!wasReturned) {
                adjustBookQuantity(requireBook(issue.getBookId()), 1);
            }
            adjustBookQuantity(scope.book(), -1);
        } else if (wasReturned != willBeReturned) {
            adjustBookQuantity(scope.book(), willBeReturned ? 1 : -1);
        }

        applyDto(issue, scope, merged);
        return toDto(repository.save(issue));
    }

    @Override
    public void delete(Long id, CurrentUser user) {
        LibraryIssue issue = repository.findById(id).orElseThrow(NotFoundException::new);
        ensureVisibleToUser(issue, user);
        if (issue.getReturnDate() == null && !"RETURNED".equalsIgnoreCase(issue.getStatus())) {
            adjustBookQuantity(requireBook(issue.getBookId()), 1);
        }
        repository.delete(issue);
    }

    private void ensureVisibleToUser(LibraryIssue issue, CurrentUser user) {
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
            ManageSchool school = requireSchool(authSchoolId);
            if (requestedSchoolId != null && !Objects.equals(user.schoolId(), requestedSchoolId)) {
                throw new ForbiddenException();
            }
            if (requestedHeadOfficeId != null && !Objects.equals(school.getHeadOfficeId(), requestedHeadOfficeId)) {
                throw new ForbiddenException();
            }
            return new ResolvedScope(school.getHeadOfficeId(), authSchoolId);
        }

        throw new ForbiddenException();
    }

    private ResolvedWriteScope resolveWriteScope(CurrentUser user, LibraryIssueDto dto, LibraryIssue currentIssue) {
        if (user == null) throw new ForbiddenException();

        Long requestedHeadOfficeId = normalizeId(dto == null ? null : dto.getHeadOfficeId());
        Long requestedSchoolId = normalizeId(dto == null ? null : dto.getSchoolId());
        Long requestedBookId = normalizeId(dto == null ? null : dto.getBookId());
        Long requestedClassId = normalizeId(dto == null ? null : dto.getClassId());
        Long requestedStudentId = normalizeId(dto == null ? null : dto.getStudentId());
        Long requestedEmployeeId = normalizeId(dto == null ? null : dto.getEmployeeId());
        String requestedEmployeeRole = normalizeOptional(dto == null ? null : dto.getEmployeeRole());
        String requestedBorrowerType = normalizeBorrowerType(dto == null ? null : dto.getBorrowerType());
        LocalDate issueDate = requiredDate(dto == null ? null : dto.getIssueDate(), "Issue date is required");
        LocalDate dueDate = requiredDate(dto == null ? null : dto.getDueDate(), "Due date is required");
        LocalDate returnDate = normalizeDate(dto == null ? null : dto.getReturnDate());
        if (dueDate.isBefore(issueDate)) {
            throw new BadRequestException("Due date cannot be before the issue date");
        }
        if (returnDate != null && returnDate.isBefore(issueDate)) {
            throw new BadRequestException("Return date cannot be before the issue date");
        }

        String borrowerType = requestedBorrowerType;
        if (borrowerType == null && currentIssue != null) {
            borrowerType = normalizeBorrowerType(currentIssue.getBorrowerType());
        }
        if (borrowerType == null) {
            if (requestedEmployeeId != null) {
                borrowerType = BORROWER_TYPE_EMPLOYEE;
            } else {
                borrowerType = BORROWER_TYPE_STUDENT;
            }
        }

        if (user.isSuperAdmin()) {
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            validateSchoolScope(requestedHeadOfficeId, school);
            Book book = requireBook(requiredId(requestedBookId, "Book is required"));
            return resolveBorrowerForSchool(school, book, borrowerType, requestedClassId, requestedStudentId, requestedEmployeeId, requestedEmployeeRole, issueDate, dueDate, returnDate);
        }

        if (user.isHeadOfficeScopedAdmin()) {
            Long authHeadOfficeId = user.headOfficeId();
            ManageSchool school = requireSchool(requiredId(requestedSchoolId, "School is required"));
            if (!Objects.equals(authHeadOfficeId, school.getHeadOfficeId())) {
                throw new BadRequestException("School does not belong to your head office");
            }
            validateSchoolScope(authHeadOfficeId, school);
            Book book = requireBook(requiredId(requestedBookId, "Book is required"));
            return resolveBorrowerForSchool(school, book, borrowerType, requestedClassId, requestedStudentId, requestedEmployeeId, requestedEmployeeRole, issueDate, dueDate, returnDate);
        }

        if (user.isSchoolScopedAdminUser()) {
            Long authSchoolId = user.schoolId();
            ManageSchool school = requireSchool(authSchoolId);
            if (requestedSchoolId != null && !Objects.equals(requestedSchoolId, authSchoolId)) {
                throw new ForbiddenException();
            }
            if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
                throw new ForbiddenException();
            }
            Book book = requireBook(requiredId(requestedBookId, "Book is required"));
            return resolveBorrowerForSchool(school, book, borrowerType, requestedClassId, requestedStudentId, requestedEmployeeId, requestedEmployeeRole, issueDate, dueDate, returnDate);
        }

        throw new ForbiddenException();
    }

    private ResolvedWriteScope resolveBorrowerForSchool(
            ManageSchool school,
            Book book,
            String borrowerType,
            Long requestedClassId,
            Long requestedStudentId,
            Long requestedEmployeeId,
            String requestedEmployeeRole,
            LocalDate issueDate,
            LocalDate dueDate,
            LocalDate returnDate
    ) {
        validateBookRelations(school, book);

        if (BORROWER_TYPE_STUDENT.equalsIgnoreCase(borrowerType)) {
            SchoolClass schoolClass = requireClass(requiredId(requestedClassId, "Class is required"));
            validateClassRelations(school, schoolClass);
            Student student = requireStudent(requiredId(requestedStudentId, "Student is required"));
            validateStudentRelations(school, schoolClass, student);
            return new ResolvedWriteScope(school.getHeadOfficeId(), school.getId(), book, BORROWER_TYPE_STUDENT, schoolClass, student, null, issueDate, dueDate, returnDate);
        }

        if (BORROWER_TYPE_EMPLOYEE.equalsIgnoreCase(borrowerType)) {
            Employee employee = requireEmployee(requiredId(requestedEmployeeId, "Employee is required"));
            validateEmployeeRelations(school, employee, requestedEmployeeRole);
            return new ResolvedWriteScope(school.getHeadOfficeId(), school.getId(), book, BORROWER_TYPE_EMPLOYEE, null, null, employee, issueDate, dueDate, returnDate);
        }

        throw new BadRequestException("Borrower type is required");
    }

    private void applyDto(LibraryIssue issue, ResolvedWriteScope scope, LibraryIssueDto dto) {
        issue.setHeadOfficeId(scope.headOfficeId());
        issue.setSchoolId(scope.schoolId());
        issue.setBookId(scope.book().getId());
        issue.setBookTitle(scope.book().getTitle());
        issue.setBookCover(scope.book().getBookCover());
        issue.setBorrowerType(scope.borrowerType());
        issue.setClassId(scope.schoolClass() == null ? null : scope.schoolClass().getId());
        issue.setClassName(scope.schoolClass() == null ? null : scope.schoolClass().getClassName());
        issue.setStudentId(scope.student() == null ? null : scope.student().getId());
        issue.setStudentName(scope.student() == null ? null : scope.student().getName());
        issue.setStudentPhoto(scope.student() == null ? null : scope.student().getPhotoUrl());
        issue.setEmployeeId(scope.employee() == null ? null : scope.employee().getId());
        issue.setEmployeeName(scope.employee() == null ? null : scope.employee().getName());
        issue.setEmployeePhoto(scope.employee() == null ? null : scope.employee().getPhotoUrl());
        issue.setEmployeeRole(scope.employee() == null ? null : scope.employee().getRole());
        issue.setIssueDate(scope.issueDate());
        issue.setDueDate(scope.dueDate());
        issue.setReturnDate(scope.returnDate());
        issue.setNote(normalizeOptional(dto == null ? null : dto.getNote()));
    }

    private void validateBookRelations(ManageSchool school, Book book) {
        if (!Objects.equals(book.getSchoolId(), school.getId())) {
            throw new BadRequestException("Book does not belong to the selected school");
        }
        if (!Objects.equals(book.getHeadOfficeId(), school.getHeadOfficeId())) {
            throw new BadRequestException("Book does not belong to the selected head office");
        }
        if (book.getQuantity() == null || book.getQuantity() <= 0) {
            throw new BadRequestException("No available quantity for the selected book");
        }
    }

    private void validateClassRelations(ManageSchool school, SchoolClass schoolClass) {
        if (!Objects.equals(schoolClass.getSchool().getId(), school.getId())) {
            throw new BadRequestException("Class does not belong to the selected school");
        }
        if (!Objects.equals(schoolClass.getSchool().getHeadOfficeId(), school.getHeadOfficeId())) {
            throw new BadRequestException("Class does not belong to the selected head office");
        }
    }

    private void validateStudentRelations(ManageSchool school, SchoolClass selectedClass, Student student) {
        if (!Objects.equals(student.getSchool().getId(), school.getId())) {
            throw new BadRequestException("Student does not belong to the selected school");
        }
        if (!Objects.equals(student.getSchool().getHeadOfficeId(), school.getHeadOfficeId())) {
            throw new BadRequestException("Student does not belong to the selected head office");
        }
        if (student.getSchoolClass() != null) {
            if (!Objects.equals(student.getSchoolClass().getId(), selectedClass.getId())) {
                throw new BadRequestException("Student does not belong to the selected class");
            }
            return;
        }
        String studentClassName = normalizeOptional(student.getClassName());
        if (studentClassName == null) {
            throw new BadRequestException("Student does not belong to the selected class");
        }
        if (!equalsIgnoreCase(studentClassName, selectedClass.getClassName())
                && !equalsIgnoreCase(studentClassName, selectedClass.getNumericName())) {
            throw new BadRequestException("Student does not belong to the selected class");
        }
    }

    private void validateEmployeeRelations(ManageSchool school, Employee employee, String requestedRole) {
        if (!Objects.equals(employee.getSchoolId(), school.getId())) {
            throw new BadRequestException("Employee does not belong to the selected school");
        }
        if (requestedRole != null && !equalsIgnoreCase(employee.getRole(), requestedRole)) {
            throw new BadRequestException("Employee does not belong to the selected role");
        }
    }

    private LibraryIssueDto toDto(LibraryIssue issue) {
        LibraryIssueDto dto = new LibraryIssueDto();
        dto.setId(issue.getId());
        dto.setHeadOfficeId(issue.getHeadOfficeId());
        dto.setHeadOfficeName(resolveHeadOfficeName(issue.getHeadOfficeId()));
        dto.setSchoolId(issue.getSchoolId());
        dto.setSchoolName(resolveSchoolName(issue.getSchoolId()));
        dto.setBookId(issue.getBookId());
        dto.setBookTitle(issue.getBookTitle());
        dto.setBookCover(issue.getBookCover());
        dto.setBorrowerType(normalizeBorrowerType(issue.getBorrowerType()));
        dto.setClassId(issue.getClassId());
        dto.setClassName(issue.getClassName());
        dto.setStudentId(issue.getStudentId());
        dto.setStudentName(issue.getStudentName());
        dto.setStudentPhoto(issue.getStudentPhoto());
        dto.setEmployeeId(issue.getEmployeeId());
        dto.setEmployeeName(issue.getEmployeeName());
        dto.setEmployeePhoto(issue.getEmployeePhoto());
        dto.setEmployeeRole(issue.getEmployeeRole());
        dto.setBorrowerId(issue.getBorrowerType() != null && BORROWER_TYPE_EMPLOYEE.equalsIgnoreCase(issue.getBorrowerType())
                ? issue.getEmployeeId()
                : issue.getStudentId());
        dto.setBorrowerName(issue.getBorrowerType() != null && BORROWER_TYPE_EMPLOYEE.equalsIgnoreCase(issue.getBorrowerType())
                ? issue.getEmployeeName()
                : issue.getStudentName());
        dto.setBorrowerPhoto(issue.getBorrowerType() != null && BORROWER_TYPE_EMPLOYEE.equalsIgnoreCase(issue.getBorrowerType())
                ? issue.getEmployeePhoto()
                : issue.getStudentPhoto());
        dto.setBorrowerContext(issue.getBorrowerType() != null && BORROWER_TYPE_EMPLOYEE.equalsIgnoreCase(issue.getBorrowerType())
                ? (issue.getEmployeeRole() != null ? issue.getEmployeeRole() : issue.getEmployeeId() != null ? String.valueOf(issue.getEmployeeId()) : null)
                : (issue.getClassName() != null ? issue.getClassName() : issue.getClassId() != null ? String.valueOf(issue.getClassId()) : null));
        dto.setIssueDate(issue.getIssueDate());
        dto.setDueDate(issue.getDueDate());
        dto.setReturnDate(issue.getReturnDate());
        dto.setStatus(issue.getStatus());
        dto.setNote(issue.getNote());
        dto.setCreatedAt(issue.getCreatedAt());
        dto.setUpdatedAt(issue.getUpdatedAt());
        return dto;
    }

    private LibraryIssueDto merge(LibraryIssue issue, LibraryIssueDto dto) {
        LibraryIssueDto merged = new LibraryIssueDto();
        merged.setHeadOfficeId(issue.getHeadOfficeId());
        merged.setSchoolId(issue.getSchoolId());
        merged.setBookId(issue.getBookId());
        merged.setBorrowerType(issue.getBorrowerType());
        merged.setClassId(issue.getClassId());
        merged.setClassName(issue.getClassName());
        merged.setStudentId(issue.getStudentId());
        merged.setStudentName(issue.getStudentName());
        merged.setStudentPhoto(issue.getStudentPhoto());
        merged.setEmployeeId(issue.getEmployeeId());
        merged.setEmployeeName(issue.getEmployeeName());
        merged.setEmployeePhoto(issue.getEmployeePhoto());
        merged.setEmployeeRole(issue.getEmployeeRole());
        merged.setIssueDate(issue.getIssueDate());
        merged.setDueDate(issue.getDueDate());
        merged.setReturnDate(issue.getReturnDate());
        merged.setNote(issue.getNote());
        if (dto == null) return merged;
        if (dto.getHeadOfficeId() != null) merged.setHeadOfficeId(dto.getHeadOfficeId());
        if (dto.getSchoolId() != null) merged.setSchoolId(dto.getSchoolId());
        if (dto.getBookId() != null) merged.setBookId(dto.getBookId());
        if (dto.getBorrowerType() != null) merged.setBorrowerType(dto.getBorrowerType());
        if (dto.getClassId() != null) merged.setClassId(dto.getClassId());
        if (dto.getClassName() != null) merged.setClassName(dto.getClassName());
        if (dto.getStudentId() != null) merged.setStudentId(dto.getStudentId());
        if (dto.getStudentName() != null) merged.setStudentName(dto.getStudentName());
        if (dto.getStudentPhoto() != null) merged.setStudentPhoto(dto.getStudentPhoto());
        if (dto.getEmployeeId() != null) merged.setEmployeeId(dto.getEmployeeId());
        if (dto.getEmployeeName() != null) merged.setEmployeeName(dto.getEmployeeName());
        if (dto.getEmployeePhoto() != null) merged.setEmployeePhoto(dto.getEmployeePhoto());
        if (dto.getEmployeeRole() != null) merged.setEmployeeRole(dto.getEmployeeRole());
        if (dto.getIssueDate() != null) merged.setIssueDate(dto.getIssueDate());
        if (dto.getDueDate() != null) merged.setDueDate(dto.getDueDate());
        if (dto.getReturnDate() != null) merged.setReturnDate(dto.getReturnDate());
        if (dto.getNote() != null) merged.setNote(dto.getNote());
        return merged;
    }

    private ManageSchool requireSchool(Long schoolId) {
        if (schoolId == null) throw new BadRequestException("schoolId is required");
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId).orElseThrow(NotFoundException::new);
    }

    private Book requireBook(Long bookId) {
        if (bookId == null) throw new BadRequestException("bookId is required");
        return bookRepository.findById(bookId).orElseThrow(NotFoundException::new);
    }

    private Student requireStudent(Long studentId) {
        if (studentId == null) throw new BadRequestException("studentId is required");
        return studentRepository.findById(studentId).orElseThrow(NotFoundException::new);
    }

    private Employee requireEmployee(Long employeeId) {
        if (employeeId == null) throw new BadRequestException("employeeId is required");
        return employeeRepository.findById(employeeId).orElseThrow(NotFoundException::new);
    }

    private SchoolClass requireClass(Long classId) {
        if (classId == null) throw new BadRequestException("classId is required");
        return schoolClassRepository.findById(classId).orElseThrow(NotFoundException::new);
    }

    private void validateSchoolScope(Long requestedHeadOfficeId, ManageSchool school) {
        if (requestedHeadOfficeId != null && !Objects.equals(requestedHeadOfficeId, school.getHeadOfficeId())) {
            throw new BadRequestException("School does not belong to the selected head office");
        }
    }

    private String resolveHeadOfficeName(Long headOfficeId) {
        if (headOfficeId == null) return null;
        return headOfficeRepository.findById(headOfficeId).map(HeadOffice::getName).orElse("Head Office " + headOfficeId);
    }

    private String resolveSchoolName(Long schoolId) {
        if (schoolId == null) return null;
        return schoolRepository.findByIdAndIsDeletedFalse(schoolId).map(ManageSchool::getSchoolName).orElse("School " + schoolId);
    }

    private Long normalizeId(Long value) {
        return value == null || value <= 0 ? null : value;
    }

    private String normalizeSearch(String search) {
        String value = search == null ? "" : search.trim();
        return value.isEmpty() ? null : value;
    }

    private String normalizeOptional(String value) {
        String trimmed = value == null ? "" : value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeBorrowerType(String value) {
        String normalized = normalizeOptional(value);
        if (normalized == null) return null;
        if (BORROWER_TYPE_STUDENT.equalsIgnoreCase(normalized)) return BORROWER_TYPE_STUDENT;
        if (BORROWER_TYPE_EMPLOYEE.equalsIgnoreCase(normalized)) return BORROWER_TYPE_EMPLOYEE;
        return normalized.toUpperCase();
    }

    private boolean equalsIgnoreCase(String a, String b) {
        if (a == null || b == null) return false;
        return a.trim().equalsIgnoreCase(b.trim());
    }

    private Long requiredId(Long value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }

    private void adjustBookQuantity(Book book, int delta) {
        Integer current = book.getQuantity();
        int next = (current == null ? 0 : current) + delta;
        if (next < 0) {
            throw new BadRequestException("No available quantity for the selected book");
        }
        book.setQuantity(next);
        bookRepository.save(book);
    }

    private LocalDate requiredDate(LocalDate value, String message) {
        if (value == null) throw new BadRequestException(message);
        return value;
    }

    private LocalDate normalizeDate(LocalDate value) {
        return value;
    }

    private record ResolvedScope(Long headOfficeId, Long schoolId) {
    }

    private record ResolvedWriteScope(
            Long headOfficeId,
            Long schoolId,
            Book book,
            String borrowerType,
            SchoolClass schoolClass,
            Student student,
            Employee employee,
            LocalDate issueDate,
            LocalDate dueDate,
            LocalDate returnDate
    ) {
    }
}
