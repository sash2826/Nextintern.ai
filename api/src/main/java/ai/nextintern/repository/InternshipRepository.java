package ai.nextintern.repository;

import ai.nextintern.entity.Internship;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InternshipRepository extends JpaRepository<Internship, UUID> {

    Page<Internship> findByStatus(String status, Pageable pageable);

    Page<Internship> findByProviderId(UUID providerId, Pageable pageable);

    @Query("""
                SELECT i FROM Internship i
                WHERE i.status = 'active'
                  AND (i.applicationDeadline IS NULL OR i.applicationDeadline >= CURRENT_DATE)
                  AND (:category IS NULL OR i.category = :category)
                  AND (:workMode IS NULL OR i.workMode = :workMode)
                  AND (:state IS NULL OR i.locationState = :state)
                ORDER BY i.createdAt DESC
            """)
    Page<Internship> searchActive(
            @Param("category") String category,
            @Param("workMode") String workMode,
            @Param("state") String state,
            Pageable pageable);

    @Query("SELECT COUNT(a) FROM Application a WHERE a.internship.id = :internshipId AND a.status NOT IN ('withdrawn', 'rejected')")
    long countActiveApplications(@Param("internshipId") UUID internshipId);
}
