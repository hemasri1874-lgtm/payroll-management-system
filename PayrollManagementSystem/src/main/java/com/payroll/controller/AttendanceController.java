package com.payroll.controller;

import com.payroll.model.Attendance;
import com.payroll.model.Employee;
import com.payroll.model.User;
import com.payroll.repository.AttendanceRepository;
import com.payroll.repository.EmployeeRepository;
import com.payroll.repository.UserRepository;
import com.payroll.service.RecentActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/attendance")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class AttendanceController {

    @Autowired
    private AttendanceRepository attendanceRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.payroll.service.FaceRecognitionService faceRecognitionService;

    @Autowired
    private RecentActivityService recentActivityService;

    @PostMapping(value = "/mark", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> markAttendance(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        Employee employee = employeeRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Employee profile not found"));

        if (employee.getFaceDescriptor() == null || employee.getFaceDescriptor().isEmpty()) {
            return ResponseEntity.badRequest().body("Face not enrolled. Please enroll first.");
        }

        // Verify Face
        com.payroll.dto.FaceVerificationResult result = faceRecognitionService.verifyFace(file, employee.getFaceDescriptor());
        if (!result.isMatch()) {
            String errorMsg = result.getMessage() != null ? result.getMessage() : "Face verification failed.";
            return ResponseEntity.status(401).body(errorMsg);
        }

        LocalDate today = LocalDate.now();
        Optional<Attendance> existingAttendance = attendanceRepository.findByEmployeeAndDate(employee, today);

        if (existingAttendance.isPresent()) {
            return ResponseEntity.badRequest().body("Attendance already marked for today");
        }

        Attendance attendance = new Attendance();
        attendance.setEmployee(employee);
        attendance.setDate(today);
        attendance.setTime(LocalDateTime.now());
        attendance.setStatus(Attendance.AttendanceStatus.PRESENT);

        attendanceRepository.save(attendance);
        recentActivityService.logActivity(employee.getFirstName() + " marked attendance", "ATTENDANCE");

        Map<String, String> response = new HashMap<>();
        response.put("message", "Attendance marked successfully");
        response.put("status", "PRESENT");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/today")
    public ResponseEntity<?> checkTodayAttendance() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        Employee employee = employeeRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Employee profile not found"));

        LocalDate today = LocalDate.now();
        Optional<Attendance> existingAttendance = attendanceRepository.findByEmployeeAndDate(employee, today);

        Map<String, Object> response = new HashMap<>();
        if (existingAttendance.isPresent()) {
            response.put("marked", true);
            response.put("time", existingAttendance.get().getTime());
            response.put("status", existingAttendance.get().getStatus());
        } else {
            response.put("marked", false);
        }

        return ResponseEntity.ok(response);
    }
    @Autowired
    private com.payroll.repository.LeaveRequestRepository leaveRequestRepository;

    @GetMapping("/history")
    public ResponseEntity<?> getAttendanceHistory() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();
        
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        Employee employee = employeeRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Employee profile not found"));

        // 1. Get all Present days
        LocalDate start = LocalDate.now().minusMonths(6); // Last 6 months
        LocalDate end = LocalDate.now().plusMonths(6);    // Next 6 months
        
        // Note: You might need to add this method to AttendanceRepository if not exists, 
        // or just use findAll and filter, but adding the method is better.
        // For now, assuming standard JPA or we'll add it.
        // actually repository already has: findByEmployeeAndDateBetween
        List<Attendance> attendanceList = attendanceRepository.findByEmployeeAndDateBetween(employee, start, end);
        
        // 2. Get all Approved Leaves
        List<com.payroll.model.LeaveRequest> leaves = leaveRequestRepository.findByEmployee(employee);
        
        // 3. Merge into a response list
        java.util.List<Map<String, Object>> events = new java.util.ArrayList<>();
        
        // Add Present days
        for (Attendance a : attendanceList) {
            Map<String, Object> event = new HashMap<>();
            event.put("date", a.getDate());
            event.put("status", "PRESENT");
            event.put("title", "Present");
            events.add(event);
        }
        
        // Add Leaves (APPROVED only)
        for (com.payroll.model.LeaveRequest l : leaves) {
            if (com.payroll.model.LeaveRequest.LeaveStatus.APPROVED == l.getStatus()) {
                // Expand date range into individual dates for the calendar
                LocalDate d = l.getStartDate();
                while (!d.isAfter(l.getEndDate())) {
                    Map<String, Object> event = new HashMap<>();
                    event.put("date", d);
                    event.put("status", "LEAVE");
                    event.put("title", l.getLeaveType() + " (Leave)");
                    events.add(event);
                    d = d.plusDays(1);
                }
            }
        }
        
        return ResponseEntity.ok(events);
    }

    @GetMapping("/daily")
    public ResponseEntity<?> getDailyAttendance(@RequestParam("date") String dateStr) {
        LocalDate date = LocalDate.parse(dateStr);
        List<Attendance> attendanceList = attendanceRepository.findByDate(date);
        
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (Attendance a : attendanceList) {
            Map<String, Object> map = new HashMap<>();
            map.put("attendanceId", a.getId());
            map.put("employeeName", a.getEmployee().getFirstName() + " " + (a.getEmployee().getLastName() != null ? a.getEmployee().getLastName() : ""));
            map.put("employeeId", a.getEmployee().getEmployeeId());
            map.put("department", a.getEmployee().getDepartment() != null ? a.getEmployee().getDepartment().getDepartmentName() : "N/A");
            map.put("time", a.getTime());
            map.put("status", a.getStatus());
            result.add(map);
        }
        
        return ResponseEntity.ok(result);
    }
}
