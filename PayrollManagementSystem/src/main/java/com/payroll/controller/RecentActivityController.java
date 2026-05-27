package com.payroll.controller;

import com.payroll.model.RecentActivity;
import com.payroll.service.RecentActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activities")
@CrossOrigin(origins = "http://localhost:3000")
public class RecentActivityController {

    @Autowired
    private RecentActivityService recentActivityService;

    @GetMapping("/recent")
    public ResponseEntity<List<RecentActivity>> getRecentActivities() {
        return ResponseEntity.ok(recentActivityService.getRecentActivities());
    }
}
