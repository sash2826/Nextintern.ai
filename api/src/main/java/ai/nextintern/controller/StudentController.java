package ai.nextintern.controller;

import ai.nextintern.dto.StudentProfileResponse;
import ai.nextintern.dto.UpdateProfileRequest;
import ai.nextintern.service.StudentProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/students")
public class StudentController {

    private final StudentProfileService profileService;

    public StudentController(StudentProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/profile")
    public ResponseEntity<StudentProfileResponse> getProfile(@AuthenticationPrincipal UUID userId) {
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @PutMapping("/profile")
    public ResponseEntity<StudentProfileResponse> updateProfile(
            @AuthenticationPrincipal UUID userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(userId, request));
    }

    @GetMapping("/profile/completeness")
    public ResponseEntity<java.util.Map<String, Integer>> getCompleteness(
            @AuthenticationPrincipal UUID userId) {
        StudentProfileResponse profile = profileService.getProfile(userId);
        return ResponseEntity.ok(java.util.Map.of("completeness", profile.profileCompleteness()));
    }
}
