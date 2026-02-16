package ai.nextintern.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "internship_id", nullable = false)
    private Internship internship;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "applied";

    @Column(name = "status_history", columnDefinition = "jsonb")
    @Builder.Default
    private String statusHistory = "[]";

    @Column(name = "cover_note", columnDefinition = "text")
    private String coverNote;

    @CreationTimestamp
    @Column(name = "applied_at", nullable = false, updatable = false)
    private Instant appliedAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
