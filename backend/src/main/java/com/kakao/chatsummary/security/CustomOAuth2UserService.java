package com.kakao.chatsummary.security;

import com.kakao.chatsummary.entity.User;
import com.kakao.chatsummary.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String provider = userRequest.getClientRegistration().getRegistrationId().toUpperCase(); // GOOGLE
        String providerId = oAuth2User.getAttribute("sub");
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    log.info("새 OAuth2 사용자 생성: {} ({})", email, provider);
                    return userRepository.save(User.builder()
                            .username(name)
                            .email(email)
                            .provider(provider)
                            .providerId(providerId)
                            .build());
                });

        return new OAuth2UserPrincipal(user, oAuth2User.getAttributes());
    }
}
