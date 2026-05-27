// LeaveRequestRepository.java
package com.payroll.repository;

import com.payroll.model.Employee;
import com.payroll.model.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByEmployee(Employee employee);
    List<LeaveRequest> findByStatus(LeaveRequest.LeaveStatus status);
    List<LeaveRequest> findByStartDateBetween(LocalDate start, LocalDate end);
    
    @org.springframework.data.jpa.repository.Query("SELECT l FROM LeaveRequest l WHERE l.employee = :employee AND l.status = :status AND ((l.startDate BETWEEN :startDate AND :endDate) OR (l.endDate BETWEEN :startDate AND :endDate))")
    List<LeaveRequest> findByEmployeeAndStatusAndDateRange(
        @org.springframework.data.repository.query.Param("employee") Employee employee,
        @org.springframework.data.repository.query.Param("status") LeaveRequest.LeaveStatus status,
        @org.springframework.data.repository.query.Param("startDate") LocalDate startDate,
        @org.springframework.data.repository.query.Param("endDate") LocalDate endDate
    );
}