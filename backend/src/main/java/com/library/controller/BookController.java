package com.library.controller;

import com.library.entity.Book;
import com.library.service.BookService;
import com.library.utils.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/book")
public class BookController {

    @Autowired
    private BookService bookService;

    @GetMapping("/list")
    public Result<?> list(@RequestParam(defaultValue = "1") int page,
                          @RequestParam(defaultValue = "10") int pageSize,
                          @RequestParam(required = false) String keyword,
                          @RequestParam(required = false) String category) {
        return Result.success(bookService.getBookPage(page, pageSize, keyword, category));
    }

    @GetMapping("/{id}")
    public Result<?> getById(@PathVariable Long id) {
        Book book = bookService.getBookById(id);
        if (book == null) return Result.error("图书不存在");
        return Result.success(book);
    }
}
