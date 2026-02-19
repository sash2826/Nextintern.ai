package ai.nextintern.controller;

import ai.nextintern.dto.UpdateLocaleRequest;
import ai.nextintern.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PatchMapping("/me/locale")
    public ResponseEntity<Void> updateLocale(
            @RequestBody UpdateLocaleRequest request,
            Authentication authentication) {

        userService.updateLocale(authentication.getName(), request.locale());
        return ResponseEntity.noContent().build();
    }
}
