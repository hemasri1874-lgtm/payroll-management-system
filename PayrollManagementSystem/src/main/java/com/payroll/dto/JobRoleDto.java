package com.payroll.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JobRoleDto {
    private Long jobId;
    private String jobTitle;
    private String description;
    private BigDecimal baseSalary;
    private Long departmentId;
    private String departmentName;
}