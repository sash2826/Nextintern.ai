package ai.nextintern.repository;

import ai.nextintern.entity.Application;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    boolean existsByStudentIdAndInternshipId(UUID studentId, UUID internshipId);

    Optional<Application> findByStudentIdAndInternshipId(UUID studentId, UUID internshipId);

    @EntityGraph(attributePaths = { "student", "student.user", "internship", "internship.provider" })
    Page<Application> findByStudentId(UUID studentId, Pageable pageable);

    @EntityGraph(attributePaths = { "student", "student.user", "internship" })
    @Query("SELECT a FROM Application a WHERE a.internship.id = :internshipId ORDER BY a.appliedAt DESC")
    Page<Application> findByInternshipId(@Param("internshipId") UUID internshipId, Pageable pageable);

    @Override
    @EntityGraph(attributePaths = { "student", "student.user", "internship", "internship.provider" })
    Optional<Application> findById(UUID id);

    long countByInternshipIdAndStatus(@Param("internshipId") UUID internshipId,
            @Param("status") ai.nextintern.entity.ApplicationStatus status);

    @Query("SELECT a FROM Application a WHERE a.id = :id AND a.internship.provider.id = :providerId")
    Optional<Application> findByIdAndInternshipProviderId(@Param("id") UUID id, @Param("providerId") UUID providerId);
}
