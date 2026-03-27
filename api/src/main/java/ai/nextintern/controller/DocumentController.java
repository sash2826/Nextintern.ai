package ai.nextintern.controller;

import ai.nextintern.entity.StudentDocument;
import ai.nextintern.entity.StudentProfile;
import ai.nextintern.repository.StudentDocumentRepository;
import ai.nextintern.repository.StudentProfileRepository;
import ai.nextintern.service.StorageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/students/documents")
public class DocumentController {

    private final StudentDocumentRepository documentRepository;
    private final StudentProfileRepository profileRepository;
    private final StorageService storageService;

    public DocumentController(StudentDocumentRepository documentRepository,
                              StudentProfileRepository profileRepository,
                              StorageService storageService) {
        this.documentRepository = documentRepository;
        this.profileRepository = profileRepository;
        this.storageService = storageService;
    }

    @GetMapping
    public ResponseEntity<List<StudentDocument>> getDocuments(@AuthenticationPrincipal UUID userId) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));
        return ResponseEntity.ok(documentRepository.findByStudentProfileId(profile.getId()));
    }

    @PostMapping
    public ResponseEntity<StudentDocument> uploadDocument(
            @AuthenticationPrincipal UUID userId,
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") StudentDocument.DocumentType type) {

        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        long maxSize = 5 * 1024 * 1024; // 5MB
        if (file.getSize() > maxSize) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File size exceeds 5MB limit");
        }

        String fileName = file.getOriginalFilename();
        if (fileName != null && !(fileName.toLowerCase().endsWith(".pdf") || fileName.toLowerCase().endsWith(".docx"))) {
             throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only PDF and DOCX files are allowed");
        }

        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));

        if (type == StudentDocument.DocumentType.CV) {
            documentRepository.findByStudentProfileIdAndDocumentType(profile.getId(), StudentDocument.DocumentType.CV)
                    .ifPresent(oldDoc -> {
                        storageService.delete(oldDoc.getFileUrl());
                        documentRepository.delete(oldDoc);
                    });
        }

        String fileUrl = storageService.upload(file);

        StudentDocument doc = StudentDocument.builder()
                .studentProfile(profile)
                .documentType(type)
                .fileName(fileName != null ? fileName : "unknown")
                .fileUrl(fileUrl)
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(documentRepository.save(doc));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(@AuthenticationPrincipal UUID userId, @PathVariable UUID id) {
        StudentProfile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Profile not found"));

        StudentDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document not found"));

        if (!doc.getStudentProfile().getId().equals(profile.getId())) {
             throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not authorized to delete this document");
        }

        storageService.delete(doc.getFileUrl());
        documentRepository.delete(doc);

        return ResponseEntity.noContent().build();
    }
}
