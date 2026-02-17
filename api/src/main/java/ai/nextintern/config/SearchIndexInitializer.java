package ai.nextintern.config;

import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch.indices.CreateIndexRequest;
import org.opensearch.client.opensearch.indices.ExistsRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Component
public class SearchIndexInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(SearchIndexInitializer.class);
    private static final String INDEX_NAME = "internships";

    private final OpenSearchClient client;

    public SearchIndexInitializer(OpenSearchClient client) {
        this.client = client;
    }

    @Override
    public void run(String... args) {
        try {
            boolean exists = client.indices().exists(ExistsRequest.of(e -> e.index(INDEX_NAME))).value();
            if (!exists) {
                logger.info("Index {} does not exist. Creating...", INDEX_NAME);

                try (InputStream mappingStream = getClass().getResourceAsStream("/opensearch/mapping.json")) {
                    if (mappingStream != null) {
                        org.opensearch.client.json.jackson.JacksonJsonpMapper mapper = new org.opensearch.client.json.jackson.JacksonJsonpMapper();
                        try (jakarta.json.stream.JsonParser parser = mapper.jsonProvider()
                                .createParser(mappingStream)) {
                            client.indices().create(CreateIndexRequest.of(c -> c
                                    .index(INDEX_NAME)
                                    .mappings(org.opensearch.client.opensearch._types.mapping.TypeMapping._DESERIALIZER
                                            .deserialize(parser, mapper))));
                        }
                        logger.info("Index {} created successfully with mapping.", INDEX_NAME);
                    } else {
                        client.indices().create(CreateIndexRequest.of(c -> c.index(INDEX_NAME)));
                        logger.warn("Index {} created without explicit mapping (mapping.json not found).", INDEX_NAME);
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Failed to initialize OpenSearch index", e);
        }
    }
}
