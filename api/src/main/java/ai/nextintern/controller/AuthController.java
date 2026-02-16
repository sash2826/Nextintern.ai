package ai.nextintern.controller;

import ai.nextintern.dto.AuthResponse;
import ai.nextintern.dto.LoginRequest;
import ai.nextintern.dto.RegisterRequest;
import ai.nextintern.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;

/**
 * Auth endpoints: register, login, refresh (via HttpOnly cookie), logout.
 * Refresh token is NEVER sent in the response body — only as a Set-Cookie.
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    @Value("${app.jwt.refresh-token-ttl:604800}")
    private int refreshTokenTtl;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
            HttpServletResponse response) {
        AuthService.AuthResult result = authService.register(request);
        setRefreshCookie(response, result.refreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(result.response());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        AuthService.AuthResult result = authService.login(request);
        setRefreshCookie(response, result.refreshToken());
        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(HttpServletRequest request,
            HttpServletResponse response) {
        String refreshToken = extractRefreshCookie(request);
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AuthService.AuthResult result = authService.refresh(refreshToken);
        setRefreshCookie(response, result.refreshToken());
        return ResponseEntity.ok(result.response());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request,
            HttpServletResponse response) {
        String refreshToken = extractRefreshCookie(request);
        String accessToken = extractAccessToken(request);

        authService.logout(refreshToken, accessToken);

        // Clear the refresh cookie
        clearRefreshCookie(response);
        return ResponseEntity.noContent().build();
    }

    // ── Cookie Helpers ──────────────────────────────────────

    private void setRefreshCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie("refreshToken", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true); // Only sent over HTTPS (ignored on localhost)
        cookie.setPath("/api/v1/auth");
        cookie.setMaxAge(refreshTokenTtl);
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("refreshToken", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/api/v1/auth");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "Strict");
        response.addCookie(cookie);
    }

    private String extractRefreshCookie(HttpServletRequest request) {
        if (request.getCookies() == null)
            return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> "refreshToken".equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    private String extractAccessToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
