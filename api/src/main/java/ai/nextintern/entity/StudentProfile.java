package ai.nextintern.entity;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "student_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "education_level", length = 100)
    private String educationLevel;

    @Column(length = 255)
    private String university;

    @Column(name = "graduation_year")
    private Integer graduationYear;

    @Column(name = "location_city", length = 100)
    private String locationCity;

    @Column(name = "location_state", length = 100)
    private String locationState;

    @Column(name = "location_country", length = 100)
    @Builder.Default
    private String locationCountry = "India";

    @Column(columnDefinition = "text[]")
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Builder.Default
    private String[] interests = new String[] {};

    @Column(name = "resume_url", length = 512)
    private String resumeUrl;

    @Column(columnDefinition = "text")
    private String bio;

    @OneToMany(mappedBy = "studentProfile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<StudentSkill> skills = new ArrayList<>();
}
