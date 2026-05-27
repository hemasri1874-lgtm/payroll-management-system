package com.payroll.service.impl;

import com.payroll.model.RecentActivity;
import com.payroll.repository.RecentActivityRepository;
import com.payroll.service.RecentActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RecentActivityServiceImpl implements RecentActivityService {

    @Autowired
    private RecentActivityRepository recentActivityRepository;

    @Override
    public RecentActivity logActivity(String message, String type) {
        RecentActivity activity = new RecentActivity();
        activity.setMessage(message);
        activity.setType(type);
        activity.setTime(LocalDateTime.now());
        return recentActivityRepository.save(activity);
    }

    @Override
    public List<RecentActivity> getRecentActivities() {
        return recentActivityRepository.findTop3ByOrderByTimeDesc();
    }
}
