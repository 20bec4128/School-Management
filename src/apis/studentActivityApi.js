import { apiFetch } from './apiClient'

const STUDENT_ACTIVITY_API_BASE = '/api/student-activities'

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

export const fetchStudentActivitiesPage = async (page, size, filters = {}) => {
    const params = new URLSearchParams({
        page: String(Math.max(page, 0)),
        size: String(size),
    });
    
    if (filters.headOfficeId) params.append('headOfficeId', filters.headOfficeId);
    if (filters.schoolId && filters.schoolId !== 'Select' && filters.schoolId !== 'All') params.append('schoolId', filters.schoolId);
    if (filters.className && filters.className !== 'Select') params.append('className', filters.className);
    if (filters.section && filters.section !== 'Select') params.append('section', filters.section);
    
    const res = await apiFetch(`${STUDENT_ACTIVITY_API_BASE}?${params.toString()}`, {
        headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
};

export const createStudentActivity = async (payload) => {
    const res = await apiFetch(STUDENT_ACTIVITY_API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
};

export const updateStudentActivity = async (id, payload) => {
    const res = await apiFetch(`${STUDENT_ACTIVITY_API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.json();
};

export const deleteStudentActivity = async (id) => {
    const res = await apiFetch(`${STUDENT_ACTIVITY_API_BASE}/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await readApiError(res));
    return res.text();
};
