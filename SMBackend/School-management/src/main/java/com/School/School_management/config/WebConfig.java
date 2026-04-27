package com.School.School_management.config;

import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  private final String uploadDir;

  public WebConfig(UploadProperties uploadProperties) {
    this.uploadDir = uploadProperties.getDir();
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    Path dir = Paths.get(uploadDir).toAbsolutePath().normalize();
    String location = dir.toUri().toString();
    registry.addResourceHandler("/uploads/**").addResourceLocations(location);
  }

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry
        .addMapping("/api/**")
        .allowedOrigins("http://localhost:5173", "http://localhost:3000")
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true)
        .maxAge(3600);

    registry
        .addMapping("/uploads/**")
        .allowedOrigins("http://localhost:5173", "http://localhost:3000")
        .allowedMethods("GET", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true)
        .maxAge(3600);
  }
}

