package com.payroll.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PayrollDto {
    private Long payrollId;
    private Long employeeId;
    private String employeeName;
    private Integer month;
    private Integer year;
    private BigDecimal baseSalary;
    private BigDecimal allowances;
    private BigDecimal deductions;
    private BigDecimal netSalary;
    private String status;
    private LocalDateTime generatedDate;
    private LocalDateTime processedDate;
}