package com.payroll.service;

import com.payroll.model.Employee;
import com.payroll.model.LeaveRequest;
import com.payroll.model.Payroll;
import com.payroll.model.User;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.LeaveRequestRepository;
import com.payroll.repository.PayrollRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class SecurityService {
    private final EmployeeRepository employeeRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final PayrollRepository payrollRepository;

    public SecurityService(EmployeeRepository employeeRepository, 
                          LeaveRequestRepository leaveRequestRepository,
                          PayrollRepository payrollRepository) {
        this.employeeRepository = employeeRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.payrollRepository = payrollRepository;
    }

    public boolean isOwnData(Authentication authentication, Long employeeId) {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof User)) return false;
        
        User user = (User) principal;
        return employeeRepository.findByUserUserId(user.getUserId())
                .map(employee -> employee.getEmployeeId().equals(employeeId))
                .orElse(false);
    }

    public boolean isOwnUser(Authentication authentication, Long userId) {
        User user = (User) authentication.getPrincipal();
        return user.getUserId().equals(userId);
    }

    public boolean isOwnLeaveRequest(Authentication authentication, Long leaveRequestId) {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof User)) return false;
        User user = (User) principal;
        
        return employeeRepository.findByUserUserId(user.getUserId())
                .map(employee -> {
                    return leaveRequestRepository.findById(leaveRequestId)
                            .map(leaveRequest -> leaveRequest.getEmployee().getEmployeeId().equals(employee.getEmployeeId()))
                            .orElse(false);
                })
                .orElse(false);
    }

    public boolean isOwnPayroll(Authentication authentication, Long payrollId) {
        Object principal = authentication.getPrincipal();
        if (!(principal instanceof User)) return false;
        User user = (User) principal;
        
        return employeeRepository.findByUserUserId(user.getUserId())
                .map(employee -> {
                    return payrollRepository.findById(payrollId)
                            .map(payroll -> payroll.getEmployee().getEmployeeId().equals(employee.getEmployeeId()))
                            .orElse(false);
                })
                .orElse(false);
    }
}