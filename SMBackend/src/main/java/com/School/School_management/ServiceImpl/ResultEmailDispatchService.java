package com.School.School_management.ServiceImpl;

import com.School.School_management.Entity.EmailSetting;
import com.School.School_management.Entity.ResultEmail;
import com.School.School_management.Repository.EmailSettingRepository;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class ResultEmailDispatchService {

    @Autowired
    private EmailSettingRepository emailSettingRepository;

    @Async
    public void sendAsync(ResultEmail entity) {
        sendEmail(entity);
    }

    private void sendEmail(ResultEmail entity) {
        EmailSetting setting = emailSettingRepository.findByScope(entity.getHeadOfficeId(), entity.getSchoolId())
                .stream()
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Email setting not found for the selected school."));

        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(setting.getSmtpHost());
        mailSender.setPort(setting.getSmtpPort() != null ? setting.getSmtpPort() : 587);
        mailSender.setUsername(setting.getSmtpUsername());
        mailSender.setPassword(setting.getSmtpPassword());
        mailSender.setDefaultEncoding(StandardCharsets.UTF_8.name());

        var props = mailSender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", isTls(setting.getSmtpSecurity()));
        props.put("mail.smtp.ssl.enable", isSsl(setting.getSmtpSecurity()));
        props.put("mail.smtp.timeout", String.valueOf(setting.getSmtpTimeout() != null ? setting.getSmtpTimeout() * 1000 : 10000));
        props.put("mail.smtp.connectiontimeout", String.valueOf(setting.getSmtpTimeout() != null ? setting.getSmtpTimeout() * 1000 : 10000));

        MimeMessage message = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(setting.getFromEmail(), setting.getFromName());
            helper.setTo(entity.getReceiver());
            helper.setSubject(entity.getSubject());
            helper.setText(entity.getEmailBody(), false);
            mailSender.send(message);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Failed to send result email: " + ex.getMessage(), ex);
        }
    }

    private boolean isTls(String security) {
        if (security == null) return true;
        String normalized = security.trim().toLowerCase();
        return normalized.contains("tls") || normalized.contains("starttls");
    }

    private boolean isSsl(String security) {
        if (security == null) return false;
        return security.trim().toLowerCase().contains("ssl");
    }
}
