package com.library.service;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.IdUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.util.HashMap;
import java.util.Map;

@Service
public class FileService {

    @Value("${upload.path}")
    private String uploadPath;

    public Map<String, String> upload(MultipartFile file) {
        try {
            String originalName = file.getOriginalFilename();
            String ext = originalName.substring(originalName.lastIndexOf("."));
            String newName = IdUtil.fastSimpleUUID() + ext;

            File uploadDir = new File(uploadPath);
            if (!uploadDir.exists()) uploadDir.mkdirs();

            File dest = new File(uploadPath + newName);
            file.transferTo(dest);

            Map<String, String> result = new HashMap<>();
            result.put("url", "/upload/" + newName);
            result.put("filename", originalName);
            return result;
        } catch (Exception e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }
    }
}
