package ai.nextintern.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "internships")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Internship {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    private Provider provider;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "text")
    private String description;

    @Column(length = 100)
    private String category;

    @Column(name = "stipend_min")
    private Integer stipendMin;

    @Column(name = "stipend_max")
    private Integer stipendMax;

    @Column(name = "location_city", length = 100)
    private String locationCity;

    @Column(name = "location_state", length = 100)
    private String locationState;

    @Column(name = "location_country", length = 100)
    @Builder.Default
    private String locationCountry = "India";

    @Column(name = "work_mode", nullable = false, length = 20)
    private String workMode;

    @Column(columnDefinition = "text")
    private String eligibility;

    @Column(name = "duration_weeks")
    private Integer durationWeeks;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "application_deadline")
    private LocalDate applicationDeadline;

    @Column(name = "max_applicants")
    private Integer maxApplicants;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "draft";

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @OneToMany(mappedBy = "internship", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InternshipSkill> skills = new ArrayList<>();
}
