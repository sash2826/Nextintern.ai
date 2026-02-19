package ai.nextintern.service;

import ai.nextintern.entity.User;
import ai.nextintern.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public void updateLocale(String email, String locale) {
        if (!List.of("en", "hi").contains(locale)) {
            throw new IllegalArgumentException("Unsupported locale");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setLocale(locale);
        userRepository.save(user);
    }
}
