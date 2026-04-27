// apis/studentsApi.js
const STUDENTS_API_BASE = 'http://localhost:8081/api/students';

const readApiError = async (res) => {
    try {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            const data = await res.json();
            if (data?.message) return String(data.message);
            return `Request failed (${res.status})`;
        }
        const text = await res.text();
        return text || `Request failed (${res.status})`;
    } catch {
        return `Request failed (${res.status})`;
    }
};

export const fetchStudentsPage = async (page, size, filters = {}) => {
    const params = new URLSearchParams({
        page: String(Math.max(page, 0)),
        size: String(size),
    });
    
    if (filters.schoolId) params.append('schoolId', filters.schoolId);
    if (filters.className && filters.className !== 'Select') params.append('className', filters.className);
    if (filters.section && filters.section !== 'Select') params.append('section', filters.section);
    if (filters.group && filters.group !== 'Select') params.append('group', filters.group);
    
    const res = await fetch(`${STUDENTS_API_BASE}?${params.toString()}`, {
        headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
};

export const createStudent = async (payload) => {
    const res = await fetch(STUDENTS_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
};

export const updateStudent = async (studentId, payload) => {
    const res = await fetch(`${STUDENTS_API_BASE}/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
};

export const deleteStudent = async (studentId) => {
    const res = await fetch(`${STUDENTS_API_BASE}/${studentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.text();
};

export const fetchStudentsByClassSection = async (schoolId, className, section) => {
    const params = new URLSearchParams({
        schoolId: String(schoolId),
        className,
        section,
    });
    const res = await fetch(`${STUDENTS_API_BASE}?${params.toString()}`, {
        headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(await readApiError(res));
    const data = await res.json();
    return Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
};