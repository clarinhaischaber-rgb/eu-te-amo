package com.example.eu_te_amo_api.controller;

import com.example.eu_te_amo_api.dto.request.UserUpdateDTO;
import com.example.eu_te_amo_api.dto.response.UserResponseDTO;
import com.example.eu_te_amo_api.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/profile")
    public ResponseEntity<UserResponseDTO> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        UserResponseDTO profile = userService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserResponseDTO> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UserUpdateDTO dto
    ) {
        UserResponseDTO updatedProfile = userService.updateProfile(userDetails.getUsername(), dto);
        return ResponseEntity.ok(updatedProfile);
    }
}