package ai.nextintern.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

@Configuration
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class S3BucketInitializer {

    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket:nextintern-documents}")
    private String bucketName;

    @PostConstruct
    public void init() {
        try {
            s3Client.headBucket(HeadBucketRequest.builder().bucket(bucketName).build());
            log.info("S3 bucket '{}' already exists.", bucketName);
        } catch (S3Exception e) {
            if (e.statusCode() == 404) {
                log.info("S3 bucket '{}' does not exist. Creating it...", bucketName);
                s3Client.createBucket(CreateBucketRequest.builder().bucket(bucketName).build());
                log.info("S3 bucket '{}' created successfully.", bucketName);
            } else {
                log.error("Error checking/creating S3 bucket: {}", e.getMessage());
            }
        }
    }
}
