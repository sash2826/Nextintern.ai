package ai.nextintern.repository;

import ai.nextintern.entity.StudentDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentDocumentRepository extends JpaRepository<StudentDocument, UUID> {
    List<StudentDocument> findByStudentProfileId(UUID studentProfileId);
    Optional<StudentDocument> findByStudentProfileIdAndDocumentType(UUID studentProfileId, StudentDocument.DocumentType type);
    long countByStudentProfileIdAndDocumentType(UUID studentProfileId, StudentDocument.DocumentType type);
}
