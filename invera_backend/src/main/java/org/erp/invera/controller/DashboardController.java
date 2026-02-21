/// DashboardController.java
package org.erp.invera.controller;

import org.erp.invera.dto.DashboardDTO;
import org.erp.invera.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<DashboardDTO> getDashboardSummary(
            @RequestParam(defaultValue = "today") String period,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        DashboardDTO summary;
        if (startDate != null && endDate != null) {
            // Logique pour période personnalisée
            summary = dashboardService.getCustomSummary(startDate, endDate);
        } else {
            summary = dashboardService.getSummary(period);
        }
        return ResponseEntity.ok(summary);
    }
}