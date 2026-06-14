package com.library.controller;

import com.library.entity.Book;
import com.library.service.BookService;
import com.library.service.BorrowService;
import com.library.service.UserService;
import com.library.utils.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserService userService;
    @Autowired
    private BookService bookService;
    @Autowired
    private BorrowService borrowService;

    // ======== 图书管理 ========
    @PostMapping("/book")
    public Result<?> addBook(@RequestBody Book book) {
        try {
            bookService.addBook(book);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @PutMapping("/book")
    public Result<?> updateBook(@RequestBody Book book) {
        try {
            bookService.updateBook(book);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    @DeleteMapping("/book/{id}")
    public Result<?> deleteBook(@PathVariable Long id) {
        try {
            bookService.deleteBook(id);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }

    // ======== 用户管理 ========
    @GetMapping("/user/list")
    public Result<?> userList(@RequestParam(defaultValue = "1") int page,
                              @RequestParam(defaultValue = "10") int pageSize,
                              @RequestParam(required = false) String keyword) {
        return Result.success(userService.getUserPage(page, pageSize, keyword));
    }

    @PutMapping("/user/status/{id}")
    public Result<?> updateUserStatus(@PathVariable Long id, @RequestParam Integer status) {
        userService.updateUserStatus(id, status);
        return Result.success();
    }

    // ======== 借阅管理 ========
    @GetMapping("/borrow/list")
    public Result<?> borrowList(@RequestParam(defaultValue = "1") int page,
                                @RequestParam(defaultValue = "10") int pageSize,
                                @RequestParam(required = false) String status,
                                @RequestParam(required = false) String keyword) {
        return Result.success(borrowService.getAllRecords(page, pageSize, status, keyword));
    }

    @PostMapping("/borrow/check-overdue")
    public Result<?> checkOverdue() {
        borrowService.checkOverdue();
        return Result.success();
    }

    @PutMapping("/borrow/return/{id}")
    public Result<?> adminReturn(@PathVariable Long id) {
        try {
            borrowService.adminReturnBook(id);
            return Result.success();
        } catch (RuntimeException e) {
            return Result.error(e.getMessage());
        }
    }
}
