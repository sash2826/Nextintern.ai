package ai.nextintern.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
public class S3StorageService implements StorageService {

    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket:nextintern-documents}")
    private String bucketName;

    @Value("${cloud.aws.s3.endpoint:http://localhost:4566}")
    private String endpoint; // Used to construct public URLs for LocalStack

    public S3StorageService(S3Client s3Client) {
        this.s3Client = s3Client;
    }

    @Override
    public String upload(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        
        String key = UUID.randomUUID().toString() + extension;

        try {
            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(bucketName)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(putObjectRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            
            // Constructing a public URL (assuming bucket is configured for public read or authenticated access is handled elsewhere)
            // For real S3: https://{bucketName}.s3.amazonaws.com/{key}
            // For LocalStack: http://localhost:4566/{bucketName}/{key}
            
            if (endpoint.contains("localhost")) {
                 return endpoint + "/" + bucketName + "/" + key;
            } else {
                 return "https://" + bucketName + ".s3.amazonaws.com/" + key;
            }

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload file to S3", e);
        }
    }

    @Override
    public void delete(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) return;
        
        // Extract key from URL
        String key = fileUrl.substring(fileUrl.lastIndexOf("/") + 1);

        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(key)
                .build();
                
        try {
            s3Client.deleteObject(deleteObjectRequest);
        } catch (Exception e) {
             throw new RuntimeException("Failed to delete file from S3", e);
        }
    }
}
