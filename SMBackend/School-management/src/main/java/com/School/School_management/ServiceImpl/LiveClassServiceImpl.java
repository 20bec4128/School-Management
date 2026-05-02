package com.School.School_management.ServiceImpl;

import com.School.School_management.Dto.LiveClassRequestDto;
import com.School.School_management.Dto.LiveClassResponseDto;
import com.School.School_management.Dto.LiveClassEndResponseDto;
import com.School.School_management.Dto.LiveClassJoinResponseDto;
import com.School.School_management.Dto.LiveClassStartResponseDto;
import com.School.School_management.Entity.LiveClass;
import com.School.School_management.Entity.ManageSchool;
import com.School.School_management.Entity.ManageTeacher;
import com.School.School_management.Entity.MeetingParticipant;
import com.School.School_management.Entity.Notification;
import com.School.School_management.Entity.SchoolClass;
import com.School.School_management.Entity.SchoolSection;
import com.School.School_management.Entity.Student;
import com.School.School_management.Entity.Subject;
import com.School.School_management.Exception.ForbiddenException;
import com.School.School_management.Exception.NotFoundException;
import com.School.School_management.Repository.LiveClassRepository;
import com.School.School_management.Repository.MeetingParticipantRepository;
import com.School.School_management.Repository.NotificationRepository;
import com.School.School_management.Repository.ParentStudentRepository;
import com.School.School_management.Repository.SchoolClassRepository;
import com.School.School_management.Repository.SchoolRepository;
import com.School.School_management.Repository.SchoolSectionRepository;
import com.School.School_management.Repository.StudentRepository;
import com.School.School_management.Repository.SubjectRepository;
import com.School.School_management.Repository.TeacherRepository;
import com.School.School_management.Service.LiveClassService;
import com.School.School_management.auth.CurrentUser;
import com.School.School_management.auth.CurrentUserHolder;
import com.School.School_management.livekit.LiveKitProperties;
import com.School.School_management.livekit.LiveKitTokenService;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class LiveClassServiceImpl implements LiveClassService {

    private final LiveClassRepository liveClassRepository;
    private final NotificationRepository notificationRepository;
    private final SchoolRepository schoolRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final SchoolSectionRepository schoolSectionRepository;
    private final SubjectRepository subjectRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final ParentStudentRepository parentStudentRepository;
    private final MeetingParticipantRepository meetingParticipantRepository;
    private final LiveKitTokenService liveKitTokenService;
    private final LiveKitProperties liveKitProperties;

    public LiveClassServiceImpl(
            LiveClassRepository liveClassRepository,
            NotificationRepository notificationRepository,
            SchoolRepository schoolRepository,
            SchoolClassRepository schoolClassRepository,
            SchoolSectionRepository schoolSectionRepository,
            SubjectRepository subjectRepository,
            TeacherRepository teacherRepository,
            StudentRepository studentRepository,
            ParentStudentRepository parentStudentRepository,
            MeetingParticipantRepository meetingParticipantRepository,
            LiveKitTokenService liveKitTokenService,
            LiveKitProperties liveKitProperties
    ) {
        this.liveClassRepository = liveClassRepository;
        this.notificationRepository = notificationRepository;
        this.schoolRepository = schoolRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.schoolSectionRepository = schoolSectionRepository;
        this.subjectRepository = subjectRepository;
        this.teacherRepository = teacherRepository;
        this.studentRepository = studentRepository;
        this.parentStudentRepository = parentStudentRepository;
        this.meetingParticipantRepository = meetingParticipantRepository;
        this.liveKitTokenService = liveKitTokenService;
        this.liveKitProperties = liveKitProperties;
    }

    @Override
    @Transactional
    public List<LiveClassResponseDto> getAll() {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        List<LiveClass> list;
        if (user.isSuperAdmin()) {
            list = liveClassRepository.findAllByOrderByClassDateDescStartTimeDesc();
        } else if (user.adminId() != null) {
            if (user.schoolId() == null) {
                list = liveClassRepository.findAllByOrderByClassDateDescStartTimeDesc();
            } else {
                list = liveClassRepository.findAllBySchool_IdOrderByClassDateDescStartTimeDesc(user.schoolId());
            }
        } else if (user.isRole("TEACHER")) {
            list = liveClassRepository.findAllByTeacher_IdOrderByClassDateDescStartTimeDesc(user.teacherId());
        } else if (user.isRole("STUDENT")) {
            Student s = studentRepository.findById(user.studentId()).orElseThrow(NotFoundException::new);
            if (s.getSchoolClass() == null || s.getSchoolSection() == null) return List.of();
            list = liveClassRepository.findAllBySchoolClass_IdAndSection_IdOrderByClassDateDescStartTimeDesc(
                    s.getSchoolClass().getId(),
                    s.getSchoolSection().getId()
            );
        } else if (user.isRole("PARENT")) {
            Set<String> classSectionKeys = parentStudentRepository.findStudentIdsByParentId(user.parentId()).stream()
                    .map(studentRepository::findById)
                    .flatMap(Optional::stream)
                    .filter(s -> s.getSchoolClass() != null && s.getSchoolSection() != null)
                    .map(s -> s.getSchoolClass().getId() + ":" + s.getSchoolSection().getId())
                    .collect(Collectors.toSet());
            list = classSectionKeys.stream()
                    .flatMap(key -> {
                        String[] parts = key.split(":");
                        Long classId = Long.valueOf(parts[0]);
                        Long sectionId = Long.valueOf(parts[1]);
                        return liveClassRepository.findAllBySchoolClass_IdAndSection_IdOrderByClassDateDescStartTimeDesc(classId, sectionId).stream();
                    })
                    .distinct()
                    .toList();
        } else {
            list = List.of();
        }

        return list.stream().map(this::map).toList();
    }

    @Override
    @Transactional
    public LiveClassResponseDto getById(Long id) {
        LiveClass lc = findLiveClass(id);
        ensureCanAccess(lc);
        return map(lc);
    }

    @Override
    @Transactional
    public List<LiveClassResponseDto> getForStudent(Long classId, Long sectionId) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isRole("STUDENT")) {
            Student s = studentRepository.findById(user.studentId()).orElseThrow(NotFoundException::new);
            if (s.getSchoolClass() == null || s.getSchoolSection() == null) return List.of();
            classId = s.getSchoolClass().getId();
            sectionId = s.getSchoolSection().getId();
        }
        return liveClassRepository
                .findAllBySchoolClass_IdAndSection_IdOrderByClassDateDescStartTimeDesc(classId, sectionId)
                .stream()
                .map(this::map)
                .toList();
    }

    @Override
    @Transactional
    public LiveClassResponseDto create(LiveClassRequestDto dto) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isSchoolScoped()) {
            dto.setSchoolId(user.schoolId());
        }
        if (user.isRole("TEACHER")) {
            if (dto.getTeacherId() == null || !Objects.equals(dto.getTeacherId(), user.teacherId())) {
                throw new ForbiddenException();
            }
        }
        validate(dto, null);
        LiveClass liveClass = new LiveClass();
        copy(dto, liveClass);
        LiveClass saved = liveClassRepository.save(liveClass);
        LiveClassResponseDto response = map(saved);
        if (Boolean.TRUE.equals(dto.getSendNotification())) {
            response.setNotificationsCreated(createStudentNotifications(saved));
        }
        return response;
    }

    @Override
    @Transactional
    public LiveClassResponseDto update(Long id, LiveClassRequestDto dto) {
        LiveClass liveClass = findLiveClass(id);
        ensureCanAccess(liveClass);
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isSchoolScoped()) {
            dto.setSchoolId(user.schoolId());
        }
        if (user.isRole("TEACHER")) {
            if (dto.getTeacherId() == null || !Objects.equals(dto.getTeacherId(), user.teacherId())) {
                throw new ForbiddenException();
            }
        }
        validate(dto, id);
        copy(dto, liveClass);
        return map(liveClassRepository.save(liveClass));
    }

    @Override
    public void delete(Long id) {
        LiveClass lc = findLiveClass(id);
        ensureCanAccess(lc);
        liveClassRepository.deleteById(id);
    }

    @Override
    @Transactional
    public LiveClassStartResponseDto start(Long id) {
        LiveClass lc = findLiveClass(id);
        ensureCanManage(lc);

        String status = normalizeStatus(lc.getStatus());
        if ("ENDED".equals(status)) {
            throw new IllegalArgumentException("Live class already ended");
        }
        if (!"LIVE".equals(status)) {
            lc.setStatus("LIVE");
        }
        if (lc.getRoomName() == null || lc.getRoomName().isBlank()) {
            lc.setRoomName(generateRoomName(lc));
        }
        if (lc.getStartedAt() == null) {
            lc.setStartedAt(LocalDateTime.now());
        }

        LiveClass saved = liveClassRepository.save(lc);

        LiveClassStartResponseDto dto = new LiveClassStartResponseDto();
        dto.setId(saved.getId());
        dto.setRoomName(saved.getRoomName());
        dto.setStatus(saved.getStatus());
        dto.setStartedAt(saved.getStartedAt());
        dto.setNotificationsCreated(createLiveStartedNotifications(saved));
        return dto;
    }

    @Override
    @Transactional
    public LiveClassJoinResponseDto join(Long id) {
        LiveClass lc = findLiveClass(id);
        ensureCanAccess(lc);

        String status = normalizeStatus(lc.getStatus());
        if (!"LIVE".equals(status)) {
            throw new IllegalArgumentException("Live class is not LIVE");
        }
        if (lc.getRoomName() == null || lc.getRoomName().isBlank()) {
            throw new IllegalArgumentException("Room not created yet. Teacher must start the live class.");
        }

        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        JoinIdentity joinIdentity = buildJoinIdentity(user);

        // mark any previous active session as left to prevent duplicates
        meetingParticipantRepository.findActiveSession(lc.getId(), joinIdentity.userId())
                .ifPresent(mp -> {
                    mp.markLeft(LocalDateTime.now());
                    meetingParticipantRepository.save(mp);
                });

        MeetingParticipant participant = new MeetingParticipant();
        participant.setLiveClass(lc);
        participant.setUserId(joinIdentity.userId());
        participant.setRole(joinIdentity.roleName());
        participant.setJoinTime(LocalDateTime.now());
        meetingParticipantRepository.save(participant);

        String token = switch (joinIdentity.roleName()) {
            case "TEACHER" -> liveKitTokenService.createTeacherToken(joinIdentity.identity(), joinIdentity.participantName(), lc.getRoomName());
            case "STUDENT" -> liveKitTokenService.createStudentToken(joinIdentity.identity(), joinIdentity.participantName(), lc.getRoomName(), false);
            case "PARENT" -> liveKitTokenService.createViewerToken(joinIdentity.identity(), joinIdentity.participantName(), lc.getRoomName());
            default -> liveKitTokenService.createViewerToken(joinIdentity.identity(), joinIdentity.participantName(), lc.getRoomName());
        };

        LiveClassJoinResponseDto dto = new LiveClassJoinResponseDto();
        dto.setLiveClassId(lc.getId());
        dto.setRoomName(lc.getRoomName());
        dto.setWsUrl(liveKitProperties.wsUrl());
        dto.setToken(token);
        dto.setIdentity(joinIdentity.identity());
        dto.setParticipantName(joinIdentity.participantName());
        dto.setRole(joinIdentity.roleName());
        return dto;
    }

    @Override
    @Transactional
    public void leave(Long id) {
        LiveClass lc = findLiveClass(id);
        ensureCanAccess(lc);
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();

        JoinIdentity joinIdentity = buildJoinIdentity(user);
        meetingParticipantRepository.findActiveSession(lc.getId(), joinIdentity.userId())
                .ifPresent(mp -> {
                    mp.markLeft(LocalDateTime.now());
                    meetingParticipantRepository.save(mp);
                });
    }

    @Override
    @Transactional
    public LiveClassEndResponseDto end(Long id) {
        LiveClass lc = findLiveClass(id);
        ensureCanManage(lc);

        String status = normalizeStatus(lc.getStatus());
        if ("ENDED".equals(status)) {
            LiveClassEndResponseDto dto = new LiveClassEndResponseDto();
            dto.setId(lc.getId());
            dto.setStatus(lc.getStatus());
            dto.setEndedAt(lc.getEndedAt());
            return dto;
        }

        lc.setStatus("ENDED");
        if (lc.getEndedAt() == null) {
            lc.setEndedAt(LocalDateTime.now());
        }
        LiveClass saved = liveClassRepository.save(lc);

        LiveClassEndResponseDto dto = new LiveClassEndResponseDto();
        dto.setId(saved.getId());
        dto.setStatus(saved.getStatus());
        dto.setEndedAt(saved.getEndedAt());
        return dto;
    }

    private void validate(LiveClassRequestDto dto, Long excludeId) {
        if (dto == null) throw new IllegalArgumentException("Live class data is required");
        if (dto.getSchoolId() == null) throw new IllegalArgumentException("School is required");
        if (dto.getClassId() == null) throw new IllegalArgumentException("Class is required");
        if (dto.getSectionId() == null) throw new IllegalArgumentException("Section is required");
        if (dto.getSubjectId() == null) throw new IllegalArgumentException("Subject is required");
        if (dto.getTeacherId() == null) throw new IllegalArgumentException("Teacher is required");
        if (isBlank(dto.getLiveClassType())) throw new IllegalArgumentException("Live class type is required");
        if (dto.getClassDate() == null) throw new IllegalArgumentException("Class date is required");
        if (dto.getStartTime() == null) throw new IllegalArgumentException("Start time is required");
        if (dto.getEndTime() == null) throw new IllegalArgumentException("End time is required");
        if (!dto.getEndTime().isAfter(dto.getStartTime())) {
            throw new IllegalArgumentException("End time must be after start time");
        }
        if (requiresMeetingLink(dto.getLiveClassType()) && isBlank(resolveMeetingLink(dto))) {
            throw new IllegalArgumentException("Meeting link is required for this live class type");
        }
        if (liveClassRepository.existsTeacherOverlap(
                dto.getTeacherId(), dto.getClassDate(), dto.getStartTime(), dto.getEndTime(), excludeId)) {
            throw new IllegalArgumentException("Teacher already has a live class during this time");
        }
        if (liveClassRepository.existsClassSectionOverlap(
                dto.getClassId(), dto.getSectionId(), dto.getClassDate(), dto.getStartTime(), dto.getEndTime(), excludeId)) {
            throw new IllegalArgumentException("Class and section already have a live class during this time");
        }
    }

    private void copy(LiveClassRequestDto dto, LiveClass liveClass) {
        ManageSchool school = schoolRepository.findById(dto.getSchoolId())
                .orElseThrow(() -> new IllegalArgumentException("School not found"));
        SchoolClass schoolClass = schoolClassRepository.findById(dto.getClassId())
                .orElseThrow(() -> new IllegalArgumentException("Class not found"));
        SchoolSection section = schoolSectionRepository.findById(dto.getSectionId())
                .orElseThrow(() -> new IllegalArgumentException("Section not found"));
        Subject subject = subjectRepository.findById(dto.getSubjectId())
                .orElseThrow(() -> new IllegalArgumentException("Subject not found"));
        ManageTeacher teacher = teacherRepository.findById(dto.getTeacherId())
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found"));

        liveClass.setSchool(school);
        liveClass.setSchoolClass(schoolClass);
        liveClass.setSection(section);
        liveClass.setSubject(subject);
        liveClass.setTeacher(teacher);
        liveClass.setLiveClassType(dto.getLiveClassType());
        liveClass.setMeetingLink(resolveMeetingLink(dto));
        liveClass.setClassDate(dto.getClassDate());
        liveClass.setStartTime(dto.getStartTime());
        liveClass.setEndTime(dto.getEndTime());
        liveClass.setNote(dto.getNote());
        liveClass.setStatus(isBlank(dto.getStatus()) ? "Scheduled" : dto.getStatus());
    }

    private int createStudentNotifications(LiveClass liveClass) {
        List<Student> students = studentRepository.findAllBySchoolClass_IdAndSchoolSection_IdAndDeletedFalse(
                liveClass.getSchoolClass().getId(),
                liveClass.getSection().getId()
        );
        List<Notification> notifications = students.stream().map(student -> {
            Notification notification = new Notification();
            notification.setTitle("New Live Class Scheduled");
            notification.setMessage("Join meeting for " + liveClass.getSubject().getName()
                    + " on " + liveClass.getClassDate()
                    + " at " + liveClass.getStartTime());
            notification.setType("LIVE_CLASS");
            notification.setReferenceId(liveClass.getId());
            notification.setStudent(student);
            notification.setTargetRole("STUDENT");
            notification.setRead(false);
            return notification;
        }).toList();
        notificationRepository.saveAll(notifications);
        return notifications.size();
    }

    private LiveClass findLiveClass(Long id) {
        return liveClassRepository.findById(id)
                .orElseThrow(NotFoundException::new);
    }

    private void ensureCanAccess(LiveClass liveClass) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin()) return;
        if (user.adminId() != null) {
            if (user.schoolId() == null) return;
            if (!user.schoolId().equals(liveClass.getSchool().getId())) throw new NotFoundException();
            return;
        }
        if (user.isRole("TEACHER")) {
            if (!Objects.equals(user.teacherId(), liveClass.getTeacher().getId())) throw new NotFoundException();
            return;
        }
        if (user.isRole("STUDENT")) {
            Student s = studentRepository.findById(user.studentId()).orElseThrow(NotFoundException::new);
            if (s.getSchoolClass() == null || s.getSchoolSection() == null) throw new NotFoundException();
            boolean ok = Objects.equals(s.getSchoolClass().getId(), liveClass.getSchoolClass().getId())
                    && Objects.equals(s.getSchoolSection().getId(), liveClass.getSection().getId());
            if (!ok) throw new NotFoundException();
            return;
        }
        if (user.isRole("PARENT")) {
            List<Long> studentIds = parentStudentRepository.findStudentIdsByParentId(user.parentId());
            if (studentIds == null || studentIds.isEmpty()) throw new NotFoundException();

            List<Student> students = studentRepository.findAllById(studentIds).stream()
                    .filter(s -> !Boolean.TRUE.equals(s.getDeleted()))
                    .toList();

            boolean ok = students.stream().anyMatch(s ->
                    s.getSchoolClass() != null
                            && s.getSchoolSection() != null
                            && Objects.equals(s.getSchoolClass().getId(), liveClass.getSchoolClass().getId())
                            && Objects.equals(s.getSchoolSection().getId(), liveClass.getSection().getId())
            );
            if (!ok) throw new NotFoundException();
            return;
        }
        throw new ForbiddenException();
    }

    private void ensureCanManage(LiveClass liveClass) {
        CurrentUser user = CurrentUserHolder.get();
        if (user == null) throw new ForbiddenException();
        if (user.isSuperAdmin()) return;
        if (user.adminId() != null) {
            if (user.schoolId() == null) return;
            if (!user.schoolId().equals(liveClass.getSchool().getId())) throw new NotFoundException();
            return;
        }
        if (user.isRole("TEACHER")) {
            if (!Objects.equals(user.teacherId(), liveClass.getTeacher().getId())) throw new NotFoundException();
            return;
        }
        throw new ForbiddenException();
    }

    private LiveClassResponseDto map(LiveClass liveClass) {
        LiveClassResponseDto dto = new LiveClassResponseDto();
        dto.setId(liveClass.getId());
        dto.setSchoolId(liveClass.getSchool().getId());
        dto.setSchoolName(liveClass.getSchool().getSchoolName());
        dto.setClassId(liveClass.getSchoolClass().getId());
        dto.setClassName(liveClass.getSchoolClass().getClassName());
        dto.setSectionId(liveClass.getSection().getId());
        dto.setSectionName(liveClass.getSection().getName());
        dto.setSubjectId(liveClass.getSubject().getId());
        dto.setSubjectName(liveClass.getSubject().getName());
        dto.setTeacherId(liveClass.getTeacher().getId());
        dto.setTeacherName(liveClass.getTeacher().getName());
        dto.setLiveClassType(liveClass.getLiveClassType());
        dto.setMeetingLink(liveClass.getMeetingLink());
        dto.setRoomName(liveClass.getRoomName());
        dto.setClassDate(liveClass.getClassDate());
        dto.setStartTime(liveClass.getStartTime());
        dto.setEndTime(liveClass.getEndTime());
        dto.setNote(liveClass.getNote());
        dto.setStatus(liveClass.getStatus());
        dto.setStartedAt(liveClass.getStartedAt());
        dto.setEndedAt(liveClass.getEndedAt());
        dto.setCreatedAt(liveClass.getCreatedAt());
        dto.setUpdatedAt(liveClass.getUpdatedAt());
        return dto;
    }

    private String normalizeStatus(String status) {
        if (status == null) return "SCHEDULED";
        String s = status.trim();
        if (s.isEmpty()) return "SCHEDULED";
        if (s.equalsIgnoreCase("Scheduled")) return "SCHEDULED";
        return s.toUpperCase(Locale.ROOT);
    }

    private String generateRoomName(LiveClass lc) {
        // Keep deterministic + human-readable; safe chars only.
        return "school-" + lc.getSchool().getId()
                + "-class-" + lc.getSchoolClass().getId()
                + "-section-" + lc.getSection().getId()
                + "-liveclass-" + lc.getId();
    }

    private int createLiveStartedNotifications(LiveClass liveClass) {
        List<Student> students = studentRepository.findAllBySchoolClass_IdAndSchoolSection_IdAndDeletedFalse(
                liveClass.getSchoolClass().getId(),
                liveClass.getSection().getId()
        );
        List<Notification> notifications = students.stream().map(student -> {
            Notification notification = new Notification();
            notification.setTitle("Live Class Started");
            notification.setMessage("Live class for " + liveClass.getSubject().getName() + " has started.");
            notification.setType("LIVE_CLASS_STARTED");
            notification.setReferenceId(liveClass.getId());
            notification.setStudent(student);
            notification.setTargetRole("STUDENT");
            notification.setRead(false);
            return notification;
        }).toList();
        notificationRepository.saveAll(notifications);
        return notifications.size();
    }

    private record JoinIdentity(Long userId, String roleName, String identity, String participantName) {}

    private JoinIdentity buildJoinIdentity(CurrentUser user) {
        if (user.isRole("TEACHER")) {
            return new JoinIdentity(user.teacherId(), "TEACHER", "teacher:" + user.teacherId(), user.username());
        }
        if (user.isRole("STUDENT")) {
            return new JoinIdentity(user.studentId(), "STUDENT", "student:" + user.studentId(), user.username());
        }
        if (user.isRole("PARENT")) {
            return new JoinIdentity(user.parentId(), "PARENT", "parent:" + user.parentId(), user.username());
        }
        if (user.adminId() != null) {
            return new JoinIdentity(user.adminId(), user.role().toUpperCase(Locale.ROOT), "admin:" + user.adminId(), user.username());
        }
        return new JoinIdentity(0L, user.role() == null ? "USER" : user.role().toUpperCase(Locale.ROOT), "user:" + user.username(), user.username());
    }

    private String resolveMeetingLink(LiveClassRequestDto dto) {
        if (!isBlank(dto.getMeetingLink())) return dto.getMeetingLink().trim();
        if (!isBlank(dto.getMeetingRoomUrl())) return dto.getMeetingRoomUrl().trim();
        return null;
    }

    private boolean requiresMeetingLink(String liveClassType) {
        if (liveClassType == null) return false;
        String normalized = liveClassType.trim().toLowerCase();
        return normalized.equals("custom link")
                || normalized.equals("zoom")
                || normalized.equals("google meet")
                || normalized.equals("teams")
                || normalized.equals("microsoft teams");
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
