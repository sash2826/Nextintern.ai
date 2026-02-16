package ai.nextintern.service;

import ai.nextintern.entity.Internship;
import ai.nextintern.entity.InternshipSkill;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch.core.IndexRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SearchService {

    private static final Logger logger = LoggerFactory.getLogger(SearchService.class);
    private static final String INDEX_NAME = "internships";

    private final OpenSearchClient client;
    private final ObjectMapper objectMapper;

    public SearchService(OpenSearchClient client, ObjectMapper objectMapper) {
        this.client = client;
        this.objectMapper = objectMapper;
    }

    public void indexInternship(Internship internship) {
        try {
            Map<String, Object> document = convertToDocument(internship);
            IndexRequest<Map<String, Object>> request = IndexRequest.of(i -> i
                    .index(INDEX_NAME)
                    .id(internship.getId().toString())
                    .document(document));

            client.index(request);
            logger.info("Indexed internship: {}", internship.getId());
        } catch (Exception e) {
            logger.error("Failed to index internship: {}", internship.getId(), e);
        }
    }

    private Map<String, Object> convertToDocument(Internship internship) {
        Map<String, Object> doc = new HashMap<>();
        doc.put("id", internship.getId().toString());
        doc.put("title", internship.getTitle());
        doc.put("description", internship.getDescription());
        doc.put("category", internship.getCategory());
        doc.put("location_city", internship.getLocationCity());
        doc.put("location_state", internship.getLocationState());
        doc.put("location_country", internship.getLocationCountry());
        doc.put("work_mode", internship.getWorkMode());
        doc.put("stipend_min", internship.getStipendMin());
        doc.put("stipend_max", internship.getStipendMax());
        doc.put("duration_weeks", internship.getDurationWeeks());
        doc.put("start_date", internship.getStartDate() != null ? internship.getStartDate().toString() : null);
        doc.put("application_deadline",
                internship.getApplicationDeadline() != null ? internship.getApplicationDeadline().toString() : null);
        doc.put("status", internship.getStatus());
        doc.put("created_at", internship.getCreatedAt().toString());
        doc.put("provider_id", internship.getProvider().getId().toString());
        doc.put("provider_name", internship.getProvider().getCompanyName());
        doc.put("provider_verified", internship.getProvider().isVerified());

        // Flattened skills
        List<String> required = new ArrayList<>();
        List<String> preferred = new ArrayList<>();
        List<String> bonus = new ArrayList<>();
        List<String> all = new ArrayList<>();

        if (internship.getSkills() != null) {
            for (InternshipSkill is : internship.getSkills()) {
                String skillName = is.getSkill().getName();
                all.add(skillName);
                switch (is.getImportance()) {
                    case "required" -> required.add(skillName);
                    case "preferred" -> preferred.add(skillName);
                    case "bonus" -> bonus.add(skillName);
                }
            }
        }

        doc.put("skills_required", required);
        doc.put("skills_preferred", preferred);
        doc.put("skills_bonus", bonus);
        doc.put("skills_all", all);

        return doc;
    }
}
