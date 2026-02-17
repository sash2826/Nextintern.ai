package ai.nextintern.config;

import org.apache.http.HttpHost;
import org.opensearch.client.RestClient;
import org.opensearch.client.json.jackson.JacksonJsonpMapper;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.transport.OpenSearchTransport;
import org.opensearch.client.transport.rest_client.RestClientTransport;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Map;

@Configuration
public class SearchConfig {

    @Value("${app.opensearch.host:localhost}")
    private String host;

    @Value("${app.opensearch.port:9200}")
    private int port;

    @Bean
    public OpenSearchClient openSearchClient() {
        RestClient restClient = RestClient.builder(new HttpHost(host, port, "http")).build();
        OpenSearchTransport transport = new RestClientTransport(restClient, new JacksonJsonpMapper());
        return new OpenSearchClient(transport);
    }

    // Index initialization logic can be triggered via a CommandLineRunner bean if
    // needed
    // ensuring the index exists with the correct mapping on startup.
}
