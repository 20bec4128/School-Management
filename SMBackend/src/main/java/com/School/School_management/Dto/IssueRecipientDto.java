package com.School.School_management.Dto;

public class IssueRecipientDto {
    private Long id;
    private String name;
    private String role;
    private String source;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
}
