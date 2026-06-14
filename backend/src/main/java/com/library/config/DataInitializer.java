package com.library.config;

import cn.hutool.crypto.digest.BCrypt;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.library.entity.Book;
import com.library.entity.User;
import com.library.mapper.BookMapper;
import com.library.mapper.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserMapper userMapper;

    @Autowired
    private BookMapper bookMapper;

    @Override
    public void run(String... args) throws Exception {
        if (userMapper.selectCount(null) > 0) return;

        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(new ClassPathResource("seed-data.json").getInputStream());

        // 插入用户
        for (JsonNode u : root.get("users")) {
            User user = new User();
            user.setUsername(u.get("username").asText());
            user.setPassword(BCrypt.hashpw(u.get("password").asText()));
            user.setRealName(u.get("realName").asText());
            user.setRole(u.get("role").asText());
            user.setStatus(1);
            if (u.has("phone")) user.setPhone(u.get("phone").asText());
            if (u.has("email")) user.setEmail(u.get("email").asText());
            userMapper.insert(user);
        }

        // 插入图书
        for (JsonNode b : root.get("books")) {
            Book book = new Book();
            book.setTitle(b.get("title").asText());
            book.setAuthor(b.get("author").asText());
            book.setIsbn(b.get("isbn").asText());
            book.setPublisher(b.get("publisher").asText());
            book.setCategory(b.get("category").asText());
            book.setDescription(b.get("description").asText());
            int total = b.get("total").asInt();
            book.setTotal(total);
            book.setAvailable(total);
            bookMapper.insert(book);
        }

        System.out.println("Seed data loaded: " + bookMapper.selectCount(null) + " books, " + userMapper.selectCount(null) + " users.");
    }
}
