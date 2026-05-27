package com.payroll.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeDto {
    private Long employeeId;
    
    @NotNull
    private Long userId;
    
    @NotBlank
    private String firstName;
    
    @NotBlank
    private String lastName;
    
    private LocalDate dateOfBirth;
    private String phoneNumber;
    private String address;
    
    @NotNull
    private LocalDate hireDate;
    
    private Long departmentId;
    private String departmentName;
    private Long jobId;
    private String jobTitle;
    private Integer leaveBalance;
    private BigDecimal jobBaseSalary;
    private String faceDescriptor;
}
