package ai.nextintern.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "student_skills")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(StudentSkill.StudentSkillId.class)
public class StudentSkill {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_profile_id", nullable = false)
    private StudentProfile studentProfile;

    @Id
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "skill_id", nullable = false)
    private Skill skill;

    @Column(nullable = false)
    private Short proficiency;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class StudentSkillId implements Serializable {
        private java.util.UUID studentProfile;
        private Integer skill;
    }
}
