package com.payroll.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "recent_activities")
@NoArgsConstructor
@AllArgsConstructor
public class RecentActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private String type; // e.g., "EMPLOYEE", "PAYROLL", "LEAVE"

    @Column(nullable = false)
    private LocalDateTime time;

    @PrePersist
    protected void onCreate() {
        if (time == null) {
            time = LocalDateTime.now();
        }
    }

    // Manual Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public LocalDateTime getTime() { return time; }
    public void setTime(LocalDateTime time) { this.time = time; }
}
