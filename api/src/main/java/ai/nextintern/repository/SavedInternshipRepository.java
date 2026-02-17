package ai.nextintern.repository;

import ai.nextintern.entity.SavedInternship;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SavedInternshipRepository extends JpaRepository<SavedInternship, UUID> {

    @EntityGraph(attributePaths = { "internship", "internship.provider" })
    Page<SavedInternship> findByStudentId(UUID studentId, Pageable pageable);

    boolean existsByStudentIdAndInternshipId(UUID studentId, UUID internshipId);

    void deleteByStudentIdAndInternshipId(UUID studentId, UUID internshipId);
}
