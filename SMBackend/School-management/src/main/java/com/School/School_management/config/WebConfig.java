package com.School.School_management.config;

import com.School.School_management.auth.JwtAuthInterceptor;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  private final String uploadDir;
  private final JwtAuthInterceptor jwtAuthInterceptor;

  public WebConfig(UploadProperties uploadProperties, JwtAuthInterceptor jwtAuthInterceptor) {
    this.uploadDir = uploadProperties.getDir();
    this.jwtAuthInterceptor = jwtAuthInterceptor;
  }

  @Override
  public void addInterceptors(InterceptorRegistry registry) {
    registry
        .addInterceptor(jwtAuthInterceptor)
        .addPathPatterns("/api/**")
        .excludePathPatterns("/api/auth/**");
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
        .allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true)
        .maxAge(3600);

    registry
        .addMapping("/uploads/**")
        .allowedOriginPatterns("http://localhost:*", "http://127.0.0.1:*")
        .allowedMethods("GET", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true)
        .maxAge(3600);
  }
}

