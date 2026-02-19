package ai.nextintern.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class UpdateStudentSkillsRequest {

    @NotEmpty
    private List<SkillUpdateDTO> skills;

    @Data
    public static class SkillUpdateDTO {
        private Integer skillId;
        @Min(1)
        @Max(5)
        private Integer proficiency;
    }
}
