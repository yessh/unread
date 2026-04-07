package com.kakao.chatsummary.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2UserPrincipal principal = (OAuth2UserPrincipal) authentication.getPrincipal();
        String token = jwtTokenProvider.generateToken(
                principal.getUser().getId(),
                principal.getUser().getEmail()
        );

        Cookie cookie = new Cookie("access_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // 프로덕션에서 true로 변경 (HTTPS)
        cookie.setPath("/");
        cookie.setMaxAge(24 * 60 * 60); // 24시간
        response.addCookie(cookie);

        log.info("OAuth2 로그인 성공: {}", principal.getUser().getEmail());
        getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/dashboard");
    }
}
