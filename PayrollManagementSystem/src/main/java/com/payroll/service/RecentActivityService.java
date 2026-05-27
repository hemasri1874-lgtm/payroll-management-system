package com.payroll.service;

import com.payroll.model.RecentActivity;
import java.util.List;

public interface RecentActivityService {
    RecentActivity logActivity(String message, String type);
    List<RecentActivity> getRecentActivities();
}
