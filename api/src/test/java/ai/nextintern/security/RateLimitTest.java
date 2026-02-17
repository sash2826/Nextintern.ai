package ai.nextintern.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@org.springframework.test.context.ActiveProfiles("local")
public class RateLimitTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testRateLimitHeadersPresent() throws Exception {
        mockMvc.perform(get("/api/v1/internships"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Rate-Limit-Remaining"));
    }
}
