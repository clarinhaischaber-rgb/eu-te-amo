package com.example.eu_te_amo_api.service;

import com.example.eu_te_amo_api.dto.request.UserUpdateDTO;
import com.example.eu_te_amo_api.dto.response.UserResponseDTO;
import com.example.eu_te_amo_api.model.User;
import com.example.eu_te_amo_api.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


// Cuida apenas de mostrar o usuario logado, e poder alterar o seu perfil
@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponseDTO getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilizador com o e-mai: " + email + " não encontrado!" ));

        return UserResponseDTO.builder()
                .id(user.getId())
                .displayName(user.getDisplayName())
                .email(user.getEmail())
                .build();
    }

    public UserResponseDTO updateProfile(String email, UserUpdateDTO dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilizador com o e-mai: " + email + " não encontrado!" ));

        if (dto.getDisplayName() != null && !dto.getDisplayName().isBlank()) {
            user.setDisplayName(dto.getDisplayName());
        }

        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        }

        User updatedUser = userRepository.save(user);

        return UserResponseDTO.builder()
                .id(updatedUser.getId())
                .displayName(updatedUser.getDisplayName())
                .email(updatedUser.getEmail())
                .build();
    }
}