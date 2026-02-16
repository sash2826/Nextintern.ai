package ai.nextintern.service;

import ai.nextintern.dto.StudentProfileResponse;
import ai.nextintern.dto.UpdateProfileRequest;
import ai.nextintern.entity.*;
import ai.nextintern.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class StudentProfileService {

    private final StudentProfileRepository profileRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;

    public StudentProfileService(StudentProfileRepository profileRepository,
            UserRepository userRepository,
            SkillRepository skillRepository) {
        this.profileRepository = profileRepository;
        this.userRepository = userRepository;
        this.skillRepository = skillRepository;
    }

    @Transactional(readOnly = true)
    public StudentProfileResponse getProfile(UUID userId) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Profile not found"));
        User user = profile.getUser();
        return toResponse(profile, user);
    }

    @Transactional
    public StudentProfileResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new NoSuchElementException("Profile not found"));

        // Update basic fields
        if (request.educationLevel() != null)
            profile.setEducationLevel(request.educationLevel());
        if (request.university() != null)
            profile.setUniversity(request.university());
        if (request.graduationYear() != null)
            profile.setGraduationYear(request.graduationYear());
        if (request.locationCity() != null)
            profile.setLocationCity(request.locationCity());
        if (request.locationState() != null)
            profile.setLocationState(request.locationState());
        if (request.locationCountry() != null)
            profile.setLocationCountry(request.locationCountry());
        if (request.interests() != null)
            profile.setInterests(request.interests().toArray(new String[0]));
        if (request.bio() != null)
            profile.setBio(request.bio());

        // Update skills
        if (request.skills() != null) {
            profile.getSkills().clear();
            for (UpdateProfileRequest.SkillInput si : request.skills()) {
                Skill skill = skillRepository.findByNameIgnoreCase(si.name())
                        .orElseGet(() -> {
                            Skill s = Skill.builder().name(si.name()).build();
                            return skillRepository.save(s);
                        });
                StudentSkill ss = StudentSkill.builder()
                        .studentProfile(profile)
                        .skill(skill)
                        .proficiency((short) si.proficiency())
                        .build();
                profile.getSkills().add(ss);
            }
        }

        profileRepository.save(profile);
        return toResponse(profile, profile.getUser());
    }

    private StudentProfileResponse toResponse(StudentProfile profile, User user) {
        List<StudentProfileResponse.SkillInfo> skillInfos = profile.getSkills().stream()
                .map(ss -> new StudentProfileResponse.SkillInfo(
                        ss.getSkill().getId(),
                        ss.getSkill().getName(),
                        ss.getSkill().getCategory(),
                        ss.getProficiency()))
                .collect(Collectors.toList());

        return new StudentProfileResponse(
                profile.getId(),
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                profile.getEducationLevel(),
                profile.getUniversity(),
                profile.getGraduationYear(),
                profile.getLocationCity(),
                profile.getLocationState(),
                profile.getLocationCountry(),
                profile.getInterests() != null ? Arrays.asList(profile.getInterests()) : List.of(),
                profile.getBio(),
                skillInfos,
                computeCompleteness(profile));
    }

    /**
     * Computed at read time, not stored (v3 simplification S8).
     * Formula: (has_education + has_skills + has_location + has_interests +
     * has_bio) * 20 = 0-100
     */
    private int computeCompleteness(StudentProfile p) {
        int score = 0;
        if (p.getEducationLevel() != null && !p.getEducationLevel().isBlank())
            score += 20;
        if (p.getSkills() != null && !p.getSkills().isEmpty())
            score += 20;
        if (p.getLocationCity() != null && !p.getLocationCity().isBlank())
            score += 20;
        if (p.getInterests() != null && p.getInterests().length > 0)
            score += 20;
        if (p.getBio() != null && !p.getBio().isBlank())
            score += 20;
        return score;
    }
}
