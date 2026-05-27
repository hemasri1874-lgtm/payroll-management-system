package com.payroll.repository;

import com.payroll.model.RecentActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecentActivityRepository extends JpaRepository<RecentActivity, Long> {
    List<RecentActivity> findTop3ByOrderByTimeDesc();
}
