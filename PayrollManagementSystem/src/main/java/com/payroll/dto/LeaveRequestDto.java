package com.payroll.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRequestDto {
    private Long leaveId;
    private Long employeeId;
    private String employeeName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String leaveType;
    private String reason;
    private String status;
    private LocalDateTime appliedDate;
    private LocalDateTime processedDate;
    private String aiMessage;
    private Long processedBy;
}