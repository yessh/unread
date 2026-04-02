package com.kakao.chatsummary.util;

import com.kakao.chatsummary.entity.ChatMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class KakaoTalkMessageParser {

    // 날짜 헤더 패턴: "2025년 12월 26일 금요일"
    private static final Pattern DATE_HEADER_PATTERN =
            Pattern.compile("(\\d{4})년\\s+(\\d{1,2})월\\s+(\\d{1,2})일");

    // 메시지 패턴: "2025. 12. 26. 오전 12:28, 사용자명 : 메시지내용"
    // 또는: "2025. 12. 27. 오후 8:12: 초대 시스템 메시지"
    private static final Pattern MESSAGE_PATTERN =
            Pattern.compile("(\\d{4})\\. (\\d{1,2})\\. (\\d{1,2})\\. " + // 날짜
                          "(오전|오후)\\s+(\\d{1,2}):(\\d{2})" + // 시간
                          "(?:,\\s+(.+?)\\s*:\\s+(.*))?$"); // 발신자 및 메시지

    // 시스템 메시지 패턴 (콜론이 한 개인 경우)
    private static final Pattern SYSTEM_MESSAGE_PATTERN =
            Pattern.compile("(\\d{4})\\. (\\d{1,2})\\. (\\d{1,2})\\. " +
                          "(오전|오후)\\s+(\\d{1,2}):(\\d{2}):\\s+(.+)$");

    /**
     * 카카오톡 텍스트 파일 내용을 파싱하여 ChatMessage 리스트로 변환
     *
     * @param fileContent 카카오톡 내보내기 파일의 전체 내용
     * @return ChatMessage 리스트
     */
    public List<ChatMessage> parseMessages(String fileContent) {
        List<ChatMessage> messages = new ArrayList<>();
        String[] lines = fileContent.split("\\n");

        int year = 0;
        int month = 0;
        int day = 0;

        for (String line : lines) {
            line = line.trim();

            if (line.isEmpty()) {
                continue;
            }

            // 날짜 헤더 파싱
            Matcher dateHeaderMatcher = DATE_HEADER_PATTERN.matcher(line);
            if (dateHeaderMatcher.find()) {
                year = Integer.parseInt(dateHeaderMatcher.group(1));
                month = Integer.parseInt(dateHeaderMatcher.group(2));
                day = Integer.parseInt(dateHeaderMatcher.group(3));
                continue;
            }

            // 시스템 메시지 파싱 (초대, 나감 등)
            Matcher systemMatcher = SYSTEM_MESSAGE_PATTERN.matcher(line);
            if (systemMatcher.find()) {
                ChatMessage message = parseSystemMessage(systemMatcher, year, month, day);
                if (message != null) {
                    messages.add(message);
                }
                continue;
            }

            // 일반 메시지 파싱
            Matcher messageMatcher = MESSAGE_PATTERN.matcher(line);
            if (messageMatcher.find()) {
                ChatMessage message = parseRegularMessage(messageMatcher, year, month, day);
                if (message != null) {
                    messages.add(message);
                }
            }
        }

        log.info("Successfully parsed {} messages", messages.size());
        return messages;
    }

    /**
     * 일반 메시지 파싱
     */
    private ChatMessage parseRegularMessage(Matcher matcher, int headerYear, int headerMonth, int headerDay) {
        try {
            int year = Integer.parseInt(matcher.group(1));
            int month = Integer.parseInt(matcher.group(2));
            int day = Integer.parseInt(matcher.group(3));
            String period = matcher.group(4); // 오전/오후
            int hour = Integer.parseInt(matcher.group(5));
            int minute = Integer.parseInt(matcher.group(6));
            String senderName = matcher.group(7);
            String messageContent = matcher.group(8);

            // 발신자 또는 메시지가 없으면 스킵
            if (senderName == null || messageContent == null) {
                return null;
            }

            // 오전/오후를 24시간 형식으로 변환
            if ("오후".equals(period) && hour != 12) {
                hour += 12;
            } else if ("오전".equals(period) && hour == 12) {
                hour = 0;
            }

            LocalDateTime messageTime = LocalDateTime.of(year, month, day, hour, minute);

            // 메시지 타입 결정
            String messageType = determineMessageType(messageContent);

            return ChatMessage.builder()
                    .senderName(senderName.trim())
                    .messageContent(messageContent.trim())
                    .messageTime(messageTime)
                    .messageType(messageType)
                    .build();

        } catch (NumberFormatException e) {
            log.error("Failed to parse regular message: {}", matcher.group(0), e);
            return null;
        }
    }

    /**
     * 시스템 메시지 파싱 (초대, 나감 등)
     */
    private ChatMessage parseSystemMessage(Matcher matcher, int headerYear, int headerMonth, int headerDay) {
        try {
            int year = Integer.parseInt(matcher.group(1));
            int month = Integer.parseInt(matcher.group(2));
            int day = Integer.parseInt(matcher.group(3));
            String period = matcher.group(4);
            int hour = Integer.parseInt(matcher.group(5));
            int minute = Integer.parseInt(matcher.group(6));
            String systemMessage = matcher.group(7);

            // 오전/오후를 24시간 형식으로 변환
            if ("오후".equals(period) && hour != 12) {
                hour += 12;
            } else if ("오전".equals(period) && hour == 12) {
                hour = 0;
            }

            LocalDateTime messageTime = LocalDateTime.of(year, month, day, hour, minute);

            // 시스템 메시지에서 발신자 추출
            String senderName = extractSenderFromSystemMessage(systemMessage);

            return ChatMessage.builder()
                    .senderName(senderName)
                    .messageContent(systemMessage.trim())
                    .messageTime(messageTime)
                    .messageType("SYSTEM")
                    .build();

        } catch (NumberFormatException e) {
            log.error("Failed to parse system message: {}", matcher.group(0), e);
            return null;
        }
    }

    /**
     * 메시지 타입 결정
     */
    private String determineMessageType(String messageContent) {
        if (messageContent == null || messageContent.isEmpty()) {
            return "TEXT";
        }

        String content = messageContent.trim();

        // 이모티콘 감지
        if ("이모티콘".equals(content)) {
            return "EMOJI";
        }
        // 이미지, 스티커 등
        if (content.contains("[이미지]")) {
            return "IMAGE";
        }
        if (content.contains("[스티커]")) {
            return "STICKER";
        }
        if (content.contains("[파일]")) {
            return "FILE";
        }
        if (content.contains("[동영상]")) {
            return "VIDEO";
        }
        if (content.contains("[공유]")) {
            return "SHARE";
        }

        return "TEXT";
    }

    /**
     * 시스템 메시지에서 발신자 추출
     * 예: "User님이 OtherUser님을 초대했습니다." -> "User"
     */
    private String extractSenderFromSystemMessage(String systemMessage) {
        if (systemMessage == null || systemMessage.isEmpty()) {
            return "SYSTEM";
        }

        // "사용자님이" 패턴 추출
        Pattern senderPattern = Pattern.compile("^([가-힣a-zA-Z0-9]+)님");
        Matcher matcher = senderPattern.matcher(systemMessage);

        if (matcher.find()) {
            return matcher.group(1);
        }

        return "SYSTEM";
    }
}
