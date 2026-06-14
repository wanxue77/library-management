package com.library.controller;

import com.library.entity.Book;
import com.library.service.BookService;
import com.library.service.FileService;
import com.library.utils.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api")
public class FileController {

    @Autowired
    private FileService fileService;

    @Autowired
    private BookService bookService;

    @PostMapping("/upload")
    public Result<?> upload(@RequestParam("file") MultipartFile file) {
        try {
            return Result.success(fileService.upload(file));
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @GetMapping("/proxy-image")
    public void proxyImage(@RequestParam("url") String imageUrl, HttpServletResponse response) {
        try {
            URL url = new URL(imageUrl);
            String host = url.getHost().toLowerCase();
            // 仅允许公网域名，禁止内网地址
            if (host.equals("localhost") || host.equals("127.0.0.1") || host.equals("0.0.0.0")
                    || host.startsWith("10.") || host.startsWith("172.16.")
                    || host.startsWith("192.168.") || host.contains("internal")
                    || host.endsWith(".local")) {
                response.setStatus(403);
                return;
            }
            if (!url.getProtocol().equals("http") && !url.getProtocol().equals("https")) {
                response.setStatus(403);
                return;
            }
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(5000);
            conn.connect();

            String contentType = conn.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                response.setStatus(403);
                conn.disconnect();
                return;
            }
            response.setContentType(contentType);
            response.setHeader("Cache-Control", "public, max-age=86400");

            InputStream in = conn.getInputStream();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) != -1) {
                out.write(buf, 0, n);
            }
            in.close();
            out.close();
            conn.disconnect();

            response.getOutputStream().write(out.toByteArray());
        } catch (Exception e) {
            response.setStatus(404);
        }
    }

    /**
     * 生成图书封面SVG图片（国内可访问，无需外部API）
     */
    @GetMapping(value = "/cover/{id}")
    public void coverSvg(@PathVariable Long id, HttpServletResponse response) throws IOException {
        Book book = bookService.getBookById(id);
        if (book == null) {
            response.setStatus(404);
            return;
        }
        response.setContentType("image/svg+xml;charset=UTF-8");
        response.setHeader("Cache-Control", "public, max-age=86400");
        response.getWriter().write(generateCoverSvg(book));
    }

    private String generateCoverSvg(Book book) {
        String title = esc(book.getTitle());
        String author = esc(book.getAuthor() != null ? book.getAuthor() : "");
        String category = esc(book.getCategory() != null ? book.getCategory() : "");

        // 分类色彩映射
        String[] colors = getCategoryColors(book.getCategory());
        String color1 = colors[0];
        String color2 = colors[1];

        // 截取适合显示的标题（最多8个字）
        String displayTitle = book.getTitle();
        String line1, line2 = "";
        if (displayTitle.length() <= 8) {
            line1 = esc(displayTitle);
        } else if (displayTitle.length() <= 16) {
            int mid = displayTitle.length() / 2;
            line1 = esc(displayTitle.substring(0, mid));
            line2 = esc(displayTitle.substring(mid));
        } else {
            line1 = esc(displayTitle.substring(0, 8));
            line2 = esc(displayTitle.substring(8, Math.min(16, displayTitle.length())));
        }

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");
        sb.append("<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"400\" height=\"540\" viewBox=\"0 0 400 540\">");

        // 背景渐变
        sb.append("<defs>");
        sb.append("<linearGradient id=\"bg\" x1=\"0%\" y1=\"0%\" x2=\"100%\" y2=\"100%\">");
        sb.append("<stop offset=\"0%\" style=\"stop-color:").append(color1).append("\"/>");
        sb.append("<stop offset=\"100%\" style=\"stop-color:").append(color2).append("\"/>");
        sb.append("</linearGradient>");
        sb.append("<filter id=\"shadow\"><feDropShadow dx=\"2\" dy=\"2\" stdDeviation=\"3\" flood-opacity=\"0.3\"/></filter>");
        sb.append("</defs>");

        // 背景矩形（带圆角）
        sb.append("<rect width=\"400\" height=\"540\" rx=\"12\" fill=\"url(#bg)\"/>");

        // 装饰元素 - 半透明圆形
        sb.append("<circle cx=\"320\" cy=\"80\" r=\"120\" fill=\"rgba(255,255,255,0.08)\"/>");
        sb.append("<circle cx=\"80\" cy=\"420\" r=\"90\" fill=\"rgba(255,255,255,0.06)\"/>");
        sb.append("<circle cx=\"350\" cy=\"480\" r=\"60\" fill=\"rgba(255,255,255,0.04)\"/>");

        // 标题文字
        int titleY = 220;
        sb.append("<text x=\"200\" y=\"").append(titleY).append("\" text-anchor=\"middle\" font-family=\"'Microsoft YaHei','PingFang SC',sans-serif\" font-size=\"32\" font-weight=\"bold\" fill=\"white\" filter=\"url(#shadow)\">");
        sb.append(line1);
        sb.append("</text>");

        if (!line2.isEmpty()) {
            sb.append("<text x=\"200\" y=\"").append(titleY + 42).append("\" text-anchor=\"middle\" font-family=\"'Microsoft YaHei','PingFang SC',sans-serif\" font-size=\"28\" font-weight=\"bold\" fill=\"white\" filter=\"url(#shadow)\">");
            sb.append(line2);
            sb.append("</text>");
        }

        // 作者
        sb.append("<text x=\"200\" y=\"310\" text-anchor=\"middle\" font-family=\"'Microsoft YaHei','PingFang SC',sans-serif\" font-size=\"18\" fill=\"rgba(255,255,255,0.8)\">");
        sb.append(author).append(" 著");
        sb.append("</text>");

        // 分类标签
        if (!category.isEmpty()) {
            sb.append("<rect x=\"150\" y=\"350\" width=\"100\" height=\"30\" rx=\"15\" fill=\"rgba(255,255,255,0.2)\"/>");
            sb.append("<text x=\"200\" y=\"370\" text-anchor=\"middle\" font-family=\"'Microsoft YaHei','PingFang SC',sans-serif\" font-size=\"14\" fill=\"white\">");
            sb.append(category);
            sb.append("</text>");
        }

        // 底部装饰线
        sb.append("<line x1=\"80\" y1=\"440\" x2=\"320\" y2=\"440\" stroke=\"rgba(255,255,255,0.2)\" stroke-width=\"1\"/>");

        // 底部文字
        sb.append("<text x=\"200\" y=\"475\" text-anchor=\"middle\" font-family=\"sans-serif\" font-size=\"11\" fill=\"rgba(255,255,255,0.4)\">");
        sb.append("Library Management System");
        sb.append("</text>");

        sb.append("</svg>");
        return sb.toString();
    }

    private String[] getCategoryColors(String cat) {
        if (cat == null) return new String[]{"#667eea", "#764ba2"};
        switch (cat) {
            case "编程": return new String[]{"#667eea", "#764ba2"};
            case "科幻": return new String[]{"#0c3483", "#a2b6df"};
            case "文学": return new String[]{"#e0406a", "#f5576c"};
            case "历史": return new String[]{"#c79081", "#dfa579"};
            case "哲学": return new String[]{"#a18cd1", "#fbc2eb"};
            case "心理学": return new String[]{"#5ee7df", "#b490ca"};
            case "经济学": return new String[]{"#11998e", "#38ef7d"};
            case "小说": return new String[]{"#ff758c", "#ff7eb3"};
            case "传记": return new String[]{"#f6d365", "#fda085"};
            case "科学": return new String[]{"#4facfe", "#00f2fe"};
            case "艺术": return new String[]{"#d299c2", "#fef9d7"};
            case "管理": return new String[]{"#89f7fe", "#66a6ff"};
            case "教育": return new String[]{"#a1c4fd", "#c2e9fb"};
            case "医学": return new String[]{"#84fab0", "#8fd3f4"};
            case "法律": return new String[]{"#13547a", "#80d0c7"};
            default: return new String[]{"#667eea", "#764ba2"};
        }
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&apos;");
    }
}
