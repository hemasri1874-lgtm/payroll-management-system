package com.payroll.service.impl;

import com.payroll.dto.FaceVerificationResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.payroll.service.FaceRecognitionService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FaceRecognitionServiceImpl implements FaceRecognitionService {

    private final String PYTHON_SERVICE_URL = "http://localhost:5001";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String generateDescriptor(MultipartFile file) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    PYTHON_SERVICE_URL + "/generate_descriptor",
                    requestEntity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                return root.get("descriptor").asText();
            }
            throw new RuntimeException("Failed to generate descriptor from Python service");

        } catch (Exception e) {
            throw new RuntimeException("Error communicating with Face Recognition Service: " + e.getMessage());
        }
    }

    @Override
    public FaceVerificationResult verifyFace(MultipartFile file, String knownDescriptor) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            });
            body.add("known_descriptor", knownDescriptor);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    PYTHON_SERVICE_URL + "/verify",
                    requestEntity,
                    String.class
            );

            if (response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                return new FaceVerificationResult(
                    root.get("match").asBoolean(),
                    root.has("distance") ? root.get("distance").asDouble() : null,
                    root.has("message") ? root.get("message").asText() : "OK",
                    null
                );
            }
            return new FaceVerificationResult(false, null, "Empty response from Python", null);

        } catch (org.springframework.web.client.HttpClientErrorException e) {
            try {
                JsonNode errorNode = objectMapper.readTree(e.getResponseBodyAsString());
                return new FaceVerificationResult(
                    false, 
                    null, 
                    errorNode.has("error") ? errorNode.get("error").asText() : "Verification Failed",
                    "HTTP " + e.getStatusCode()
                );
            } catch (Exception ex) {
                return new FaceVerificationResult(false, null, "Verification error: " + e.getStatusCode(), null);
            }
        } catch (Exception e) {
            return new FaceVerificationResult(false, null, "Internal service exception: " + e.getMessage(), null);
        }
    }
}
