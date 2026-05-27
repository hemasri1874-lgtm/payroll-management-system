// PayrollServiceImpl.java
package com.payroll.service.impl;

import com.payroll.dto.PayrollDto;
import com.payroll.exception.ResourceNotFoundException;
import com.payroll.model.Employee;
import com.payroll.model.Payroll;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.PayrollRepository;
import com.payroll.service.PayrollService;
import com.payroll.service.RecentActivityService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PayrollServiceImpl implements PayrollService {
    private final PayrollRepository payrollRepository;
    private final EmployeeRepository employeeRepository;
    private final com.payroll.repository.LeaveRequestRepository leaveRequestRepository;
    private final com.payroll.repository.AttendanceRepository attendanceRepository;
    private final RecentActivityService recentActivityService;

    public PayrollServiceImpl(PayrollRepository payrollRepository, EmployeeRepository employeeRepository, 
                              com.payroll.repository.LeaveRequestRepository leaveRequestRepository,
                              com.payroll.repository.AttendanceRepository attendanceRepository,
                              RecentActivityService recentActivityService) {
        this.payrollRepository = payrollRepository;
        this.employeeRepository = employeeRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.attendanceRepository = attendanceRepository;
        this.recentActivityService = recentActivityService;
    }

    @Override
    public List<PayrollDto> getAllPayrolls() {
        return payrollRepository.findAll().stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<PayrollDto> getPayrollsByEmployee(Long employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));
        
        return payrollRepository.findByEmployee(employee).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<PayrollDto> getPayrollsByMonthAndYear(Integer month, Integer year) {
        return payrollRepository.findByMonthAndYear(month, year).stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public PayrollDto getPayrollById(Long id) {
        Payroll payroll = payrollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found with id: " + id));
        return convertToDto(payroll);
    }

    @Override
    @Transactional
    public PayrollDto createPayroll(PayrollDto payrollDto) {
        Employee employee = employeeRepository.findById(payrollDto.getEmployeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + payrollDto.getEmployeeId()));
        
        // Check if payroll already exists for this employee and period
        if (payrollRepository.findByEmployeeAndMonthAndYear(employee, payrollDto.getMonth(), payrollDto.getYear()).isPresent()) {
            throw new RuntimeException("Payroll already exists for this employee and period");
        }
        
        // Auto-fetch Base Salary from Job Role if not provided
        if (payrollDto.getBaseSalary() == null && employee.getJobRole() != null) {
            payrollDto.setBaseSalary(employee.getJobRole().getBaseSalary());
        }

        BigDecimal baseSalary = payrollDto.getBaseSalary() != null ? payrollDto.getBaseSalary() : BigDecimal.ZERO;

        // --- NEW PAY-FOR-PRESENCE LOGIC ---
        
        java.time.YearMonth yearMonth = java.time.YearMonth.of(payrollDto.getYear(), payrollDto.getMonth());
        java.time.LocalDate startOfMonth = yearMonth.atDay(1);
        java.time.LocalDate endOfMonth = yearMonth.atEndOfMonth();

        // 1. Calculate Daily Salary (Base / 30)
        BigDecimal dailySalary = baseSalary.divide(new BigDecimal(30), 2, java.math.RoundingMode.HALF_UP);

        // 2. Calculate Days Present
        // Note: Using findByEmployeeAndDateBetween which we verified exists in AttendanceRepository
        List<com.payroll.model.Attendance> attendanceRecords = attendanceRepository.findByEmployeeAndDateBetween(
            employee, startOfMonth, endOfMonth
        );
        
        // Filter mainly for PRESENT status (and LATE/HALF_DAY can be handled if needed)
        // For simplicity: treating PRESENT, LATE, HALF_DAY as 1 day presence for now. 
        // You can refine this (e.g., HALF_DAY = 0.5) if required.
        long daysPresent = attendanceRecords.stream()
            .filter(a -> a.getStatus() == com.payroll.model.Attendance.AttendanceStatus.PRESENT ||
                         a.getStatus() == com.payroll.model.Attendance.AttendanceStatus.LATE || 
                         a.getStatus() == com.payroll.model.Attendance.AttendanceStatus.HALF_DAY)
            .count();


        // 3. Calculate Approved Paid Leave Days
        List<com.payroll.model.LeaveRequest> approvedLeaves = leaveRequestRepository.findByEmployeeAndStatusAndDateRange(
            employee, 
            com.payroll.model.LeaveRequest.LeaveStatus.APPROVED,
            startOfMonth,
            endOfMonth
        );

        long paidLeaveDays = 0;
        for (com.payroll.model.LeaveRequest leave : approvedLeaves) {
            // Only count if NOT Unpaid
            if (leave.getLeaveType() != com.payroll.model.LeaveRequest.LeaveType.UNPAID) {
               java.time.LocalDate effectiveStart = leave.getStartDate().isBefore(startOfMonth) ? startOfMonth : leave.getStartDate();
               java.time.LocalDate effectiveEnd = leave.getEndDate().isAfter(endOfMonth) ? endOfMonth : leave.getEndDate();
               
               if (!effectiveStart.isAfter(effectiveEnd)) {
                   paidLeaveDays += java.time.temporal.ChronoUnit.DAYS.between(effectiveStart, effectiveEnd) + 1;
               }
            }
        }

        // 4. Calculate Net Salary based on Payable Days
        BigDecimal totalPayableDays = new BigDecimal(daysPresent + paidLeaveDays);
        BigDecimal salaryFromAttendance = dailySalary.multiply(totalPayableDays);
        
        BigDecimal allowances = payrollDto.getAllowances() != null ? payrollDto.getAllowances() : BigDecimal.ZERO;
        BigDecimal manualDeductions = payrollDto.getDeductions() != null ? payrollDto.getDeductions() : BigDecimal.ZERO;
        
        // Calculate how much pay was lost due to absences
        BigDecimal attendancePenalty = baseSalary.subtract(salaryFromAttendance);
        if (attendancePenalty.compareTo(BigDecimal.ZERO) < 0) {
            attendancePenalty = BigDecimal.ZERO;
        }

        // Total deductions = manual deductions + attendance penalty
        BigDecimal totalDeductions = manualDeductions.add(attendancePenalty);

        // Formula: Base + Allowances - Total Deductions
        BigDecimal netSalary = baseSalary.add(allowances).subtract(totalDeductions);
        
        // Ensure Net Salary is not negative
        if (netSalary.compareTo(BigDecimal.ZERO) < 0) {
            netSalary = BigDecimal.ZERO;
        }

        Payroll payroll = new Payroll();
        payroll.setEmployee(employee);
        payroll.setMonth(payrollDto.getMonth());
        payroll.setYear(payrollDto.getYear());
        payroll.setBaseSalary(payrollDto.getBaseSalary());
        payroll.setAllowances(payrollDto.getAllowances());
        payroll.setDeductions(totalDeductions);
        payroll.setNetSalary(netSalary);
        
        Payroll savedPayroll = payrollRepository.save(payroll);
        recentActivityService.logActivity("Payroll generated for " + employee.getFirstName() + " " + employee.getLastName(), "PAYROLL");
        return convertToDto(savedPayroll);
    }

    @Override
    @Transactional
    public List<PayrollDto> generateAllPayrolls(Integer month, Integer year) {
        List<Employee> employees = employeeRepository.findAll();
        List<PayrollDto> generatedPayrolls = new java.util.ArrayList<>();

        for (Employee employee : employees) {
            // Check if payroll already exists
            if (payrollRepository.findByEmployeeAndMonthAndYear(employee, month, year).isPresent()) {
                continue; 
            }

            try {
                PayrollDto payrollDto = new PayrollDto();
                payrollDto.setEmployeeId(employee.getEmployeeId());
                payrollDto.setMonth(month);
                payrollDto.setYear(year);
                payrollDto.setBaseSalary(employee.getJobRole() != null ? employee.getJobRole().getBaseSalary() : BigDecimal.ZERO);
                payrollDto.setAllowances(BigDecimal.ZERO);
                payrollDto.setDeductions(BigDecimal.ZERO);

                generatedPayrolls.add(createPayroll(payrollDto));
            } catch (Exception e) {
                // Log error and continue with next employee
                System.err.println("Error generating payroll for employee " + employee.getEmployeeId() + ": " + e.getMessage());
            }
        }
        
        return generatedPayrolls;
    }

    @Override
    @Transactional
    public PayrollDto processPayroll(Long id) {
        Payroll payroll = payrollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found with id: " + id));
        
        payroll.setStatus(Payroll.PayrollStatus.PROCESSED);
        payroll.setProcessedDate(LocalDateTime.now());
        
        Payroll processedPayroll = payrollRepository.save(payroll);
        recentActivityService.logActivity("Payroll processed for " + payroll.getEmployee().getFirstName() + " " + payroll.getEmployee().getLastName(), "PAYROLL");
        return convertToDto(processedPayroll);
    }

    @Override
    public void deletePayroll(Long id) {
        Payroll payroll = payrollRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payroll not found with id: " + id));
        payrollRepository.delete(payroll);
        recentActivityService.logActivity("Payroll deleted for " + payroll.getEmployee().getFirstName() + " " + payroll.getEmployee().getLastName(), "PAYROLL");
    }

    private PayrollDto convertToDto(Payroll payroll) {
        PayrollDto dto = new PayrollDto();
        dto.setPayrollId(payroll.getPayrollId());
        dto.setEmployeeId(payroll.getEmployee().getEmployeeId());
        dto.setMonth(payroll.getMonth());
        dto.setYear(payroll.getYear());
        dto.setBaseSalary(payroll.getBaseSalary());
        dto.setAllowances(payroll.getAllowances());
        dto.setDeductions(payroll.getDeductions());
        dto.setNetSalary(payroll.getNetSalary());
        dto.setStatus(payroll.getStatus().name());
        dto.setGeneratedDate(payroll.getGeneratedDate());
        dto.setProcessedDate(payroll.getProcessedDate());
        return dto;
    }

}