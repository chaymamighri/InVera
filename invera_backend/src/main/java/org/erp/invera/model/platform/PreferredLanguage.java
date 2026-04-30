package org.erp.invera.model.platform;

import java.util.List;

public enum PreferredLanguage {
    EN("en"),
    FR("fr"),
    AR("ar");

    private final String code;

    PreferredLanguage(String code) {
        this.code = code;
    }

    public String getCode() {
        return code;
    }

    public static PreferredLanguage fromCode(String code) {
        if (code == null) {
            return null;
        }

        for (PreferredLanguage language : values()) {
            if (language.code.equalsIgnoreCase(code.trim())) {
                return language;
            }
        }

        throw new IllegalArgumentException("Unsupported language: " + code);
    }

    public static List<String> supportedCodes() {
        return List.of(EN.code, FR.code, AR.code);
    }
}
