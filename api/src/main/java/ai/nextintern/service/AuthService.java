package ai.nextintern.service;

import ai.nextintern.dto.AuthResponse;
import ai.nextintern.dto.LoginRequest;
import ai.nextintern.dto.RegisterRequest;
import ai.nextintern.entity.*;
import ai.nextintern.repository.*;
import ai.nextintern.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final ProviderRepository providerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository,
            RoleRepository roleRepository,
            StudentProfileRepository studentProfileRepository,
            ProviderRepository providerRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.providerRepository = providerRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Register a new user, create the role-specific profile, generate tokens.
     */
    @Transactional
    public AuthResult register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already registered");
        }

        Role role = roleRepository.findByName(request.role())
                .orElseThrow(() -> new IllegalArgumentException("Invalid role: " + request.role()));

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .build();
        user.getRoles().add(role);
        userRepository.save(user);

        // Create role-specific profile
        if ("student".equals(request.role())) {
            StudentProfile profile = StudentProfile.builder()
                    .user(user)
                    .build();
            studentProfileRepository.save(profile);
        } else if ("provider".equals(request.role())) {
            Provider provider = Provider.builder()
                    .user(user)
                    .companyName(request.fullName() + "'s Company")
                    .build();
            providerRepository.save(provider);
        }

        Set<String> roleNames = Set.of(request.role());
        String accessToken = jwtService.generateAccessToken(user.getId(), roleNames);
        String refreshToken = jwtService.generateRefreshToken(user.getId(), roleNames);

        return new AuthResult(
                new AuthResponse(accessToken, toUserInfo(user, roleNames)),
                refreshToken);
    }

    /**
     * Login with email + password, generate tokens.
     */
    @Transactional
    public AuthResult login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!user.getIsActive()) {
            throw new IllegalArgumentException("Account is deactivated");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        String accessToken = jwtService.generateAccessToken(user.getId(), roleNames);
        String refreshToken = jwtService.generateRefreshToken(user.getId(), roleNames);

        return new AuthResult(
                new AuthResponse(accessToken, toUserInfo(user, roleNames)),
                refreshToken);
    }

    /**
     * Refresh access token using the refresh token cookie.
     */
    public AuthResult refresh(String refreshToken) {
        JwtService.RefreshResult result = jwtService.rotateRefreshToken(refreshToken);
        if (result == null) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        User user = userRepository.findById(result.userId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Set<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        return new AuthResult(
                new AuthResponse(result.accessToken(), toUserInfo(user, roleNames)),
                result.refreshToken());
    }

    /**
     * Logout — revoke refresh token family + block access token jti.
     */
    public void logout(String refreshToken, String accessToken) {
        // Revoke refresh token family
        if (refreshToken != null) {
            jwtService.revokeRefreshToken(refreshToken);
        }

        // Block access token jti
        if (accessToken != null) {
            try {
                var claims = jwtService.parseAccessToken(accessToken);
                jwtService.blockAccessToken(claims.getId(), claims.getExpiration().toInstant());
            } catch (Exception ignored) {
                // Token already invalid — fine
            }
        }
    }

    private AuthResponse.UserInfo toUserInfo(User user, Set<String> roles) {
        return new AuthResponse.UserInfo(user.getId(), user.getEmail(), user.getFullName(), roles);
    }

    public record AuthResult(AuthResponse response, String refreshToken) {
    }
}
