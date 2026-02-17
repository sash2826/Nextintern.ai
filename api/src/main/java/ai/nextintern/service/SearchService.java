package ai.nextintern.service;

import ai.nextintern.dto.InternshipDocument;
import ai.nextintern.dto.SearchResult;
import ai.nextintern.entity.Internship;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch._types.Refresh;
import org.opensearch.client.opensearch._types.query_dsl.BoolQuery;
import org.opensearch.client.opensearch.core.IndexRequest;
import org.opensearch.client.opensearch.core.SearchRequest;
import org.opensearch.client.opensearch.core.SearchResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private static final Logger logger = LoggerFactory.getLogger(SearchService.class);
    private static final String INDEX_NAME = "internships";

    private final OpenSearchClient client;

    public SearchService(OpenSearchClient client) {
        this.client = client;
    }

    public SearchResult searchInternships(
            String query,
            String category,
            String workMode,
            String locationState,
            int page,
            int size) {
        if (page < 0) {
            throw new IllegalArgumentException("Page index must not be less than zero");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("Page size must not be less than or equal to zero");
        }
        try {
            int from = Math.multiplyExact(page, size);
            BoolQuery.Builder boolQuery = new BoolQuery.Builder();

            // Full text query
            if (query != null && !query.isBlank()) {
                boolQuery.must(m -> m.multiMatch(mm -> mm
                        .query(query)
                        .fields("title", "description", "skills_all")));
            }

            // Filters
            boolQuery.filter(f -> f.term(t -> t.field("status").value(v -> v.stringValue("active"))));

            if (category != null && !category.isBlank()) {
                boolQuery.filter(f -> f.term(t -> t.field("category").value(v -> v.stringValue(category))));
            }

            if (workMode != null && !workMode.isBlank()) {
                boolQuery.filter(f -> f.term(t -> t.field("work_mode").value(v -> v.stringValue(workMode))));
            }

            if (locationState != null && !locationState.isBlank()) {
                boolQuery.filter(f -> f.term(t -> t.field("location_state").value(v -> v.stringValue(locationState))));
            }

            SearchRequest request = new SearchRequest.Builder()
                    .index(INDEX_NAME)
                    .from(from)
                    .size(size)
                    .query(q -> q.bool(boolQuery.build()))
                    .build();

            SearchResponse<Void> response = client.search(request, Void.class);

            List<UUID> ids = response.hits().hits().stream()
                    .map(hit -> UUID.fromString(hit.id()))
                    .collect(Collectors.toList());

            long total = response.hits().total() != null
                    ? response.hits().total().value()
                    : 0;

            return new SearchResult(ids, total);

        } catch (IOException e) {
            logger.error("Failed to search internships", e);
            return new SearchResult(List.of(), 0);
        }
    }

    public void indexInternship(Internship internship) {
        try {
            InternshipDocument doc = InternshipDocument.from(internship);
            IndexRequest<InternshipDocument> request = IndexRequest.of(i -> i
                    .index(INDEX_NAME)
                    .id(internship.getId().toString())
                    .document(doc)
                    .refresh(Refresh.WaitFor));

            client.index(request);
            logger.info("Indexed internship: {}", internship.getId());
        } catch (IOException e) {
            logger.error("Failed to index internship: {}", internship.getId(), e);
            // In a real production system we might want to throw this up or add to a DLQ
            throw new RuntimeException("Failed to index internship", e);
        }
    }

    public void deleteInternship(UUID id) {
        try {
            client.delete(d -> d
                    .index(INDEX_NAME)
                    .id(id.toString())
                    .refresh(Refresh.WaitFor));
            logger.info("Deleted internship from index: {}", id);
        } catch (IOException e) {
            logger.error("Failed to delete internship from index: {}", id, e);
            throw new RuntimeException("Failed to delete internship from index", e);
        }
    }
}
