package com.School.School_management.Dto;

// ── Request DTO (Add / Update) ────────────────────────────────────────────────
public class StudentTypeDto {

    public static class Request {

        private Long schoolId;

        private String studentType;

        private String note;

        public Request() {
        }

        public Request(Long schoolId, String studentType, String note) {
            this.schoolId = schoolId;
            this.studentType = studentType;
            this.note = note;
        }

        public Long getSchoolId() {
            return schoolId;
        }

        public void setSchoolId(Long schoolId) {
            this.schoolId = schoolId;
        }

        public String getStudentType() {
            return studentType;
        }

        public void setStudentType(String studentType) {
            this.studentType = studentType;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }

        public static RequestBuilder builder() {
            return new RequestBuilder();
        }

        public static class RequestBuilder {
            private Long schoolId;
            private String studentType;
            private String note;

            public RequestBuilder schoolId(Long schoolId) {
                this.schoolId = schoolId;
                return this;
            }

            public RequestBuilder studentType(String studentType) {
                this.studentType = studentType;
                return this;
            }

            public RequestBuilder note(String note) {
                this.note = note;
                return this;
            }

            public Request build() {
                Request request = new Request();
                request.setSchoolId(this.schoolId);
                request.setStudentType(this.studentType);
                request.setNote(this.note);
                return request;
            }
        }
    }

    // ── Response DTO ──────────────────────────────────────────────────────────
    public static class Response {

        private Long id;

        private Long schoolId;

        private String schoolName;

        private String studentType;

        private String note;

        public Response() {
        }

        public Response(Long id, Long schoolId, String schoolName, String studentType, String note) {
            this.id = id;
            this.schoolId = schoolId;
            this.schoolName = schoolName;
            this.studentType = studentType;
            this.note = note;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public Long getSchoolId() {
            return schoolId;
        }

        public void setSchoolId(Long schoolId) {
            this.schoolId = schoolId;
        }

        public String getSchoolName() {
            return schoolName;
        }

        public void setSchoolName(String schoolName) {
            this.schoolName = schoolName;
        }

        public String getStudentType() {
            return studentType;
        }

        public void setStudentType(String studentType) {
            this.studentType = studentType;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }

        public static ResponseBuilder builder() {
            return new ResponseBuilder();
        }

        public static class ResponseBuilder {
            private Long id;
            private Long schoolId;
            private String schoolName;
            private String studentType;
            private String note;

            public ResponseBuilder id(Long id) {
                this.id = id;
                return this;
            }

            public ResponseBuilder schoolId(Long schoolId) {
                this.schoolId = schoolId;
                return this;
            }

            public ResponseBuilder schoolName(String schoolName) {
                this.schoolName = schoolName;
                return this;
            }

            public ResponseBuilder studentType(String studentType) {
                this.studentType = studentType;
                return this;
            }

            public ResponseBuilder note(String note) {
                this.note = note;
                return this;
            }

            public Response build() {
                Response response = new Response();
                response.setId(this.id);
                response.setSchoolId(this.schoolId);
                response.setSchoolName(this.schoolName);
                response.setStudentType(this.studentType);
                response.setNote(this.note);
                return response;
            }
        }
    }
}
