package com.payroll.dto;

public class FaceVerificationResult {
    private boolean match;
    private Double distance;
    private String message;
    private String error;

    public FaceVerificationResult() {}

    public FaceVerificationResult(boolean match, Double distance, String message, String error) {
        this.match = match;
        this.distance = distance;
        this.message = message;
        this.error = error;
    }

    public boolean isMatch() { return match; }
    public void setMatch(boolean match) { this.match = match; }
    public Double getDistance() { return distance; }
    public void setDistance(Double distance) { this.distance = distance; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }
}
