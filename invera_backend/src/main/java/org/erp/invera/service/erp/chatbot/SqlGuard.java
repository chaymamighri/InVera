package org.erp.invera.service.erp.chatbot;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class SqlGuard {

    private static final Pattern TABLE_ALIAS = Pattern.compile("\\b(from|join)\\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\\s+(?:as\\s+)?([a-zA-Z_][a-zA-Z0-9_]*))?", Pattern.CASE_INSENSITIVE);
    private static final Pattern QUALIFIED_COLUMN = Pattern.compile("\\b([a-zA-Z_][a-zA-Z0-9_]*)\\.([a-zA-Z_][a-zA-Z0-9_]*)\\b");
    private static final Pattern LIMIT = Pattern.compile("\\blimit\\s+(\\d+)\\b", Pattern.CASE_INSENSITIVE);
    private static final Set<String> JOIN_WORDS = Set.of("on", "where", "join", "left", "right", "inner", "outer", "full", "cross", "group", "order", "limit");

    public String validateAndNormalize(String sql, ChatSchema.Snapshot schema) {
        String cleaned = clean(sql);
        String lower = " " + cleaned.toLowerCase(Locale.ROOT) + " ";

        reject(cleaned.isBlank(), "SQL empty.");
        reject(!lower.trim().startsWith("select "), "Only SELECT queries are allowed.");
        reject(cleaned.contains(";"), "Semicolons and multiple statements are not allowed.");
        reject(lower.contains("--") || lower.contains("/*") || lower.contains("*/"), "SQL comments are not allowed.");
        reject(lower.contains(" select * ") || lower.startsWith(" select *"), "SELECT * is not allowed.");
        reject(hasDangerousKeyword(lower), "Dangerous SQL keyword rejected.");
        reject(lower.contains(" information_schema") || lower.contains(" pg_catalog"), "System schemas are not allowed.");
        reject(lower.contains(" union ") || lower.contains(" with ") || lower.contains(" recursive "), "Complex SQL is not allowed yet.");
        reject(hasSensitiveWord(lower), "Sensitive fields are not allowed.");

        Map<String, String> aliases = validateTablesAndAliases(cleaned, schema);
        validateQualifiedColumns(cleaned, schema, aliases);
        return ensureSafeLimit(cleaned);
    }

    private Map<String, String> validateTablesAndAliases(String sql, ChatSchema.Snapshot schema) {
        Map<String, String> aliases = new HashMap<>();
        Matcher matcher = TABLE_ALIAS.matcher(sql);
        boolean found = false;
        while (matcher.find()) {
            found = true;
            String table = matcher.group(2).toLowerCase(Locale.ROOT);
            String alias = matcher.group(3) == null ? table : matcher.group(3).toLowerCase(Locale.ROOT);
            if (JOIN_WORDS.contains(alias)) {
                alias = table;
            }
            reject(!schema.hasTable(table), "Table not allowed: " + table);
            aliases.put(table, table);
            aliases.put(alias, table);
        }
        reject(!found, "No table detected.");
        return aliases;
    }

    private void validateQualifiedColumns(String sql, ChatSchema.Snapshot schema, Map<String, String> aliases) {
        Matcher matcher = QUALIFIED_COLUMN.matcher(sql);
        while (matcher.find()) {
            String qualifier = matcher.group(1).toLowerCase(Locale.ROOT);
            String column = matcher.group(2).toLowerCase(Locale.ROOT);
            String table = aliases.get(qualifier);
            reject(table == null, "Unknown table alias: " + qualifier);
            reject(!schema.hasColumn(table, column), "Column not allowed: " + qualifier + "." + column);
        }
    }

    private String ensureSafeLimit(String sql) {
        Matcher matcher = LIMIT.matcher(sql);
        if (!matcher.find()) {
            return sql + " LIMIT 50";
        }
        int limit = Integer.parseInt(matcher.group(1));
        reject(limit > 100, "LIMIT must be <= 100.");
        return sql;
    }

    private String clean(String sql) {
        String cleaned = sql == null ? "" : sql.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```(?:sql)?\\s*", "");
            cleaned = cleaned.replaceFirst("\\s*```$", "");
        }
        return cleaned.replaceAll("\\s+", " ").trim();
    }

    private boolean hasDangerousKeyword(String lower) {
        return lower.contains(" insert ")
                || lower.contains(" update ")
                || lower.contains(" delete ")
                || lower.contains(" drop ")
                || lower.contains(" alter ")
                || lower.contains(" truncate ")
                || lower.contains(" create ")
                || lower.contains(" grant ")
                || lower.contains(" revoke ")
                || lower.contains(" call ")
                || lower.contains(" copy ")
                || lower.contains(" execute ");
    }

    private boolean hasSensitiveWord(String lower) {
        return lower.contains("password")
                || lower.contains("mot_de_passe")
                || lower.contains(" token")
                || lower.contains("secret")
                || lower.contains("jwt")
                || lower.contains("api_key");
    }

    private void reject(boolean condition, String message) {
        if (condition) {
            throw new IllegalArgumentException(message);
        }
    }
}
