package org.erp.invera.service.erp.chatbot;

import org.erp.invera.repository.tenant.TenantAwareRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSetMetaData;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class QueryRunner {

    private static final int QUERY_TIMEOUT_SECONDS = 12;
    private static final int MAX_ROWS = 100;

    private final TenantAwareRepository tenantRepo;

    public QueryRunner(TenantAwareRepository tenantRepo) {
        this.tenantRepo = tenantRepo;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> run(Long clientId, String sql) {
        JdbcTemplate jdbc = tenantRepo.getClientJdbcTemplate(clientId, String.valueOf(clientId));
        jdbc.setQueryTimeout(QUERY_TIMEOUT_SECONDS);
        List<Map<String, Object>> rows = jdbc.query(sql, (rs, rowNum) -> {
            ResultSetMetaData meta = rs.getMetaData();
            int count = meta.getColumnCount();
            Map<String, Object> row = new LinkedHashMap<>();
            for (int i = 1; i <= count; i++) {
                row.put(meta.getColumnLabel(i), rs.getObject(i));
            }
            return row;
        });
        return rows.size() > MAX_ROWS ? rows.subList(0, MAX_ROWS) : rows;
    }
}
