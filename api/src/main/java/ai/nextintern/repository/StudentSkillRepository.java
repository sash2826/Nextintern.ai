package ai.nextintern.repository;

import ai.nextintern.entity.StudentSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface StudentSkillRepository extends JpaRepository<StudentSkill, UUID> {
    void deleteByStudentProfileId(UUID studentProfileId);
}
