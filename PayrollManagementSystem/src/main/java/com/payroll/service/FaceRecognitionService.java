package com.payroll.service;

import com.payroll.dto.FaceVerificationResult;
import org.springframework.web.multipart.MultipartFile;

public interface FaceRecognitionService {
    String generateDescriptor(MultipartFile file);
    FaceVerificationResult verifyFace(MultipartFile file, String knownDescriptor);
}
